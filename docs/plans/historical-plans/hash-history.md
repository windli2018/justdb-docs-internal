# Hash-Based History系统实现计划

## 1. 总体目标

将JustDB的History系统从Version-Based改造为Hash-Based：
- 使用SHA256计算Schema指纹
- 双重Hash验证（Schema级 + 对象级）
- 列顺序无关
- 匹配声明式Schema模式

## 2. 实施阶段

### 阶段一：核心Hash计算器

**任务**：
- 创建`SchemaHashCalculator`接口
- 实现`NormalizedJsonSchemaHashCalculator`（方案一：规范JSON）
- 创建测试验证Hash计算正确性

**文件**：
- `justdb-core/src/main/java/org/verydb/justdb/hash/SchemaHashCalculator.java`
- `justdb-core/src/main/java/org/verydb/justdb/hash/NormalizedJsonSchemaHashCalculator.java`
- `justdb-core/src/test/java/org/verydb/justdb/hash/SchemaHashCalculatorTest.java`

### 阶段二：Hash History实体类

**任务**：
- 创建`SchemaHashHistoryRecord`实体
- 创建`SchemaObjectHashRecord`实体
- 创建变更类型枚举

**文件**：
- `justdb-core/src/main/java/org/verydb/justdb/hash/SchemaHashHistoryRecord.java`
- `justdb-core/src/main/java/org/verydb/justdb/hash/SchemaObjectHashRecord.java`
- `justdb-core/src/main/java/org/verydb/justdb/hash/HashChangeType.java`

### 阶段三：Repository接口和实现

**任务**：
- 创建`SchemaHashHistoryRepository`接口
- 实现`DatabaseSchemaHashHistoryRepository`
- 实现表创建/初始化逻辑
- 实现所有CRUD方法

**文件**：
- `justdb-core/src/main/java/org/verydb/justdb/hash/SchemaHashHistoryRepository.java`
- `justdb-core/src/main/java/org/verydb/justdb/hash/DatabaseSchemaHashHistoryRepository.java`

**Repository方法列表**：
```java
// 表初始化
void ensureTablesExist(Connection conn);

// 记录部署
long recordDeployment(SchemaHashHistoryRecord record, Connection conn);
long recordDeployment(Justdb schema, String deployedBy, Connection conn);

// 查询Hash
String getLatestSchemaHash(Connection conn);
String getLatestSchemaHash(String projectName, Connection conn);
Map<String, String> getLatestObjectHashes(Connection conn);
Map<String, String> getLatestObjectHashes(String projectName, Connection conn);
Map<String, String> getObjectHashes(long historyId, Connection conn);

// 历史记录
List<SchemaHashHistoryRecord> getHistory(int limit, Connection conn);
List<SchemaHashHistoryRecord> getHistory(String projectName, int limit, Connection conn);
SchemaHashHistoryRecord getLatestRecord(Connection conn);
SchemaHashHistoryRecord getLatestRecord(String projectName, Connection conn);
SchemaHashHistoryRecord getRecordById(long id, Connection conn);

// 一致性检查
boolean isSchemaHashConsistent(String expectedHash, Connection conn);
ConsistencyReport checkConsistency(Justdb schema, Connection conn);

// 对象级查询
SchemaObjectHashRecord getObjectHash(long historyId, String objectType, String objectName, Connection conn);
List<SchemaObjectHashRecord> getObjectHashesByType(String objectType, Connection conn);

// 清理
void clearHistory(Connection conn);
void clearHistory(String projectName, Connection conn);
void deleteOldRecords(int keepCount, Connection conn);
```

### 阶段四：部署验证器

**任务**：
- 创建`DeploymentValidator`用于部署前检查
- 实现变更检测逻辑
- 生成部署计划

**文件**：
- `justdb-core/src/main/java/org/verydb/justdb/hash/DeploymentValidator.java`
- `justdb-core/src/main/java/org/verydb/justdb/hash/DeploymentPlan.java`

### 阶段五：集成SchemaDeployer

**任务**：
- 改造`SchemaDeployer`使用Hash系统
- 保持向后兼容

**文件**：
- 修改 `justdb-core/src/main/java/org/verydb/justdb/SchemaDeployer.java`

### 阶段六：测试

**任务**：
- 单元测试
- 集成测试
- 多数据库测试

## 3. 数据库表结构

### 主表：justdb_schema_hash_history

```sql
CREATE TABLE IF NOT EXISTS justdb_schema_hash_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_name VARCHAR(255) NOT NULL COMMENT '项目名称，用于多项目隔离',
    deployed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deployed_by VARCHAR(255) NOT NULL,

    -- Schema Hash
    schema_hash CHAR(64) NOT NULL COMMENT 'SHA256 of entire schema',
    hash_algorithm VARCHAR(20) NOT NULL DEFAULT 'SHA256',

    -- 部署信息
    execution_time_ms BIGINT COMMENT 'Execution time in milliseconds',
    success BOOLEAN NOT NULL DEFAULT TRUE,

    -- 附加信息（JSON）
    metadata TEXT COMMENT 'Additional deployment metadata (JSON)',

    INDEX idx_project (project_name),
    INDEX idx_schema_hash (schema_hash),
    INDEX idx_deployed_at (deployed_at)
) COMMENT='JustDB Schema Hash History';
```

### 对象表：justdb_schema_object_hashes

```sql
CREATE TABLE IF NOT EXISTS justdb_schema_object_hashes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    history_id BIGINT NOT NULL,

    -- 对象标识
    object_type VARCHAR(50) NOT NULL COMMENT 'TABLE, VIEW, INDEX, COLUMN, CONSTRAINT, etc.',
    object_name VARCHAR(255) NOT NULL COMMENT 'Object name',
    parent_object VARCHAR(255) COMMENT 'Parent object name (e.g., table for column)',

    -- 对象Hash
    object_hash CHAR(64) NOT NULL COMMENT 'SHA256 of object definition',

    -- 变更类型
    change_type ENUM('ADDED', 'MODIFIED', 'UNCHANGED', 'REMOVED') NOT NULL,

    FOREIGN KEY (history_id) REFERENCES justdb_schema_hash_history(id) ON DELETE CASCADE,
    UNIQUE KEY uk_object (history_id, object_type, object_name, parent_object),
    INDEX idx_object (object_type, object_name),
    INDEX idx_parent (parent_object)
) COMMENT='JustDB Schema Object Hashes';
```

## 4. Hash计算规则

### Schema Hash包含的内容
- `namespace` - 命名空间
- `tables` - 所有表（按表名排序）
  - 每个表的：name, comment, columns, indexes, constraints
- `views` - 所有视图（按视图名排序）
- `indexes` - 全局索引（按索引名排序）
- `constraints` - 全局约束（按约束名排序）

### 排序规则（确保顺序无关）
1. 表按`name`排序
2. 列按`name`排序
3. 索引按`name`排序
4. 约束按`name`排序
5. 所有集合类型字段按元素排序

### 忽略的字段（不影响语义）
- `id` - 内部ID
- `unknownElems` - 扩展属性
- 生命周期钩子（beforeCreates, afterCreates等）- 执行时不影响结构

## 5. 实现优先级

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | Hash计算器 | 核心基础 |
| P0 | Repository接口和实现 | 数据持久化 |
| P1 | 实体类和枚举 | 数据模型 |
| P1 | 部署验证器 | 部署前检查 |
| P2 | SchemaDeployer集成 | 完整流程 |
| P3 | 测试 | 质量保证 |

## 6. 向后兼容

- 保留原有的`SchemaHistoryManager`相关类
- 新的Hash系统作为独立模块添加
- `SchemaDeployer`可选择使用新旧系统
- 旧表不删除，逐步迁移

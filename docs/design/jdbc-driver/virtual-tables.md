---
icon: table
title: 虚拟表
order: 3
category:
  - 设计文档
  - JDBC 驱动
tag:
  - jdbc
  - virtual-table
---

# 虚拟表

虚拟表是 JustDB JDBC 驱动的核心功能，允许通过标准 SQL 查询和管理 Schema 定义。与普通表不同，虚拟表的数据是在运行时动态生成的，不会持久化到 schema 文件中。

## 系统虚拟表

### information_schema.tables

查询所有表定义。

```sql
SELECT * FROM information_schema.tables;
SELECT * FROM information_schema.tables WHERE table_name = 'users';
```

### information_schema.columns

查询所有列定义。

```sql
SELECT * FROM information_schema.columns;
SELECT * FROM information_schema.columns WHERE table_name = 'users';
```

### information_schema.indexes

查询所有索引定义。

```sql
SELECT * FROM information_schema.indexes;
SELECT * FROM information_schema.indexes WHERE table_name = 'users';
```

---

## DATA_PARTITIONS 虚拟表

`DATA_PARTITIONS` 是 JustDB JDBC 提供的虚拟表，用于查看和管理数据（Data）分区的配置和状态。

### 功能特性

| 操作 | 说明 |
|-------|------|
| **SELECT** | 查看所有 Data 分区的属性和统计信息 |
| **INSERT** | 创建新的 Data 分区 |
| **UPDATE** | 修改 Data 分区条件，自动触发行重新分配 |
| **DELETE** | 删除 Data 分区定义，数据迁移到默认分区 |

### 表结构

| 列名 | 类型 | 说明 |
|-------|------|------|
| `TABLE_NAME` | VARCHAR(64) | 分区所属的表名 |
| `CONDITION` | VARCHAR(2048) | 分区条件（SQL WHERE 子句），NULL 表示默认分区 |
| `MODULE` | VARCHAR(128) | 分区模块标识 |
| `DESCRIPTION` | VARCHAR(512) | 分区描述 |
| `ROW_COUNT` | BIGINT | 当前分区中的行数 |
| `SOURCE_PATTERN` | VARCHAR(256) | 生成该分区的规则模式 |
| `IS_DEFAULT` | VARCHAR(3) | 是否为默认分区（YES/NO） |
| `IS_TEMPORARY` | VARCHAR(3) | 是否为临时分区（YES/NO） |

### 使用示例

#### 查看所有分区

```sql
-- 查看所有表的分区情况
SELECT TABLE_NAME, CONDITION, MODULE, ROW_COUNT
FROM DATA_PARTITIONS
ORDER BY TABLE_NAME, MODULE;

-- 查看特定表的分区
SELECT * FROM DATA_PARTITIONS WHERE TABLE_NAME = 'users';

-- 查看没有条件的分区（默认分区）
SELECT * FROM DATA_PARTITIONS WHERE CONDITION IS NULL;
```

#### 创建新分区

```sql
-- 为 users 表创建活跃用户分区
INSERT INTO DATA_PARTITIONS (TABLE_NAME, CONDITION, MODULE, DESCRIPTION)
VALUES ('users', 'deleted=0 AND active=1', 'active-users', 'Active users');

-- 为 orders 表创建高金额订单分区
INSERT INTO DATA_PARTITIONS (TABLE_NAME, CONDITION, MODULE, DESCRIPTION)
VALUES ('orders', 'amount > 1000', 'high-value-orders', 'High value orders');
```

#### 修改分区条件（触发重新分区）

```sql
-- 修改分区条件：从 deleted=0 改为 deleted=0 AND verified=1
-- 这会自动将所有符合旧条件但不符合新条件的行移动到其他分区
UPDATE DATA_PARTITIONS
SET CONDITION = 'deleted=0 AND verified=1'
WHERE TABLE_NAME = 'users' AND CONDITION = 'deleted=0';

-- 修改分区描述
UPDATE DATA_PARTITIONS
SET DESCRIPTION = 'Verified active users'
WHERE TABLE_NAME = 'users' AND CONDITION = 'deleted=0 AND verified=1';
```

#### 删除分区

```sql
-- 删除分区，数据迁移到默认分区
DELETE FROM DATA_PARTITIONS
WHERE TABLE_NAME = 'users' AND CONDITION = 'deleted=1';

-- 删除特定模块的分区
DELETE FROM DATA_PARTITIONS
WHERE MODULE = 'archived-data';
```

### 设计原理

#### Data 分区架构

JustDB 支持在一个表上定义多个 Data 节点，每个节点通过 `condition` 属性指定其包含的行：

```xml
<Data table="users" condition="deleted=0 AND active=1" module="active-users">
    <Row id="1" name="Alice" active="1" deleted="0"/>
    <Row id="2" name="Bob" active="1" deleted="0"/>
</Data>

<Data table="users" condition="deleted=0 AND active=0" module="inactive-users">
    <Row id="3" name="Charlie" active="0" deleted="0"/>
</Data>

<Data table="users" module="default-users">
    <!-- 没有条件的默认分区，容纳所有不匹配其他条件的行 -->
    <Row id="4" name="David" deleted="1"/>
</Data>
```

#### 重新分区机制

当通过 `UPDATE DATA_PARTITIONS` 修改分区条件时，系统会自动重新分配行：

1. 收集原分区的所有行
2. 清空原分区
3. 根据新条件评估每行，将其分配到匹配的新分区
4. 如果没有分区匹配，行留在原分区（使用新条件）

```
原始: condition="deleted=0"
  ┌─────────────────────────┐
  │ id=1, deleted=0    │ → 匹配
  │ id=2, deleted=0    │ → 匹配
  │ id=3, deleted=1    │ → 不匹配
  │ id=4, deleted=0    │ → 匹配
  └─────────────────────────┘

更新: SET condition="deleted=0 AND active=1"
  ┌─────────────────────────┐
  │ id=1, deleted=0, active=1   │ → 匹配新条件 → 留在原分区
  │ id=2, deleted=0, active=0   │ → 不匹配新条件 → 移到默认分区
  │ id=3, deleted=1           │ → 本来就不匹配，位置不变
  │ id=4, deleted=0, active=1   │ → 匹配新条件 → 留在原分区
  └─────────────────────────┘
```

#### 删除分区机制

删除分区时：

1. 收集要删除分区的所有行
2. 查找或创建默认分区（condition 为 null 的分区）
3. 将所有行迁移到默认分区
4. 标记原 Data 节点为已删除

### API 参考

#### JustdbDataSource 新增方法

```java
/**
 * 获取指定表的所有 DataNode 信息
 */
public List<DataNodeInfo> getDataNodes(String tableName);

/**
 * 创建新的 Data 分区
 */
public void createDataPartition(String tableName, String condition,
                          String module, String description) throws SQLException;

/**
 * 删除 Data 分区（数据迁移到默认分区）
 */
public void dropDataPartition(String tableName, String condition) throws SQLException;

/**
 * 更新 Data 分区条件并重新分区
 */
public void updateDataPartition(String tableName, String oldCondition,
                          String newCondition) throws SQLException;

/**
 * DataNode 信息封装类
 */
public static class DataNodeInfo {
    public String tableName;
    public String condition;
    public String module;
    public String description;
    public String sourcePattern;
    public boolean isDefault;
    public boolean isTemporary;
    public long rowCount;
}
```

### 条件语法说明

`DATA_PARTITIONS` 使用简化的 SQL WHERE 子句语法来定义分区条件。

#### 支持的条件格式

```sql
-- 简单等值条件
deleted=0

-- 多条件 AND 组合
deleted=0 AND active=1

-- 字符串值（单引号或双引号）
status='active'
name="admin"

-- 数值
amount>1000
count>=5
```

#### 条件解析规则

1. **AND 连接**：支持多个条件通过 `AND` 连接（不区分大小写）
2. **等值匹配**：目前主要支持 `column=value` 格式
3. **值类型**：自动识别字符串、整数和浮点数
4. **默认分区**：`condition` 为 `NULL` 的分区接受所有不匹配其他分区的行

### 注意事项

1. **条件互斥性**：建议为同一表的多个 Data 分区设置互斥的条件，避免一行同时匹配多个分区
2. **默认分区**：每个表应该有一个无条件的默认分区，用于容纳不匹配任何其他条件的行
3. **重新分区性能**：对于包含大量行的分区，修改条件可能需要较长时间
4. **事务支持**：分区管理操作目前不支持事务回滚
5. **级联删除**：删除分区不会级联删除表，只删除分区定义并将数据迁移到默认分区

### 虚拟表工作原理

#### 虚拟表实现机制

`DATA_PARTITIONS` 不是真实的数据表，而是通过 JustDB JDBC 驱动的虚拟表机制实现的：

1. **表定义注册**：在 `BuiltinVirtualTables` 中创建表结构
2. **数据动态生成**：查询时从运行时 Justdb 对象收集 Data 节点信息
3. **DML 操作拦截**：INSERT/UPDATE/DELETE 操作被拦截并转换为对 Justdb 数据结构的操作

#### 内存状态同步

虚拟表操作会同步修改内存中的 TableData 结构：

```
INSERT INTO DATA_PARTITIONS
    → JustdbDataSource.createDataPartition()
        → Justdb.getData().add(newData)
        → TableData.addDataNode(newData)

UPDATE DATA_PARTITIONS
    → JustdbDataSource.updateDataPartition()
        → 重新分配 Row 对象到对应 Data 节点

DELETE FROM DATA_PARTITIONS
    → JustdbDataSource.dropDataPartition()
        → targetData.setDeleted(true)
        → TableData.removeDataNode()
```

---

## 相关文件

- `justdb-core/src/main/java/ai/justdb/justdb/jdbc/BuiltinVirtualTables.java` - 虚拟表定义
- `justdb-core/src/main/java/ai/justdb/justdb/jdbc/JustdbDataSource.java` - 数据源实现
- `justdb-core/src/main/java/ai/justdb/justdb/jdbc/SqlExecutor.java` - SQL 执行支持
- `justdb-core/src/main/java/ai/justdb/justdb/schema/Data.java` - Data 节点定义

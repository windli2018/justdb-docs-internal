# 基于Hash的History系统设计

## 1. 设计背景

### 1.1 核心问题

JustDB使用**声明式Schema**（Declarative Schema），表示数据库的最终期望状态，而非增量迁移脚本。这与Flyway/Liquibase等工具的版本化迁移模式完全不同。

**现有History系统的问题**：
- 使用`installed_rank`（自增ID）和`version`字段追踪变更
- 仿照Flyway设计，但JustDB的Schema没有版本概念
- `version`只是CLI参数，对Schema文件本身无意义

### 1.2 设计目标

1. **Hash-based一致性验证**：使用SHA1或SHA256计算Schema指纹
2. **双重Hash验证**：Schema级Hash + 对象级Hash，确保最终一致性
3. **列顺序无关**：数据库中的列顺序变化不应影响Hash计算
4. **声明式友好**：匹配JustDB的最终状态描述模式

## 2. Hash计算方案

### 方案一：基于规范JSON的Hash（推荐）

**原理**：将Schema对象序列化为规范化的JSON字符串，然后计算Hash。

**规范化的关键要求**：
- 按字段名排序（确保字段顺序不影响结果）
- 按集合元素排序（确保列/索引顺序不影响结果）
- 忽略空值字段
- 统一数值格式（整数、浮点数）

**实现示例**：

```java
public class SchemaHashCalculator {

    private static final ObjectMapper NORMALIZED_MAPPER = createNormalizedMapper();

    private static ObjectMapper createNormalizedMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // 按字母顺序排序字段
        mapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
        // 忽略null值
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        // 统一数值格式
        mapper.enable(JsonWriteNumeralToString.MINIMAL);
        return mapper;
    }

    /**
     * 计算Schema的Hash值
     */
    public String calculateSchemaHash(Justdb schema) {
        try {
            // 1. 提取需要Hash的关键字段
            Map<String, Object> schemaMap = extractSchemaMap(schema);

            // 2. 序列化为规范化JSON
            String normalizedJson = NORMALIZED_MAPPER.writeValueAsString(schemaMap);

            // 3. 计算SHA256
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(normalizedJson.getBytes(StandardCharsets.UTF_8));

            // 4. 转换为Hex字符串
            return bytesToHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate schema hash", e);
        }
    }

    /**
     * 提取Schema的关键字段（忽略运行时元数据）
     */
    private Map<String, Object> extractSchemaMap(Justdb schema) {
        Map<String, Object> map = new TreeMap<>(); // TreeMap自动排序

        // Schema级属性
        map.put("namespace", schema.getNamespace());
        map.put("name", schema.getName());

        // 提取所有表
        List<Map<String, Object>> tables = new ArrayList<>();
        for (Table table : schema.getTables()) {
            tables.add(extractTableMap(table));
        }
        // 按表名排序（确保表顺序不影响Hash）
        tables.sort(Comparator.comparing(m -> (String) m.get("name")));
        map.put("tables", tables);

        // 其他Schema对象...
        return map;
    }

    /**
     * 提取Table的关键字段（列顺序无关）
     */
    private Map<String, Object> extractTableMap(Table table) {
        Map<String, Object> map = new TreeMap<>();

        map.put("name", table.getName());
        map.put("comment", table.getComment());

        // 列：按列名排序，确保列顺序不影响Hash
        List<Map<String, Object>> columns = new ArrayList<>();
        for (Column column : table.getColumns()) {
            columns.add(extractColumnMap(column));
        }
        columns.sort(Comparator.comparing(m -> (String) m.get("name")));
        map.put("columns", columns);

        // 索引：按索引名排序
        List<Map<String, Object>> indexes = new ArrayList<>();
        for (Index index : table.getIndexes()) {
            indexes.add(extractIndexMap(index));
        }
        indexes.sort(Comparator.comparing(m -> (String) m.get("name")));
        map.put("indexes", indexes);

        // 约束、触发器等...
        return map;
    }

    /**
     * 提取Column的关键字段
     */
    private Map<String, Object> extractColumnMap(Column column) {
        Map<String, Object> map = new TreeMap<>();

        map.put("name", column.getName());
        map.put("type", column.getType());
        map.put("nullable", column.getNullable());
        map.put("primaryKey", column.getPrimaryKey());
        map.put("autoIncrement", column.getAutoIncrement());
        map.put("defaultValue", column.getDefaultValue());
        map.put("comment", column.getComment());

        return map;
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
```

**优点**：
- 实现简单，使用成熟的JSON库
- 列顺序完全无关
- 易于调试（可以查看规范化JSON）
- 支持跨语言验证

**缺点**：
- 依赖JSON序列化细节
- 字段顺序变化仍会影响Hash（但已通过TreeMap解决）

---

### 方案二：基于字段遍历的增量Hash

**原理**：直接遍历Schema对象树，按固定顺序累加各字段的Hash值。

**实现示例**：

```java
public class IncrementalSchemaHashCalculator {

    /**
     * 计算Schema Hash（增量方式）
     */
    public String calculateSchemaHash(Justdb schema) {
        MessageDigest digest = newDigest();

        // Schema级属性
        updateDigest(digest, schema.getNamespace());
        updateDigest(digest, schema.getName());

        // 表：先排序再Hash
        List<Table> sortedTables = schema.getTables().stream()
            .sorted(Comparator.comparing(Table::getName))
            .collect(Collectors.toList());

        for (Table table : sortedTables) {
            hashTable(digest, table);
        }

        return digestToHex(digest);
    }

    private void hashTable(MessageDigest digest, Table table) {
        updateDigest(digest, table.getName());
        updateDigest(digest, table.getComment());

        // 列：按列名排序
        List<Column> sortedColumns = table.getColumns().stream()
            .sorted(Comparator.comparing(Column::getName))
            .collect(Collectors.toList());

        for (Column column : sortedColumns) {
            hashColumn(digest, column);
        }

        // 索引、约束等...
    }

    private void hashColumn(MessageDigest digest, Column column) {
        updateDigest(digest, column.getName());
        updateDigest(digest, column.getType());
        updateDigest(digest, column.getNullable() != null ? column.getNullable().toString() : null);
        updateDigest(digest, column.getPrimaryKey() != null ? column.getPrimaryKey().toString() : null);
        updateDigest(digest, column.getDefaultValue());
        updateDigest(digest, column.getComment());
    }

    private void updateDigest(MessageDigest digest, String value) {
        if (value != null) {
            digest.update(value.getBytes(StandardCharsets.UTF_8));
            digest.update((byte) 0); // 分隔符
        }
    }

    private MessageDigest newDigest() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
```

**优点**：
- 性能更好（无需完整序列化）
- 内存占用更小
- 更精细的控制Hash逻辑

**缺点**：
- 需要为每个Schema对象类型编写Hash逻辑
- 维护成本较高

---

### 方案三：基于结构签名的Hash（最灵活）

**原理**：为每种Schema对象定义结构签名，只包含语义相关的字段。

**实现示例**：

```java
public class StructuralHashCalculator {

    /**
     * 计算结构签名Hash
     */
    public String calculateStructuralHash(Justdb schema) {
        List<String> signatures = new ArrayList<>();

        // 收集所有对象的结构签名
        for (Table table : schema.getTables()) {
            signatures.add(tableSignature(table));
        }

        // 排序并合并
        Collections.sort(signatures);
        String combined = String.join("\n", signatures);

        return sha256Hex(combined);
    }

    /**
     * 生成Table的结构签名
     *
     * 格式：TABLE|name|column_count|index_count|constraint_count|column:definitions|index:definitions|...
     */
    private String tableSignature(Table table) {
        StringBuilder sig = new StringBuilder();

        sig.append("TABLE|");
        sig.append(table.getName()).append("|");

        // 列签名（按列名排序）
        List<String> columnSigs = new ArrayList<>();
        for (Column col : table.getColumns()) {
            columnSigs.add(columnSignature(col));
        }
        Collections.sort(columnSigs);
        sig.append(String.join(",", columnSigs)).append("|");

        // 索引签名
        List<String> indexSigs = new ArrayList<>();
        for (Index idx : table.getIndexes()) {
            indexSigs.add(indexSignature(idx));
        }
        Collections.sort(indexSigs);
        sig.append(String.join(",", indexSigs)).append("|");

        return sig.toString();
    }

    /**
     * 生成Column的结构签名
     *
     * 格式：COLUMN|name|type|nullable|pk|autoinc|default
     */
    private String columnSignature(Column column) {
        return String.format("COLUMN|%s|%s|%s|%s|%s|%s",
            column.getName(),
            column.getType(),
            boolToStr(column.getNullable()),
            boolToStr(column.getPrimaryKey()),
            boolToStr(column.getAutoIncrement()),
            column.getDefaultValue()
        );
    }

    private String boolToStr(Boolean b) {
        return b == null ? "" : b ? "1" : "0";
    }

    private String sha256Hex(String input) {
        // SHA256实现...
    }
}
```

**优点**：
- 灵活控制Hash内容
- 可以忽略某些"无关紧要"的差异（如comment变化）
- 签名格式可读，便于调试

**缺点**：
- 需要为每个对象类型定义签名格式
- 签名格式变化会影响历史兼容性

---

## 3. 双重Hash验证机制

### 3.1 两级Hash设计

```
Justdb Schema
├── Schema Hash (schema_hash)
│   └── 整个Schema的Hash值
│
└── Object Hashes (object_hashs)
    ├── Table1 Hash
    ├── Table2 Hash
    ├── View1 Hash
    └── ...
```

### 3.2 验证逻辑

**场景1：部署前检查**
```java
public class DeploymentValidator {

    public ValidationResult validateForDeployment(Justdb schema, String dbType) {
        // 1. 计算当前Schema的Hash
        String schemaHash = hashCalculator.calculateSchemaHash(schema);

        // 2. 从数据库读取已部署的Hash
        SchemaHistoryRecord lastRecord = historyRepository.getLatestRecord();
        if (lastRecord != null) {
            String deployedHash = lastRecord.getSchemaHash();

            // 3. 如果Hash相同，无需部署
            if (schemaHash.equals(deployedHash)) {
                return ValidationResult.noChange("Schema already deployed");
            }
        }

        // 4. 计算差异（按对象级别）
        Map<String, String> currentObjectHashes = hashCalculator.calculateObjectHashes(schema);
        Map<String, String> deployedObjectHashes = historyRepository.getLatestObjectHashes();

        // 5. 识别变更的对象
        MapDifference<String, String> diff = Maps.difference(currentObjectHashes, deployedObjectHashes);

        return ValidationResult.builder()
            .schemaHash(schemaHash)
            .addedObjects(diff.entriesOnlyOnLeft().keySet())
            .removedObjects(diff.entriesOnlyOnRight().keySet())
            .modifiedObjects(diff.entriesDiffering().keySet())
            .unchangedObjects(diff.entriesInCommon().keySet())
            .build();
    }
}
```

**场景2：一致性校验**
```java
public class ConsistencyChecker {

    /**
     * 验证数据库状态与Schema定义是否一致
     */
    public ConsistencyReport checkConsistency(Justdb schema, Connection conn) {
        // 1. 计算期望的Schema Hash
        String expectedSchemaHash = hashCalculator.calculateSchemaHash(schema);

        // 2. 从数据库读取实际的Schema Hash
        String actualSchemaHash = historyRepository.getCurrentSchemaHash(conn);

        if (!expectedSchemaHash.equals(actualSchemaHash)) {
            // Schema不一致，深入检查
            return detailedObjectLevelCheck(schema, conn);
        }

        return ConsistencyReport.consistent();
    }

    /**
     * 对象级别详细检查
     */
    private ConsistencyReport detailedObjectLevelCheck(Justdb schema, Connection conn) {
        Map<String, String> expectedObjectHashes = hashCalculator.calculateObjectHashes(schema);
        Map<String, String> actualObjectHashes = extractObjectHashesFromDatabase(conn);

        MapDifference<String, String> diff = Maps.difference(expectedObjectHashes, actualObjectHashes);

        ConsistencyReport report = new ConsistencyReport();
        report.setInconsistent(true);
        report.setAddedObjects(diff.entriesOnlyOnLeft().keySet());
        report.setRemovedObjects(diff.entriesOnlyOnRight().keySet());
        report.setModifiedObjects(diff.entriesDiffering().keySet());

        return report;
    }
}
```

## 4. 新History表结构

### 4.1 主表：justdb_schema_hash_history

```sql
CREATE TABLE justdb_schema_hash_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    deployed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deployed_by VARCHAR(255) NOT NULL,

    -- Schema Hash
    schema_hash CHAR(64) NOT NULL COMMENT 'SHA256 of entire schema',
    hash_algorithm VARCHAR(20) NOT NULL DEFAULT 'SHA256',

    -- 部署信息
    execution_time_ms BIGINT COMMENT 'Execution time in milliseconds',
    success BOOLEAN NOT NULL DEFAULT TRUE,

    -- 附加信息（JSON）
    metadata JSON COMMENT 'Additional deployment metadata',

    INDEX idx_schema_hash (schema_hash),
    INDEX idx_deployed_at (deployed_at)
) COMMENT='JustDB Schema Hash History';
```

### 4.2 对象表：justdb_schema_object_hashes

```sql
CREATE TABLE justdb_schema_object_hashes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    history_id BIGINT NOT NULL,

    -- 对象标识
    object_type VARCHAR(50) NOT NULL COMMENT 'TABLE, VIEW, INDEX, etc.',
    object_name VARCHAR(255) NOT NULL,

    -- 对象Hash
    object_hash CHAR(64) NOT NULL COMMENT 'SHA256 of object definition',

    -- 变更类型
    change_type ENUM('ADDED', 'MODIFIED', 'UNCHANGED', 'REMOVED') NOT NULL,

    FOREIGN KEY (history_id) REFERENCES justdb_schema_hash_history(id),
    UNIQUE KEY uk_object (history_id, object_type, object_name),
    INDEX idx_object (object_type, object_name)
) COMMENT='JustDB Schema Object Hashes';
```

## 5. 工作流程

### 5.1 部署流程

```
1. 加载Schema文件
   ↓
2. 计算Schema Hash (SHA256)
   ↓
3. 查询最新部署记录的Hash
   ↓
4. 比较Hash值
   ├─ 相同 → 跳过部署（无需变更）
   └─ 不同 → 继续
   ↓
5. 计算对象级Hash，识别变更
   ├─ ADDED: 新对象
   ├─ MODIFIED: 修改的对象
   ├─ UNCHANGED: 未变对象
   └─ REMOVED: 删除的对象
   ↓
6. 生成SQL并执行
   ↓
7. 记录History
   ├─ 插入主表记录 (schema_hash)
   └─ 插入对象表记录 (object_hashs)
```

### 5.2 一致性检查流程

```
1. 从Schema文件计算期望Hash
   ↓
2. 从数据库读取实际Hash
   ↓
3. 比较Schema Hash
   ├─ 相同 → 一致 ✓
   └─ 不同 → 继续
   ↓
4. 比较对象Hash
   ├─ 识别差异对象
   └─ 生成差异报告
```

## 6. 列顺序无关性处理

### 6.1 问题分析

数据库中列的物理顺序可能变化，但Schema的语义不变：

```sql
-- 场景1：Schema定义顺序
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);

-- 场景2：数据库实际顺序（ALTER TABLE调整后）
CREATE TABLE users (
    email VARCHAR(100),
    id BIGINT PRIMARY KEY,
    username VARCHAR(50)
);
```

这两个表在语义上完全相同，应该产生相同的Hash。

### 6.2 解决方案

**方案A：按列名排序后计算Hash**

```java
// 在计算Hash前，先按列名排序
List<Column> sortedColumns = table.getColumns().stream()
    .sorted(Comparator.comparing(Column::getName))
    .collect(Collectors.toList());

// 然后使用排序后的列计算Hash
for (Column column : sortedColumns) {
    hashColumn(digest, column);
}
```

**方案B：提取数据库元数据时自动排序**

```java
public class DatabaseSchemaExtractor {

    /**
     * 从数据库提取Table定义
     *
     * 关键：查询时按列名排序，确保顺序一致
     */
    public Table extractTable(Connection conn, String tableName) throws SQLException {
        String sql = "SELECT column_name, data_type, is_nullable, " +
                     "column_default, column_comment " +
                     "FROM information_schema.columns " +
                     "WHERE table_name = ? " +
                     "ORDER BY column_name";  // 关键：按列名排序

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, tableName);
            ResultSet rs = stmt.executeQuery();

            Table table = new Table();
            table.setName(tableName);

            while (rs.next()) {
                Column column = extractColumn(rs);
                table.getColumns().add(column);
            }

            return table;
        }
    }
}
```

## 7. Hash算法选择

### 7.1 SHA1 vs SHA256

| 特性 | SHA1 | SHA256 |
|------|------|--------|
| 输出长度 | 160位 (40字符) | 256位 (64字符) |
| 碰撞概率 | 极低 | 更低 |
| 性能 | 更快 | 稍慢 |
| 存储空间 | 更小 | 更大 |
| 安全性 | 已有理论攻击 | 目前安全 |

**推荐**：使用**SHA256**
- 安全性更高
- 性能差异可忽略（Schema Hash计算次数有限）
- 64字符Hex字符串仍足够短

### 7.2 Hash存储格式

```sql
-- 使用CHAR(64)存储SHA256 Hex字符串
schema_hash CHAR(64) NOT NULL COMMENT 'SHA256 Hex string'

-- 示例值：a1b2c3d4e5f6...（64个字符）
```

## 8. 实现建议

### 8.1 核心类设计

```java
/**
 * Schema Hash计算器接口
 */
public interface SchemaHashCalculator {
    /**
     * 计算整个Schema的Hash
     */
    String calculateSchemaHash(Justdb schema);

    /**
     * 计算所有对象的Hash
     * 返回: Map<"TABLE:users", "hash1", "VIEW:user_view", "hash2", ...>
     */
    Map<String, String> calculateObjectHashes(Justdb schema);

    /**
     * 计算单个对象的Hash
     */
    String calculateObjectHash(Item item);
}

/**
 * Hash历史仓储接口
 */
public interface SchemaHashHistoryRepository {
    /**
     * 保存部署记录
     */
    void recordDeployment(SchemaHashRecord record);

    /**
     * 获取最新的Schema Hash
     */
    String getLatestSchemaHash();

    /**
     * 获取最新的对象Hash
     */
    Map<String, String> getLatestObjectHashes();

    /**
     * 获取当前数据库的Schema Hash
     */
    String getCurrentSchemaHash(Connection conn);
}

/**
 * Hash记录
 */
public class SchemaHashRecord {
    private Long id;
    private Timestamp deployedAt;
    private String deployedBy;
    private String schemaHash;
    private String hashAlgorithm;
    private Long executionTimeMs;
    private Boolean success;
    private Map<String, String> metadata;
    private List<ObjectHashRecord> objectHashes;
}
```

### 8.2 集成到现有系统

```java
/**
 * SchemaDeployer改造：使用Hash替代版本
 */
public class SchemaDeployer {

    private final SchemaHashCalculator hashCalculator;
    private final SchemaHashHistoryRepository historyRepository;

    public DeploymentResult deploy(Justdb schema, Connection conn) {
        // 1. 计算Hash
        String newSchemaHash = hashCalculator.calculateSchemaHash(schema);

        // 2. 检查是否需要部署
        String lastHash = historyRepository.getLatestSchemaHash();
        if (newSchemaHash.equals(lastHash)) {
            return DeploymentResult.noChange();
        }

        // 3. 计算差异
        Map<String, String> newObjectHashes = hashCalculator.calculateObjectHashes(schema);
        Map<String, String> lastObjectHashes = historyRepository.getLatestObjectHashes();

        // 4. 生成SQL（只对变更对象）
        List<String> sqlStatements = generateSqlForChanges(schema, newObjectHashes, lastObjectHashes);

        // 5. 执行SQL
        long startTime = System.currentTimeMillis();
        boolean success = executeSql(sqlStatements, conn);
        long executionTime = System.currentTimeMillis() - startTime;

        // 6. 记录History
        SchemaHashRecord record = new SchemaHashRecord();
        record.setSchemaHash(newSchemaHash);
        record.setHashAlgorithm("SHA256");
        record.setExecutionTimeMs(executionTime);
        record.setSuccess(success);
        record.setObjectHashes(buildObjectHashRecords(newObjectHashes, lastObjectHashes));

        historyRepository.recordDeployment(record);

        return DeploymentResult.success(sqlStatements);
    }
}
```

## 9. 总结

### 9.1 推荐方案组合

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| Hash计算 | **方案一：规范JSON Hash** | 实现简单、易调试、列顺序无关 |
| Hash算法 | **SHA256** | 安全性高、性能影响小 |
| 验证机制 | **双重Hash** | Schema级快速检查 + 对象级精确定位 |

### 9.2 关键设计原则

1. **列顺序无关**：在计算Hash前对列按名称排序
2. **对象排序**：对表、索引等对象按名称排序后再Hash
3. **忽略空值**：null字段不参与Hash计算
4. **规范化格式**：统一数值、日期等类型的表示
5. **双重验证**：Schema Hash用于快速判断，对象Hash用于精确定位差异

### 9.3 迁移路径

1. **第一阶段**：实现Hash计算器，保留现有History表
2. **第二阶段**：新增Hash History表，双写
3. **第三阶段**：逐步迁移到Hash系统
4. **第四阶段**：废弃旧的version-based History表

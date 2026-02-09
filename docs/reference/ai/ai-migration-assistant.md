---
title: AI 迁移助手
icon: 🔄
description: 使用 AI 进行智能 Schema 迁移、风险评估和数据迁移方案
order: 4
---

# AI 迁移助手

JustDB AI 迁移助手提供智能的数据库 Schema 迁移建议，包括风险评估、数据迁移方案和自动生成的迁移脚本。

## 智能迁移建议

### 基础用法

```java
import org.verydb.justdb.ai.AIAssistant;
import org.verydb.justdb.schema.Justdb;

// 创建当前 Schema 和目标 Schema
Justdb currentSchema = loadSchema("current-schema.yaml");
Justdb targetSchema = loadSchema("target-schema.yaml");

// 获取 AI 迁移建议
String advice = AIAssistant.generateMigrationAdvice(
    currentSchema,
    targetSchema
);

System.out.println(advice);
```

### 输出示例

```
=== Database Migration Advice ===

Source Schema table count: 3
Target Schema table count: 5

Detected new tables, recommend backing up data before performing migration

Migration steps recommendation:
1. Backup current database
2. Execute structural changes (add/modify/delete tables and columns)
3. Data migration (if necessary)
4. Verify data integrity
5. Update application configuration

Warnings:
- Table 'users' renamed to 'customers'
- New NOT NULL constraint on 'email' column
- Type change: VARCHAR(100) -> VARCHAR(255) for 'name' column
```

## 风险评估

### 迁移风险分析

AI 迁移助手会自动分析迁移过程中的潜在风险：

```java
import org.verydb.justdb.ai.AiSchemaManager;

AiSchemaManager aiManager = new AiSchemaManager();
aiManager.initialize(config);

// 获取风险评估
String riskAssessment = aiManager.assessMigrationRisks(
    currentSchema,
    targetSchema
);

System.out.println(riskAssessment);
```

### 风险级别

| 级别 | 说明 | 示例操作 |
|------|------|----------|
| **高风险** | 可能导致数据丢失 | 删除表、删除列、缩小字段长度 |
| **中风险** | 可能导致停机 | 添加 NOT NULL 约束、类型转换 |
| **低风险** | 影响较小 | 添加表、添加列、添加索引 |

### 风险评估输出示例

```
=== Migration Risk Assessment ===

High Risk Operations:
  [HIGH] DROP TABLE temp_users - Data will be lost
  [HIGH] ALTER TABLE users DROP COLUMN old_email - Data will be lost

Medium Risk Operations:
  [MEDIUM] ALTER TABLE posts MODIFY COLUMN content TEXT - May require table rebuild
  [MEDIUM] ALTER TABLE comments ADD CONSTRAINT not_null - Requires data validation

Low Risk Operations:
  [LOW] CREATE TABLE tags - Safe operation
  [LOW] ALTER TABLE users ADD COLUMN phone VARCHAR(20) - Safe operation

Recommendations:
1. Backup all data before proceeding
2. Test migration on staging environment first
3. Consider using safe-drop mode for high-risk operations
4. Prepare rollback plan for critical tables
```

## 数据迁移方案

### 生成数据迁移脚本

```java
String dataMigrationPlan = aiManager.generateDataMigrationPlan(
    currentSchema,
    targetSchema,
    "mysql"  // 目标数据库类型
);

System.out.println(dataMigrationPlan);
```

### 数据迁移策略

AI 会根据变更类型自动选择合适的数据迁移策略：

#### 1. 表重命名

```sql
-- 原始表名：users
-- 目标表名：customers

-- 策略：直接重命名（保留数据）
ALTER TABLE users RENAME TO customers;
```

#### 2. 列重命名

```sql
-- 原始列名：user_name
-- 目标列名：username

-- 策略：直接重命名（保留数据）
ALTER TABLE users RENAME COLUMN user_name TO username;
```

#### 3. 类型转换

```sql
-- 原始类型：VARCHAR(100)
-- 目标类型：VARCHAR(255)

-- 策略：安全转换（保留数据）
ALTER TABLE users MODIFY COLUMN name VARCHAR(255);

-- 对于可能有数据丢失的转换，使用中间步骤
ALTER TABLE users MODIFY COLUMN price DECIMAL(15,2);
```

#### 4. 添加 NOT NULL 约束

```sql
-- 策略：先更新数据，再添加约束
UPDATE users SET email = 'unknown@example.com' WHERE email IS NULL;
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL;
```

#### 5. 表拆分

```sql
-- 将一个大表拆分为多个小表
-- 策略：创建新表，复制数据，建立外键关系

-- 1. 创建新表
CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    bio TEXT,
    avatar_url VARCHAR(512),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. 迁移数据
INSERT INTO user_profiles (user_id, bio, avatar_url)
SELECT id, bio, avatar_url FROM users WHERE bio IS NOT NULL;

-- 3. 删除原列（可选）
-- ALTER TABLE users DROP COLUMN bio;
```

## 代码示例

### 完整迁移流程

```java
import org.verydb.justdb.ai.AiSchemaManager;
import org.verydb.justdb.cli.config.AiConfig;
import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.migration.SchemaMigrationService;

public class AiMigrationExample {

    public static void main(String[] args) {
        // 初始化
        AiSchemaManager aiManager = new AiSchemaManager();
        AiConfig config = new AiConfig("migration-ai", "openai");
        config.setApiKey(System.getenv("OPENAI_API_KEY"));
        aiManager.initialize(config);

        // 加载 Schema
        Justdb currentSchema = loadSchema("schema-v1.yaml");
        Justdb targetSchema = loadSchema("schema-v2.yaml");

        // 1. 获取迁移建议
        System.out.println("=== Migration Advice ===");
        String advice = aiManager.getMigrationAdvice(currentSchema, targetSchema);
        System.out.println(advice);

        // 2. 风险评估
        System.out.println("\n=== Risk Assessment ===");
        String risks = aiManager.assessMigrationRisks(currentSchema, targetSchema);
        System.out.println(risks);

        // 3. 生成迁移脚本
        System.out.println("\n=== Migration Scripts ===");
        SchemaMigrationService migrationService = new SchemaMigrationService(
            currentSchema,
            JustdbManager.getInstance()
        );

        List&lt;String&gt; scripts = migrationService.generateMigrationScripts(
            targetSchema,
            "mysql"
        );

        for (String script : scripts) {
            System.out.println(script);
        }

        // 4. 执行迁移（带确认）
        if (confirmMigration()) {
            migrationService.executeMigration(targetSchema);
            System.out.println("Migration completed successfully!");
        }
    }

    private static boolean confirmMigration() {
        // 实现确认逻辑
        return true;
    }

    private static Justdb loadSchema(String path) {
        // 实现加载逻辑
        return new Justdb();
    }
}
```

### 增量迁移

```java
// 分步骤执行迁移，每步验证后再继续

// 步骤 1：添加新表
Justdb step1 = aiManager.processNaturalLanguageRequest(
    "Add a new tags table for post categorization",
    currentSchema
);
migrationService.executeMigration(step1);
verifyDataIntegrity();

// 步骤 2：添加关联列
Justdb step2 = aiManager.processNaturalLanguageRequest(
    "Add tag_id column to posts table",
    step1
);
migrationService.executeMigration(step2);
verifyDataIntegrity();

// 步骤 3：添加外键约束
Justdb step3 = aiManager.processNaturalLanguageRequest(
    "Add foreign key from posts.tag_id to tags.id",
    step2
);
migrationService.executeMigration(step3);
verifyDataIntegrity();
```

## 高级功能

### 1. 安全迁移模式

使用安全迁移模式（Safe Drop）避免数据丢失：

```yaml
migration:
  safeDrop: true
  backupBeforeDrop: true
  backupDir: ./backups
```

```java
// 启用安全模式
MigrationConfig config = new MigrationConfig();
config.setSafeDrop(true);
config.setBackupBeforeDrop(true);

SchemaMigrationService service = new SchemaMigrationService(
    currentSchema,
    justdbManager,
    config
);
```

### 2. 回滚计划

AI 会自动生成回滚脚本：

```java
String rollbackPlan = aiManager.generateRollbackPlan(
    currentSchema,
    targetSchema
);

System.out.println("=== Rollback Plan ===");
System.out.println(rollbackPlan);
```

### 3. 数据验证

```java
// 验证数据完整性
ValidationResult result = aiManager.validateMigration(
    currentSchema,
    targetSchema,
    "mysql"
);

if (!result.isValid()) {
    System.err.println("Validation failed:");
    for (String error : result.getErrors()) {
        System.err.println("  - " + error);
    }
}
```

### 4. 历史记录

AI 迁移助手会记录每次迁移的历史：

```java
AiSchemaHistoryManager historyManager = aiManager.getAiService()
    .getHistoryManager();

// 保存迁移前的快照
historyManager.saveSnapshot(currentSchema, "pre-migration");

// 执行迁移
Justdb migratedSchema = executeMigration(currentSchema, targetSchema);

// 保存迁移后的快照
historyManager.saveSnapshot(migratedSchema, "post-migration");

// 查看历史
List&lt;SchemaSnapshot&gt; snapshots = historyManager.getSnapshots();
for (SchemaSnapshot snapshot : snapshots) {
    System.out.println(snapshot.getTag() + ": " +
        snapshot.getTimestamp());
}
```

## 最佳实践

### 1. 迁移前检查清单

```java
public class MigrationChecklist {

    public static boolean checkBeforeMigration(Justdb current, Justdb target) {
        // 1. 备份数据库
        if (!backupDatabase()) {
            return false;
        }

        // 2. 在测试环境验证
        if (!validateOnStaging(current, target)) {
            return false;
        }

        // 3. 检查依赖关系
        if (!checkDependencies(current, target)) {
            return false;
        }

        // 4. 评估性能影响
        if (!assessPerformance(current, target)) {
            return false;
        }

        return true;
    }
}
```

### 2. 分阶段迁移

```java
// 阶段 1：添加新表（不影响现有功能）
Justdb phase1 = addNewTables(currentSchema);

// 阶段 2：添加新列（不影响现有功能）
Justdb phase2 = addNewColumns(phase1);

// 阶段 3：迁移数据
Justdb phase3 = migrateData(phase2);

// 阶段 4：更新应用代码
// (在应用中逐步切换到新字段)

// 阶段 5：清理旧代码和字段
Justdb phase5 = removeLegacyFields(phase3);
```

### 3. 零停机迁移

```java
// 使用蓝绿部署策略实现零停机迁移

// 1. 创建新 Schema
Justdb newSchema = createNewSchema();

// 2. 同步数据
syncData(currentSchema, newSchema);

// 3. 切换流量
switchTrafficToNewSchema(newSchema);

// 4. 验证
if (validateNewSchema(newSchema)) {
    // 5. 清理旧 Schema
    cleanupOldSchema(currentSchema);
}
```

## 常见场景

### 场景 1：添加用户认证

```java
String request = """
    Add user authentication to existing users table:
    - Add password_hash column (VARCHAR(255), NOT NULL)
    - Add email_verified column (BOOLEAN, default false)
    - Add last_login column (TIMESTAMP)
    - Add unique index on email
""";

Justdb updated = aiManager.processNaturalLanguageRequest(
    request,
    currentSchema
);
```

### 场景 2：实现软删除

```java
String request = """
    Add soft delete support to all tables:
    - Add deleted_at column (TIMESTAMP, nullable)
    - Add index on deleted_at
    - Do not add to audit tables
""";

Justdb updated = aiManager.processNaturalLanguageRequest(
    request,
    currentSchema
);
```

### 场景 3：多语言支持

```java
String request = """
    Add internationalization support:
    - Create translations table with locale, key, and value
    - Add locale column to users (default 'en')
    - Create content_translations for posts and comments
""";

Justdb updated = aiManager.processNaturalLanguageRequest(
    request,
    currentSchema
);
```

## 故障排除

### 迁移失败

```java
try {
    migrationService.executeMigration(targetSchema);
} catch (MigrationException e) {
    System.err.println("Migration failed: " + e.getMessage());

    // 从历史恢复
    Justdb previous = historyManager.restoreSnapshot("pre-migration");
    System.out.println("Restored to previous version");
}
```

### 数据不一致

```java
// 验证数据一致性
List&lt;String&gt; inconsistencies = checkDataConsistency(
    currentSchema,
    targetSchema
);

if (!inconsistencies.isEmpty()) {
    System.err.println("Data inconsistencies found:");
    for (String issue : inconsistencies) {
        System.err.println("  - " + issue);
    }
}
```

## 相关文档

- [AI 集成概述](./README.md) - AI 功能总览
- [自然语言操作](./natural-language.md) - 自然语言 Schema 操作
- [AI Schema 生成](./ai-schema-generation.md) - 从描述生成 Schema
- [Schema 迁移系统](../../design/migration-system/overview.md) - 迁移系统设计

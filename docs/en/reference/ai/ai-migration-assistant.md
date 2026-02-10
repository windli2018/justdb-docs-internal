---
title: AI Migration Assistant
icon: 🔄
description: Use AI for intelligent Schema migration, risk assessment, and data migration plans
order: 4
---

# AI Migration Assistant

JustDB AI migration assistant provides intelligent database Schema migration recommendations, including risk assessment, data migration plans, and automatically generated migration scripts.

## Intelligent Migration Recommendations

### Basic Usage

```java
import org.verydb.justdb.ai.AIAssistant;
import org.verydb.justdb.schema.Justdb;

// Create current Schema and target Schema
Justdb currentSchema = loadSchema("current-schema.yaml");
Justdb targetSchema = loadSchema("target-schema.yaml");

// Get AI migration recommendations
String advice = AIAssistant.generateMigrationAdvice(
    currentSchema,
    targetSchema
);

System.out.println(advice);
```

### Output Example

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

## Risk Assessment

### Migration Risk Analysis

The AI migration assistant automatically analyzes potential risks during the migration process:

```java
import org.verydb.justdb.ai.AiSchemaManager;

AiSchemaManager aiManager = new AiSchemaManager();
aiManager.initialize(config);

// Get risk assessment
String riskAssessment = aiManager.assessMigrationRisks(
    currentSchema,
    targetSchema
);

System.out.println(riskAssessment);
```

### Risk Levels

| Level | Description | Example Operations |
|-------|-------------|-------------------|
| **High Risk** | May cause data loss | Drop tables, drop columns, reduce field length |
| **Medium Risk** | May cause downtime | Add NOT NULL constraint, type conversion |
| **Low Risk** | Minor impact | Add tables, add columns, add indexes |

### Risk Assessment Output Example

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

## Data Migration Plans

### Generate Data Migration Scripts

```java
String dataMigrationPlan = aiManager.generateDataMigrationPlan(
    currentSchema,
    targetSchema,
    "mysql"  // Target database type
);

System.out.println(dataMigrationPlan);
```

### Data Migration Strategies

AI automatically selects appropriate data migration strategies based on change types:

#### 1. Table Rename

```sql
-- Original table name: users
-- Target table name: customers

-- Strategy: Direct rename (preserves data)
ALTER TABLE users RENAME TO customers;
```

#### 2. Column Rename

```sql
-- Original column name: user_name
-- Target column name: username

-- Strategy: Direct rename (preserves data)
ALTER TABLE users RENAME COLUMN user_name TO username;
```

#### 3. Type Conversion

```sql
-- Original type: VARCHAR(100)
-- Target type: VARCHAR(255)

-- Strategy: Safe conversion (preserves data)
ALTER TABLE users MODIFY COLUMN name VARCHAR(255);

-- For conversions with potential data loss, use intermediate steps
ALTER TABLE users MODIFY COLUMN price DECIMAL(15,2);
```

#### 4. Add NOT NULL Constraint

```sql
-- Strategy: Update data first, then add constraint
UPDATE users SET email = 'unknown@example.com' WHERE email IS NULL;
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL;
```

#### 5. Table Split

```sql
-- Split a large table into multiple smaller tables
-- Strategy: Create new tables, copy data, establish foreign key relationships

-- 1. Create new table
CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    bio TEXT,
    avatar_url VARCHAR(512),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. Migrate data
INSERT INTO user_profiles (user_id, bio, avatar_url)
SELECT id, bio, avatar_url FROM users WHERE bio IS NOT NULL;

-- 3. Delete original columns (optional)
-- ALTER TABLE users DROP COLUMN bio;
```

## Code Examples

### Complete Migration Workflow

```java
import org.verydb.justdb.ai.AiSchemaManager;
import org.verydb.justdb.cli.config.AiConfig;
import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.migration.SchemaMigrationService;

public class AiMigrationExample {

    public static void main(String[] args) {
        // Initialize
        AiSchemaManager aiManager = new AiSchemaManager();
        AiConfig config = new AiConfig("migration-ai", "openai");
        config.setApiKey(System.getenv("OPENAI_API_KEY"));
        aiManager.initialize(config);

        // Load Schema
        Justdb currentSchema = loadSchema("schema-v1.yaml");
        Justdb targetSchema = loadSchema("schema-v2.yaml");

        // 1. Get migration recommendations
        System.out.println("=== Migration Advice ===");
        String advice = aiManager.getMigrationAdvice(currentSchema, targetSchema);
        System.out.println(advice);

        // 2. Risk assessment
        System.out.println("\n=== Risk Assessment ===");
        String risks = aiManager.assessMigrationRisks(currentSchema, targetSchema);
        System.out.println(risks);

        // 3. Generate migration scripts
        System.out.println("\n=== Migration Scripts ===");
        SchemaMigrationService migrationService = new SchemaMigrationService(
            currentSchema,
            JustdbManager.getInstance()
        );

        List<String> scripts = migrationService.generateMigrationScripts(
            targetSchema,
            "mysql"
        );

        for (String script : scripts) {
            System.out.println(script);
        }

        // 4. Execute migration (with confirmation)
        if (confirmMigration()) {
            migrationService.executeMigration(targetSchema);
            System.out.println("Migration completed successfully!");
        }
    }

    private static boolean confirmMigration() {
        // Implement confirmation logic
        return true;
    }

    private static Justdb loadSchema(String path) {
        // Implement loading logic
        return new Justdb();
    }
}
```

### Incremental Migration

```java
// Execute migration in steps, verify each step before continuing

// Step 1: Add new tables
Justdb step1 = aiManager.processNaturalLanguageRequest(
    "Add a new tags table for post categorization",
    currentSchema
);
migrationService.executeMigration(step1);
verifyDataIntegrity();

// Step 2: Add association columns
Justdb step2 = aiManager.processNaturalLanguageRequest(
    "Add tag_id column to posts table",
    step1
);
migrationService.executeMigration(step2);
verifyDataIntegrity();

// Step 3: Add foreign key constraints
Justdb step3 = aiManager.processNaturalLanguageRequest(
    "Add foreign key from posts.tag_id to tags.id",
    step2
);
migrationService.executeMigration(step3);
verifyDataIntegrity();
```

## Advanced Features

### 1. Safe Migration Mode

Use safe migration mode (Safe Drop) to avoid data loss:

```yaml
migration:
  safeDrop: true
  backupBeforeDrop: true
  backupDir: ./backups
```

```java
// Enable safe mode
MigrationConfig config = new MigrationConfig();
config.setSafeDrop(true);
config.setBackupBeforeDrop(true);

SchemaMigrationService service = new SchemaMigrationService(
    currentSchema,
    justdbManager,
    config
);
```

### 2. Rollback Plan

AI automatically generates rollback scripts:

```java
String rollbackPlan = aiManager.generateRollbackPlan(
    currentSchema,
    targetSchema
);

System.out.println("=== Rollback Plan ===");
System.out.println(rollbackPlan);
```

### 3. Data Validation

```java
// Verify data integrity
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

### 4. History Tracking

AI migration assistant records the history of each migration:

```java
AiSchemaHistoryManager historyManager = aiManager.getAiService()
    .getHistoryManager();

// Save pre-migration snapshot
historyManager.saveSnapshot(currentSchema, "pre-migration");

// Execute migration
Justdb migratedSchema = executeMigration(currentSchema, targetSchema);

// Save post-migration snapshot
historyManager.saveSnapshot(migratedSchema, "post-migration");

// View history
List<SchemaSnapshot> snapshots = historyManager.getSnapshots();
for (SchemaSnapshot snapshot : snapshots) {
    System.out.println(snapshot.getTag() + ": " +
        snapshot.getTimestamp());
}
```

## Best Practices

### 1. Pre-Migration Checklist

```java
public class MigrationChecklist {

    public static boolean checkBeforeMigration(Justdb current, Justdb target) {
        // 1. Backup database
        if (!backupDatabase()) {
            return false;
        }

        // 2. Validate on staging environment
        if (!validateOnStaging(current, target)) {
            return false;
        }

        // 3. Check dependencies
        if (!checkDependencies(current, target)) {
            return false;
        }

        // 4. Assess performance impact
        if (!assessPerformance(current, target)) {
            return false;
        }

        return true;
    }
}
```

### 2. Phased Migration

```java
// Phase 1: Add new tables (doesn't affect existing functionality)
Justdb phase1 = addNewTables(currentSchema);

// Phase 2: Add new columns (doesn't affect existing functionality)
Justdb phase2 = addNewColumns(phase1);

// Phase 3: Migrate data
Justdb phase3 = migrateData(phase2);

// Phase 4: Update application code
// (Gradually switch to new fields in application)

// Phase 5: Clean up old code and fields
Justdb phase5 = removeLegacyFields(phase3);
```

### 3. Zero-Downtime Migration

```java
// Use blue-green deployment strategy for zero-downtime migration

// 1. Create new Schema
Justdb newSchema = createNewSchema();

// 2. Sync data
syncData(currentSchema, newSchema);

// 3. Switch traffic
switchTrafficToNewSchema(newSchema);

// 4. Validate
if (validateNewSchema(newSchema)) {
    // 5. Clean up old Schema
    cleanupOldSchema(currentSchema);
}
```

## Common Scenarios

### Scenario 1: Add User Authentication

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

### Scenario 2: Implement Soft Delete

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

### Scenario 3: Multi-language Support

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

## Troubleshooting

### Migration Failure

```java
try {
    migrationService.executeMigration(targetSchema);
} catch (MigrationException e) {
    System.err.println("Migration failed: " + e.getMessage());

    // Restore from history
    Justdb previous = historyManager.restoreSnapshot("pre-migration");
    System.out.println("Restored to previous version");
}
```

### Data Inconsistency

```java
// Verify data consistency
List<String> inconsistencies = checkDataConsistency(
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

## Related Documentation

- [AI Integration Overview](./README.md) - AI feature overview
- [Natural Language Operations](./natural-language.md) - Natural language Schema operations
- [AI Schema Generation](./ai-schema-generation.md) - Generate Schema from descriptions
- [Schema Migration System](../../design/migration-system/overview.md) - Migration system design

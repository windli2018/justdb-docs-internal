# Hash-based History System Design

## 1. Design Background

### 1.1 Core Problem

JustDB uses **Declarative Schema**, representing the final desired database state rather than incremental migration scripts. This differs fundamentally from Flyway/Liquibase versioned migration patterns.

**Current History System Issues**:
- Uses `installed_rank` (auto-increment ID) and `version` fields to track changes
- Modeled after Flyway design, but JustDB Schema has no version concept
- `version` is just a CLI parameter, meaningless to Schema files themselves

### 1.2 Design Goals

1. **Hash-based Consistency Validation**: Use SHA1 or SHA256 to calculate Schema fingerprints
2. **Dual Hash Validation**: Schema-level Hash + object-level Hash for final consistency
3. **Column Order Independence**: Column order changes in database should not affect Hash calculation
4. **Declarative Friendly**: Matches JustDB's final state description pattern

---------------------------

## 2. Hash Calculation Approaches

### Approach 1: Normalized JSON-based Hash (Recommended)

**Principle**: Serialize Schema objects to normalized JSON strings, then calculate Hash.

**Key Requirements**:
- Sort by field names (ensures field order doesn't affect result)
- Sort collection elements (ensures column/index order doesn't affect result)
- Ignore null fields
- Unified numeric format (integers, floats)

**Pros**: Simple implementation, easy debugging, cross-language validation
**Cons**: Depends on JSON serialization details

### Approach 2: Incremental Hash via Field Traversal

**Principle**: Directly traverse Schema object tree, accumulating Hash values in fixed order.

**Pros**: Better performance, smaller memory footprint
**Cons**: Higher maintenance cost

### Approach 3: Structural Signature Hash (Most Flexible)

**Principle**: Define structural signatures for each Schema object type, including only semantically relevant fields.

**Pros**: Flexible control, can ignore "insignificant" differences
**Cons**: Need to define signature format for each object type

---------------------------

## 3. Dual Hash Validation Mechanism

### 3.1 Two-Level Hash Design

```
Justdb Schema
├── Schema Hash (schema_hash)
│   └── Hash of entire Schema
│
└── Object Hashes (object_hashes)
    ├── Table1 Hash
    ├── Table2 Hash
    └── ...
```

### 3.2 Validation Logic

**Scenario 1: Pre-deployment Check**
1. Calculate current Schema Hash
2. Read deployed Hash from database
3. If same, skip deployment
4. If different, calculate object-level Hash to identify changes

**Scenario 2: Consistency Check**
1. Calculate expected Schema Hash from file
2. Read actual Schema Hash from database
3. If different, perform object-level detailed check

---------------------------

## 4. New History Table Structure

### 4.1 Main Table: justdb_schema_hash_history

```sql
CREATE TABLE justdb_schema_hash_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    deployed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deployed_by VARCHAR(255) NOT NULL,
    schema_hash CHAR(64) NOT NULL COMMENT 'SHA256 of entire schema',
    hash_algorithm VARCHAR(20) NOT NULL DEFAULT 'SHA256',
    execution_time_ms BIGINT COMMENT 'Execution time in milliseconds',
    success BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSON COMMENT 'Additional deployment metadata',
    INDEX idx_schema_hash (schema_hash),
    INDEX idx_deployed_at (deployed_at)
);
```

### 4.2 Object Table: justdb_schema_object_hashes

```sql
CREATE TABLE justdb_schema_object_hashes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    history_id BIGINT NOT NULL,
    object_type VARCHAR(50) NOT NULL COMMENT 'TABLE, VIEW, INDEX, etc.',
    object_name VARCHAR(255) NOT NULL,
    object_hash CHAR(64) NOT NULL COMMENT 'SHA256 of object definition',
    change_type ENUM('ADDED', 'MODIFIED', 'UNCHANGED', 'REMOVED') NOT NULL,
    FOREIGN KEY (history_id) REFERENCES justdb_schema_hash_history(id),
    UNIQUE KEY uk_object (history_id, object_type, object_name),
    INDEX idx_object (object_type, object_name)
);
```

---------------------------

## 5. Workflow

### 5.1 Deployment Flow

```
1. Load Schema file
   ↓
2. Calculate Schema Hash (SHA256)
   ↓
3. Query latest deployed Hash
   ↓
4. Compare Hash values
   ├─ Same → Skip deployment (no changes needed)
   └─ Different → Continue
   ↓
5. Calculate object-level Hash, identify changes
   ├─ ADDED: New objects
   ├─ MODIFIED: Modified objects
   ├─ UNCHANGED: Unchanged objects
   └─ REMOVED: Deleted objects
   ↓
6. Generate and execute SQL
   ↓
7. Record History
   ├─ Insert main table record (schema_hash)
   └─ Insert object table records (object_hashes)
```

---------------------------

## 6. Column Order Independence Handling

### 6.1 Problem Analysis

Column physical order in database may change, but Schema semantics remain unchanged.

**Solution**: Sort columns by name before calculating Hash.

```java
// Before calculating Hash, sort columns by name
List<Column> sortedColumns = table.getColumns().stream()
    .sorted(Comparator.comparing(Column::getName))
    .collect(Collectors.toList());

// Then use sorted columns to calculate Hash
for (Column column : sortedColumns) {
    hashColumn(digest, column);
}
```

---------------------------

## 7. Hash Algorithm Selection

### 7.1 SHA1 vs SHA256

| Feature | SHA1 | SHA256 |
|---------|------|--------|
| Output Length | 160 bits (40 chars) | 256 bits (64 chars) |
| Collision Probability | Extremely low | Even lower |
| Performance | Faster | Slightly slower |
| Security | Theoretical attacks exist | Currently secure |

**Recommendation**: Use **SHA256** for higher security with negligible performance impact.

---------------------------

## 8. Implementation Summary

### 8.1 Recommended Approach Combination

| Scenario | Recommended Approach | Rationale |
|----------|---------------------|-----------|
| Hash Calculation | Normalized JSON Hash | Simple, debuggable, column-order independent |
| Hash Algorithm | SHA256 | High security, low performance impact |
| Validation | Dual Hash | Quick Schema-level check + precise object-level location |

### 8.2 Key Design Principles

1. **Column Order Independence**: Sort columns by name before Hash calculation
2. **Object Sorting**: Sort tables, indexes by name before Hash
3. **Ignore Nulls**: null fields don't participate in Hash calculation
4. **Dual Validation**: Schema Hash for quick判断, Object Hash for precise diff location

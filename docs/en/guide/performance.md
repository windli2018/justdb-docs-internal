---
icon: gauge-high
date: 2024-01-01
title: Performance
order: 10
category:
  - Guide
  - Performance
tag:
  - performance
  - optimization
  - best practices
---

# Performance

Learn how to optimize JustDB's schema loading, SQL generation, and migration performance.

## Schema Loading Performance

### File Organization Optimization

#### Modular Organization

```yaml
# Good practice: Modular
justdb/
├── core/
│   ├── users.yaml       # 100 lines
│   ├── roles.yaml       # 50 lines
│   └── permissions.yaml # 30 lines
├── business/
│   ├── orders.yaml      # 200 lines
│   ├── products.yaml    # 150 lines
│   └── payments.yaml    # 100 lines
└── config/
    ├── dev.yaml
    └── prod.yaml

# Avoid: Single file
justdb/
└── schema.yaml          # 1000+ lines, slow loading
```

#### Lazy Loading

```yaml
# config.yaml
schema:
  locations:
    - ./justdb/core       # Core tables load first
    - ./justdb/business   # Business tables load on demand
  lazyLoad: true          # Enable lazy loading
```

### Format Selection

**Loading speed comparison** (fastest to slowest):

1. **YAML** - Recommended
   - Human-readable
   - Fast loading speed
   - Supports comments

2. **JSON** - Machine-readable
   - Fast loading speed
   - No comments

3. **XML** - Enterprise
   - Medium loading speed
   - Supports schema validation

```bash
# YAML (recommended)
justdb migrate justdb/schema.yaml

# JSON
justdb migrate justdb/schema.json

# XML
justdb migrate justdb/schema.xml
```

## SQL Generation Performance

### Template Caching

```java
// Enable template caching
TemplateExecutor executor = new TemplateExecutor();
executor.setCacheTemplates(true);  // Default enabled

// Precompile templates
executor.precompileTemplates();
```

### Batch Operations

#### Batch Generate SQL

```java
// Good practice: Batch processing
List<Table&gt;> tables = schema.getTables();
DBGenerator generator = new DBGenerator(pluginManager, dialect);

// Batch generate
List&lt;String&gt; sqlStatements = generator.generateAll(tables);

// Batch execute
try (Statement stmt = connection.createStatement()) {
    for (String sql : sqlStatements) {
        stmt.addBatch(sql);
    }
    stmt.executeBatch();
}

// Avoid: Process individually
for (Table table : tables) {
    String sql = generator.generate(table);
    try (Statement stmt = connection.createStatement()) {
        stmt.execute(sql);
    }
}
```

### SQL Optimization

#### Use Batch Insert

```yaml
Table:
  - name: users
    beforeCreates:
      - sql: |
          -- Batch insert mode
          SET SESSION unique_checks=0;
          SET SESSION foreign_key_checks=0;
    afterCreates:
      - sql: |
          -- Restore defaults
          SET SESSION unique_checks=1;
          SET SESSION foreign_key_checks=1;
```

#### Optimize Index Creation

```yaml
Table:
  - name: users
    afterCreates:
      - sql: |
          -- Create table first
          -- Batch create indexes (faster than individual creation)
          ALTER TABLE users
            ADD INDEX idx_username (username),
            ADD INDEX idx_email (email),
            ADD INDEX idx_phone (phone);
    # Avoid: Create indexes individually in table definition
    Index:
      - name: idx_username
        columns: [username]
      - name: idx_email
        columns: [email]
```

## Migration Performance

### Incremental Migration

```bash
# Use incremental migration instead of full migration
justdb migrate --incremental

# Only process changed parts
# Instead of reprocessing entire schema
```

### Parallel Processing

```yaml
# config.yaml
migration:
  parallel: true          # Enable parallel processing
  threads: 4             # Thread count
  batchSize: 1000        # Batch processing size
```

### Large Table Processing

#### Batch Processing

```sql
-- Batch update large table
UPDATE users SET status = 1 WHERE id BETWEEN 1 AND 10000;
UPDATE users SET status = 1 WHERE id BETWEEN 10001 AND 20000;
-- Continue batching...
```

#### Use pt-online-schema-change

```bash
# Online modify large table
pt-online-schema-change \
  --alter "ADD COLUMN phone VARCHAR(20)" \
  --charset=utf8mb4 \
  --critical-load="Threads_running=50" \
  --execute \
  D=myapp,t=users
```

### Reduce Table Lock Time

```yaml
Table:
  - name: users
    beforeAlters:
      - sql: |
          -- MySQL: Use online DDL
          SET SESSION alter_algorithm='INPLACE';
          SET SESSION lock_wait_timeout=10;
    Column:
      - name: phone
        type: VARCHAR(20)
```

## Database Performance

### Index Strategy

#### Create Indexes Appropriately

```yaml
# Good practice: High selectivity fields
Index:
  - name: idx_email
    columns: [email]
    unique: true           # High email uniqueness

  - name: idx_user_status
    columns: [user_id, status]
    # Composite index: High selectivity + Common query condition

# Avoid: Low selectivity fields
Index:
  - name: idx_gender
    columns: [gender]
    # gender has few values, poor index effectiveness
```

#### Index Count Control

```yaml
# Good practice: Keep under 5
Table:
  - name: users
    Index:
      - name: PRIMARY
        columns: [id]
      - name: idx_username
        columns: [username]
      - name: idx_email
        columns: [email]
      - name: idx_user_status
        columns: [user_id, status]
      - name: idx_created_at
        columns: [created_at]

# Avoid: Too many indexes affect write performance
```

### Field Type Optimization

#### Use Appropriate Types

```yaml
Column:
  # Good practice: Use minimum sufficient type
  - name: status
    type: TINYINT          # Only few values
    # type: VARCHAR(20)   # Avoid: Wastes space

  - name: amount
    type: DECIMAL(12, 2)   # Precise amount
    # type: FLOAT         # Avoid: Imprecise

  - name: created_at
    type: TIMESTAMP       # 4 bytes
    # type: BIGINT        # 8 bytes, waste
```

#### String Length

```yaml
Column:
  # Good practice: Reasonable length
  - name: username
    type: VARCHAR(50)     # Sufficient and not too long

  - name: email
    type: VARCHAR(100)    # Standard email length

  # Avoid: Too long or too short
  - name: phone
    type: VARCHAR(500)    # Too long
    # type: VARCHAR(10)   # Too short
```

### Partition Strategy

```yaml
Table:
  - name: orders
    comment: Order table (monthly partitioning)
    partitionBy: RANGE (TO_DAYS(created_at))
    partitions:
      - name: p202401
        value: TO_DAYS('2024-01-31')
      - name: p202402
        value: TO_DAYS('2024-02-29')
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: created_at
        type: TIMESTAMP
```

## JVM Optimization

### Memory Configuration

```bash
# Increase heap memory
export JAVA_OPTS="-Xmx2g -Xms2g"

# Set G1 GC
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"

# Optimize GC
export JAVA_OPTS="$JAVA_OPTS -XX:MaxGCPauseMillis=200"
```

### JIT Compilation

```bash
# Enable JIT compilation
export JAVA_OPTS="$JAVA_OPTS -XX:+CompileThreshold=1000"

# Warm up JVM
justdb warmup
justdb migrate
```

## Monitoring and Analysis

### Performance Monitoring

```bash
# Enable performance monitoring
justdb migrate --profile

# Output:
# [INFO] Schema loading: 123ms
# [INFO] Diff calculation: 45ms
# [INFO] SQL generation: 67ms
# [INFO] Migration execution: 234ms
# [INFO] Total time: 469ms
```

### Slow Query Analysis

```yaml
# config.yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  options:
    - logSlowQueries=true
    - slowQueryThreshold=1000
```

### Execution Plan Analysis

```bash
# View execution plan
justdb explain --sql "SELECT * FROM users WHERE email = 'test@example.com'"

# Output:
# +----+-------------+-------+------+---------------+
# | id | select_type | table | type | possible_keys |
# +----+-------------+-------+------+---------------+
# |  1 | SIMPLE      | users | ref  | idx_email     |
# +----+-------------+-------+------+---------------+
```

## Best Practices

### 1. Regular Maintenance

```sql
-- Regularly optimize table
OPTIMIZE TABLE users;

-- Analyze table
ANALYZE TABLE users;

-- Check table
CHECK TABLE users;
```

### 2. Monitor Performance

```bash
# Regularly check performance
justdb health --verbose

# View statistics
justdb stats
```

### 3. Caching Strategy

```java
// Enable schema cache
JustdbManager manager = JustdbManager.getInstance();
manager.setCacheEnabled(true);
manager.setCacheSize(100);
```

### 4. Connection Pool Configuration

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 5. Batch Operations

```java
// Use batch operations
try (PreparedStatement ps = conn.prepareStatement(
    "INSERT INTO users (username, email) VALUES (?, ?)")) {

    for (User user : users) {
        ps.setString(1, user.getUsername());
        ps.setString(2, user.getEmail());
        ps.addBatch();
    }

    ps.executeBatch();
}
```

## Performance Checklist

### Schema Design

- [ ] Use appropriate data types
- [ ] Reasonable field lengths
- [ ] Moderate index count (3-5)
- [ ] High index selectivity
- [ ] Avoid over-normalization

### Migration Strategy

- [ ] Use incremental migration
- [ ] Process large tables in batches
- [ ] Avoid long transactions
- [ ] Enable parallel processing
- [ ] Reduce table lock time

### Runtime Configuration

- [ ] Sufficient JVM memory
- [ ] Reasonable connection pool configuration
- [ ] Enable caching
- [ ] Monitor performance metrics
- [ ] Regular database maintenance

## Next Steps

<VPCard
  title="Docker Deployment"
  desc="Optimize deployment performance with Docker"
  link="/en/guide/docker.html"
/>

<VPCard
  title="Configuration Reference"
  desc="Complete performance configuration options"
  link="/en/guide/config-reference.html"
/>

<VPCard
  title="API Reference"
  desc="Performance related API documentation"
  link="/en/guide/api-reference.html"
/>

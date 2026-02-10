---
icon: settings
date: 2024-01-01
title: Configuration Reference
order: 14
category:
  - Guide
  - Reference
tag:
  - configuration
  - reference
  - options
---

# Configuration Reference

Complete configuration options for JustDB, including configuration file formats, options, and environment variables.

## Configuration File Format

### YAML Format (Recommended)

```yaml
# justdb-config.yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
  driver: com.mysql.cj.jdbc.Driver
  options:
    - useSSL=false
    - serverTimezone=UTC

schema:
  locations:
    - ./justdb
    - ./db
    - classpath:justdb
  format: yaml
  encoding: UTF-8

migrate:
  auto-diff: true
  safe-drop: false
  baseline-on-migrate: true
  idempotent: true
  dry-run: false

history:
  enabled: true
  table: justdb_history
  columns: 50

logging:
  level: INFO
  format: "%d{yyyy-MM-dd HH:mm:ss} [%t] %-5p %c{1}:%L - %m%n"
  file: logs/justdb.log
```

### JSON Format

```json
{
  "database": {
    "url": "jdbc:mysql://localhost:3306/myapp",
    "username": "root",
    "password": "password",
    "driver": "com.mysql.cj.jdbc.Driver",
    "options": [
      "useSSL=false",
      "serverTimezone=UTC"
    ]
  },
  "schema": {
    "locations": [
      "./justdb",
      "./db",
      "classpath:justdb"
    ],
    "format": "yaml",
    "encoding": "UTF-8"
  },
  "migrate": {
    "autoDiff": true,
    "safeDrop": false,
    "baselineOnMigrate": true,
    "idempotent": true,
    "dryRun": false
  }
}
```

### TOML Format

```toml
[database]
url = "jdbc:mysql://localhost:3306/myapp"
username = "root"
password = "password"
driver = "com.mysql.cj.jdbc.Driver"

[[database.options]]
value = "useSSL=false"

[[database.options]]
value = "serverTimezone=UTC"

[schema]
locations = ["./justdb", "./db", "classpath:justdb"]
format = "yaml"
encoding = "UTF-8"

[migrate]
auto-diff = true
safe-drop = false
baseline-on-migrate = true
idempotent = true
dry-run = false
```

### Properties Format

```properties
# justdb-config.properties
database.url=jdbc:mysql://localhost:3306/myapp
database.username=root
database.password=password
database.driver=com.mysql.cj.jdbc.Driver
database.options=useSSL=false,serverTimezone=UTC

schema.locations=./justdb,./db,classpath:justdb
schema.format=yaml
schema.encoding=UTF-8

migrate.auto-diff=true
migrate.safe-drop=false
migrate.baseline-on-migrate=true
migrate.idempotent=true
migrate.dry-run=false
```

## Configuration Options

### Database Configuration

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `database.url` | String | - | JDBC connection URL |
| `database.username` | String | - | Database username |
| `database.password` | String | - | Database password |
| `database.driver` | String | Auto-detect | JDBC driver class name |
| `database.options` | List | [] | Connection options |
| `database.pool.maxSize` | Integer | 10 | Connection pool max size |
| `database.pool.minIdle` | Integer | 5 | Connection pool min idle |
| `database.pool.timeout` | Integer | 30000 | Connection timeout (ms) |

**Example**:
```yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
  pool:
    maxSize: 20
    minIdle: 10
    timeout: 60000
```

### Schema Configuration

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `schema.locations` | List | ["./justdb"] | Schema file locations |
| `schema.format` | String | auto | Schema format (yaml/json/xml/properties/toml) |
| `schema.encoding` | String | UTF-8 | File encoding |
| `schema.validate` | Boolean | true | Whether to validate schema |
| `schema.lazyLoad` | Boolean | false | Whether to lazy load |
| `schema.cache` | Boolean | true | Whether to cache schema |

**Example**:
```yaml
schema:
  locations:
    - classpath:justdb/core
    - classpath:justdb/business
    - file:./schemas
  format: yaml
  encoding: UTF-8
  validate: true
  lazyLoad: false
  cache: true
```

### Migration Configuration

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `migrate.auto-diff` | Boolean | true | Auto calculate diff |
| `migrate.safe-drop` | Boolean | false | Safe drop mode |
| `migrate.baseline-on-migrate` | Boolean | false | Set baseline on migrate |
| `migrate.idempotent` | Boolean | true | Idempotent mode |
| `migrate.dry-run` | Boolean | false | Dry run |
| `migrate.parallel` | Boolean | false | Parallel processing |
| `migrate.threads` | Integer | 4 | Parallel thread count |
| `migrate.batchSize` | Integer | 1000 | Batch processing size |

**Example**:
```yaml
migrate:
  auto-diff: true
  safe-drop: false
  baseline-on-migrate: true
  idempotent: true
  dry-run: false
  parallel: true
  threads: 8
  batchSize: 2000
```

### History Configuration

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `history.enabled` | Boolean | true | Whether to record history |
| `history.table` | String | justdb_history | History table name |
| `history.columns` | Integer | 50 | History table column count |
| `history.compress` | Boolean | false | Whether to compress history |

**Example**:
```yaml
history:
  enabled: true
  table: schema_migration_history
  columns: 100
  compress: true
```

### Logging Configuration

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `logging.level` | String | INFO | Log level |
| `logging.format` | String | - | Log format |
| `logging.file` | String | - | Log file |
| `logging.console` | Boolean | true | Console output |
| `logging.color` | Boolean | true | Colored output |

**Example**:
```yaml
logging:
  level: DEBUG
  format: "%d{yyyy-MM-dd HH:mm:ss} [%t] %-5p %c{1}:%L - %m%n"
  file: logs/justdb.log
  console: true
  color: true
```

## Environment Variables

### Naming Convention

JustDB environment variables use `JUSTDB_` prefix, configuration items use uppercase and underscores.

**Mapping rules**:
- `database.url` → `JUSTDB_DATABASE_URL`
- `migrate.auto-diff` → `JUSTDB_MIGRATION_AUTO_DIFF`
- `schema.locations` → `JUSTDB_SCHEMA_LOCATIONS`

### Database Environment Variables

| Environment Variable | Description | Example |
|:---|:---|:---|
| `JUSTDB_DATABASE_URL` | Database URL | `jdbc:mysql://localhost:3306/myapp` |
| `JUSTDB_DATABASE_USERNAME` | Username | `root` |
| `JUSTDB_DATABASE_PASSWORD` | Password | `password` |
| `JUSTDB_DATABASE_DRIVER` | Driver class | `com.mysql.cj.jdbc.Driver` |

**Example**:
```bash
export JUSTDB_DATABASE_URL="jdbc:mysql://localhost:3306/myapp"
export JUSTDB_DATABASE_USERNAME="root"
export JUSTDB_DATABASE_PASSWORD="password"
export JUSTDB_DATABASE_DRIVER="com.mysql.cj.jdbc.Driver"
```

### Schema Environment Variables

| Environment Variable | Description | Example |
|:---|:---|:---|
| `JUSTDB_SCHEMA_LOCATIONS` | Schema locations | `./justdb,./db` |
| `JUSTDB_SCHEMA_FORMAT` | Schema format | `yaml` |
| `JUSTDB_SCHEMA_ENCODING` | File encoding | `UTF-8` |

**Example**:
```bash
export JUSTDB_SCHEMA_LOCATIONS="./justdb,./db,classpath:justdb"
export JUSTDB_SCHEMA_FORMAT="yaml"
export JUSTDB_SCHEMA_ENCODING="UTF-8"
```

### Migration Environment Variables

| Environment Variable | Description | Example |
|:---|:---|:---|
| `JUSTDB_MIGRATION_AUTO_DIFF` | Auto diff | `true` |
| `JUSTDB_MIGRATION_SAFE_DROP` | Safe drop | `false` |
| `JUSTDB_MIGRATION_BASELINE_ON_MIGRATE` | Set baseline | `true` |
| `JUSTDB_MIGRATION_IDEMPOTENT` | Idempotent mode | `true` |
| `JUSTDB_MIGRATION_DRY_RUN` | Dry run | `false` |

**Example**:
```bash
export JUSTDB_MIGRATION_AUTO_DIFF="true"
export JUSTDB_MIGRATION_SAFE_DROP="false"
export JUSTDB_MIGRATION_BASELINE_ON_MIGRATE="true"
export JUSTDB_MIGRATION_IDEMPOTENT="true"
export JUSTDB_MIGRATION_DRY_RUN="false"
```

## Spring Boot Configuration

### application.yml

```yaml
justdb:
  enabled: true
  locations: classpath:justdb
  dry-run: false
  baseline-on-migrate: true
  safe-drop: false
  idempotent: true
  validate-on-startup: true
  migrate-on-startup: true

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
```

### application.properties

```properties
justdb.enabled=true
justdb.locations=classpath:justdb
justdb.dry-run=false
justdb.baseline-on-migrate=true
justdb.safe-drop=false
justdb.idempotent=true
justdb.validate-on-startup=true
justdb.migrate-on-startup=true

spring.datasource.url=jdbc:mysql://localhost:3306/myapp
spring.datasource.username=root
spring.datasource.password=password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

## Multi-Environment Configuration

### Environment-Specific Configuration

```yaml
# application.yml (common)
justdb:
  enabled: true
  locations: classpath:justdb

---------------------------

# application-dev.yml (development)
justdb:
  dry-run: false
  migrate-on-startup: true
  safe-drop: false

---------------------------

# application-test.yml (test)
justdb:
  dry-run: true
  migrate-on-startup: false
  validate-on-startup: true

---------------------------

# application-prod.yml (production)
justdb:
  dry-run: false
  migrate-on-startup: true
  baseline-on-migrate: true
  safe-drop: true
  idempotent: true
```

### Activate Environment

```bash
# Use Spring Profile
java -jar app.jar --spring.profiles.active=dev

# Use environment variable
export SPRING_PROFILES_ACTIVE=prod

# Use command line parameter
java -jar app.jar --justdb.dry-run=false
```

## Configuration Priority

Configuration priority from high to low:

1. **Command line parameters**
   ```bash
   justdb migrate --dry-run=false
   ```

2. **Environment variables**
   ```bash
   export JUSTDB_MIGRATION_DRY_RUN=false
   ```

3. **Configuration file**
   ```yaml
   migrate:
     dry-run: false
   ```

4. **Default values**
   ```yaml
   # dry-run defaults to false
   ```

## Configuration Validation

### Validation Commands

```bash
# Validate configuration file
justdb validate -c config.yaml

# Check configuration
justdb config check

# Show current configuration
justdb config show
```

### Configuration Testing

```bash
# Test database connection
justdb test connection

# Test schema loading
justdb test schema

# Test migration
justdb test migration --dry-run
```

## Configuration Templates

### Minimal Configuration

```yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
```

### Recommended Configuration

```yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
  pool:
    maxSize: 20
    minIdle: 5

schema:
  locations:
    - classpath:justdb
  validate: true

migrate:
  auto-diff: true
  idempotent: true
  baseline-on-migrate: true

history:
  enabled: true

logging:
  level: INFO
  file: logs/justdb.log
```

### Production Configuration

```yaml
database:
  url: jdbc:mysql://prod-db:3306/myapp
  username: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  options:
    - useSSL=true
    - connectTimeout=10000
  pool:
    maxSize: 50
    minIdle: 10
    timeout: 60000

schema:
  locations:
    - classpath:justdb/prod
  validate: true
  cache: true

migrate:
  auto-diff: true
  safe-drop: true
  baseline-on-migrate: true
  idempotent: true
  dry-run: false

history:
  enabled: true
  table: schema_migration_history
  compress: true

logging:
  level: WARN
  file: /var/log/justdb/migration.log
  console: false
```

## Next Steps

<VPCard
  title="CLI Reference"
  desc="Complete command-line interface reference"
  link="/en/guide/cli-reference.html"
/>

<VPCard
  title="API Reference"
  desc="Programming API documentation"
  link="/en/guide/api-reference.html"
/>

<VPCard
  title="Installation Guide"
  desc="Install and configure JustDB"
  link="/en/getting-started/installation.html"
/>

---
title: Configuration File
icon: settings
description: JustDB CLI configuration file format, options, and priority
order: 4
---

# Configuration File

JustDB CLI supports multiple configuration formats for managing database connections, AI providers, backup settings, and more.

## Configuration File Lookup

### Lookup Order (Lowest to Highest Priority)

1. **Built-in Configuration** - `justdb/builtin-config.*` (JAR resources)
2. **Auto-discovered Configuration** - `~/.justdb-cli.*` (user home directory)
3. **Project Configuration** - `./.justdb-cli.*` (current directory)
4. **User-specified Configuration** - File specified with `-c` option
5. **Environment Variables** - System environment variables
6. **Command-line Arguments** - Highest priority

### Configuration Merging

Later-loaded configurations override fields with the same name in earlier-loaded configurations:

```yaml
# builtin-config.yaml
databases:
  - name: dev
    type: h2
    jdbcUrl: jdbc:h2:mem:testdb

# .justdb-cli.yaml
databases:
  - name: production
    type: mysql
    jdbcUrl: jdbc:mysql://localhost:3306/mydb

# Final configuration contains both databases: dev and production
```

## Supported Formats

JustDB supports the following configuration formats:

### YAML Format (Recommended)

```yaml
# justdb-config.yaml
databases:
  - name: production
    type: mysql
    driver: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3306/mydb
    username: root
    password: password

aiProviders:
  - name: local
    type: ollama
    baseUrl: http://localhost:11434
    model: qwen2.5-coder:1.5b
    enabled: true

backupProviders:
  - name: default
    type: filesystem
    location: ./backups
    enabled: true
    format: json
    compress: true

includeRules:
  - pattern: sys_*
    author: admin
    remark: System tables
    dataFilter: deleted = 0

output:
  format: yaml
  dir: ./output

log:
  level: info
  file: justdb.log

disabledPlugins: []
```

### JSON Format

```json
{
  "databases": [
    {
      "name": "production",
      "type": "mysql",
      "driver": "com.mysql.cj.jdbc.Driver",
      "jdbcUrl": "jdbc:mysql://localhost:3306/mydb",
      "username": "root",
      "password": "password"
    }
  ],
  "aiProviders": [
    {
      "name": "local",
      "type": "ollama",
      "baseUrl": "http://localhost:11434",
      "model": "qwen2.5-coder:1.5b",
      "enabled": true
    }
  ]
}
```

### Properties Format

```properties
# Database configuration
production.jdbcUrl=jdbc:mysql://localhost:3306/mydb
production.username=root
production.password=password
production.type=mysql

# AI configuration
ai.local.type=ollama
ai.local.baseUrl=http://localhost:11434
ai.local.model=qwen2.5-coder:1.5b

# Output configuration
output.format=yaml
output.dir=./output
```

### XML Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
    <databases>
        <database>
            <name>production</name>
            <type>mysql</type>
            <driver>com.mysql.cj.jdbc.Driver</driver>
            <jdbcUrl>jdbc:mysql://localhost:3306/mydb</jdbcUrl>
            <username>root</username>
            <password>password</password>
        </database>
    </databases>
</config>
```

### TOML Format

```toml
[[databases]]
name = "production"
type = "mysql"
driver = "com.mysql.cj.jdbc.Driver"
jdbcUrl = "jdbc:mysql://localhost:3306/mydb"
username = "root"
password = "password"

[[aiProviders]]
name = "local"
type = "ollama"
baseUrl = "http://localhost:11434"
model = "qwen2.5-coder:1.5b"
enabled = true
```

## Configuration Options

### Database Configuration

```yaml
databases:
  - name: production              # Database name
    type: mysql                   # Database type
    driver: com.mysql.cj.jdbc.Driver  # JDBC driver class
    jdbcUrl: jdbc:mysql://localhost:3306/mydb  # JDBC URL
    username: root                # Username
    password: password            # Password
    properties:                   # Connection properties
      useSSL: false
      serverTimezone: UTC
```

**Supported Database Types**
- `h2` - H2 Database
- `mysql` - MySQL/MariaDB
- `postgresql` / `postgres` - PostgreSQL
- `oracle` - Oracle
- `sqlserver` - Microsoft SQL Server
- `sqlite` - SQLite
- `db2` - IBM DB2
- `dm` - Dameng Database
- `kingbase` - Kingbase

### AI Provider Configuration

```yaml
aiProviders:
  - name: local                   # Provider name
    type: ollama                  # Provider type
    baseUrl: http://localhost:11434  # Service URL
    model: qwen2.5-coder:1.5b     # Model name
    enabled: true                 # Whether enabled
    description: Local Ollama model

  - name: openai
    type: openai
    baseUrl: https://api.openai.com/v1
    apiKey: ${OPENAI_API_KEY}     # Environment variable reference
    model: gpt-4
    temperature: 0.7
    maxTokens: 2000
    enabled: false
```

**Supported AI Provider Types**
- `ollama` / `local` - Local Ollama models
- `openai` - OpenAI API
- `zhipu` / `glm` - Zhipu AI
- `qwen` - Tongyi Qianwen
- `baichuan` - Baichuan AI
- `erniebot` - Baidu Ernie Bot

### Backup Configuration

```yaml
backupProviders:
  - name: default
    type: filesystem              # Backup type
    location: ./backups           # Backup location
    enabled: true
    format: json                  # Backup format
    compress: true                # Whether to compress
    retentionDays: 60             # Retention days
    encrypt: false                # Whether to encrypt
    encryptionKey: ${BACKUP_KEY}  # Encryption key
    encryptionAlgorithm: AES      # Encryption algorithm
```

**Supported Backup Types**
- `filesystem` - File system
- `s3` - AWS S3
- `oss` - Alibaba Cloud OSS
- `cos` - Tencent Cloud COS

### Include Rules Configuration

```yaml
includeRules:
  - pattern: sys_*                # Table match pattern
    author: admin                 # Author
    remark: System tables         # Remark
    module: system                # Module
    dataFilter: deleted = 0       # Data filter condition

  - pattern: lca_*
    author: limeng
    remark: LCA module tables
    module: lca
    dataFilter: status = 1
```

### Output Configuration

```yaml
output:
  format: yaml                    # Default output format
  dir: ./output                   # Output directory
  file: schema.yaml               # Default output file
```

### Log Configuration

```yaml
log:
  level: info                     # Log level
  file: justdb.log                # Log file
```

**Log Levels**
- `trace` - Most verbose
- `debug` - Debug information
- `info` - General information (default)
- `warn` - Warning information
- `error` - Error information

### Other Configuration

```yaml
# Current database
currentDatabase: production

# Disabled plugins
disabledPlugins:
  - oracle
  - db2

# Maven configuration
maven:
  settingsPath: ~/.m2/settings.xml
  additionalRepos:
    - https://repo.spring.io/milestone

# Package name reverse (for ORM code generation)
packageNameReverse: true
```

## Environment Variables

JustDB supports configuration through environment variables:

### Database Environment Variables

```bash
export JUSTDB_DB_URL="jdbc:mysql://localhost:3306/mydb"
export JUSTDB_DB_USERNAME="root"
export JUSTDB_DB_PASSWORD="password"
export JUSTDB_CURRENT_DATABASE="production"
```

### AI Environment Variables

```bash
export JUSTDB_AI_PROVIDER="openai"
export OPENAI_API_KEY="sk-..."
export JUSTDB_AI_BASE_URL="https://api.openai.com/v1"
export JUSTDB_AI_MODEL="gpt-4"
```

### Output Environment Variables

```bash
export JUSTDB_OUTPUT_FILE="schema.yaml"
export JUSTDB_OUTPUT_DIR="./output"
export JUSTDB_OUTPUT_TYPE="yaml"
export JUSTDB_FORMAT="yaml"
```

### Log Environment Variables

```bash
export JUSTDB_LOG_LEVEL="debug"
export JUSTDB_LOG_FILE="justdb.log"
```

### Environment Variable Placeholders

Using environment variables in configuration files:

```yaml
databases:
  - name: production
    password: ${DB_PASSWORD}              # Simple reference
    username: ${DB_USER:root}            # With default value

aiProviders:
  - name: openai
    apiKey: ${OPENAI_API_KEY:?API key not set}  # Required
```

## Configuration Priority Example

```bash
# 1. Built-in configuration (lowest)
# Built-in default database configuration

# 2. Auto-discovered configuration
# ~/.justdb-cli.yaml
databases:
  - name: dev
    jdbcUrl: jdbc:h2:mem:testdb

# 3. Project configuration
# ./.justdb-cli.yaml
databases:
  - name: staging
    jdbcUrl: jdbc:mysql://staging:3306/db

# 4. User-specified configuration
# -c prod-config.yaml
databases:
  - name: production
    jdbcUrl: jdbc:mysql://prod:3306/db

# 5. Environment variables
export JUSTDB_DB_URL="jdbc:mysql://localhost:3306/local"

# 6. Command-line arguments (highest)
justdb migrate -U "jdbc:mysql://remote:3306/db"
```

The final URL used is `jdbc:mysql://remote:3306/db`.

## Configuration Validation

Validate configuration file:

```bash
# Validate configuration
justdb config validate

# Show current configuration
justdb config show
```

## Configuration Best Practices

1. **Use Environment Variables for Sensitive Information**
   ```yaml
   password: ${DB_PASSWORD}
   apiKey: ${API_KEY}
   ```

2. **Separate Environment Configurations**
   ```bash
   # dev.yaml
   databases:
     - name: dev
       jdbcUrl: jdbc:h2:mem:testdb

   # prod.yaml
   databases:
     - name: prod
       jdbcUrl: jdbc:mysql://prod:3306/db
   ```

3. **Use Configuration File Templates**
   ```bash
   # justdb-config.template.yaml
   databases:
     - name: production
       password: ${DB_PASSWORD}
   ```

4. **Version Control Non-Sensitive Configuration**
   - Commit structural configuration
   - Ignore sensitive configuration (like passwords)

## Related Documentation

- [Command Reference](./commands.md) - Command-line options
- [File Loading Mechanism](./file-loading.md) - File loading rules

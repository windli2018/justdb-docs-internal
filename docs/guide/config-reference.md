---
icon: settings
date: 2024-01-01
title: 配置参考
order: 14
category:
  - 指南
  - 参考
tag:
  - 配置
  - 参考
  - 选项
---

# 配置参考

JustDB 的完整配置选项说明，包括配置文件格式、配置选项和环境变量。

## 配置文件格式

### YAML 格式（推荐）

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

### JSON 格式

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

### TOML 格式

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

### Properties 格式

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

## 配置选项

### 数据库配置

| 选项 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `database.url` | String | - | JDBC 连接 URL |
| `database.username` | String | - | 数据库用户名 |
| `database.password` | String | - | 数据库密码 |
| `database.driver` | String | 自动检测 | JDBC 驱动类名 |
| `database.options` | List | [] | 连接选项 |
| `database.pool.maxSize` | Integer | 10 | 连接池最大大小 |
| `database.pool.minIdle` | Integer | 5 | 连接池最小空闲数 |
| `database.pool.timeout` | Integer | 30000 | 连接超时（毫秒） |

**示例**：
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

### Schema 配置

| 选项 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `schema.locations` | List | ["./justdb"] | Schema 文件位置 |
| `schema.format` | String | auto | Schema 格式（yaml/json/xml/properties/toml） |
| `schema.encoding` | String | UTF-8 | 文件编码 |
| `schema.validate` | Boolean | true | 是否验证 Schema |
| `schema.lazyLoad` | Boolean | false | 是否延迟加载 |
| `schema.cache` | Boolean | true | 是否缓存 Schema |

**示例**：
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

### 迁移配置

| 选项 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `migrate.auto-diff` | Boolean | true | 自动计算差异 |
| `migrate.safe-drop` | Boolean | false | 安全删除模式 |
| `migrate.baseline-on-migrate` | Boolean | false | 迁移前设置基线 |
| `migrate.idempotent` | Boolean | true | 幂等模式 |
| `migrate.dry-run` | Boolean | false | 试运行 |
| `migrate.parallel` | Boolean | false | 并行处理 |
| `migrate.threads` | Integer | 4 | 并行线程数 |
| `migrate.batchSize` | Integer | 1000 | 批处理大小 |

**示例**：
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

### 历史配置

| 选项 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `history.enabled` | Boolean | true | 是否记录历史 |
| `history.table` | String | justdb_history | 历史表名 |
| `history.columns` | Integer | 50 | 历志表列数 |
| `history.compress` | Boolean | false | 是否压缩历史 |

**示例**：
```yaml
history:
  enabled: true
  table: schema_migration_history
  columns: 100
  compress: true
```

### 日志配置

| 选项 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `logging.level` | String | INFO | 日志级别 |
| `logging.format` | String | - | 日志格式 |
| `logging.file` | String | - | 日志文件 |
| `logging.console` | Boolean | true | 控制台输出 |
| `logging.color` | Boolean | true | 彩色输出 |

**示例**：
```yaml
logging:
  level: DEBUG
  format: "%d{yyyy-MM-dd HH:mm:ss} [%t] %-5p %c{1}:%L - %m%n"
  file: logs/justdb.log
  console: true
  color: true
```

## 环境变量

### 命名规范

JustDB 环境变量使用 `JUSTDB_` 前缀，配置项使用大写和下划线。

**映射规则**：
- `database.url` → `JUSTDB_DATABASE_URL`
- `migrate.auto-diff` → `JUSTDB_MIGRATION_AUTO_DIFF`
- `schema.locations` → `JUSTDB_SCHEMA_LOCATIONS`

### 数据库环境变量

| 环境变量 | 说明 | 示例 |
|:---|:---|:---|
| `JUSTDB_DATABASE_URL` | 数据库 URL | `jdbc:mysql://localhost:3306/myapp` |
| `JUSTDB_DATABASE_USERNAME` | 用户名 | `root` |
| `JUSTDB_DATABASE_PASSWORD` | 密码 | `password` |
| `JUSTDB_DATABASE_DRIVER` | 驱动类 | `com.mysql.cj.jdbc.Driver` |

**示例**：
```bash
export JUSTDB_DATABASE_URL="jdbc:mysql://localhost:3306/myapp"
export JUSTDB_DATABASE_USERNAME="root"
export JUSTDB_DATABASE_PASSWORD="password"
export JUSTDB_DATABASE_DRIVER="com.mysql.cj.jdbc.Driver"
```

### Schema 环境变量

| 环境变量 | 说明 | 示例 |
|:---|:---|:---|
| `JUSTDB_SCHEMA_LOCATIONS` | Schema 位置 | `./justdb,./db` |
| `JUSTDB_SCHEMA_FORMAT` | Schema 格式 | `yaml` |
| `JUSTDB_SCHEMA_ENCODING` | 文件编码 | `UTF-8` |

**示例**：
```bash
export JUSTDB_SCHEMA_LOCATIONS="./justdb,./db,classpath:justdb"
export JUSTDB_SCHEMA_FORMAT="yaml"
export JUSTDB_SCHEMA_ENCODING="UTF-8"
```

### 迁移环境变量

| 环境变量 | 说明 | 示例 |
|:---|:---|:---|
| `JUSTDB_MIGRATION_AUTO_DIFF` | 自动差异 | `true` |
| `JUSTDB_MIGRATION_SAFE_DROP` | 安全删除 | `false` |
| `JUSTDB_MIGRATION_BASELINE_ON_MIGRATE` | 设置基线 | `true` |
| `JUSTDB_MIGRATION_IDEMPOTENT` | 幂等模式 | `true` |
| `JUSTDB_MIGRATION_DRY_RUN` | 试运行 | `false` |

**示例**：
```bash
export JUSTDB_MIGRATION_AUTO_DIFF="true"
export JUSTDB_MIGRATION_SAFE_DROP="false"
export JUSTDB_MIGRATION_BASELINE_ON_MIGRATE="true"
export JUSTDB_MIGRATION_IDEMPOTENT="true"
export JUSTDB_MIGRATION_DRY_RUN="false"
```

## Spring Boot 配置

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

## 多环境配置

### 环境特定配置

```yaml
# application.yml（通用）
justdb:
  enabled: true
  locations: classpath:justdb

---------------------------

# application-dev.yml（开发）
justdb:
  dry-run: false
  migrate-on-startup: true
  safe-drop: false

---------------------------

# application-test.yml（测试）
justdb:
  dry-run: true
  migrate-on-startup: false
  validate-on-startup: true

---------------------------

# application-prod.yml（生产）
justdb:
  dry-run: false
  migrate-on-startup: true
  baseline-on-migrate: true
  safe-drop: true
  idempotent: true
```

### 激活环境

```bash
# 使用 Spring Profile
java -jar app.jar --spring.profiles.active=dev

# 使用环境变量
export SPRING_PROFILES_ACTIVE=prod

# 使用命令行参数
java -jar app.jar --justdb.dry-run=false
```

## 配置优先级

配置优先级从高到低：

1. **命令行参数**
   ```bash
   justdb migrate --dry-run=false
   ```

2. **环境变量**
   ```bash
   export JUSTDB_MIGRATION_DRY_RUN=false
   ```

3. **配置文件**
   ```yaml
   migrate:
     dry-run: false
   ```

4. **默认值**
   ```yaml
   # dry-run 默认为 false
   ```

## 配置验证

### 验证命令

```bash
# 验证配置文件
justdb validate -c config.yaml

# 检查配置
justdb config check

# 显示当前配置
justdb config show
```

### 配置测试

```bash
# 测试数据库连接
justdb test connection

# 测试 Schema 加载
justdb test schema

# 测试迁移
justdb test migration --dry-run
```

## 配置模板

### 最小配置

```yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
```

### 推荐配置

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

### 生产配置

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

## 下一步

<VPCard
  title="CLI 参考"
  desc="命令行界面完整参考"
  link="/guide/cli-reference.html"
/>

<VPCard
  title="API 参考"
  desc="编程 API 文档"
  link="/guide/api-reference.html"
/>

<VPCard
  title="安装指南"
  desc="安装和配置 JustDB"
  link="/guide/installation.html"
/>

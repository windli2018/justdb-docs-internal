---
title: 配置文件
icon: settings
description: JustDB CLI 配置文件格式、选项和优先级
order: 4
---

# 配置文件

JustDB CLI 支持多种配置格式，用于管理数据库连接、AI 提供者、备份设置等。

## 配置文件查找

### 查找顺序（优先级从低到高）

1. **内置配置** - `justdb/builtin-config.*`（JAR 资源）
2. **自动发现配置** - `~/.justdb-cli.*`（用户主目录）
3. **项目配置** - `./.justdb-cli.*`（当前目录）
4. **用户指定配置** - `-c` 选项指定的文件
5. **环境变量** - 系统环境变量
6. **命令行参数** - 最高优先级

### 配置合并

后加载的配置会覆盖先加载的配置中的同名字段：

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

# 最终配置包含两个数据库：dev 和 production
```

## 支持的格式

JustDB 支持以下配置格式：

### YAML 格式（推荐）

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
    remark: 系统表
    dataFilter: deleted = 0

output:
  format: yaml
  dir: ./output

log:
  level: info
  file: justdb.log

disabledPlugins: []
```

### JSON 格式

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

### Properties 格式

```properties
# 数据库配置
production.jdbcUrl=jdbc:mysql://localhost:3306/mydb
production.username=root
production.password=password
production.type=mysql

# AI 配置
ai.local.type=ollama
ai.local.baseUrl=http://localhost:11434
ai.local.model=qwen2.5-coder:1.5b

# 输出配置
output.format=yaml
output.dir=./output
```

### XML 格式

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;config&gt;
    &lt;databases&gt;
        &lt;database&gt;
            &lt;name&gt;production&lt;/name&gt;
            &lt;type&gt;mysql&lt;/type&gt;
            &lt;driver&gt;com.mysql.cj.jdbc.Driver&lt;/driver&gt;
            &lt;jdbcUrl&gt;jdbc:mysql://localhost:3306/mydb&lt;/jdbcUrl&gt;
            &lt;username&gt;root&lt;/username&gt;
            &lt;password&gt;password&lt;/password&gt;
        &lt;/database&gt;
    &lt;/databases&gt;
&lt;/config&gt;
```

### TOML 格式

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

## 配置选项

### 数据库配置

```yaml
databases:
  - name: production              # 数据库名称
    type: mysql                   # 数据库类型
    driver: com.mysql.cj.jdbc.Driver  # JDBC 驱动类
    jdbcUrl: jdbc:mysql://localhost:3306/mydb  # JDBC URL
    username: root                # 用户名
    password: password            # 密码
    properties:                   # 连接属性
      useSSL: false
      serverTimezone: UTC
```

**支持的数据库类型**
- `h2` - H2 数据库
- `mysql` - MySQL/MariaDB
- `postgresql` / `postgres` - PostgreSQL
- `oracle` - Oracle
- `sqlserver` - Microsoft SQL Server
- `sqlite` - SQLite
- `db2` - IBM DB2
- `dm` - 达梦数据库
- `kingbase` - 人大金仓

### AI 提供者配置

```yaml
aiProviders:
  - name: local                   # 提供者名称
    type: ollama                  # 提供者类型
    baseUrl: http://localhost:11434  # 服务 URL
    model: qwen2.5-coder:1.5b     # 模型名称
    enabled: true                 # 是否启用
    description: 本地 Ollama 模型

  - name: openai
    type: openai
    baseUrl: https://api.openai.com/v1
    apiKey: ${OPENAI_API_KEY}     # 环境变量引用
    model: gpt-4
    temperature: 0.7
    maxTokens: 2000
    enabled: false
```

**支持的 AI 提供者类型**
- `ollama` / `local` - 本地 Ollama 模型
- `openai` - OpenAI API
- `zhipu` / `glm` - 智谱 AI
- `qwen` - 通义千问
- `baichuan` - 百川智能
- `erniebot` - 百度文心一言

### 备份配置

```yaml
backupProviders:
  - name: default
    type: filesystem              # 备份类型
    location: ./backups           # 备份位置
    enabled: true
    format: json                  # 备份格式
    compress: true                # 是否压缩
    retentionDays: 60             # 保留天数
    encrypt: false                # 是否加密
    encryptionKey: ${BACKUP_KEY}  # 加密密钥
    encryptionAlgorithm: AES      # 加密算法
```

**支持的备份类型**
- `filesystem` - 文件系统
- `s3` - AWS S3
- `oss` - 阿里云 OSS
- `cos` - 腾讯云 COS

### Include 规则配置

```yaml
includeRules:
  - pattern: sys_*                # 表匹配模式
    author: admin                 # 作者
    remark: 系统表                # 备注
    module: system                # 模块
    dataFilter: deleted = 0       # 数据过滤条件

  - pattern: lca_*
    author: limeng
    remark: LCA模块表
    module: lca
    dataFilter: status = 1
```

### 输出配置

```yaml
output:
  format: yaml                    # 默认输出格式
  dir: ./output                   # 输出目录
  file: schema.yaml               # 默认输出文件
```

### 日志配置

```yaml
log:
  level: info                     # 日志级别
  file: justdb.log                # 日志文件
```

**日志级别**
- `trace` - 最详细
- `debug` - 调试信息
- `info` - 一般信息（默认）
- `warn` - 警告信息
- `error` - 错误信息

### 其他配置

```yaml
# 当前数据库
currentDatabase: production

# 禁用的插件
disabledPlugins:
  - oracle
  - db2

# Maven 配置
maven:
  settingsPath: ~/.m2/settings.xml
  additionalRepos:
    - https://repo.spring.io/milestone

# 包名反转（用于 ORM 代码生成）
packageNameReverse: true
```

## 环境变量

JustDB 支持通过环境变量配置：

### 数据库环境变量

```bash
export JUSTDB_DB_URL="jdbc:mysql://localhost:3306/mydb"
export JUSTDB_DB_USERNAME="root"
export JUSTDB_DB_PASSWORD="password"
export JUSTDB_CURRENT_DATABASE="production"
```

### AI 环境变量

```bash
export JUSTDB_AI_PROVIDER="openai"
export OPENAI_API_KEY="sk-..."
export JUSTDB_AI_BASE_URL="https://api.openai.com/v1"
export JUSTDB_AI_MODEL="gpt-4"
```

### 输出环境变量

```bash
export JUSTDB_OUTPUT_FILE="schema.yaml"
export JUSTDB_OUTPUT_DIR="./output"
export JUSTDB_OUTPUT_TYPE="yaml"
export JUSTDB_FORMAT="yaml"
```

### 日志环境变量

```bash
export JUSTDB_LOG_LEVEL="debug"
export JUSTDB_LOG_FILE="justdb.log"
```

### 环境变量占位符

在配置文件中使用环境变量：

```yaml
databases:
  - name: production
    password: ${DB_PASSWORD}              # 简单引用
    username: ${DB_USER:root}            # 带默认值

aiProviders:
  - name: openai
    apiKey: ${OPENAI_API_KEY:?未设置 API 密钥}  # 必需项
```

## 配置优先级示例

```bash
# 1. 内置配置（最低）
# 内置默认数据库配置

# 2. 自动发现配置
# ~/.justdb-cli.yaml
databases:
  - name: dev
    jdbcUrl: jdbc:h2:mem:testdb

# 3. 项目配置
# ./.justdb-cli.yaml
databases:
  - name: staging
    jdbcUrl: jdbc:mysql://staging:3306/db

# 4. 用户指定配置
# -c prod-config.yaml
databases:
  - name: production
    jdbcUrl: jdbc:mysql://prod:3306/db

# 5. 环境变量
export JUSTDB_DB_URL="jdbc:mysql://localhost:3306/local"

# 6. 命令行参数（最高）
justdb migrate -U "jdbc:mysql://remote:3306/db"
```

最终使用的 URL 是 `jdbc:mysql://remote:3306/db`。

## 配置验证

验证配置文件：

```bash
# 验证配置
justdb config validate

# 显示当前配置
justdb config show
```

## 配置最佳实践

1. **使用环境变量存储敏感信息**
   ```yaml
   password: ${DB_PASSWORD}
   apiKey: ${API_KEY}
   ```

2. **分离环境配置**
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

3. **使用配置文件模板**
   ```bash
   # justdb-config.template.yaml
   databases:
     - name: production
       password: ${DB_PASSWORD}
   ```

4. **版本控制非敏感配置**
   - 提交结构配置
   - 忽略敏感配置（如密码）

## 相关文档

- [命令参考](./commands.md) - 命令行选项
- [文件加载机制](./file-loading.md) - 文件加载规则

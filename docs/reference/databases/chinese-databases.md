# 国产数据库支持

JustDB 支持多款国产数据库，包括达梦、人大金仓、GBase、TiDB、OceanBase 等。

## 支持的国产数据库

| 数据库 | 厂商 | 方言兼容 | 状态 |
|--------|------|----------|------|
| 达梦 (DM) | 武汉达梦 | 类 Oracle | 完全支持 |
| 人大金仓 (KingBase) | 人大金仓 | 类 PostgreSQL | 完全支持 |
| GBase 8s | 南大通用 | 类 Informix | 支持 |
| TiDB | PingCAP | MySQL 兼容 | 完全支持 |
| OceanBase | 蚂蚁集团 | MySQL 兼容 | 完全支持 |
| openGauss | 华为 | 类 PostgreSQL | 支持 |
| GaussDB | 华为 | 类 PostgreSQL | 支持 |
| TDSQL | 腾讯云 | MySQL 兼容 | 支持 |

## 达梦 (DM)

### 版本支持

| 版本 | 状态 |
|------|------|
| DM8 | 完全支持 |
| DM7 | 支持 |

### 连接配置

**JDBC 驱动:**

```xml
<dependency>
    <groupId>com.dameng</groupId>
    <artifactId>DmJdbcDriver18</artifactId>
    <version>8.1.3.62</version>
</dependency>
```

**连接字符串:**

```bash
jdbc:dm://{host}[:{port}]
```

**配置示例 (YAML):**

```yaml
databases:
  production:
    url: jdbc:dm://localhost:5236
    driver: dm.jdbc.driver.DmDriver
    username: SYSDBA
    password: SYSDBA
    dialect: dameng
```

### 数据类型映射

| JustDB 类型 | DM 类型 | 说明 |
|-------------|---------|------|
| INTEGER | INT | 整数 |
| BIGINT | BIGINT | 长整数 |
| DECIMAL | DECIMAL(p,s) | 精确数值 |
| VARCHAR | VARCHAR2(n) | 可变长度字符串 |
| TEXT | CLOB | 大文本 |
| TIMESTAMP | TIMESTAMP | 时间戳 |
| BLOB | BLOB | 二进制数据 |

### DM 特定功能

```yaml
tables:
  - name: users
    tablespace: USERS  # 表空间
    storage:
      initial: 100
      next: 100
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
```

### 生成的 SQL 示例

```sql
CREATE TABLE "users" (
  "id" BIGINT PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL
);
```

### 官方文档

- [达梦数据库官网](https://eco.dameng.com/)
- [达梦数据库文档](https://eco.dameng.com/document/dm/zh-cn/start/)
- [数据类型参考](https://eco.dameng.com/document/dm/zh-cn/sql-dev/dmpl-sql-datatype.html)

## 人大金仓 (KingBase)

### 版本支持

| 版本 | 状态 |
|------|------|
| KingBaseES V8 | 完全支持 |
| KingBaseES V7 | 支持 |

### 连接配置

**JDBC 驱动:**

```xml
<dependency>
    <groupId>cn.com.kingbase</groupId>
    <artifactId>kingbase8</artifactId>
    <version>9.0.1</version>
</dependency>
```

**连接字符串:**

```bash
jdbc:kingbase8://{host}[:{port}]/[{database}]
```

**配置示例 (YAML):**

```yaml
databases:
  production:
    url: jdbc:kingbase8://localhost:54321/mydb
    driver: com.kingbase8.Driver
    username: system
    password: password
    dialect: kingbase
```

### 数据类型映射

| JustDB 类型 | KingBase 类型 | 说明 |
|-------------|---------------|------|
| INTEGER | INTEGER | 整数 |
| BIGINT | BIGINT | 长整数 |
| DECIMAL | NUMERIC(p,s) | 精确数值 |
| VARCHAR | VARCHAR(n) | 可变长度字符串 |
| TEXT | TEXT | 大文本 |
| TIMESTAMP | TIMESTAMP | 时间戳 |
| BLOB | BYTEA | 二进制数据 |

### KingBase 特定功能

```yaml
tables:
  - name: users
    schema: public
    columns:
      - name: id
        type: BIGSERIAL
        primaryKey: true
```

### 生成的 SQL 示例

```sql
CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL
);
```

### 官方文档

- [人大金仓官网](https://help.kingbase.com.cn/)
- [数据类型参考](https://help.kingbase.com.cn/v8/development/sql-plsql/datatype.html)

## GBase (南大通用)

### 版本支持

| 版本 | 状态 | 说明 |
|------|------|------|
| GBase 8s | 支持 | 类 Informix |
| GBase 8a | 支持 | 分析型数据库 |

### 连接配置

**JDBC 驱动:**

```xml
<dependency>
    <groupId>com.gbase</groupId>
    <artifactId>gbasejdbc</artifactId>
    <version>8.8.0</version>
</dependency>
```

**连接字符串 (GBase 8s):**

```bash
jdbc:gbasedbt-sqli://{host}:{port}/{database}:GBASEDBTSERVER={server}
```

**配置示例 (YAML):**

```yaml
databases:
  production:
    url: jdbc:gbasedbt-sqli://localhost:9088/mydb:GBASEDBTSERVER=gbase01
    driver: com.gbasedbt.jdbc.Driver
    username: informix
    password: password
    dialect: gbase8s
```

### 数据类型映射

| JustDB 类型 | GBase 8s 类型 | 说明 |
|-------------|---------------|------|
| INTEGER | INTEGER | 整数 |
| BIGINT | BIGINT | 长整数 |
| DECIMAL | DECIMAL(p,s) | 精确数值 |
| VARCHAR | VARCHAR(n) | 可变长度字符串 |
| TEXT | TEXT | 大文本 |
| DATETIME | DATETIME | 日期时间 |
| BLOB | BLOB | 二进制数据 |

### 官方文档

- [GBase 官网](http://www.gbase.cn/)
- [GBase 文档](http://www.gbase.cn/community/)

## TiDB

### 版本支持

| 版本 | 状态 |
|------|------|
| TiDB 7.x | 完全支持 |
| TiDB 6.x | 完全支持 |
| TiDB 5.x | 完全支持 |

### 连接配置

**JDBC 驱动:**

TiDB 兼容 MySQL 协议，使用 MySQL JDBC 驱动。

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
</dependency>
```

**连接字符串:**

```bash
jdbc:mysql://{host}[:{port}]/[{database}]
```

**配置示例 (YAML):**

```yaml
databases:
  production:
    url: jdbc:mysql://localhost:4000/mydb
    driver: com.mysql.cj.jdbc.Driver
    username: root
    password: password
    dialect: mysql
```

### 数据类型映射

TiDB 完全兼容 MySQL 数据类型，参考 [MySQL 文档](./mysql.md)。

### TiDB 特定功能

```yaml
tables:
  - name: users
    engine: InnoDB  # TiDB 使用 InnoDB
    charset: utf8mb4
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### 已知限制

1. **不支持 SPATIAL 类型**: TiDB 不支持 MySQL 的空间数据类型
2. **不支持 FULLTEXT 索引**: 暂不支持全文索引
3. **部分函数限制**: 部分 MySQL 函数可能不完全支持

### 官方文档

- [TiDB 官网](https://www.pingcap.com/tidb/)
- [TiDB 文档](https://docs.pingcap.com/tidb/stable)

## OceanBase

### 版本支持

| 版本 | 状态 |
|------|------|
| OceanBase 4.x | 完全支持 |
| OceanBase 3.x | 完全支持 |
| OceanBase 2.x | 支持 |

### 连接配置

**JDBC 驱动:**

OceanBase MySQL 模式兼容 MySQL 协议，使用 MySQL JDBC 驱动。

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
</dependency>
```

**连接字符串:**

```bash
jdbc:mysql://{host}[:{port}]/[{database}]
```

**配置示例 (YAML):**

```yaml
databases:
  production:
    url: jdbc:mysql://localhost:2881/mydb
    driver: com.mysql.cj.jdbc.Driver
    username: root@sys
    password: password
    dialect: mysql
```

### 数据类型映射

OceanBase MySQL 模式完全兼容 MySQL 数据类型，参考 [MySQL 文档](./mysql.md)。

### 已知限制

1. **不支持 SPATIAL 类型**: OceanBase 不支持 MySQL 的空间数据类型
2. **部分特性限制**: 部分 MySQL 高级特性可能不完全支持

### 官方文档

- [OceanBase 官网](https://www.oceanbase.com/)
- [OceanBase 文档](https://www.oceanbase.com/docs)

## openGauss

### 版本支持

| 版本 | 状态 |
|------|------|
| openGauss 5.x | 支持 |
| openGauss 3.x | 支持 |

### 连接配置

openGauss 兼容 PostgreSQL 协议，使用 PostgreSQL JDBC 驱动。

**连接字符串:**

```bash
jdbc:postgresql://{host}[:{port}]/[{database}]
```

**配置示例 (YAML):**

```yaml
databases:
  production:
    url: jdbc:postgresql://localhost:5432/mydb
    driver: org.postgresql.Driver
    username: opengauss
    password: password
    dialect: postgresql
```

### 数据类型映射

openGauss 兼容 PostgreSQL 数据类型，参考 [PostgreSQL 文档](./postgresql.md)。

### 官方文档

- [openGauss 官网](https://opengauss.org/zh/)
- [openGauss 文档](https://docs-opengauss.osinfra.cn/zh/)

## 功能对比

| 功能 | 达梦 | 人大金仓 | GBase | TiDB | OceanBase | openGauss |
|------|:----:|:--------:|:-----:|:----:|:--------:|:---------:|
| **DDL** | | | | | | |
| CREATE TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ALTER TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DROP TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CREATE INDEX | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **数据类型** | | | | | | |
| INTEGER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BIGINT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| VARCHAR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TEXT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TIMESTAMP | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BLOB | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **约束** | | | | | | |
| PRIMARY KEY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| FOREIGN KEY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UNIQUE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CHECK | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **高级特性** | | | | | | |
| AUTO_INCREMENT | Sequence | SERIAL | Sequence | ✓ | ✓ | SERIAL |
| IF EXISTS | 部分 | ✓ | 部分 | ✓ | ✓ | ✓ |
| SCHEMA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## 最佳实践

### 1. 选择合适的方言

根据国产数据库的兼容性选择方言：

- **达梦**: 使用 `dameng` 方言
- **人大金仓**: 使用 `kingbase` 方言
- **GBase 8s**: 使用 `gbase8s` 方言
- **TiDB**: 使用 `mysql` 方言
- **OceanBase**: 使用 `mysql` 方言
- **openGauss**: 使用 `postgresql` 方言

### 2. 注意数据类型差异

不同国产数据库的数据类型可能略有差异，建议：

```yaml
# 使用通用的数据类型
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT  # 使用通用类型
      - name: username
        type: VARCHAR(255)  # 而非 VARCHAR2
      - name: content
        type: TEXT  # 而非 CLOB
```

### 3. 利用兼容模式

部分国产数据库提供兼容模式：

```yaml
# 达梦 Oracle 兼容模式
databases:
  production:
    url: jdbc:dm://localhost:5236?compatibilityMode=oracle
    dialect: dameng
```

### 4. 测试兼容性

在迁移前进行充分测试：

```bash
# 使用 JustDB 生成 SQL
justdb schema2sql -s schema.yaml -o output.sql -d dameng

# 检查生成的 SQL
cat output.sql
```

## 迁移指南

### 从 MySQL 迁移到国产数据库

1. **TiDB/OceanBase**: 几乎零改动
2. **达梦/人大金仓**: 需要调整数据类型和语法
3. **GBase**: 需要调整存储过程和触发器

### 从 Oracle 迁移到国产数据库

1. **达梦**: 高度兼容，改动最小
2. **人大金仓**: 需要调整 PL/SQL 代码
3. **openGauss**: 需要调整数据类型和函数

### 从 PostgreSQL 迁移到国产数据库

1. **人大金仓**: 高度兼容
2. **openGauss**: 高度兼容
3. **达梦**: 需要调整语法

## 相关文档

- [数据库支持概述](./README.md)
- [MySQL 文档](./mysql.md)
- [PostgreSQL 文档](./postgresql.md)
- [Oracle 文档](./oracle.md)

# 数据库支持

JustDB 支持 100+ 数据库，涵盖传统关系型数据库、国产数据库、云原生数据库、时序数据库、搜索引擎等多种类型。

## 按字母索引

&lt;DatabaseIndex /&gt;

## 数据库分类

### 传统关系型数据库

| 数据库 | 文档 | 状态 |
|--------|------|------|
| MySQL | [查看详情](./mysql.md) | 完全支持 |
| PostgreSQL | [查看详情](./postgresql.md) | 完全支持 |
| Oracle | [查看详情](./oracle.md) | 完全支持 |
| SQL Server | [查看详情](./sql-server.md) | 完全支持 |
| MariaDB | - | 完全支持 |
| DB2 | - | 支持 |
| Sybase ASE | - | 支持 |

### 嵌入式数据库

| 数据库 | 文档 | 状态 |
|--------|------|------|
| H2 | [查看详情](./h2.md) | 完全支持 |
| SQLite | [查看详情](./sqlite.md) | 完全支持 |
| Apache Derby | - | 支持 |
| HSQLDB | - | 支持 |

### 国产数据库

| 数据库 | 厂商 | 文档 | 状态 |
|--------|------|------|------|
| 达梦 (DM) | 武汉达梦 | [查看详情](./chinese-databases.md#达梦-dm) | 支持 |
| 人大金仓 (KingBase) | 人大金仓 | [查看详情](./chinese-databases.md#人大金仓-kingbase) | 支持 |
| GBase | 南大通用 | [查看详情](./chinese-databases.md#gbase-南大通用) | 支持 |
| TiDB | PingCAP | [查看详情](./chinese-databases.md#tidb) | 完全支持 |
| OceanBase | 蚂蚁集团 | [查看详情](./chinese-databases.md#oceanbase) | 支持 |
| openGauss | 华为 | - | 支持 |

### 云原生数据库

| 数据库 | 云服务商 | 状态 |
|--------|----------|------|
| Azure SQL | Microsoft | 支持 |
| Azure Synapse | Microsoft | 支持 |
| Google Cloud SQL | Google | 支持 |
| Amazon Aurora | Amazon | 支持 |
| Amazon Redshift | Amazon | 支持 |
| PolarDB | Alibaba Cloud | 支持 |
| Snowflake | Snowflake | 支持 |

### 分析型数据库

| 数据库 | 状态 |
|--------|------|
| ClickHouse | 支持 |
| DuckDB | 支持 |
| Apache Doris | 支持 |
| StarRocks | 支持 |
| Apache Hive | 支持 |
| Apache Impala | 支持 |
| Greenplum | 支持 |
| Vertica | 支持 |

### 时序数据库

| 数据库 | 状态 |
|--------|------|
| TimescaleDB | 支持 |
| TDengine | 支持 |
| InfluxDB | 支持 |
| QuestDB | 支持 |

### 搜索引擎

| 数据库 | 状态 |
|--------|------|
| Elasticsearch | 支持 |
| OpenSearch | 支持 |
| Apache Solr | 支持 |

### NoSQL 数据库

| 数据库 | 类型 | 状态 |
|--------|------|------|
| MongoDB | 文档型 | 支持 |
| Redis | 键值型 | 支持 |
| Cassandra | 列族型 | 支持 |
| HBase | 列族型 | 支持 |
| Neo4j | 图数据库 | 支持 |
| Couchbase | 文档型 | 支持 |

## 功能对比

### 核心功能支持

| 功能分类 | 功能 | MySQL | PostgreSQL | Oracle | SQL Server | H2 | SQLite | 国产数据库 |
|----------|------|:-----:|:----------:|:------:|:----------:|:--:|:------:|:----------:|
| **DDL** | CREATE TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | ALTER TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | DROP TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | CREATE INDEX | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | DROP INDEX | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | CREATE VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | DROP VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | CREATE SEQUENCE | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| | DROP SEQUENCE | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| **数据类型** | INTEGER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | BIGINT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | VARCHAR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | TEXT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | JSON | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | 部分支持 |
| | TIMESTAMP | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | BLOB | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **约束** | PRIMARY KEY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | FOREIGN KEY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | UNIQUE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | CHECK | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| | NOT NULL | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **高级特性** | AUTO_INCREMENT | ✓ | Sequence | Sequence | IDENTITY | ✓ | AUTOINCREMENT | 部分支持 |
| | IF EXISTS | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | 部分支持 |
| | IF NOT EXISTS | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | 部分支持 |
| | COMMENT | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | 部分支持 |
| | SCHEMA | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | 部分支持 |

### SQL 方言支持

JustDB 通过模板系统支持不同数据库的 SQL 方言差异：

| 方言特性 | MySQL | PostgreSQL | Oracle | SQL Server | H2 | SQLite | 国产数据库 |
|----------|:-----:|:----------:|:------:|:----------:|:--:|:------:|:----------:|
| 标识符引用 | \`table\` | "table" | "table" | [table] | "table" | "table" | 因库而异 |
| 主键自增 | AUTO_INCREMENT | SERIAL/Sequence | Sequence | IDENTITY(1,1) | AUTO_INCREMENT | AUTOINCREMENT | 因库而异 |
| 重命名表 | RENAME TABLE | ALTER TABLE RENAME | ALTER TABLE RENAME | sp_rename | ALTER TABLE RENAME | ALTER TABLE RENAME | 因库而异 |
| 重命名列 | ALTER TABLE RENAME COLUMN | ALTER TABLE RENAME COLUMN | 需重建 | sp_rename | ALTER TABLE RENAME COLUMN | 需重建 | 因库而异 |
| 修改列 | MODIFY COLUMN | ALTER COLUMN ALTER TYPE | 需重建 | ALTER COLUMN | ALTER COLUMN ALTER COLUMN | 需重建 | 因库而异 |

## 连接配置示例

### YAML 配置

```yaml
databases:
  production:
    url: jdbc:mysql://localhost:3306/mydb
    driver: com.mysql.cj.jdbc.Driver
    username: root
    password: secret
    dialect: mysql
```

### JSON 配置

```json
{
  "databases": {
    "production": {
      "url": "jdbc:postgresql://localhost:5432/mydb",
      "driver": "org.postgresql.Driver",
      "username": "postgres",
      "password": "secret",
      "dialect": "postgresql"
    }
  }
}
```

### XML 配置

```xml
&lt;databases&gt;
  &lt;database id="production"&gt;
    &lt;url&gt;jdbc:oracle:thin:@localhost:1521:orcl&lt;/url&gt;
    &lt;driver&gt;oracle.jdbc.OracleDriver&lt;/driver&gt;
    &lt;username&gt;system&lt;/username&gt;
    &lt;password&gt;oracle&lt;/password&gt;
    &lt;dialect&gt;oracle&lt;/dialect&gt;
  &lt;/database&gt;
&lt;/databases&gt;
```

## 相关文档

- [Schema 结构参考](../schema/)
- [CLI 命令参考](../cli/)
- [格式支持](../formats/)
- [AI 集成](../ai/)

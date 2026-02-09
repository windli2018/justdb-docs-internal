# PostgreSQL 数据库支持

JustDB 提供完整的 PostgreSQL 数据库支持，包括最新版本的 PostgreSQL 及其衍生数据库。

## 版本支持

| 版本 | 状态 | 说明 |
|------|------|------|
| PostgreSQL 16.x | 完全支持 | 最新稳定版 |
| PostgreSQL 15.x | 完全支持 | 稳定版本 |
| PostgreSQL 14.x | 完全支持 | 稳定版本 |
| PostgreSQL 13.x | 完全支持 | 稳定版本 |
| PostgreSQL 12.x | 完全支持 | 基本功能支持 |
| PostgreSQL 11.x | 支持 | 基本功能支持 |

## 衍生数据库支持

JustDB 通过 PostgreSQL 协议支持以下衍生数据库：

| 数据库 | 说明 |
|--------|------|
| TimescaleDB | 时序数据库扩展 |
| Greenplum | 大规模并行处理数据库 |
| Redshift | AWS 数据仓库 |
| CockroachDB | 分布式 SQL 数据库 |
| YugabyteDB | 分布式 SQL 数据库 |
| EDB | 企业级 PostgreSQL |
| Citus | PostgreSQL 分布式扩展 |
| Yellowbrick | 数据仓库平台 |

## 连接配置

### JDBC 驱动

```xml
&lt;dependency&gt;
    &lt;groupId&gt;org.postgresql&lt;/groupId&gt;
    &lt;artifactId&gt;postgresql&lt;/artifactId&gt;
    &lt;version&gt;42.7.2&lt;/version&gt;
&lt;/dependency&gt;
```

### 连接字符串

```bash
# 基本格式
jdbc:postgresql://{host}[:{port}]/[{database}]

# 示例
jdbc:postgresql://localhost:5432/mydb
jdbc:postgresql://192.168.1.100:5432/mydb
```

### 配置示例

**YAML:**
```yaml
databases:
  production:
    url: jdbc:postgresql://localhost:5432/mydb
    driver: org.postgresql.Driver
    username: postgres
    password: secret
    dialect: postgresql
    schema: public
```

**JSON:**
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

**XML:**
```xml
&lt;databases&gt;
  &lt;database id="production"&gt;
    &lt;url&gt;jdbc:postgresql://localhost:5432/mydb&lt;/url&gt;
    &lt;driver&gt;org.postgresql.Driver&lt;/driver&gt;
    &lt;username&gt;postgres&lt;/username&gt;
    &lt;password&gt;secret&lt;/password&gt;
    &lt;dialect&gt;postgresql&lt;/dialect&gt;
  &lt;/database&gt;
&lt;/databases&gt;
```

## 数据类型映射

### 数值类型

| JustDB 类型 | PostgreSQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| SMALLINT | SMALLINT | SMALLINT | Integer | 2 字节整数 |
| INTEGER | INTEGER | INTEGER | Integer | 4 字节整数 |
| BIGINT | BIGINT | BIGINT | Long | 8 字节整数 |
| DECIMAL | NUMERIC | NUMERIC | BigDecimal | 精确数值 |
| REAL | REAL | FLOAT | Float | 单精度浮点 (6 位精度) |
| DOUBLE | DOUBLE PRECISION | DOUBLE | Double | 双精度浮点 (15 位精度) |
| SERIAL | SERIAL | INTEGER | Integer | 自增整数 |
| BIGSERIAL | BIGSERIAL | BIGINT | Long | 自增大整数 |
| MONEY | MONEY | NUMERIC | BigDecimal | 货币类型 |

### 字符串类型

| JustDB 类型 | PostgreSQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| CHAR | CHAR(n) | CHAR | String | 固定长度字符串 |
| VARCHAR | VARCHAR(n) | VARCHAR | String | 可变长度字符串 |
| TEXT | TEXT | LONGVARCHAR | String | 无限制长度文本 |
| NAME | NAME | VARCHAR | String | 标识符类型 (64 字符) |

### 日期时间类型

| JustDB 类型 | PostgreSQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| DATE | DATE | DATE | Date | 日期 |
| TIME | TIME(n) | TIME | Time | 时间 (可选精度) |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | Timestamp | 时间戳 (无时区) |
| TIMESTAMPTZ | TIMESTAMPTZ | TIMESTAMPTZ | Timestamp | 时间戳 (带时区) |
| INTERVAL | INTERVAL | VARCHAR | String | 时间间隔 |

### 二进制类型

| JustDB 类型 | PostgreSQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| BYTEA | BYTEA | BINARY | byte[] | 可变长度二进制 |

### JSON 类型

| JustDB 类型 | PostgreSQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| JSON | JSON | OTHER | String | JSON 文本 |
| JSONB | JSONB | OTHER | String | JSON 二进制 (推荐) |

### 几何类型

| JustDB 类型 | PostgreSQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| POINT | POINT | OTHER | PGobject | 点 |
| LINE | LINE | OTHER | PGobject | 线 |
| LSEG | LSEG | OTHER | PGobject | 线段 |
| BOX | BOX | OTHER | PGobject | 矩形 |
| PATH | PATH | OTHER | PGobject | 路径 |
| POLYGON | POLYGON | OTHER | PGobject | 多边形 |
| CIRCLE | CIRCLE | OTHER | PGobject | 圆 |

### 数组类型

PostgreSQL 支持数组类型，JustDB 通过扩展属性支持：

```yaml
tables:
  - name: users
    columns:
      - name: tags
        type: TEXT[]
        comment: "标签数组"
      - name: scores
        type: INTEGER[]
        comment: "分数数组"
```

## PostgreSQL 特定功能

### Schema 支持

```yaml
tables:
  - name: users
    schema: myapp
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
```

### 序列 (Sequence)

```yaml
sequences:
  - name: user_id_seq
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9223372036854775807
    cycle: false
    cache: 1
```

### 自增列 (SERIAL)

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGSERIAL
        primaryKey: true
```

### 唯一约束

```yaml
tables:
  - name: users
    constraints:
      - type: UNIQUE
        name: uk_email
        columns:
          - email
```

### 检查约束

```yaml
tables:
  - name: users
    constraints:
      - type: CHECK
        name: chk_age
        checkExpression: "age >= 18"
```

### 外键约束

```yaml
tables:
  - name: orders
    constraints:
      - type: FOREIGN_KEY
        name: fk_user
        columns:
          - user_id
        referencedTable: users
        referencedColumn: id
        onDelete: CASCADE
        onUpdate: RESTRICT
```

## 生成的 SQL 示例

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_email" UNIQUE ("email")
);
```

### ALTER TABLE

```sql
-- 添加列
ALTER TABLE "users" ADD COLUMN "status" VARCHAR(50) NOT NULL DEFAULT 'active';

-- 修改列类型
ALTER TABLE "users" ALTER COLUMN "email" TYPE VARCHAR(500);

-- 修改列约束
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- 重命名列
ALTER TABLE "users" RENAME COLUMN "username" TO "login_name";

-- 删除列
ALTER TABLE "users" DROP COLUMN "status";
```

### CREATE INDEX

```sql
CREATE INDEX IF NOT EXISTS "idx_username" ON "users" ("username");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_email" ON "users" ("email");
```

### CREATE SEQUENCE

```sql
CREATE SEQUENCE "user_id_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 NO CYCLE;
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS "users";
```

## 已知限制

### 不完全支持的功能

1. **自定义类型**: CREATE TYPE 和 ENUM 类型需要手动处理
2. **全文检索**: tsvector 和 tsquery 基本支持，但高级特性有限
3. **表继承**: PostgreSQL 的表继承特性需要手动处理
4. **分区表**: 声明式分区需要额外配置

### 数据类型限制

1. **几何类型**: 点、线、多边形等几何类型支持有限
2. **范围类型**: int4range, tsrange 等范围类型需要特殊处理
3. **网络地址类型**: inet, cidr, macaddr 类型需要特殊处理

## 最佳实践

### 1. 使用 TEXT 而非 VARCHAR

```yaml
tables:
  - name: users
    columns:
      - name: bio
        type: TEXT  # PostgreSQL 中 TEXT 性能很好
```

### 2. 使用 JSONB 而非 JSON

```yaml
tables:
  - name: users
    columns:
      - name: metadata
        type: JSONB  # 更高效，支持索引
```

### 3. 使用 BIGSERIAL 作为主键

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGSERIAL
        primaryKey: true
```

### 4. 使用 SCHEMA 组织表

```yaml
tables:
  - name: users
    schema: myapp  # 使用 schema 组织表
```

### 5. 利用约束和触发器

```yaml
tables:
  - name: users
    constraints:
      - type: CHECK
        name: chk_email_format
        checkExpression: "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"
```

## 相关文档

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [PostgreSQL 数据类型参考](https://www.postgresql.org/docs/current/datatype.html)
- [数据库支持概述](./README.md)

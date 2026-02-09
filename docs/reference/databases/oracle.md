# Oracle 数据库支持

JustDB 提供 Oracle 数据库支持，包括 Oracle 11g 及以上版本。

## 版本支持

| 版本 | 状态 | 说明 |
|------|------|------|
| Oracle 23c | 完全支持 | 最新版本 |
| Oracle 21c | 完全支持 | 长期支持版本 |
| Oracle 19c | 完全支持 | 长期支持版本 |
| Oracle 18c | 完全支持 | 稳定版本 |
| Oracle 12c | 完全支持 | 稳定版本 |
| Oracle 11g | 支持 | 基本功能支持 |

## 连接配置

### JDBC 驱动

```xml
&lt;dependency&gt;
    &lt;groupId&gt;com.oracle.database.jdbc&lt;/groupId&gt;
    &lt;artifactId&gt;ojdbc11&lt;/artifactId&gt;
    &lt;version&gt;23.2.0.0&lt;/version&gt;
&lt;/dependency&gt;
```

### 连接字符串

```bash
# 基本格式 (Thin 模式)
jdbc:oracle:thin:@{host}[:{port}]/[{database}]

# 示例
jdbc:oracle:thin:@localhost:1521/orcl
jdbc:oracle:thin:@192.168.1.100:1521/orcl

# Service Name 格式
jdbc:oracle:thin:@{host}:{port}/{service_name}

# SID 格式 (旧式)
jdbc:oracle:thin:@{host}:{port}:{sid}

# TNS 格式
jdbc:oracle:thin:@{tns_alias}
```

### 配置示例

**YAML:**
```yaml
databases:
  production:
    url: jdbc:oracle:thin:@localhost:1521/orcl
    driver: oracle.jdbc.OracleDriver
    username: system
    password: oracle
    dialect: oracle
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:oracle:thin:@localhost:1521/orcl",
      "driver": "oracle.jdbc.OracleDriver",
      "username": "system",
      "password": "oracle",
      "dialect": "oracle"
    }
  }
}
```

**XML:**
```xml
&lt;databases&gt;
  &lt;database id="production"&gt;
    &lt;url&gt;jdbc:oracle:thin:@localhost:1521/orcl&lt;/url&gt;
    &lt;driver&gt;oracle.jdbc.OracleDriver&lt;/driver&gt;
    &lt;username&gt;system&lt;/username&gt;
    &lt;password&gt;oracle&lt;/password&gt;
    &lt;dialect&gt;oracle&lt;/dialect&gt;
  &lt;/database&gt;
&lt;/databases&gt;
```

## 数据类型映射

### 数值类型

| JustDB 类型 | Oracle 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| INTEGER | NUMBER(10) | INTEGER | Integer | 整数 |
| BIGINT | NUMBER(19) | BIGINT | Long | 长整数 |
| SMALLINT | NUMBER(5) | SMALLINT | Integer | 短整数 |
| DECIMAL | NUMBER(p,s) | NUMERIC | BigDecimal | 精确数值 |
| FLOAT | FLOAT | FLOAT | Double | 浮点数 |
| DOUBLE | BINARY_DOUBLE | DOUBLE | Double | 双精度 |
| REAL | BINARY_FLOAT | FLOAT | Float | 单精度 |
| NUMBER | NUMBER | NUMERIC | BigDecimal | 数值 |

### 字符串类型

| JustDB 类型 | Oracle 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| CHAR | CHAR(n) | CHAR | String | 固定长度字符串 |
| VARCHAR | VARCHAR2(n) | VARCHAR | String | 可变长度字符串 |
| VARCHAR2 | VARCHAR2(n) | VARCHAR | String | 可变长度字符串 (推荐) |
| CLOB | CLOB | CLOB | String | 大文本 |
| LONG | LONG | LONGVARCHAR | String | 长文本 (已废弃) |
| NVARCHAR | NVARCHAR2(n) | NVARCHAR | String | Unicode 字符串 |
| NCHAR | NCHAR(n) | NCHAR | String | Unicode 固定长度 |

### 日期时间类型

| JustDB 类型 | Oracle 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| DATE | DATE | TIMESTAMP | Timestamp | 日期时间 (包含时间) |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | Timestamp | 时间戳 |
| TIMESTAMPTZ | TIMESTAMP WITH TIME ZONE | TIMESTAMPTZ | Timestamp | 时间戳 (带时区) |
| TIMESTAMPLTZ | TIMESTAMP WITH LOCAL TIME ZONE | TIMESTAMP | Timestamp | 时间戳 (本地时区) |
| INTERVAL | INTERVAL YEAR TO MONTH | VARCHAR | String | 时间间隔 |

### 二进制类型

| JustDB 类型 | Oracle 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| BLOB | BLOB | BLOB | byte[] | 二进制大对象 |
| RAW | RAW(n) | BINARY | byte[] | 固定长度二进制 |
| LONG RAW | LONG RAW | LONGVARBINARY | byte[] | 长二进制 (已废弃) |

### ROWID 类型

| JustDB 类型 | Oracle 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| ROWID | ROWID | ROWID | String | 行标识符 |

## Oracle 特定功能

### 序列 (Sequence)

Oracle 使用 Sequence 实现自增功能：

```yaml
sequences:
  - name: user_id_seq
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 999999999999999999999
    cycle: false
    cache: 20
```

### 表空间

```yaml
tables:
  - name: users
    tablespace: USERS
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
```

### 存储参数

```yaml
tables:
  - name: users
    storage:
      initial: 100K
      next: 100K
      minExtents: 1
      maxExtents: UNLIMITED
      pctIncrease: 0
```

### 注释

Oracle 支持表和列注释：

```yaml
tables:
  - name: users
    comment: "用户信息表"
    columns:
      - name: email
        type: VARCHAR2(255)
        comment: "用户邮箱地址"
```

## 生成的 SQL 示例

### CREATE TABLE

```sql
CREATE TABLE "users" (
  "id" NUMBER(10) PRIMARY KEY,
  "username" VARCHAR2(255) NOT NULL,
  "email" VARCHAR2(255) NOT NULL,
  "created_at" TIMESTAMP DEFAULT SYSTIMESTAMP
);

COMMENT ON TABLE "users" IS '用户信息表';
COMMENT ON COLUMN "users"."email" IS '用户邮箱地址';
```

### CREATE SEQUENCE

```sql
CREATE SEQUENCE "user_id_seq"
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 999999999999999999999
  NOCYCLE
  CACHE 20;
```

### ALTER TABLE

```sql
-- 添加列
ALTER TABLE "users" ADD ("status" VARCHAR2(50) DEFAULT 'active' NOT NULL);

-- 修改列类型
ALTER TABLE "users" MODIFY ("email" VARCHAR2(500));

-- 重命名列 (需要重建)
-- Oracle 12c+ 支持直接重命名
ALTER TABLE "users" RENAME COLUMN "username" TO "login_name";

-- 删除列
ALTER TABLE "users" DROP COLUMN "status";
```

### CREATE INDEX

```sql
CREATE INDEX "idx_username" ON "users" ("username");
CREATE UNIQUE INDEX "idx_email" ON "users" ("email");
```

### DROP TABLE

```sql
-- Oracle 不支持 IF EXISTS
DROP TABLE "users";
```

## 已知限制

### 不支持的功能

1. **IF EXISTS/IF NOT EXISTS**: Oracle 不支持这些语法，需要手动检查
2. **IDENTITY**: Oracle 12c+ 支持 IDENTITY 列，但 JustDB 使用 Sequence
3. **CASCADE**: Oracle 的 CASCADE 删除有特殊规则
4. **RENAME COLUMN**: Oracle 12c+ 才支持直接重命名列

### 数据类型限制

1. **VARCHAR**: Oracle 推荐使用 VARCHAR2 而非 VARCHAR
2. **AUTO_INCREMENT**: Oracle 不支持，需要使用 Sequence + Trigger
3. **BOOLEAN**: Oracle 没有 BOOLEAN 类型，使用 NUMBER(1) 或 CHAR(1)

### 其他限制

1. **列重命名**: Oracle 11g 及以下不支持直接重命名列
2. **表重命名**: 需要重建所有依赖对象
3. **修改列类型**: 某些类型转换需要特殊处理

## 最佳实践

### 1. 使用 Sequence 实现自增

```yaml
sequences:
  - name: user_id_seq
    startWith: 1
    incrementBy: 1
    cache: 20

tables:
  - name: users
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
        defaultValueComputed: "user_id_seq.NEXTVAL"
```

### 2. 使用 VARCHAR2 而非 VARCHAR

```yaml
tables:
  - name: users
    columns:
      - name: username
        type: VARCHAR2(255)  # 推荐使用 VARCHAR2
```

### 3. 使用 TIMESTAMP 而非 DATE

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: "SYSTIMESTAMP"
```

### 4. 使用表空间组织表

```yaml
tables:
  - name: users
    tablespace: USERS  # 组织表到不同表空间
```

### 5. 利用 COMMENT 增强文档

```yaml
tables:
  - name: users
    comment: "用户信息表"
    columns:
      - name: email
        type: VARCHAR2(255)
        comment: "用户邮箱地址，用于登录和通知"
```

### 6. 使用 NVARCHAR2 存储 Unicode

```yaml
tables:
  - name: users
    columns:
      - name: chinese_name
        type: NVARCHAR2(100)  # 支持多语言字符
```

## 迁移建议

### 从 MySQL 迁移到 Oracle

1. **AUTO_INCREMENT → Sequence**
2. **VARCHAR → VARCHAR2**
3. **TEXT → CLOB**
4. **DATETIME → TIMESTAMP**
5. **TINYINT(1) → NUMBER(1)**

### 从 PostgreSQL 迁移到 Oracle

1. **SERIAL → Sequence**
2. **VARCHAR → VARCHAR2**
3. **JSONB → CLOB** (存储 JSON 字符串)

## 相关文档

- [Oracle 官方文档](https://docs.oracle.com/en/database/oracle/oracle-database/)
- [Oracle 数据类型参考](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [数据库支持概述](./README.md)

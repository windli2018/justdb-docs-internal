# SQLite 数据库支持

JustDB 提供完整的 SQLite 数据库支持，适用于嵌入式场景和移动应用。

## 版本支持

| 版本 | 状态 | 说明 |
|------|------|------|
| SQLite 3.x | 完全支持 | 推荐使用最新版本 |
| SQLite 3.35.0+ | 完全支持 | 支持 DROP COLUMN |
| SQLite 3.25.0+ | 支持 | 支持 RENAME COLUMN |

## 连接配置

### JDBC 驱动

```xml
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
    <version>3.42.0.0</version>
</dependency>
```

### 连接字符串

```bash
# 基本格式
jdbc:sqlite:{file}

# 示例
jdbc:sqlite:sample.db
jdbc:sqlite:/path/to/database.db
jdbc:sqlite:C:/data/mydb.db

# 内存数据库
jdbc:sqlite::memory:
jdbc:sqlite:memory:
```

### 配置示例

**YAML:**
```yaml
databases:
  production:
    url: jdbc:sqlite:./data/mydb.db
    driver: org.sqlite.JDBC
    username: ""
    password: ""
    dialect: sqlite
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:sqlite:./data/mydb.db",
      "driver": "org.sqlite.JDBC",
      "username": "",
      "password": "",
      "dialect": "sqlite"
    }
  }
}
```

**XML:**
```xml
<databases>
  <database id="production">
    <url>jdbc:sqlite:./data/mydb.db</url>
    <driver>org.sqlite.JDBC</driver>
    <username></username>
    <password></password>
    <dialect>sqlite</dialect>
  </database>
</databases>
```

## 数据类型映射

### 数值类型

| JustDB 类型 | SQLite 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| INTEGER | INTEGER | INTEGER | Integer/Long | 整数 (自动大小) |
| BIGINT | INTEGER | BIGINT | Long | 长整数 |
| SMALLINT | INTEGER | SMALLINT | Integer | 短整数 |
| TINYINT | INTEGER | TINYINT | Integer | 字节整数 |
| DECIMAL | REAL | DECIMAL | BigDecimal | 浮点数 |
| FLOAT | REAL | FLOAT | Double | 浮点数 |
| DOUBLE | REAL | DOUBLE | Double | 双精度浮点 |
| REAL | REAL | REAL | Double | 浮点数 |

### 字符串类型

| JustDB 类型 | SQLite 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| CHAR | TEXT | CHAR | String | 字符串 |
| VARCHAR | TEXT | VARCHAR | String | 字符串 |
| TEXT | TEXT | LONGVARCHAR | String | 文本 |
| CLOB | TEXT | CLOB | String | 大文本 |
| NVARCHAR | TEXT | NVARCHAR | String | Unicode 字符串 |
| NCHAR | TEXT | NCHAR | String | Unicode 字符串 |

### 日期时间类型

| JustDB 类型 | SQLite 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| DATE | TEXT | VARCHAR | String | 日期字符串 (ISO8601) |
| TIME | TEXT | VARCHAR | String | 时间字符串 (ISO8601) |
| TIMESTAMP | TEXT | VARCHAR | String | 时间戳字符串 (ISO8601) |
| DATETIME | TEXT | VARCHAR | String | 日期时间字符串 (ISO8601) |

### 二进制类型

| JustDB 类型 | SQLite 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| BINARY | BLOB | BINARY | byte[] | 二进制数据 |
| VARBINARY | BLOB | VARBINARY | byte[] | 二进制数据 |
| BLOB | BLOB | BLOB | byte[] | 二进制大对象 |

### 其他类型

| JustDB 类型 | SQLite 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-------------|-----------|-----------|------|
| BOOLEAN | INTEGER | BIT | Boolean | 布尔值 (0/1) |
| NUMERIC | NUMERIC | NUMERIC | BigDecimal | 数值 |

## SQLite 特定功能

### AUTOINCREMENT

SQLite 使用 AUTOINCREMENT 关键字：

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
        autoIncrement: true  # 生成 AUTOINCREMENT
```

### WITHOUT ROWID

SQLite 支持无行 ID 表：

```yaml
tables:
  - name: config
    withoutRowId: true
    columns:
      - name: key
        type: TEXT
        primaryKey: true
      - name: value
        type: TEXT
```

### 临时表

```yaml
tables:
  - name: temp_cache
    temporary: true
    columns:
      - name: key
        type: TEXT
        primaryKey: true
```

## 生成的 SQL 示例

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### ALTER TABLE

```sql
-- 添加列 (SQLite 3.25.0+)
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- 重命名列 (SQLite 3.25.0+)
ALTER TABLE users RENAME COLUMN username TO login_name;

-- 删除列 (SQLite 3.35.0+)
ALTER TABLE users DROP COLUMN status;

-- 重命名表
ALTER TABLE users RENAME TO users_new;
```

### CREATE INDEX

```sql
CREATE INDEX IF NOT EXISTS idx_username ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email ON users (email);
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS users;
```

## 已知限制

### ALTER TABLE 限制

SQLite 对 ALTER TABLE 的支持有限：

1. **修改列类型**: 不支持直接修改列类型
2. **删除列**: SQLite 3.35.0+ 才支持 DROP COLUMN
3. **重命名列**: SQLite 3.25.0+ 才支持 RENAME COLUMN
4. **添加约束**: 不支持通过 ALTER TABLE 添加约束

### 数据类型限制

1. **弱类型**: SQLite 使用动态类型系统
2. **日期时间**: 没有原生的日期时间类型，使用 TEXT/REAL/INTEGER 存储
3. **BOOLEAN**: 使用 INTEGER 0/1 表示

### 其他限制

1. **外键**: 默认不启用外键约束
2. **触发器**: 支持，但语法较简单
3. **视图**: 支持，但更新视图有限制

## 兼容性说明

### SQLite 版本差异

| 版本 | 特性 |
|------|------|
| 3.35.0+ | 支持 DROP COLUMN |
| 3.25.0+ | 支持 RENAME COLUMN |
| 3.9.0+ | 支持表达式索引 |
| 3.8.3+ | 支持 CTE (WITH 子句) |

## 最佳实践

### 1. 启用外键约束

```bash
jdbc:sqlite:mydb.db?foreign_keys=on
```

### 2. 使用 TEXT 存储日期时间

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: TEXT  # ISO8601 格式字符串
        defaultValueComputed: "CURRENT_TIMESTAMP"
```

### 3. 使用 INTEGER 作为主键

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
        autoIncrement: true
```

### 4. 利用 WITHOUT ROWID 优化性能

```yaml
tables:
  - name: config
    withoutRowId: true  # 减少存储和提升性能
```

### 5. 使用事务提升性能

```yaml
# JustDB 默认使用事务
databases:
  production:
    url: jdbc:sqlite:mydb.db?journal_mode=WAL
    dialect: sqlite
```

## 使用场景

### 1. 移动应用

SQLite 是移动应用的理想选择：

```yaml
databases:
  mobile:
    url: jdbc:sqlite:/data/data/com.myapp/files/database.db
    dialect: sqlite
```

### 2. 桌面应用

嵌入式数据库方案：

```yaml
databases:
  desktop:
    url: jdbc:sqlite:~/Library/Application Support/MyApp/database.db
    dialect: sqlite
```

### 3. 小型网站

低流量网站的数据库方案：

```yaml
databases:
  web:
    url: jdbc:sqlite:/var/www/myapp/data/database.db
    dialect: sqlite
```

### 4. 测试和开发

快速原型开发：

```yaml
databases:
  test:
    url: jdbc:sqlite::memory:
    dialect: sqlite
```

## 性能优化

### 1. 使用 WAL 模式

```bash
jdbc:sqlite:mydb.db?journal_mode=WAL
```

### 2. 调整缓存大小

```bash
jdbc:sqlite:mydb.db?cache_size=-10000
```

### 3. 禁用同步 (测试环境)

```bash
jdbc:sqlite:mydb.db?synchronous=OFF
```

### 4. 使用内存数据库

```bash
jdbc:sqlite::memory:
```

## 连接池配置

SQLite 推荐使用单连接或少量连接：

```yaml
databases:
  production:
    url: jdbc:sqlite:./data/mydb.db
    dialect: sqlite
    pool:
      maxSize: 1  # SQLite 推荐单连接
      minIdle: 1
```

## 迁移建议

### 从 MySQL 迁移到 SQLite

1. **AUTO_INCREMENT → AUTOINCREMENT**
2. **VARCHAR → TEXT**
3. **DATETIME → TEXT** (ISO8601 格式)
4. **BLOB → BLOB** (相同)

### 从 PostgreSQL 迁移到 SQLite

1. **SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT**
2. **VARCHAR → TEXT**
3. **TIMESTAMP → TEXT** (ISO8601 格式)
4. **BOOLEAN → INTEGER**

## 相关文档

- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [SQLite 数据类型参考](https://www.sqlite.org/datatype3.html)
- [数据库支持概述](./README.md)

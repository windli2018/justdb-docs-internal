# MySQL 数据库支持

JustDB 提供完整的 MySQL 数据库支持，包括 MySQL 5.x 和 MySQL 8.x 版本。

## 版本支持

| 版本 | 状态 | 说明 |
|------|------|------|
| MySQL 8.x | 完全支持 | 推荐使用，支持所有特性 |
| MySQL 5.7 | 完全支持 | 稳定版本 |
| MySQL 5.6 | 支持 | 基本功能支持 |
| MySQL 5.5 | 支持 | 基本功能支持 |

## 连接配置

### JDBC 驱动

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
</dependency>
```

### 连接字符串

```bash
# 基本格式
jdbc:mysql://{host}[:{port}]/[{database}]

# 示例
jdbc:mysql://localhost:3306/mydb
jdbc:mysql://192.168.1.100:3306/mydb
```

### 配置示例

**YAML:**
```yaml
databases:
  production:
    url: jdbc:mysql://localhost:3306/mydb
    driver: com.mysql.cj.jdbc.Driver
    username: root
    password: secret
    dialect: mysql
    properties:
      useSSL: false
      characterEncoding: utf8mb4
      serverTimezone: Asia/Shanghai
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:mysql://localhost:3306/mydb",
      "driver": "com.mysql.cj.jdbc.Driver",
      "username": "root",
      "password": "secret",
      "dialect": "mysql"
    }
  }
}
```

**XML:**
```xml
<databases>
  <database id="production">
    <url>jdbc:mysql://localhost:3306/mydb</url>
    <driver>com.mysql.cj.jdbc.Driver</driver>
    <username>root</username>
    <password>secret</password>
    <dialect>mysql</dialect>
  </database>
</databases>
```

## 数据类型映射

### 数值类型

| JustDB 类型 | MySQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|------------|-----------|-----------|------|
| TINYINT | TINYINT | TINYINT | Integer | 1 字节整数 |
| SMALLINT | SMALLINT | SMALLINT | Integer | 2 字节整数 |
| INTEGER | INT | INTEGER | Integer | 4 字节整数 |
| BIGINT | BIGINT | BIGINT | Long | 8 字节整数 |
| DECIMAL | DECIMAL | DECIMAL | BigDecimal | 精确数值 |
| FLOAT | FLOAT | FLOAT | Double | 单精度浮点 |
| DOUBLE | DOUBLE | DOUBLE | Double | 双精度浮点 |
| BIT | BIT | BIT | Integer | 位类型 |

### 字符串类型

| JustDB 类型 | MySQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|------------|-----------|-----------|------|
| CHAR | CHAR | CHAR | String | 固定长度字符串 |
| VARCHAR | VARCHAR | VARCHAR | String | 可变长度字符串 |
| TEXT | TEXT | LONGVARCHAR | String | 长文本 (64KB) |
| MEDIUMTEXT | MEDIUMTEXT | LONGVARCHAR | String | 中等文本 (16MB) |
| LONGTEXT | LONGTEXT | LONGVARCHAR | String | 长文本 (4GB) |
| TINYTEXT | TINYTEXT | VARCHAR | String | 短文本 (255B) |

### 日期时间类型

| JustDB 类型 | MySQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|------------|-----------|-----------|------|
| DATE | DATE | DATE | Date | 日期 |
| TIME | TIME | TIME | Time | 时间 |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | Timestamp | 时间戳 |
| DATETIME | DATETIME | TIMESTAMP | Timestamp | 日期时间 |
| YEAR | YEAR | DATE | Integer | 年份 |

### 二进制类型

| JustDB 类型 | MySQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|------------|-----------|-----------|------|
| BINARY | BINARY | BINARY | byte[] | 固定长度二进制 |
| VARBINARY | VARBINARY | VARBINARY | byte[] | 可变长度二进制 |
| BLOB | BLOB | BLOB | byte[] | 二进制大对象 |
| TINYBLOB | TINYBLOB | BLOB | byte[] | 小二进制 (255B) |
| MEDIUMBLOB | MEDIUMBLOB | BLOB | byte[] | 中二进制 (16MB) |
| LONGBLOB | LONGBLOB | BLOB | byte[] | 长二进制 (4GB) |

### JSON 类型

| JustDB 类型 | MySQL 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|------------|-----------|-----------|------|
| JSON | JSON | OTHER | String | JSON 数据 |

## MySQL 特定功能

### 表选项

```yaml
tables:
  - name: users
    engine: InnoDB
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
    rowFormat: DYNAMIC
    maxRows: 1000000
    comment: "用户表"
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### 存储引擎

MySQL 支持多种存储引擎，JustDB 通过扩展属性支持：

```yaml
tables:
  - name: my_table
    engine: InnoDB  # InnoDB, MyISAM, Memory, CSV, Archive
```

### 字符集和排序规则

```yaml
tables:
  - name: users
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
```

### AUTO_INCREMENT

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### 索引类型

```yaml
tables:
  - name: users
    indexes:
      - name: idx_email
        columns:
          - email
        type: BTREE  # BTREE, HASH, FULLTEXT, SPATIAL
```

## 生成的 SQL 示例

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### ALTER TABLE

```sql
-- 添加列
ALTER TABLE `users` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'active';

-- 修改列
ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(500) NOT NULL;

-- 重命名列
ALTER TABLE `users` RENAME COLUMN `username` TO `login_name`;

-- 删除列
ALTER TABLE `users` DROP COLUMN `status`;
```

### CREATE INDEX

```sql
CREATE INDEX idx_username ON `users` (`username`);
CREATE UNIQUE INDEX idx_email ON `users` (`email`);
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS `users`;
```

## 已知限制

### 不支持的功能

1. **空间类型 (SPATIAL)**: MySQL 的空间数据类型（如 GEOMETRY, POINT）暂不完全支持
2. **全文索引**: FULLTEXT 索引的基本功能支持，但高级特性有限
3. **分区表**: 仅支持基本分区，复杂分区策略需要手动处理

### 兼容性说明

1. **MySQL 5.5 及以下**: 部分 IF EXISTS/IF NOT EXISTS 语法可能不支持
2. **字符集**: 建议使用 utf8mb4 而非 utf8，以支持完整的 Unicode 字符
3. **时间类型**: TIMESTAMP 有 2038 年问题，建议使用 DATETIME

## 最佳实践

### 1. 使用 InnoDB 引擎

```yaml
tables:
  - name: my_table
    engine: InnoDB  # 支持事务、外键、行锁
```

### 2. 合理设置字符集

```yaml
tables:
  - name: users
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
```

### 3. 使用 BIGINT 作为主键

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### 4. 添加表和列注释

```yaml
tables:
  - name: users
    comment: "用户信息表"
    columns:
      - name: email
        type: VARCHAR(255)
        comment: "用户邮箱地址"
```

### 5. 使用 TIMESTAMP 而非 DATETIME

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: TIMESTAMP
        defaultValue: "CURRENT_TIMESTAMP"
```

## 相关文档

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [MySQL 数据类型参考](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
- [数据库支持概述](./README.md)

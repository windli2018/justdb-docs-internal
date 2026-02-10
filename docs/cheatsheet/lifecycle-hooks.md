# Lifecycle Hooks 生命周期钩子速查

生命周期钩子（Lifecycle Hooks）允许在 DDL 执行的不同阶段注入自定义 SQL 脚本。

## 快速示例

### 基本钩子使用

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>

    <!-- 创建后执行 -->
    <afterCreates>
        <ConditionalSqlScript>
            <content>INSERT INTO users (id, username) VALUES (1, 'admin')</content>
        </ConditionalSqlScript>
    </afterCreates>

    <!-- 删除前执行 -->
    <beforeDrops>
        <ConditionalSqlScript>
            <content>DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users)</content>
        </ConditionalSqlScript>
    </beforeDrops>
</Table>
```

### 多个钩子组合

```xml
<Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="order_no" type="VARCHAR(50)"/>

    <!-- 创建前：检查表是否存在 -->
    <beforeCreates>
        <ConditionalSqlScript>
            <content>-- Check if table exists</content>
        </ConditionalSqlScript>
    </beforeCreates>

    <!-- 创建后：创建索引 -->
    <afterCreates>
        <ConditionalSqlScript dbms="mysql">
            <content>CREATE INDEX idx_order_no ON orders(order_no)</content>
        </ConditionalSqlScript>
        <ConditionalSqlScript dbms="postgresql">
            <content>CREATE INDEX idx_order_no ON orders(order_no)</content>
        </ConditionalSqlScript>
    </afterCreates>

    <!-- 修改前：备份数据 -->
    <beforeAlters>
        <ConditionalSqlScript>
            <content>CREATE TABLE orders_backup AS SELECT * FROM orders</content>
        </ConditionalSqlScript>
    </beforeAlters>

    <!-- 修改后：更新触发器 -->
    <afterAlters>
        <ConditionalSqlScript>
            <content>DROP TRIGGER IF EXISTS trg_orders_update</content>
        </ConditionalSqlScript>
    </afterAlters>

    <!-- 添加后：初始化数据 -->
    <afterAdds>
        <ConditionalSqlScript>
            <content>INSERT INTO order_sequences (name, value) VALUES ('order_no', 1000)</content>
        </ConditionalSqlScript>
    </afterAdds>

    <!-- 删除后：清理相关表 -->
    <afterDrops>
        <ConditionalSqlScript>
            <content>DROP TABLE IF EXISTS order_items</content>
        </ConditionalSqlScript>
    </afterDrops>
</Table>
```

## 钩子类型

| 钩子 | 执行时机 | 使用场景 |
|------|---------|----------|
| `beforeCreates` | 表创建前 | 检查前置条件、创建依赖对象 |
| `afterCreates` | 表创建后 | 创建索引、初始化数据 |
| `beforeAlters` | 表修改前 | 备份数据、检查兼容性 |
| `afterAlters` | 表修改后 | 更新触发器、重建索引 |
| `beforeDrops` | 表删除前 | 删除依赖对象、清理外键 |
| `afterDrops` | 表删除后 | 清理相关表、删除序列 |
| `beforeAdds` | 列添加前 | 检查约束、准备数据 |
| `afterAdds` | 列添加后 | 设置默认值、更新数据 |

## 常用场景

### 场景 1: 初始化种子数据

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>

    <afterCreates>
        <ConditionalSqlScript>
            <content>INSERT INTO users (id, username) VALUES (1, 'admin'), (2, 'system')</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

### 场景 2: 数据库特定语法

```xml
<Table name="events">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="event_time" type="TIMESTAMP"/>

    <afterCreates>
        <!-- MySQL 特定 -->
        <ConditionalSqlScript dbms="mysql">
            <content>CREATE TRIGGER trg_events_insert BEFORE INSERT ON events FOR EACH ROW SET NEW.event_time = NOW()</content>
        </ConditionalSqlScript>

        <!-- PostgreSQL 特定 -->
        <ConditionalSqlScript dbms="postgresql">
            <content>CREATE FUNCTION trg_events_insert() RETURNS TRIGGER AS $$ BEGIN NEW.event_time := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_events_insert BEFORE INSERT ON events FOR EACH ROW EXECUTE FUNCTION trg_events_insert()</content>
        </ConditionalSqlScript>

        <!-- Oracle 特定 -->
        <ConditionalSqlScript dbms="oracle">
            <content>CREATE OR REPLACE TRIGGER trg_events_insert BEFORE INSERT ON events FOR EACH ROW BEGIN :NEW.event_time := SYSTIMESTAMP; END;</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

### 场景 3: 外键依赖处理

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="role_id" type="BIGINT"/>

    <!-- 删除前：先删除关联数据 -->
    <beforeDrops>
        <ConditionalSqlScript>
            <content>DELETE FROM user_permissions WHERE user_role_id IN (SELECT id FROM user_roles)</content>
        </ConditionalSqlScript>
    </beforeDrops>
</Table>
```

### 场景 4: 索引和约束

```xml
<Table name="products">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="name" type="VARCHAR(100)"/>
    <Column name="category" type="VARCHAR(50)"/>
    <Column name="price" type="DECIMAL(10,2)"/>

    <afterCreates>
        <!-- 全文索引 -->
        <ConditionalSqlScript dbms="mysql">
            <content>CREATE FULLTEXT INDEX idx_product_name ON products(name)</content>
        </ConditionalSqlScript>

        <!-- 复合索引 -->
        <ConditionalSqlScript>
            <content>CREATE INDEX idx_product_category ON products(category, price)</content>
        </ConditionalSqlScript>

        <!-- 条件索引（PostgreSQL） -->
        <ConditionalSqlScript dbms="postgresql">
            <content>CREATE INDEX idx_product_active ON products(name) WHERE price > 0</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

## 条件执行

### 数据库类型条件

```xml
<afterCreates>
    <!-- 仅 MySQL -->
    <ConditionalSqlScript dbms="mysql">
        <content>CREATE TRIGGER trg_users_insert ...</content>
    </ConditionalSqlScript>

    <!-- 仅 PostgreSQL -->
    <ConditionalSqlScript dbms="postgresql">
        <content>CREATE FUNCTION trg_users_insert() ...</content>
    </ConditionalSqlScript>

    <!-- 多个数据库（逗号分隔） -->
    <ConditionalSqlScript dbms="mysql,postgresql">
        <content>CREATE INDEX idx_users_name ON users(username)</content>
    </ConditionalSqlScript>
</afterCreates>
```

### 版本条件

```xml
<beforeAlters>
    <!-- MySQL 8.0+ -->
    <ConditionalSqlScript dbms="mysql" dbVersionMin="8.0">
        <content>CREATE INDEX idx_users_json ON users((CAST(metadata->>'$.id' AS UNSIGNED)))</content>
    </ConditionalSqlScript>

    <!-- PostgreSQL 12+ -->
    <ConditionalSqlScript dbms="postgresql" dbVersionMin="12">
        <content>CREATE INDEX idx_users_json ON users USING GIN (metadata jsonb_path_ops)</content>
    </ConditionalSqlScript>
</beforeAlters>
```

### Schema 状态条件

```xml
<beforeAlters>
    <!-- 仅当列不存在时 -->
    <ConditionalSqlScript condition="!columnExists('users','email')">
        <content>ALTER TABLE users ADD COLUMN email VARCHAR(100)</content>
    </ConditionalSqlScript>
</beforeAlters>
```

## 钩子属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `content` | String | SQL 脚本内容 |
| `dbms` | String | 数据库类型（逗号分隔多个） |
| `dbVersionMin` | String | 最低数据库版本 |
| `dbVersionMax` | String | 最高数据库版本 |
| `condition` | String | 执行条件表达式 |

## 注意事项

### 1. 钩子执行顺序

```
beforeCreates → CREATE TABLE → afterCreates
beforeAlters → ALTER TABLE → afterAlters
beforeAdds → ADD COLUMN → afterAdds
beforeDrops → DROP TABLE → afterDrops
```

### 2. 事务管理

```xml
<!-- 钩子在同一个事务中执行 -->
<Table name="users">
    <afterCreates>
        <!-- 如果这里失败，表创建也会回滚 -->
        <ConditionalSqlScript>
            <content>INSERT INTO users ...</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

### 3. 错误处理

```xml
<!-- 使用 IF EXISTS 避免错误 -->
<beforeDrops>
    <ConditionalSqlScript>
        <content>DROP TRIGGER IF EXISTS trg_users_update</content>
    </ConditionalSqlScript>
</beforeDrops>
```

### 4. 权限要求

```xml
<!-- 某些操作需要特殊权限 -->
<afterCreates>
    <!-- 创建触发器需要 TRIGGER 权限 -->
    <ConditionalSqlScript>
        <content>CREATE TRIGGER trg_users_insert ...</content>
    </ConditionalSqlScript>

    <!-- 创建序列需要 CREATE SEQUENCE 权限 -->
    <ConditionalSqlScript>
        <content>CREATE SEQUENCE seq_users_id START WITH 1</content>
    </ConditionalSqlScript>
</afterCreates>
```

## 进阶技巧

### 技巧 1: 动态 SQL

```xml
<beforeAlters>
    <ConditionalSqlScript>
        <content>
            SET @column_exists = (
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email'
            );
            SET @sql = IF(@column_exists = 0, 'ALTER TABLE users ADD COLUMN email VARCHAR(100)', 'SELECT "Column exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        </content>
    </ConditionalSqlScript>
</beforeAlters>
```

### 技巧 2: 批量操作

```xml
<afterCreates>
    <ConditionalSqlScript>
        <content>
            INSERT INTO roles (name) VALUES ('admin'), ('user'), ('guest');
            INSERT INTO permissions (name) VALUES ('read'), ('write'), ('delete');
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
            WHERE r.name = 'admin';
        </content>
    </ConditionalSqlScript>
</afterCreates>
```

### 技巧 3: 存储过程调用

```xml
<afterCreates>
    <ConditionalSqlScript dbms="mysql">
        <content>CALL init_user_data()</content>
    </ConditionalSqlScript>
    <ConditionalSqlScript dbms="postgresql">
        <content>SELECT init_user_data()</content>
    </ConditionalSqlScript>
    <ConditionalSqlScript dbms="oracle">
        <content>BEGIN init_user_data(); END;</content>
    </ConditionalSqlScript>
</afterCreates>
```

## 参考链接

- [生命周期钩子详解](../reference/schema/lifecycle-hooks.md)
- [SQL 参考](../reference/sql/)
- [数据库脚本](../reference/scripts/)

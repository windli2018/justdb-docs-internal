---
icon: git-commit
title: 生命周期钩子
order: 10
category:
  - 参考文档
  - Schema 定义
tag:
  - lifecycle
  - hooks
  - schema
---

# 生命周期钩子 (Lifecycle Hooks)

生命周期钩子允许在 DDL（数据定义语言）操作的前后执行自定义 SQL 语句。钩子提供了一种灵活的方式来扩展 JustDB 的功能，实现数据库特定的逻辑或自定义操作。

## 钩子类型

| 钩子 | 执行时机 | 适用对象 |
|------|---------|---------|
| `beforeCreates` | CREATE TABLE/VIEW/INDEX 前 | Table, View, Index |
| `afterCreates` | CREATE TABLE/VIEW/INDEX 后 | Table, View, Index |
| `beforeDrops` | DROP TABLE/VIEW/INDEX 前 | Table, View, Index |
| `afterDrops` | DROP TABLE/VIEW/INDEX 后 | Table, View, Index |
| `beforeAlters` | ALTER TABLE/VIEW/COLUMN 前 | Table, View, Column |
| `afterAlters` | ALTER TABLE/VIEW/COLUMN 后 | Table, View, Column |
| `beforeAdds` | ADD COLUMN/INDEX/CONSTRAINT 前 | Table, View |
| `afterAdds` | ADD COLUMN/INDEX/CONSTRAINT 后 | Table, View |

## ConditionalSqlScript 结构

钩子使用 `ConditionalSqlScript` 定义条件 SQL 脚本：

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | String | 是 | SQL 脚本内容 |
| `dbms` | List&lt;String&gt; | 否 | 适用数据库列表 |
| `condition` | String | 否 | 执行条件表达式 |

## 基本示例

### 简单钩子

```yaml
Table:
  - name: users
    comment: 用户表
    afterCreates:
      - content: |
          CREATE INDEX idx_users_created_at
          ON users(created_at);
```

### 条件钩子

基于数据库类型执行不同的 SQL：

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [postgresql]
        content: |
          CREATE INDEX CONCURRENTLY idx_users_email
          ON users(email);

      - dbms: [mysql]
        content: |
          CREATE INDEX idx_users_email
          ON users(email);
```

## 表级钩子

### beforeCreates / afterCreates

在创建表前后执行 SQL：

```yaml
Table:
  - name: users
    beforeCreates:
      - content: |
          -- 创建前检查
          SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name = 'users_backup';

    afterCreates:
      - content: |
          -- 创建后初始化数据
          INSERT INTO users (username, email, status)
          VALUES ('admin', 'admin@example.com', 'active');

          -- 创建额外索引
          CREATE INDEX idx_users_status
          ON users(status);
```

### beforeDrops / afterDrops

在删除表前后执行 SQL：

```yaml
Table:
  - name: users
    beforeDrops:
      - content: |
          -- 删除前备份数据
          CREATE TABLE users_backup AS
          SELECT * FROM users;

    afterDrops:
      - content: |
          -- 删除后清理
          DROP TABLE IF EXISTS users_backup;
```

### beforeAlters / afterAlters

在修改表前后执行 SQL：

```yaml
Table:
  - name: users
    beforeAlters:
      - content: |
          -- 修改前锁定表
          LOCK TABLES users WRITE;

    afterAlters:
      - content: |
          -- 修改后解锁
          UNLOCK TABLES;
```

### beforeAdds / afterAdds

在添加子对象前后执行 SQL：

```yaml
Table:
  - name: users
    Column:
      - name: status
        type: VARCHAR(20)
        defaultValue: 'active'

    afterAdds:
      - content: |
          -- 添加列后更新现有数据
          UPDATE users
          SET status = 'active'
          WHERE status IS NULL;
```

## 列级钩子

列也支持生命周期钩子：

```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
        afterAlters:
          - content: |
              -- 修改列后更新数据
              UPDATE users
              SET email = LOWER(email)
              WHERE email IS NOT NULL
                AND email != LOWER(email);
```

## 数据库特定钩子

### PostgreSQL 特定钩子

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [postgresql, timescaledb]
        content: |
          -- 创建并发索引
          CREATE INDEX CONCURRENTLY idx_users_username
          ON users(LOWER(username));

          -- 创建部分索引
          CREATE INDEX idx_users_active
          ON users(created_at)
          WHERE status = 'active';

      - dbms: [postgresql]
        content: |
          -- 创建触发器函数
          CREATE OR REPLACE FUNCTION update_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          -- 创建触发器
          CREATE TRIGGER trg_users_update_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at();
```

### MySQL 特定钩子

```yaml
Table:
  - name: products
    afterCreates:
      - dbms: [mysql, mariadb]
        content: |
          -- 创建全文索引
          CREATE FULLTEXT INDEX ft_products_search
          ON products(name, description);

          -- 创建空间索引
          CREATE SPATIAL INDEX idx_products_location
          ON products(location);
```

### Oracle 特定钩子

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [oracle]
        content: |
          -- 创建序列
          CREATE SEQUENCE seq_users_id
          START WITH 1
          INCREMENT BY 1
          NOCACHE;

          -- 创建触发器
          CREATE OR REPLACE TRIGGER trg_users_bi
          BEFORE INSERT ON users
          FOR EACH ROW
          BEGIN
            IF :NEW.id IS NULL THEN
              SELECT seq_users_id.NEXTVAL INTO :NEW.id FROM dual;
            END IF;
          END;
          /
```

## 高级用法

### 多阶段钩子

组合多个钩子实现复杂逻辑：

```yaml
Table:
  - name: orders
    beforeCreates:
      - content: |
          -- 阶段1：创建辅助表
          CREATE TABLE IF NOT EXISTS order_archive LIKE orders;

    afterCreates:
      - content: |
          -- 阶段2：创建触发器
          CREATE TRIGGER trg_orders_archive
          AFTER UPDATE ON orders
          FOR EACH ROW
          WHEN NEW.status = 'completed'
          BEGIN
            INSERT INTO order_archive VALUES (OLD.*;
          END;

      - content: |
          -- 阶段3：创建事件调度器（MySQL）
          CREATE EVENT evt_cleanup_old_orders
          ON SCHEDULE EVERY 1 DAY
          DO
            DELETE FROM orders
            WHERE status = 'completed'
              AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 条件执行

基于条件执行钩子：

```yaml
Table:
  - name: users
    afterCreates:
      - condition: "@root.environment == 'production'"
        content: |
          -- 仅在生产环境创建
          CREATE INDEX idx_users_created_at
          ON users(created_at);

      - condition: "@root.environment == 'development'"
        content: |
          -- 仅在开发环境创建
          CREATE INDEX idx_users_all
          ON users(username, email, status);
```

### 钩子链

多个钩子按顺序执行：

```yaml
Table:
  - name: products
    afterCreates:
      # 钩子1：创建基本索引
      - content: |
          CREATE INDEX idx_products_name
          ON products(name);

      # 钩子2：创建全文索引
      - dbms: [mysql]
        content: |
          CREATE FULLTEXT INDEX ft_products_search
          ON products(name, description);

      # 钩子3：创建统计表
      - content: |
          CREATE TABLE IF NOT EXISTS product_stats AS
          SELECT
            category_id,
            COUNT(*) AS product_count,
            AVG(price) AS avg_price
          FROM products
          GROUP BY category_id;
```

## 完整示例

### 电商系统生命周期钩子

```yaml
Table:
  # 用户表钩子
  - name: users
    comment: 用户表
    beforeCreates:
      - content: |
          -- 创建备份表
          CREATE TABLE IF NOT EXISTS users_backup LIKE users;

    afterCreates:
      # PostgreSQL 特定
      - dbms: [postgresql]
        content: |
          -- 创建更新时间戳函数
          CREATE OR REPLACE FUNCTION update_users_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          -- 创建触发器
          CREATE TRIGGER trg_users_update_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_users_updated_at();

          -- 创建并发索引
          CREATE INDEX CONCURRENTLY idx_users_email
          ON users(email);

          -- 创建部分索引
          CREATE INDEX idx_users_active
          ON users(created_at)
          WHERE status = 'active';

      # MySQL 特定
      - dbms: [mysql, mariadb]
        content: |
          -- 创建更新时间戳触发器
          CREATE TRIGGER trg_users_before_update
          BEFORE UPDATE ON users
          FOR EACH ROW
          SET NEW.updated_at = CURRENT_TIMESTAMP;

          -- 创建索引
          CREATE INDEX idx_users_email
          ON users(email);

          CREATE INDEX idx_users_status
          ON users(status);

      # 初始化管理员账户
      - content: |
          INSERT INTO users (username, email, password_hash, status)
          VALUES ('admin', 'admin@example.com', '$2a$10$...', 'active');

    beforeDrops:
      - content: |
          -- 删除前备份
          INSERT INTO users_backup
          SELECT * FROM users;

    afterDrops:
      - content: |
          -- 删除后清理
          DROP TABLE IF EXISTS users_backup;

  # 订单表钩子
  - name: orders
    comment: 订单表
    beforeCreates:
      - content: |
          -- 创建订单归档表
          CREATE TABLE IF NOT EXISTS order_archive (
            LIKE orders INCLUDING ALL
          );

    afterCreates:
      - dbms: [postgresql]
        content: |
          -- 创建归档触发器
          CREATE OR REPLACE FUNCTION archive_completed_orders()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
              INSERT INTO order_archive VALUES (NEW.*;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trg_orders_archive
          AFTER UPDATE ON orders
          FOR EACH ROW
          EXECUTE FUNCTION archive_completed_orders();

      # 创建订单号序列
      - dbms: [postgresql, oracle, h2]
        content: |
          CREATE SEQUENCE seq_order_no
          START WITH 1000
          INCREMENT BY 1;

      # 创建事件调度器（MySQL）
      - dbms: [mysql]
        content: |
          CREATE EVENT evt_cleanup_old_orders
          ON SCHEDULE EVERY 1 DAY
          DO
            DELETE FROM orders
            WHERE status = 'completed'
              AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

  # 商品表钩子
  - name: products
    comment: 商品表
    afterCreates:
      # MySQL 全文搜索
      - dbms: [mysql, mariadb]
        content: |
          CREATE FULLTEXT INDEX ft_products_search
          ON products(name, description);

      # 低库存警报触发器
      - dbms: [mysql, mariadb]
        content: |
          CREATE TRIGGER trg_products_low_stock
          AFTER UPDATE ON products
          FOR EACH ROW
          WHEN NEW.stock <= NEW.low_stock_threshold
            AND NEW.stock != OLD.stock
          BEGIN
            INSERT INTO low_stock_alerts (product_id, stock_level, alerted_at)
            VALUES (NEW.id, NEW.stock, NOW());
          END;

      # PostgreSQL 全文搜索
      - dbms: [postgresql]
        content: |
          -- 添加全文搜索列
          ALTER TABLE products ADD COLUMN search_vector tsvector;

          -- 创建更新触发器
          CREATE OR REPLACE FUNCTION products_search_vector_update()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.search_vector :=
              setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
              setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trg_products_search_vector_update
          BEFORE INSERT OR UPDATE ON products
          FOR EACH ROW
          EXECUTE FUNCTION products_search_vector_update();

          -- 创建全文索引
          CREATE INDEX idx_products_search
          ON products USING gin(search_vector);

  # 文章表钩子
  - name: articles
    comment: 文章表
    afterCreates:
      # 创建视图计数更新触发器
      - dbms: [mysql, mariadb]
        content: |
          CREATE TRIGGER trg_articles_view_count
          AFTER INSERT ON article_views
          FOR EACH ROW
          BEGIN
            UPDATE articles
            SET view_count = view_count + 1
            WHERE id = NEW.article_id;
          END;

      # 创建发布通知
      - dbms: [postgresql]
        content: |
          CREATE OR REPLACE FUNCTION notify_article_published()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.status = 'published' AND OLD.status != 'published' THEN
              PERFORM pg_notify(
                'article_published',
                json_build_object(
                  'article_id', NEW.id,
                  'title', NEW.title,
                  'author_id', NEW.author_id
                )::text
              );
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trg_articles_notify_published
          AFTER UPDATE ON articles
          FOR EACH ROW
          EXECUTE FUNCTION notify_article_published();
```

## 最佳实践

### 1. 钩子命名规范

```yaml
# 触发器命名
Trigger:
  - name: trg_{table}_{timing}_{event}  # 标准触发器
  - name: trg_{table}_{purpose}         # 功能触发器

# 示例
Trigger:
  - name: trg_users_before_insert
  - name: trg_orders_archive_completed
```

### 2. 保持钩子简单

```yaml
# 好的设计：简单的钩子
afterCreates:
  - content: |
      CREATE INDEX idx_users_email ON users(email);

# 避免：过于复杂的钩子
# 应该拆分为多个简单的钩子或在应用层实现
```

### 3. 使用条件执行

```yaml
# 避免在错误的数据库上执行
afterCreates:
  - dbms: [postgresql]
    content: |
      -- PostgreSQL 特定语法
      CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

### 4. 错误处理

```yaml
# 使用异常处理
afterCreates:
  - content: |
      BEGIN
        -- 可能失败的语句
        CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
      EXCEPTION WHEN OTHERS THEN
        -- 处理错误
        NULL;
      END;
```

### 5. 文档化钩子

```yaml
Table:
  - name: orders
    afterCreates:
      - comment: |
          创建订单归档触发器：
          - 自动将已完成的订单归档到 order_archive 表
          - 仅在状态从非完成变为完成时触发
      - content: |
          CREATE TRIGGER trg_orders_archive ...
```

## 常见问题

### 钩子执行顺序是什么？

钩子按以下顺序执行：
1. beforeCreates → 主操作 → afterCreates
2. beforeDrops → 主操作 → afterDrops
3. beforeAlters → 主操作 → afterAlters
4. beforeAdds → 主操作 → afterAdds

同一类型的多个钩子按定义顺序执行。

### 如何调试钩子？

使用日志表记录钩子执行：

```yaml
Table:
  - name: users
    afterCreates:
      - content: |
          INSERT INTO hook_execution_log (hook_name, executed_at)
          VALUES ('afterCreates_users', NOW());
```

### 钩子失败会怎样？

钩子执行失败会回滚整个操作。确保钩子的幂等性和错误处理。

### 如何禁用钩子？

使用条件或注释掉钩子定义：

```yaml
afterCreates:
  - condition: "@root.enableHooks == true"
    content: |
      CREATE INDEX idx_users_email ON users(email);
```

## 相关文档

- [表定义](./table.md)
- [列定义](./column.md)
- [触发器定义](./trigger.md)
- [存储过程定义](./procedure.md)

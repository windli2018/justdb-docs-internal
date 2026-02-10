---
title: AI Schema 生成
icon: 🎨
description: 使用 AI 从业务描述自动生成数据库 Schema
order: 3
---

# AI Schema 生成

JustDB AI 可以从业务需求描述自动生成完整的数据库 Schema，包括表结构、字段类型、约束、索引和关系定义。

## 从描述生成 Schema

### 基础用法

```java
import ai.justdb.justdb.ai.AiSchemaManager;
import ai.justdb.justdb.cli.config.AiConfig;
import ai.justdb.justdb.schema.Justdb;

// 创建 AI Schema 管理器
AiSchemaManager aiManager = new AiSchemaManager();

// 配置 AI 提供商
AiConfig config = new AiConfig("my-ai", "openai");
config.setApiKey("sk-xxx...");
config.setModel("gpt-3.5-turbo");
aiManager.initialize(config);

// 从描述生成 Schema
String description = """
    Create a blog database with the following requirements:
    - Users can register with username, email, and password
    - Users can write posts with title, content, and publish date
    - Other users can comment on posts
    - Posts can have tags for categorization
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);
```

### 增量式生成

```java
// 先创建基础 Schema
Justdb baseSchema = aiManager.processNaturalLanguageRequest(
    "Create a users table with id, username, and email",
    null
);

// 基于现有 Schema 添加新表
Justdb expanded = aiManager.processNaturalLanguageRequest(
    "Add posts table with foreign key to users",
    baseSchema
);

// 继续扩展
expanded = aiManager.processNaturalLanguageRequest(
    "Add comments table that references both users and posts",
    expanded
);
```

## 智能类型推断

AI 会根据字段名称和业务上下文自动推断数据类型：

### 字段命名规范

| 字段名模式 | 推断类型 | 说明 |
|-----------|----------|------|
| `id`, `*_id` | BIGINT | 主键或外键 |
| `*_count`, `*_amount` | INT | 数量或金额 |
| `email` | VARCHAR(255) | 电子邮件 |
| `phone`, `mobile` | VARCHAR(20) | 电话号码 |
| `password`, `hash` | VARCHAR(255) | 密码哈希 |
| `url`, `link` | VARCHAR(512) | URL 链接 |
| `title`, `name`, `subject` | VARCHAR(255) | 短文本 |
| `content`, `body`, `description` | TEXT | 长文本 |
| `*_date`, `*_at` | TIMESTAMP | 日期时间 |
| `*_time` | TIME | 时间 |
| `is_*`, `has_*`, `can_*` | BOOLEAN | 布尔值 |
| `status`, `state` | VARCHAR(50) | 状态 |
| `price`, `cost` | DECIMAL(10,2) | 金额 |

### 示例

```java
// AI 会自动推断类型
String description = """
    Create an orders table with:
    - id (primary key)
    - user_id (foreign key to users)
    - order_date
    - total_amount
    - status (pending, paid, shipped, cancelled)
    - shipping_address
    - is_paid
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// 生成的类型：
// - id: BIGINT (PRIMARY KEY, AUTO_INCREMENT)
// - user_id: BIGINT (NOT NULL)
// - order_date: TIMESTAMP
// - total_amount: DECIMAL(10,2)
// - status: VARCHAR(50)
// - shipping_address: TEXT
// - is_paid: BOOLEAN (DEFAULT false)
```

## 关系推断

AI 会根据表名和字段名自动推断表之间的关系：

### 一对多关系

```java
String description = """
    Create users and posts tables where:
    - Each user can have multiple posts
    - Each post belongs to one user
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI 自动生成：
// posts.user_id 外键引用 users.id
```

### 多对多关系

```java
String description = """
    Create posts and tags tables with many-to-many relationship:
    - Each post can have multiple tags
    - Each tag can be on multiple posts
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI 自动生成：
// - posts_tags 关联表
// - post_id 外键引用 posts.id
// - tag_id 外键引用 tags.id
// - 联合唯一约束 (post_id, tag_id)
```

### 自引用关系

```java
String description = """
    Create an employees table with:
    - Each employee has a manager who is also an employee
    - Manager is optional
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI 自动生成：
// - manager_id 外键引用 employees.id (可为 NULL)
```

## 高级功能

### 1. 约束生成

AI 会根据业务描述自动添加适当的约束：

```java
String description = """
    Create a users table with:
    - Unique username and email
    - Password is required
    - Email format validation
    - Status can only be 'active' or 'inactive'
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// 生成的约束：
// - UNIQUE(username)
// - UNIQUE(email)
// - NOT NULL(password)
// - CHECK status IN ('active', 'inactive')
```

### 2. 索引建议

AI 会根据查询模式自动建议索引：

```java
String description = """
    Create an orders table that will be frequently queried by:
    - user_id
    - order_date
    - status
    - Combination of user_id and status
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// 生成的索引：
// - INDEX idx_user_id (user_id)
// - INDEX idx_order_date (order_date)
// - INDEX idx_status (status)
// - INDEX idx_user_status (user_id, status)
```

### 3. 规范化设计

AI 会遵循数据库规范化原则：

```java
String description = """
    Design an e-commerce database for:
    - Products with categories
    - Customers with orders
    - Orders with order items
    - Inventory tracking
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI 自动应用 3NF：
// - 分离产品和类别到不同表
// - 创建订单和订单项的分离
// - 避免数据冗余
```

## 代码示例

### 完整示例：博客系统

```java
import ai.justdb.justdb.ai.AiSchemaManager;
import ai.justdb.justdb.cli.config.AiConfig;
import ai.justdb.justdb.schema.Justdb;
import ai.justdb.justdb.schema.Table;
import ai.justdb.justdb.schema.Column;

public class BlogSchemaGenerator {

    public static void main(String[] args) {
        // 初始化 AI Schema 管理器
        AiSchemaManager aiManager = new AiSchemaManager();
        AiConfig config = new AiConfig("blog-ai", "openai");
        config.setApiKey(System.getenv("OPENAI_API_KEY"));
        config.setModel("gpt-3.5-turbo");
        config.setTemperature(0.2);
        aiManager.initialize(config);

        // 博客系统需求描述
        String blogRequirements = """
            Design a blog database with the following features:

            1. User Management
               - Users can register with username, email, and password
               - Email must be unique
               - User profile with display name and bio
               - User roles: admin, author, reader

            2. Content Management
               - Posts have title, content, excerpt, and featured image
               - Posts can be draft, published, or archived
               - Each post has one author
               - Posts support tags and categories
               - Posts can have many comments

            3. Comments
               - Comments belong to a post and a user
               - Comments have parent-child threading
               - Comments can be approved or pending

            4. Tags and Categories
               - Posts can have multiple tags
               - Posts belong to one category
               - Tags and categories have slugs for URLs

            5. Analytics
               - Track post views
               - Track comment counts
               - Store publication dates and update dates
        """;

        // 生成 Schema
        Justdb blogSchema = aiManager.processNaturalLanguageRequest(
            blogRequirements,
            null
        );

        // 分析生成的 Schema
        System.out.println("=== Generated Blog Schema ===");
        System.out.println("Tables: " + blogSchema.getTables().size());

        for (Table table : blogSchema.getTables()) {
            System.out.println("\nTable: " + table.getId());
            System.out.println("  Columns:");
            for (Column column : table.getColumns()) {
                System.out.printf("    - %s: %s %s%n",
                    column.getId(),
                    column.getType(),
                    column.getPrimaryKey() ? "(PK)" : ""
                );
            }
        }

        // 使用 SchemaAnalyzer 进行分析
        String analysis = ai.justdb.justdb.ai.SchemaAnalyzer.analyzeSchema(blogSchema);
        System.out.println("\n=== Schema Analysis ===");
        System.out.println(analysis);
    }
}
```

### 电商系统示例

```java
String ecommerceRequirements = """
    Design an e-commerce database schema:

    Products and Inventory:
    - Products with SKU, name, description, price
    - Products belong to categories
    - Products have multiple images
    - Track stock quantity
    - Product variants (size, color)

    Customers:
    - Customer accounts with email and password
    - Shipping addresses and billing addresses
    - Customer profile and preferences

    Orders:
    - Orders contain multiple products
    - Track order status (pending, confirmed, shipped, delivered)
    - Order items with quantity and unit price
    - Track order totals and discounts

    Payments:
    - Payment transactions
    - Support multiple payment methods
    - Track payment status

    Shipping:
    - Shipping methods and costs
    - Track shipment information
    - Delivery status tracking
""";

Justdb ecommerceSchema = aiManager.processNaturalLanguageRequest(
    ecommerceRequirements,
    null
);
```

## Schema 验证和优化

### 使用 SchemaAnalyzer

```java
import ai.justdb.justdb.ai.SchemaAnalyzer;

// 分析 Schema
String analysis = SchemaAnalyzer.analyzeSchema(schema);
System.out.println(analysis);

// 诊断问题
String diagnosis = SchemaAnalyzer.diagnoseSchema(schema);

// 优化建议
Justdb optimized = SchemaAnalyzer.optimizeSchema(schema);
```

### 输出示例

```
=== AI Schema Analysis Report ===

1. Basic Statistics:
   - Number of tables: 5
   - Total columns: 32
   - Total indexes: 8
   - Total constraints: 12

2. Performance Optimization Suggestions:
   - Table 'posts' has a large expected record count, suggestions:
     * Consider adding appropriate indexes to improve query performance
     * Consider using partitioning strategy to manage large data volumes

3. Potential Issue Detection:
   - Table 'comments' is missing index on post_id for foreign key
   - Column 'password' in table 'users' should use VARCHAR(255) minimum

4. Database Compatibility Analysis:
   - All data types are compatible with most databases
   - Consider using TEXT instead of VARCHAR for large content fields
```

## 最佳实践

### 1. 提供清晰的描述

```java
// 好的描述 - 具体、明确
String good = """
    Create a task management system with:
    - Projects with name, description, and owner
    - Tasks within projects with title, status, priority
    - Tasks can be assigned to users
    - Track task completion dates
""";

// 不好的描述 - 模糊、不明确
String bad = "Create a task system";
```

### 2. 指定关键约束

```java
String withConstraints = """
    Create an orders table with:
    - id as primary key (auto increment)
    - user_id foreign key (not null)
    - total_amount decimal with 2 decimal places
    - status enum: pending, paid, cancelled
    - created_at timestamp with default now()
""";
```

### 3. 说明查询模式

```java
String withQueryPatterns = """
    Create an articles table that will be:
    - Frequently searched by title
    - Filtered by publication date
    - Sorted by view count
    - Joined with authors table
""";
```

### 4. 增量式开发

```java
// 从简单开始，逐步增加复杂度
Justdb v1 = aiManager.processNaturalLanguageRequest(
    "Create a simple users table with id, name, email",
    null
);

Justdb v2 = aiManager.processNaturalLanguageRequest(
    "Add password hash and created_at to users",
    v1
);

Justdb v3 = aiManager.processNaturalLanguageRequest(
    "Add unique constraint on email and index on name",
    v2
);
```

## 相关文档

- [AI 集成概述](./README.md) - AI 功能总览
- [自然语言操作](./natural-language.md) - 自然语言 Schema 操作
- [AI 迁移助手](./ai-migration-assistant.md) - 智能迁移建议

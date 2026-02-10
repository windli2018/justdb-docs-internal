---
title: AI Schema Generation
icon: 🎨
description: Use AI to automatically generate database Schema from business descriptions
order: 3
---

# AI Schema Generation

JustDB AI can automatically generate complete database Schema from business requirement descriptions, including table structures, field types, constraints, indexes, and relationship definitions.

## Generate Schema from Descriptions

### Basic Usage

```java
import org.verydb.justdb.ai.AiSchemaManager;
import org.verydb.justdb.cli.config.AiConfig;
import org.verydb.justdb.schema.Justdb;

// Create AI Schema manager
AiSchemaManager aiManager = new AiSchemaManager();

// Configure AI provider
AiConfig config = new AiConfig("my-ai", "openai");
config.setApiKey("sk-xxx...");
config.setModel("gpt-3.5-turbo");
aiManager.initialize(config);

// Generate Schema from description
String description = """
    Create a blog database with the following requirements:
    - Users can register with username, email, and password
    - Users can write posts with title, content, and publish date
    - Other users can comment on posts
    - Posts can have tags for categorization
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);
```

### Incremental Generation

```java
// First create base Schema
Justdb baseSchema = aiManager.processNaturalLanguageRequest(
    "Create a users table with id, username, and email",
    null
);

// Add new tables based on existing Schema
Justdb expanded = aiManager.processNaturalLanguageRequest(
    "Add posts table with foreign key to users",
    baseSchema
);

// Continue expanding
expanded = aiManager.processNaturalLanguageRequest(
    "Add comments table that references both users and posts",
    expanded
);
```

## Intelligent Type Inference

AI automatically infers data types based on field names and business context:

### Field Naming Conventions

| Field Name Pattern | Inferred Type | Description |
|-------------------|---------------|-------------|
| `id`, `*_id` | BIGINT | Primary key or foreign key |
| `*_count`, `*_amount` | INT | Count or amount |
| `email` | VARCHAR(255) | Email address |
| `phone`, `mobile` | VARCHAR(20) | Phone number |
| `password`, `hash` | VARCHAR(255) | Password hash |
| `url`, `link` | VARCHAR(512) | URL link |
| `title`, `name`, `subject` | VARCHAR(255) | Short text |
| `content`, `body`, `description` | TEXT | Long text |
| `*_date`, `*_at` | TIMESTAMP | Date time |
| `*_time` | TIME | Time |
| `is_*`, `has_*`, `can_*` | BOOLEAN | Boolean value |
| `status`, `state` | VARCHAR(50) | Status |
| `price`, `cost` | DECIMAL(10,2) | Amount |

### Example

```java
// AI automatically infers types
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

// Generated types:
// - id: BIGINT (PRIMARY KEY, AUTO_INCREMENT)
// - user_id: BIGINT (NOT NULL)
// - order_date: TIMESTAMP
// - total_amount: DECIMAL(10,2)
// - status: VARCHAR(50)
// - shipping_address: TEXT
// - is_paid: BOOLEAN (DEFAULT false)
```

## Relationship Inference

AI automatically infers relationships between tables based on table names and field names:

### One-to-Many Relationship

```java
String description = """
    Create users and posts tables where:
    - Each user can have multiple posts
    - Each post belongs to one user
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI automatically generates:
// posts.user_id foreign key references users.id
```

### Many-to-Many Relationship

```java
String description = """
    Create posts and tags tables with many-to-many relationship:
    - Each post can have multiple tags
    - Each tag can be on multiple posts
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI automatically generates:
// - posts_tags association table
// - post_id foreign key references posts.id
// - tag_id foreign key references tags.id
// - Composite unique constraint (post_id, tag_id)
```

### Self-Referencing Relationship

```java
String description = """
    Create an employees table with:
    - Each employee has a manager who is also an employee
    - Manager is optional
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI automatically generates:
// - manager_id foreign key references employees.id (can be NULL)
```

## Advanced Features

### 1. Constraint Generation

AI automatically adds appropriate constraints based on business descriptions:

```java
String description = """
    Create a users table with:
    - Unique username and email
    - Password is required
    - Email format validation
    - Status can only be 'active' or 'inactive'
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// Generated constraints:
// - UNIQUE(username)
// - UNIQUE(email)
// - NOT NULL(password)
// - CHECK status IN ('active', 'inactive')
```

### 2. Index Recommendations

AI automatically recommends indexes based on query patterns:

```java
String description = """
    Create an orders table that will be frequently queried by:
    - user_id
    - order_date
    - status
    - Combination of user_id and status
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// Generated indexes:
// - INDEX idx_user_id (user_id)
// - INDEX idx_order_date (order_date)
// - INDEX idx_status (status)
// - INDEX idx_user_status (user_id, status)
```

### 3. Normalization Design

AI follows database normalization principles:

```java
String description = """
    Design an e-commerce database for:
    - Products with categories
    - Customers with orders
    - Orders with order items
    - Inventory tracking
""";

Justdb schema = aiManager.processNaturalLanguageRequest(description, null);

// AI automatically applies 3NF:
// - Separate products and categories into different tables
// - Create separation of orders and order items
// - Avoid data redundancy
```

## Code Examples

### Complete Example: Blog System

```java
import org.verydb.justdb.ai.AiSchemaManager;
import org.verydb.justdb.cli.config.AiConfig;
import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.schema.Table;
import org.verydb.justdb.schema.Column;

public class BlogSchemaGenerator {

    public static void main(String[] args) {
        // Initialize AI Schema manager
        AiSchemaManager aiManager = new AiSchemaManager();
        AiConfig config = new AiConfig("blog-ai", "openai");
        config.setApiKey(System.getenv("OPENAI_API_KEY"));
        config.setModel("gpt-3.5-turbo");
        config.setTemperature(0.2);
        aiManager.initialize(config);

        // Blog system requirements description
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

        // Generate Schema
        Justdb blogSchema = aiManager.processNaturalLanguageRequest(
            blogRequirements,
            null
        );

        // Analyze generated Schema
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

        // Use SchemaAnalyzer for analysis
        String analysis = org.verydb.justdb.ai.SchemaAnalyzer.analyzeSchema(blogSchema);
        System.out.println("\n=== Schema Analysis ===");
        System.out.println(analysis);
    }
}
```

### E-commerce System Example

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

## Schema Validation and Optimization

### Using SchemaAnalyzer

```java
import org.verydb.justdb.ai.SchemaAnalyzer;

// Analyze Schema
String analysis = SchemaAnalyzer.analyzeSchema(schema);
System.out.println(analysis);

// Diagnose issues
String diagnosis = SchemaAnalyzer.diagnoseSchema(schema);

// Optimization recommendations
Justdb optimized = SchemaAnalyzer.optimizeSchema(schema);
```

### Output Example

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

## Best Practices

### 1. Provide Clear Descriptions

```java
// Good description - specific, clear
String good = """
    Create a task management system with:
    - Projects with name, description, and owner
    - Tasks within projects with title, status, priority
    - Tasks can be assigned to users
    - Track task completion dates
""";

// Bad description - vague, unclear
String bad = "Create a task system";
```

### 2. Specify Key Constraints

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

### 3. Describe Query Patterns

```java
String withQueryPatterns = """
    Create an articles table that will be:
    - Frequently searched by title
    - Filtered by publication date
    - Sorted by view count
    - Joined with authors table
""";
```

### 4. Incremental Development

```java
// Start simple, gradually increase complexity
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

## Related Documentation

- [AI Integration Overview](./README.md) - AI feature overview
- [Natural Language Operations](./natural-language.md) - Natural language Schema operations
- [AI Migration Assistant](./ai-migration-assistant.md) - Intelligent migration recommendations

---
icon: robot
title: AI Features Overview
order: 40
category:
  - Reference
  - AI
tag:
  - ai
  - features
---

# AI Features Overview

JustDB integrates advanced AI capabilities to help you create and manage database schemas using natural language.

## AI Capabilities

### Natural Language Schema Generation

Generate database schemas directly from natural language descriptions.

```bash
# CLI usage
justdb ai "create a user table with id, username, email, and created_at"

# Interactive mode
justdb
> /ai create an orders table with order details
```

### Intelligent Migration Planning

AI analyzes schema changes and generates safe migration plans.

```bash
# Let AI plan your migration
justdb ai "add phone column to users table"
```

### Schema Optimization

AI suggests optimizations for your schema design.

```bash
justdb ai "optimize my schema for performance"
```

### Natural Language Queries

Query your schema structure using natural language.

```bash
justdb ai "show me all tables with foreign keys to users"
```

## Supported AI Providers

### OpenAI

- **Models**: GPT-4, GPT-3.5-turbo
- **Features**: Full schema generation, optimization, analysis

### Alibaba Qwen

- **Models**: Qwen-Max, Qwen-Plus
- **Features**: Chinese language optimization

### Baidu Ernie

- **Models**: ERNIE-Bot
- **Features**: Chinese language support

### Local LLMs

- **Models**: Llama, Mistral, etc.
- **Features**: Privacy, offline usage

## Configuration

### OpenAI Configuration

```yaml
# justdb.yaml
ai:
  provider: openai
  apiKey: ${OPENAI_API_KEY}
  model: gpt-4
  temperature: 0.7
  maxTokens: 2000
```

### Qwen Configuration

```yaml
# justdb.yaml
ai:
  provider: qwen
  apiKey: ${QWEN_API_KEY}
  model: qwen-max
  endpoint: https://dashscope.aliyuncs.com/api/v1
```

### Local LLM Configuration

```yaml
# justdb.yaml
ai:
  provider: local
  endpoint: http://localhost:11434/api/generate
  model: llama2
```

## Usage Patterns

### 1. Schema Creation

```bash
# Create complete schema
justdb ai "Create a blog database with users, posts, and comments"

# Create specific table
justdb ai "Add a products table with inventory tracking"
```

### 2. Schema Evolution

```bash
# Add column
justdb ai "Add status column to orders table"

# Rename table
justdb ai "Rename user table to users"

# Add relationship
justdb ai "Add foreign key from orders to users"
```

### 3. Schema Analysis

```bash
# Analyze schema
justdb ai "Analyze my schema for potential issues"

# Get suggestions
justdb ai "Suggest improvements for my schema"
```

### 4. Interactive Mode

```bash
justdb

# In interactive mode
> /ai create a customer management database
> /ai Add orders table
> /migrate
```

## AI Features by Provider

| Feature | OpenAI | Qwen | Ernie | Local |
|---------|--------|------|-------|-------|
| Schema Generation | ✓✓✓ | ✓✓ | ✓✓ | ✓✓ |
| Migration Planning | ✓✓✓ | ✓✓ | ✓✓ | ✓ |
| Optimization | ✓✓✓ | ✓✓ | ✓ | ✓ |
| Chinese Language | ✓ | ✓✓✓ | ✓✓✓ | ✓ |
| Privacy | ✓ | ✓ | ✓ | ✓✓✓ |
| Offline Mode | ✗ | ✗ | ✗ | ✓✓✓ |

## Best Practices

### 1. Be Specific

```bash
# Good: Specific requirements
justdb ai "Create a users table with id (BIGINT PK), username (VARCHAR 50), email (VARCHAR 100 UNIQUE), created_at (TIMESTAMP)"

# Less effective: Vague
justdb ai "Create a user table"
```

### 2. Use Context

```bash
# Provide context
justdb ai "Add a payment method column to users table. The system is for e-commerce, needs to support credit cards and PayPal."
```

### 3. Iterate

```bash
# Start simple
justdb ai "Create an orders table"

# Add details
justdb ai "Add order status tracking"

# Refine
justdb ai "Add order history audit trail"
```

### 4. Validate

```bash
# Always validate AI-generated schemas
justdb ai "Create a users table"
justdb validate schema.yaml
```

## Example Workflows

### E-commerce Database

```bash
# Step 1: Create core tables
justdb ai "Create e-commerce database with users, products, and orders"

# Step 2: Add relationships
justdb ai "Add foreign keys from orders to users and products"

# Step 3: Add details
justdb ai "Add order_items table for order line items"

# Step 4: Optimize
justdb ai "Add indexes for common queries"

# Step 5: Deploy
justdb migrate
```

### Blog Platform

```bash
# Interactive session
justdb
> /ai Create blog database with users, posts, and comments
> /ai Add categories and tags for posts
> /ai Add post likes and favorites
> /validate
> /migrate
```

## Limitations

### AI Limitations

- May generate invalid SQL for complex scenarios
- Limited understanding of existing schema context
- May not follow all best practices

### Mitigation

1. **Always validate** AI-generated schemas
2. **Review migrations** before applying
3. **Use dry-run** to preview changes
4. **Iterate** on AI suggestions

## Troubleshooting

### API Key Issues

```bash
# Check API key
justdb config show ai.apiKey

# Set API key
justdb config set ai.apiKey your-key-here
```

### Model Issues

```bash
# Test AI connection
justdb ai test

# Switch model
justdb config set ai.model gpt-3.5-turbo
```

## Related Documentation

- [Natural Language Schema](./natural-language.md) - Schema creation with natural language *(Coming soon)*
- [AI Migration Planning](./migration-planning.md) - AI-assisted migration *(Coming soon)*
- [AI Configuration](./configuration.md) - Provider configuration *(Coming soon)*
- [AI Best Practices](./best-practices.md) - Tips for effective AI usage *(Coming soon)*

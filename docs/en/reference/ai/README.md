---
icon: robot
title: AI Integration
order: 6
---

# AI Integration Reference

JustDB AI features for natural language schema generation and migration assistance.

## Overview

JustDB integrates with multiple AI providers to enable:

- Natural language to schema conversion
- Intelligent migration planning
- SQL query generation
- Schema optimization suggestions

## Supported AI Providers

### OpenAI

- Models: GPT-4, GPT-3.5
- Requires: API key
- Configuration:

```yaml
ai:
  provider: openai
  apiKey: ${OPENAI_API_KEY}
  model: gpt-4
  maxTokens: 2000
```

### Alibaba Qwen (通义千问)

- Models: qwen-turbo, qwen-plus, qwen-max
- Requires: API key
- Configuration:

```yaml
ai:
  provider: qwen
  apiKey: ${QWEN_API_KEY}
  model: qwen-plus
  endpoint: https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
```

### Baidu Ernie (文心一言)

- Models: ernie-bot, ernie-bot-turbo
- Requires: API key and secret key
- Configuration:

```yaml
ai:
  provider: ernie
  apiKey: ${ERNIE_API_KEY}
  secretKey: ${ERNIE_SECRET_KEY}
  model: ernie-bot
```

### Local LLMs

- Models: llama2, codellama, mistral
- Requires: Local LLM server
- Configuration:

```yaml
ai:
  provider: local
  endpoint: http://localhost:11434/api/generate
  model: llama2
```

## CLI AI Commands

### Interactive AI Mode

```bash
justdb ai
```

Enter natural language prompts:

```
> Create a table for user accounts with id, username, email, and created_at
> Add a unique index on email
> Generate SQL for PostgreSQL
```

### Direct AI Prompts

```bash
# Generate schema
justdb ai "Create a users table with id, username, email, and password"

# Migration planning
justdb ai "Plan migration to add phone column to users table"

# SQL generation
justdb ai "Generate SELECT query for users table with email filter"
```

### AI Configuration

```yaml
# justdb-config.yaml
ai:
  enabled: true
  provider: openai
  apiKey: sk-...
  model: gpt-4
  temperature: 0.7
  maxTokens: 2000
```

## Java API

### AISchemaGenerator

Generate schemas from natural language:

```java
import org.verydb.justdb.ai.AISchemaGenerator;
import org.verydb.justdb.ai.OpenAIProvider;

AISchemaGenerator generator = new AISchemaGenerator(
    new OpenAIProvider("sk-...")
);

String prompt = "Create a users table with id, username, and email";
Justdb schema = generator.generate(prompt);
```

### AIMigrationPlanner

Plan migrations with AI assistance:

```java
import org.verydb.justdb.ai.AIMigrationPlanner;

AIMigrationPlanner planner = new AIMigrationPlanner(aiProvider);

Justdb currentSchema = ...;
Justdb targetSchema = ...;

MigrationPlan plan = planner.planMigration(currentSchema, targetSchema);

System.out.println(plan.getDescription());
System.out.println(plan.getSteps());
```

### AIOptimizer

Optimize schemas with AI:

```java
import org.verydb.justdb.ai.AIOptimizer;

AIOptimizer optimizer = new AIOptimizer(aiProvider);

SchemaOptimization suggestions = optimizer.optimize(schema);

for (Suggestion s : suggestions.getSuggestions()) {
    System.out.println(s.getDescription());
    System.out.println(s.getSQL());
}
```

## Prompt Templates

### Schema Generation

```java
String prompt = """
Generate a JustDB schema for {entity} with the following requirements:
- Primary key: {primaryKey}
- Columns: {columns}
- Indexes: {indexes}
- Constraints: {constraints}

Output in YAML format.
""";
```

### Migration Planning

```java
String prompt = """
Plan a migration from:
Current schema: {currentSchema}
Target schema: {targetSchema}

Consider:
- Data preservation
- Downtime minimization
- Rollback strategy
- Testing requirements

Provide step-by-step migration plan.
""";
```

## Configuration Examples

### OpenAI Configuration

```yaml
ai:
  provider: openai
  apiKey: ${OPENAI_API_KEY}
  organization: org-...
  model: gpt-4
  temperature: 0.7
  maxTokens: 2000
  timeout: 30000
```

### Qwen Configuration

```yaml
ai:
  provider: qwen
  apiKey: ${QWEN_API_KEY}
  model: qwen-plus
  endpoint: https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
  temperature: 0.7
  topP: 0.8
```

### Local LLM Configuration

```yaml
ai:
  provider: local
  endpoint: http://localhost:11434/api/generate
  model: codellama:instruct
  temperature: 0.5
  numCtx: 4096
```

## Best Practices

### 1. Clear Prompts

```java
// Good: Specific requirements
String prompt = """
Create a users table with:
- BIGINT primary key id with auto-increment
- VARCHAR(50) username, NOT NULL, unique
- VARCHAR(255) email, NOT NULL
- TIMESTAMP created_at, default CURRENT_TIMESTAMP
Include indexes for username and email.
""";

// Bad: Vague
String prompt = "Make a users table";
```

### 2. Specify Database

```java
String prompt = """
Generate schema for PostgreSQL database.
Create orders table with id, user_id, amount, and status.
Include foreign key to users table.
""";
```

### 3. Request Explanations

```java
String prompt = """
Generate a users table schema.
Explain each choice of data type and constraint.
Provide recommendations for indexing.
""";
```

### 4. Validation

```java
// Always validate AI-generated schemas
SchemaValidator validator = new SchemaValidator();
Justdb schema = generator.generate(prompt);
ValidationResult result = validator.validate(schema);

if (!result.isValid()) {
    // Fix or regenerate
}
```

## Error Handling

```java
try {
    Justdb schema = generator.generate(prompt);
} catch (AIProviderException e) {
    // API key error
    logger.error("API key invalid: " + e.getMessage());
} catch (AIRateLimitException e) {
    // Rate limit exceeded
    logger.warn("Rate limit exceeded, retrying...");
    // Retry after delay
} catch (AIParseException e) {
    // Could not parse AI response
    logger.error("Failed to parse AI response: " + e.getMessage());
}
```

## Examples

### Generate Complete Schema

```java
String prompt = """
Generate a complete e-commerce schema with:
- users table (id, username, email, created_at)
- products table (id, name, price, stock)
- orders table (id, user_id, total, status, created_at)
- order_items table (order_id, product_id, quantity, price)

Include all foreign keys and indexes.
Use MySQL dialect.
""";

Justdb schema = generator.generate(prompt);
FormatFactory.saveToFile(schema, "ecommerce.yaml");
```

### Migration Planning

```java
String prompt = """
I need to add a phone column to the users table.
Current table has 1 million rows.
Plan a safe migration with minimal downtime.
Consider rollback strategy.
""";

MigrationPlan plan = planner.planMigration(prompt);
System.out.println(plan.getSteps());
```

### SQL Generation

```java
String prompt = """
Generate SQL query to find all users who:
- Registered in the last 7 days
- Have not verified their email
Order by registration date DESC
Use MySQL syntax.
""";

String sql = sqlGenerator.generate(prompt);
```

## Next Steps

- **[Quick Start](/getting-started/)** - Get started quickly
- **[CLI Reference](/reference/cli/)** - AI commands
- **[API Reference](/reference/api/)** - Java API

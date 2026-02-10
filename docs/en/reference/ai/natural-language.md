---
title: Natural Language Operations
icon: 💬
description: Use natural language for database Schema operations
order: 2
---

# Natural Language Operations

JustDB AI supports using natural language for database Schema operations, eliminating the need to write SQL or configuration files, completing Schema design and modification through conversational interaction.

## Supported Command Types

### 1. Table Operations

#### Create Tables
```
create a users table
add a new table called customers
create a posts table with id, title, and content
```

#### Rename Tables
```
rename users to customers
rename the orders table to purchase_orders
```

#### Drop Tables
```
drop the temp_table
delete the users_backup table
```

### 2. Column Operations

#### Add Columns
```
add an email column to the users table
add a status column of type VARCHAR(50) to orders
add created_at and updated_at timestamps to posts
```

#### Modify Columns
```
change the type of username column to VARCHAR(100)
modify the status column to be NOT NULL
```

#### Drop Columns
```
remove the temp_column from users
drop the old_email column from customers
```

### 3. Constraint Operations

#### Add Primary Key
```
add a primary key on id column
set id as primary key for users table
```

#### Add Foreign Key
```
add a foreign key from orders.user_id to users.id
create a foreign key constraint on posts referencing users
```

#### Add Unique Constraint
```
add a unique constraint on email column
make username unique in users table
```

### 4. Index Operations

```
create an index on email column
add a composite index on (user_id, created_at)
create index idx_username on username
```

## Configure AI Provider

### YAML Configuration File

Configure in `justdb-config.yaml`:

```yaml
ai:
  enabled: true
  name: my-ai
  type: openai  # openai, qwen, erniebot, local
  apiKey: ${OPENAI_API_KEY}
  baseUrl: https://api.openai.com/v1
  model: gpt-3.5-turbo
  temperature: 0.2
  maxTokens: 2000
```

### Configuration for Different Providers

#### OpenAI
```yaml
ai:
  type: openai
  apiKey: sk-xxx...
  model: gpt-3.5-turbo
  baseUrl: https://api.openai.com/v1
```

#### Alibaba Cloud Qwen
```yaml
ai:
  type: qwen
  apiKey: sk-xxx...
  model: qwen2.5-coder:3b
  baseUrl: https://dashscope.aliyuncs.com/compatible-mode/v1
```

#### Baidu ERNIE Bot
```yaml
ai:
  type: erniebot
  apiKey: sk-xxx...
  model: ernie-bot-4.5
  baseUrl: https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat
```

#### Local Ollama
```yaml
ai:
  type: local
  baseUrl: http://localhost:11434
  model: qwen2.5-coder:1.5b
```

## Code Examples

### 1. Basic Usage

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
config.setTemperature(0.2);
config.setMaxTokens(2000);

// Initialize
aiManager.initialize(config);

// Use natural language to create Schema
String request = "Create a blog database with users, posts, and comments tables";
Justdb schema = aiManager.processNaturalLanguageRequest(request, null);

// Output result
System.out.println("Generated schema with " + schema.getTables().size() + " tables");
```

### 2. Incremental Modifications

```java
// Make modifications based on existing Schema
Justdb currentSchema = ...; // Load existing Schema

// Add new table
Justdb updated = aiManager.processNaturalLanguageRequest(
    "Add a tags table for post categorization",
    currentSchema
);

// Add column
updated = aiManager.processNaturalLanguageRequest(
    "Add a published_at column to the posts table",
    updated
);

// Add index
updated = aiManager.processNaturalLanguageRequest(
    "Create an index on user_id in posts table",
    updated
);
```

### 3. Using Markdown Format

```java
// Interact using Markdown format
Justdb schema = aiManager.processWithMarkdownFormat(
    "Create an e-commerce schema with products and categories",
    null
);

// Serialize to Markdown
String markdown = aiManager.serializeSchemaToMarkdown(schema);
System.out.println(markdown);

// Load from Markdown
Justdb loaded = aiManager.loadSchemaFromMarkdown(markdown);
```

### 4. JSON Patch Mode

```java
// Use JSON Patch for precise control
Justdb schema = aiManager.processSchemaWithJsonPatch(
    "Add a status column with default value 'active'",
    currentSchema,
    "text"
);
```

## Interactive Terminal Usage

### Start Interactive Terminal

```bash
justdb interactive
```

### Interactive Command Examples

```bash
# Enter interactive mode
justdb> ai mode enabled
AI enabled. Type natural language commands.

# Create table
justdb> create a users table with id, username, email
✓ Created table 'users' with 3 columns:
  - id: BIGINT (PRIMARY KEY)
  - username: VARCHAR(255) (NOT NULL)
  - email: VARCHAR(255)

# Add column
justdb> add a created_at timestamp to users
✓ Added column 'created_at' (TIMESTAMP) to 'users'

# Create related table
justdb> create posts table with user_id foreign key referencing users
✓ Created table 'posts' with foreign key to 'users'

# View current Schema
justdb> show schema
Database: default
Tables: users, posts

# Rename table
justdb> rename users to customers
✓ Renamed table 'users' to 'customers'

# Add index
justdb> add index on email in customers
✓ Created index 'idx_email' on 'customers.email'
```

## Advanced Features

### 1. Session History Management

```java
// Reset session
aiManager.resetSession();

// Get conversation history
List<Message> history = aiManager.getAiService()
    .getConversationHistory();

for (Message msg : history) {
    System.out.println(msg.getRole() + ": " + msg.getContent());
}
```

### 2. Semantic Similarity Search

```java
// Find similar table names
List<String> tables = Arrays.asList("users", "customers", "clients");
List<String> similar = aiManager.findSimilarTableNames(
    "客户",  // Chinese query
    tables,
    0.7  // Similarity threshold
);

// Find best match
String bestMatch = aiManager.findBestMatchingTableName(
    "user info",
    Arrays.asList("users", "user_info", "user_profile")
);
```

### 3. Schema History Rollback

```java
// AI modifications automatically save history snapshots
// To rollback, restore from history

Justdb currentSchema = ...;
Justdb previousVersion = loadFromHistory("pre-modification");

if (needRollback) {
    return previousVersion;
}
```

## Expert System Prompts

JustDB uses database design expert system prompts to ensure AI output conforms to JustDB Schema format:

### Status Code System
- `needinfo`: Insufficient information, user needs to provide more details
- `completed`: Task completed, provide complete design
- `migration`: Generate migration scripts
- `error`: Encountered an error

### Output Specifications
- Use meaningful English names (lowercase + underscores)
- Choose appropriate data types and lengths
- Add necessary constraints (primary keys, foreign keys, unique constraints)
- Create indexes for frequently queried fields
- Use Chinese comments to explain business meanings

## Error Handling

### 1. AI Service Unavailable

```java
try {
    Justdb schema = aiManager.processNaturalLanguageRequest(
        "Create a users table",
        null
    );
} catch (AiServiceUnavailableException e) {
    // Fallback to local parsing
    System.err.println("AI service unavailable: " + e.getMessage());
    // Use regex to parse user input
}
```

### 2. Parsing Failure

```java
// Use fault-tolerant mode
Justdb schema = aiManager.processSchemaWithJsonPatchAndRetry(
    request,
    currentSchema,
    "text",
    3  // Retry 3 times
);
```

### 3. Local Fallback

When AI service is unavailable, the system automatically falls back to local parsing:

```java
// Automatic fallback logic implemented in AiSchemaManager
// If JSON parsing fails, attempts regex parsing
```

## Performance Optimization

### 1. Parameter Tuning

```yaml
ai:
  temperature: 0.2      # Reduce randomness, improve stability
  maxTokens: 2000       # Control output length
  enabled: true
```

### 2. Use Local Models

```yaml
ai:
  type: local
  baseUrl: http://localhost:11434
  model: qwen2.5-coder:1.5b  # Smaller, faster model
```

### 3. Batch Operations

```java
// Combine multiple operations into one request
String combinedRequest = """
    Add the following changes:
    1. Add status column to orders
    2. Create index on user_id
    3. Add foreign key from orders to users
""";

Justdb schema = aiManager.processNaturalLanguageRequest(
    combinedRequest,
    currentSchema
);
```

## Related Documentation

- [AI Integration Overview](./README.md) - AI feature overview
- [AI Schema Generation](./ai-schema-generation.md) - Generate Schema from descriptions
- [AI Migration Assistant](./ai-migration-assistant.md) - Intelligent migration recommendations

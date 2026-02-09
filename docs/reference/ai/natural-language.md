---
title: 自然语言操作
icon: 💬
description: 使用自然语言进行数据库 Schema 操作
order: 2
---

# 自然语言操作

JustDB AI 支持使用自然语言进行数据库 Schema 操作，无需编写 SQL 或配置文件，通过对话式交互完成 Schema 设计和修改。

## 支持的命令类型

### 1. 表操作

#### 创建表
```
create a users table
add a new table called customers
create a posts table with id, title, and content
```

#### 重命名表
```
rename users to customers
rename the orders table to purchase_orders
```

#### 删除表
```
drop the temp_table
delete the users_backup table
```

### 2. 列操作

#### 添加列
```
add an email column to the users table
add a status column of type VARCHAR(50) to orders
add created_at and updated_at timestamps to posts
```

#### 修改列
```
change the type of username column to VARCHAR(100)
modify the status column to be NOT NULL
```

#### 删除列
```
remove the temp_column from users
drop the old_email column from customers
```

### 3. 约束操作

#### 添加主键
```
add a primary key on id column
set id as primary key for users table
```

#### 添加外键
```
add a foreign key from orders.user_id to users.id
create a foreign key constraint on posts referencing users
```

#### 添加唯一约束
```
add a unique constraint on email column
make username unique in users table
```

### 4. 索引操作

```
create an index on email column
add a composite index on (user_id, created_at)
create index idx_username on username
```

## 配置 AI 提供商

### YAML 配置文件

在 `justdb-config.yaml` 中配置：

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

### 不同提供商的配置

#### OpenAI
```yaml
ai:
  type: openai
  apiKey: sk-xxx...
  model: gpt-3.5-turbo
  baseUrl: https://api.openai.com/v1
```

#### 阿里云 Qwen
```yaml
ai:
  type: qwen
  apiKey: sk-xxx...
  model: qwen2.5-coder:3b
  baseUrl: https://dashscope.aliyuncs.com/compatible-mode/v1
```

#### 百度 ERNIE Bot
```yaml
ai:
  type: erniebot
  apiKey: sk-xxx...
  model: ernie-bot-4.5
  baseUrl: https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat
```

#### 本地 Ollama
```yaml
ai:
  type: local
  baseUrl: http://localhost:11434
  model: qwen2.5-coder:1.5b
```

## 代码示例

### 1. 基础用法

```java
import org.verydb.justdb.ai.AiSchemaManager;
import org.verydb.justdb.cli.config.AiConfig;
import org.verydb.justdb.schema.Justdb;

// 创建 AI Schema 管理器
AiSchemaManager aiManager = new AiSchemaManager();

// 配置 AI 提供商
AiConfig config = new AiConfig("my-ai", "openai");
config.setApiKey("sk-xxx...");
config.setModel("gpt-3.5-turbo");
config.setTemperature(0.2);
config.setMaxTokens(2000);

// 初始化
aiManager.initialize(config);

// 使用自然语言创建 Schema
String request = "Create a blog database with users, posts, and comments tables";
Justdb schema = aiManager.processNaturalLanguageRequest(request, null);

// 输出结果
System.out.println("Generated schema with " + schema.getTables().size() + " tables");
```

### 2. 增量式修改

```java
// 基于现有 Schema 进行修改
Justdb currentSchema = ...; // 加载现有 Schema

// 添加新表
Justdb updated = aiManager.processNaturalLanguageRequest(
    "Add a tags table for post categorization",
    currentSchema
);

// 添加列
updated = aiManager.processNaturalLanguageRequest(
    "Add a published_at column to the posts table",
    updated
);

// 添加索引
updated = aiManager.processNaturalLanguageRequest(
    "Create an index on user_id in posts table",
    updated
);
```

### 3. 使用 Markdown 格式

```java
// 使用 Markdown 格式进行交互
Justdb schema = aiManager.processWithMarkdownFormat(
    "Create an e-commerce schema with products and categories",
    null
);

// 序列化为 Markdown
String markdown = aiManager.serializeSchemaToMarkdown(schema);
System.out.println(markdown);

// 从 Markdown 加载
Justdb loaded = aiManager.loadSchemaFromMarkdown(markdown);
```

### 4. JSON Patch 模式

```java
// 使用 JSON Patch 进行精确控制
Justdb schema = aiManager.processSchemaWithJsonPatch(
    "Add a status column with default value 'active'",
    currentSchema,
    "text"
);
```

## 交互式终端使用

### 启动交互式终端

```bash
justdb interactive
```

### 交互式命令示例

```bash
# 进入交互模式
justdb> ai mode enabled
AI enabled. Type natural language commands.

# 创建表
justdb> create a users table with id, username, email
✓ Created table 'users' with 3 columns:
  - id: BIGINT (PRIMARY KEY)
  - username: VARCHAR(255) (NOT NULL)
  - email: VARCHAR(255)

# 添加列
justdb> add a created_at timestamp to users
✓ Added column 'created_at' (TIMESTAMP) to 'users'

# 创建关联表
justdb> create posts table with user_id foreign key referencing users
✓ Created table 'posts' with foreign key to 'users'

# 查看当前 Schema
justdb> show schema
Database: default
Tables: users, posts

# 重命名表
justdb> rename users to customers
✓ Renamed table 'users' to 'customers'

# 添加索引
justdb> add index on email in customers
✓ Created index 'idx_email' on 'customers.email'
```

## 高级功能

### 1. 会话历史管理

```java
// 重置会话
aiManager.resetSession();

// 获取对话历史
List<Message> history = aiManager.getAiService()
    .getConversationHistory();

for (Message msg : history) {
    System.out.println(msg.getRole() + ": " + msg.getContent());
}
```

### 2. 语义相似度搜索

```java
// 查找相似的表名
List<String> tables = Arrays.asList("users", "customers", "clients");
List<String> similar = aiManager.findSimilarTableNames(
    "客户",  // 中文查询
    tables,
    0.7  // 相似度阈值
);

// 查找最佳匹配
String bestMatch = aiManager.findBestMatchingTableName(
    "user info",
    Arrays.asList("users", "user_info", "user_profile")
);
```

### 3. Schema 历史回滚

```java
// AI 修改会自动保存历史快照
// 如果需要回滚，可以从历史记录恢复

Justdb currentSchema = ...;
Justdb previousVersion = loadFromHistory("pre-modification");

if (needRollback) {
    return previousVersion;
}
```

## 专家系统提示词

JustDB 使用数据库设计专家系统提示词，确保 AI 输出符合 JustDB Schema 格式：

### 状态码系统
- `needinfo`: 信息不足，需要用户提供更多细节
- `completed`: 任务完成，提供完整设计
- `migration`: 生成迁移脚本
- `error`: 遇到错误

### 输出规范
- 使用有意义的英文名称（小写+下划线）
- 选择合适的数据类型和长度
- 添加必要的约束（主键、外键、唯一约束）
- 为常用查询字段创建索引
- 用中文注释说明业务含义

## 错误处理

### 1. AI 服务不可用

```java
try {
    Justdb schema = aiManager.processNaturalLanguageRequest(
        "Create a users table",
        null
    );
} catch (AiServiceUnavailableException e) {
    // 回退到本地解析
    System.err.println("AI service unavailable: " + e.getMessage());
    // 使用正则表达式解析用户输入
}
```

### 2. 解析失败

```java
// 使用容错模式
Justdb schema = aiManager.processSchemaWithJsonPatchAndRetry(
    request,
    currentSchema,
    "text",
    3  // 重试 3 次
);
```

### 3. 本地回退

当 AI 服务不可用时，系统会自动回退到本地解析：

```java
// 自动回退逻辑在 AiSchemaManager 中实现
// 如果 JSON 解析失败，会尝试正则表达式解析
```

## 性能优化

### 1. 参数调优

```yaml
ai:
  temperature: 0.2      # 降低随机性，提高稳定性
  maxTokens: 2000       # 控制输出长度
  enabled: true
```

### 2. 使用本地模型

```yaml
ai:
  type: local
  baseUrl: http://localhost:11434
  model: qwen2.5-coder:1.5b  # 更小、更快的模型
```

### 3. 批量操作

```java
// 合并多个操作为一次请求
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

## 相关文档

- [AI 集成概述](./README.md) - AI 功能总览
- [AI Schema 生成](./ai-schema-generation.md) - 从描述生成 Schema
- [AI 迁移助手](./ai-migration-assistant.md) - 智能迁移建议

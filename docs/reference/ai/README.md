---
title: AI 集成概述
icon: 🤖
description: JustDB AI 功能概览、支持的 AI 提供商和快速开始指南
order: 1
---

# AI 集成概述

JustDB 提供了强大的 AI 集成功能，通过自然语言与数据库进行交互，让数据库设计和管理变得更加简单高效。

## 核心功能

### 1. 自然语言 Schema 操作
- 通过自然语言描述生成数据库 Schema
- 使用自然语言修改现有 Schema
- 智能理解用户意图并转换为数据库操作

### 2. AI Schema 生成
- 从业务需求描述自动生成 Schema
- 智能类型推断和关系推断
- 支持增量式 Schema 演进

### 3. AI 迁移助手
- 智能迁移建议
- 风险评估和数据迁移方案
- 自动生成迁移脚本

### 4. Schema 分析与优化
- Schema 健康检查
- 性能优化建议
- 兼容性分析

## 支持的 AI 提供商

JustDB 支持多种 AI 提供商，可以根据需求选择最适合的服务：

| 提供商 | 类型 | 说明 | 配置参数 |
|--------|------|------|----------|
| **OpenAI** | 云服务 | GPT-3.5/GPT-4 系列 | `apiKey`, `baseUrl`, `model` |
| **Qwen** | 云服务 | 阿里云通义千问 | `apiKey`, `baseUrl`, `model` |
| **ERNIE Bot** | 云服务 | 百度文心一言 | `apiKey`, `baseUrl`, `model` |
| **Ollama** | 本地服务 | 本地部署的开源模型 | `baseUrl`, `model` |

### 快速配置

#### OpenAI 配置
```yaml
ai:
  type: openai
  apiKey: sk-xxx...
  model: gpt-3.5-turbo
  baseUrl: https://api.openai.com/v1
  temperature: 0.2
  maxTokens: 2000
```

#### Qwen 配置
```yaml
ai:
  type: qwen
  apiKey: sk-xxx...
  model: qwen2.5-coder:3b
  baseUrl: https://dashscope.aliyuncs.com/compatible-mode/v1
  temperature: 0.2
  maxTokens: 2000
```

#### 本地 Ollama 配置
```yaml
ai:
  type: local
  baseUrl: http://localhost:11434
  model: qwen2.5-coder:1.5b
  temperature: 0.2
  maxTokens: 2000
```

## 快速开始

### 1. 配置 AI 提供商

在 `justdb-config.yaml` 中配置 AI 提供商：

```yaml
ai:
  enabled: true
  type: openai
  apiKey: ${OPENAI_API_KEY}
  model: gpt-3.5-turbo
  temperature: 0.2
  maxTokens: 2000
```

### 2. 使用自然语言创建 Schema

```bash
# 启动交互式终端
justdb interactive

# 使用自然语言创建表
justdb> create a users table with id, username, email, and created_at
✓ Created table 'users' with 4 columns

# 使用自然语言修改表
justdb> add a status column to the users table
✓ Added column 'status' to table 'users'

# 使用自然语言重命名表
justdb> rename the users table to customers
✓ Renamed table 'users' to 'customers'
```

### 3. 代码中使用 AI 功能

```java
// 创建 AI Schema 管理器
AiSchemaManager aiManager = new AiSchemaManager();
AiConfig config = new AiConfig("openai", "openai");
config.setApiKey("sk-xxx...");
config.setModel("gpt-3.5-turbo");
aiManager.initialize(config);

// 使用自然语言生成 Schema
Justdb schema = aiManager.processNaturalLanguageRequest(
    "Create a blog schema with users, posts, and comments tables",
    null  // null 表示从空 Schema 开始
);

// 使用自然语言修改 Schema
Justdb updatedSchema = aiManager.processNaturalLanguageRequest(
    "Add a likes table to track user likes on posts",
    schema  // 基于现有 Schema 修改
);
```

## 架构设计

### 核心 AI 组件

```
AI 集成架构
├── LangChainAiService      # AI 服务抽象层（基于 LangChain4j）
├── AiSchemaManager         # Schema 管理
├── SchemaAnalyzer          # Schema 分析
├── EmbeddingService        # 语义相似度计算
├── AiPluginManager         # AI 插件管理
└── AiSchemaHistoryManager  # Schema 历史管理
```

### 工作流程

```
用户输入（自然语言）
    ↓
AI 理解与解析
    ↓
结构化输出（JSON/YAML）
    ↓
Schema 应用
    ↓
历史记录保存
```

## 高级功能

### 1. Schema 历史管理

JustDB 自动保存每次 AI 修改的 Schema 历史，支持版本回滚：

```yaml
ai:
  schemaHistoryDir: ~/.justdb/history
  schemaHistoryLimit: 50  # 最多保留 50 个历史版本
```

### 2. 上下文管理

AI 会话支持上下文记忆，可以记住之前的对话：

```java
// 重置会话
aiManager.resetSession();

// 获取对话历史
List<Message> history = aiManager.getAiService().getConversationHistory();
```

### 3. 语义相似度搜索

使用 EmbeddingService 进行表名和语义的相似度匹配：

```java
// 查找相似的表名
List<String> similarTables = aiManager.findSimilarTableNames(
    "客户信息",
    Arrays.asList("users", "customers", "clients", "profiles"),
    0.7  // 相似度阈值
);

// 查找最佳匹配
String bestMatch = aiManager.findBestMatchingTableName(
    "user",
    Arrays.asList("users", "user_info", "customer")
);
```

### 4. Schema 分析与诊断

```java
// 分析 Schema
String analysis = SchemaAnalyzer.analyzeSchema(schema);
System.out.println(analysis);

// 诊断问题
String diagnosis = SchemaAnalyzer.diagnoseSchema(schema);

// 优化建议
Justdb optimized = SchemaAnalyzer.optimizeSchema(schema);
```

## 输出格式

AI 支持多种结构化输出格式：

### JSON 格式（默认）
```json
{
  "operations": [
    {
      "type": "create",
      "new_name": "users",
      "description": "Create users table",
      "schema": {
        "id": "users",
        "Column": [
          {"id": "id", "type": "BIGINT", "primaryKey": true},
          {"id": "name", "type": "VARCHAR(255)", "nullable": false}
        ]
      }
    }
  ]
}
```

### YAML 格式
```yaml
status: completed
schema:
  database: mydb
  tables:
    - name: users
      comment: 用户表
      columns:
        - name: id
          type: BIGINT
          nullable: false
          comment: 主键
```

## 配置参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | Boolean | true | 是否启用 AI 功能 |
| `type` | String | - | AI 提供商类型 |
| `apiKey` | String | - | API 密钥 |
| `baseUrl` | String | - | API 基础 URL |
| `model` | String | - | 模型名称 |
| `temperature` | Double | 0.2 | 温度参数（0-1） |
| `maxTokens` | Integer | 2000 | 最大令牌数 |
| `merge` | Boolean | true | 是否合并现有内容 |
| `schemaHistoryDir` | String | ~/.justdb | Schema 历史目录 |
| `schemaHistoryLimit` | Integer | 50 | 历史版本限制 |

## 相关文档

- [自然语言操作](./natural-language.md) - 详细的自然语言 Schema 操作指南
- [AI Schema 生成](./ai-schema-generation.md) - 从描述生成 Schema
- [AI 迁移助手](./ai-migration-assistant.md) - 智能迁移建议

## 最佳实践

1. **选择合适的 AI 提供商**
   - 开发/测试：使用本地 Ollama（免费、快速）
   - 生产环境：使用 OpenAI/Qwen（更准确）

2. **优化 Prompt**
   - 使用明确的表名和字段名
   - 指定数据类型和约束
   - 添加业务场景描述

3. **版本管理**
   - 启用 Schema 历史记录
   - 定期备份重要 Schema
   - 使用 Git 跟踪 Schema 变更

4. **性能优化**
   - 控制 `temperature` 参数（推荐 0.2-0.3）
   - 合理设置 `maxTokens`
   - 使用本地模型降低延迟

## 故障排除

### AI 服务不可用
```bash
# 检查本地 Ollama 服务
curl http://localhost:11434/api/tags

# 启动 Ollama 服务
ollama serve
```

### API 密钥错误
```bash
# 设置环境变量
export OPENAI_API_KEY=sk-xxx...
export QWEN_API_KEY=sk-xxx...
```

### Schema 解析失败
```java
// 查看详细错误日志
aiManager.processWithFullSchemaStructure(request, schema, "text");

// 使用 Markdown 格式重试
aiManager.processWithMarkdownFormat(request, schema);
```

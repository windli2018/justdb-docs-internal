# JustDB AI Agent 重构设计方案

## 一、设计概述

### 目标
将现有的混乱 AI 实现重构为清晰的 Agent 架构，基于 LangChain4j 框架，使用 JSON 通信协议，支持分层记忆和 Token 管理。

### 用户选择
- **通信格式**: JSON
- **Agent框架**: LangChain4j
- **上下文压缩**: 分层记忆（短期+长期向量检索）
- **交互体验**: 混合模式（简单问题实时，复杂问题清单）

---------------------------

## 二、现状分析

### 当前核心问题

1. **职责混乱**: `LangChainAiService` (1500+ 行) 承担太多职责
   - 提供商路由、Schema 管理、历史管理、SQL 解析、JSON 修复、会话管理

2. **通信格式不统一**: YAML/JSON/XML/TOML/Markdown 混用

3. **AI 逻辑散布在 core 包中**: 违反模块化原则

4. **缺少 Token 管理和上下文压缩**: 容易超出模型限制

5. **Interactive 和 AI 命令职责不清**: 功能重叠

### 可保留的优秀设计
- **AiSchemaHistoryManager**: 时间戳命名、淘汰式修剪算法、项目隔离设计
- **AiService 接口**: 清晰的抽象层

---------------------------

## 三、新架构设计

### 3.1 模块结构

```
justdb-parent/
├── justdb-core/              # 核心模块（保留 AI 接口）
│   └── org.verydb.justdb
│       └── ai/               # AI 接口定义（保留）
│           ├── AiService.java
│           ├── AiSchemaHistory.java
│           └── Message.java
│
├── justdb-ai/                # AI 实现模块（新建）
│   └── org.verydb.justdb.ai
│       ├── agent/            # Agent 核心
│       │   ├── JustdbAgent.java
│       │   ├── AgentConfig.java
│       │   └── AgentOrchestrator.java
│       ├── memory/           # 记忆管理
│       │   ├── ConversationMemory.java
│       │   ├── ShortTermMemory.java
│       │   ├── LongTermMemory.java
│       │   ├── MemoryCompressor.java
│       │   └── TokenManager.java
│       ├── provider/         # 提供商抽象
│       │   ├── AiProvider.java
│       │   ├── LangChain4jProvider.java
│       │   ├── OpenAiProvider.java
│       │   ├── QwenProvider.java
│       │   └── LocalProvider.java
│       ├── tool/             # Agent 工具
│       │   ├── Tool.java
│       │   ├── ToolRegistry.java
│       │   ├── SchemaTool.java
│       │   ├── HistoryTool.java
│       │   └── QueryTool.java
│       ├── protocol/         # JSON 通信协议
│       │   ├── JsonProtocol.java
│       │   ├── AiRequest.java
│       │   ├── AiResponse.java
│       │   ├── ToolCallRequest.java
│       │   └── ToolCallResponse.java
│       ├── history/          # Schema 历史（保留原逻辑）
│       │   ├── AiSchemaHistoryManager.java
│       │   └── HistoryEntry.java
│       └── service/          # 服务层
│           └── AiSchemaManager.java
│
└── justdb-cli/               # CLI 集成
    └── org.verydb.justdb.cli
        ├── interactive/
        │   ├── AiInteractiveSession.java
        │   └── ConversationDisplay.java
        └── commands/
            └── AiCommand.java  # 简化后的命令
```

### 3.2 核心类设计

#### 3.2.1 JustdbAgent（主代理）

```java
/**
 * JustDB AI Agent - 主代理类
 * 负责协调 Provider、Memory、Tool 完成用户任务
 */
public class JustdbAgent {
    private final AiProvider provider;
    private final ConversationMemory memory;
    private final ToolRegistry toolRegistry;
    private final TokenManager tokenManager;

    public AiResponse processRequest(AiRequest request);
    public List&lt;ConversationMessage&gt; getHistory();
    public void reset();
}
```

#### 3.2.2 分层记忆系统

```java
// ConversationMemory - 主协调器
public class ConversationMemory {
    private final ShortTermMemory shortTerm;  // 最近 N 条消息
    private final LongTermMemory longTerm;    // 向量检索
    private final MemoryCompressor compressor;

    public void add(AiRequest request, AiResponse response);
    public void compress();  // 压缩旧消息到长期记忆
    public List&lt;ConversationMessage&gt; searchRelevant(String query, int topK);
    public List&lt;ConversationMessage&gt; getFullContext();
}

// ShortTermMemory - FIFO 队列
public class ShortTermMemory {
    private final int capacity;  // 默认 20 条消息
    private final LinkedList&lt;ConversationMessage&gt; messages;
}

// LongTermMemory - 向量检索
public class LongTermMemory {
    private final EmbeddingService embeddingService;
    private final VectorStore vectorStore;

    public void store(List&lt;Summary&gt; summaries);
    public List&lt;ConversationMessage&gt; semanticSearch(String query, int topK);
}

// MemoryCompressor - 记忆压缩器
public class MemoryCompressor {
    public List&lt;Summary&gt; summarize(List&lt;ConversationMessage&gt; messages);
}
```

#### 3.2.3 Token 管理

```java
public class TokenManager {
    private final int maxContextTokens;  // 默认 4000
    private final double compressionThreshold;  // 默认 0.8

    public boolean wouldExceedLimit(AiRequest request, ConversationMemory memory);
    public int estimateUsage(AiRequest request, ConversationMemory memory);
}

public class TokenCounter {
    public int count(AiRequest request);
    public int count(List&lt;ConversationMessage&gt; messages);
}
```

#### 3.2.4 提供商抽象

```java
public interface AiProvider {
    AiResponse execute(AgentContext context);
    String summarize(List&lt;ConversationMessage&gt; messages);  // 用于记忆压缩
    int getContextWindowSize();
}

public class LangChain4jProvider implements AiProvider {
    private final ChatLanguageModel model;
    // 使用 LangChain4j 实现
}
```

#### 3.2.5 Agent 工具

```java
public interface Tool {
    String getName();
    String getDescription();
    ToolCallResponse execute(ToolCallRequest request);
}

public class SchemaTool implements Tool {
    // 读取/修改 Schema
}

public class HistoryTool implements Tool {
    // 查询 Schema 历史
}

public class QueryTool implements Tool {
    // 执行数据库查询
}

public class ToolRegistry {
    private final Map&lt;String, Tool&gt; tools;
    public String generateToolDescriptions();  // 用于 System Prompt
}
```

### 3.3 JSON 通信协议

#### 请求格式
```json
{
  "sessionId": "会话ID",
  "text": "用户输入",
  "context": {
    "currentSchema": {...},
    "operation": "schema_design|schema_modification|query|general"
  },
  "requiredTools": ["schema", "history"]
}
```

#### 响应格式
```json
{
  "text": "AI 响应文本",
  "toolCalls": [
    {
      "toolName": "schema",
      "callId": "call_123",
      "args": {"action": "read"}
    }
  ],
  "metadata": {
    "tokensUsed": 1234,
    "model": "qwen2.5-coder:3b",
    "timestamp": 1234567890
  },
  "requiresToolCalls": true
}
```

#### 访谈问题格式
```json
{
  "text": "需要更多信息",
  "metadata": {
    "needsInterview": true,
    "questions": [
      "主要业务领域是什么？",
      "预期用户量是多少？"
    ]
  }
}
```

### 3.4 交互模式集成

```java
public class AiInteractiveSession {
    private final JustdbAgent agent;
    private final ConversationDisplay display;

    public void handleInput(String input);  // 处理用户输入
    private void handleCommand(String command);  // 处理 /history, /clear 等
}

public class ConversationDisplay {
    public void showThinking();
    public void showToolCalls(List&lt;ToolCall&gt; calls);
    public void showResponse(AiResponse response);
    public void showInterviewQuestions(List&lt;String&gt; questions);
    public void showHistory(List&lt;ConversationMessage&gt; history);
}
```

---------------------------

## 四、Token 管理策略

### 配置参数
| 参数 | 默认值 | 说明 |
|------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------|
| maxContextTokens | 4000 | 最大上下文 Token 数 |
| compressionThreshold | 0.8 | 触发压缩的阈值（80%） |
| shortTermCapacity | 20 | 短期记忆容量（消息数） |
| longTermCapacity | 1000 | 长期记忆容量（摘要数） |
| summaryTargetTokens | 500 | 摘要目标 Token 数 |

### 压缩算法
1. 从最旧消息开始，按 topic 分组
2. 每组调用 LLM 生成摘要（~500 tokens）
3. 存入长期记忆（向量检索）
4. 从短期记忆删除原始消息

### 检索策略
1. 对用户输入做 embedding
2. 从长期记忆检索 top-3 相关摘要
3. 结合短期记忆的所有消息
4. 构建完整上下文

### 上下文构建
```
完整上下文 = [
  System Prompt (~200 tokens),
  工具描述 (~300 tokens),
  长期记忆摘要（~500 * 3 = 1500 tokens）,
  短期记忆消息（~100 * 10 = 1000 tokens）,
  当前请求（~200 tokens）
]
总计 ~3200 tokens（安全余量 800 tokens）
```

---------------------------

## 五、实现步骤

### 阶段 1：基础重构（2-3 天）
1. 创建 `justdb-ai` 模块
2. 移动现有 AI 代码到新模块
3. 在 core 中只保留接口
4. 实现 JSON 协议（JsonProtocol、AiRequest、AiResponse）
5. 实现提供商抽象（AiProvider、LangChain4jProvider）

### 阶段 2：记忆系统（2-3 天）
1. 实现 ConversationMemory（主协调器）
2. 实现 ShortTermMemory（FIFO 队列）
3. 实现 LongTermMemory（向量检索）
4. 实现 TokenManager 和 MemoryCompressor
5. 集成到 JustdbAgent

### 阶段 3：工具系统（1-2 天）
1. 实现 Tool 接口和 ToolRegistry
2. 实现 SchemaTool、HistoryTool、QueryTool
3. 集成工具调用逻辑到 JustdbAgent

### 阶段 4：交互模式集成（1-2 天）
1. 创建 AiInteractiveSession
2. 实现 ConversationDisplay
3. 简化交互体验（去掉 /ai 命令，直接对话）
4. 显示对话历史和访谈问题

### 阶段 5：测试和优化（2-3 天）
1. 单元测试（Provider、Memory、Tool）
2. 集成测试（Agent 端到端、交互模式）
3. 性能优化（Token 计数、向量检索、并发处理）

### 阶段 6：文档和迁移（1 天）
1. 更新 API 文档、使用指南
2. 迁移现有代码、更新配置文件

---------------------------

## 六、关键文件清单

### 需要修改的核心文件
1. `justdb-core/.../ai/LangChainAiService.java` - 拆分为 Provider + Service
2. `justdb-core/.../ai/AiSchemaManager.java` - 迁移到 justdb-ai
3. `justdb-core/.../cli/interactive/CommandExecutor.java` - 集成 AiInteractiveSession
4. `justdb-core/.../cli/commands/AiCommand.java` - 简化为配置管理

### 需要保留并迁移
- `justdb-core/.../ai/AiSchemaHistoryManager.java` - 设计良好，迁移到 justdb-ai
- `justdb-core/.../ai/AiService.java` - 保留在 core 作为接口

### 需要创建的新文件（justdb-ai 模块）
```
justdb-ai/src/main/java/org/verydb/justdb/ai/
├── agent/JustdbAgent.java
├── memory/ConversationMemory.java
├── memory/ShortTermMemory.java
├── memory/LongTermMemory.java
├── memory/MemoryCompressor.java
├── memory/TokenManager.java
├── provider/AiProvider.java
├── provider/LangChain4jProvider.java
├── tool/Tool.java
├── tool/ToolRegistry.java
├── tool/SchemaTool.java
├── tool/HistoryTool.java
├── tool/QueryTool.java
├── protocol/JsonProtocol.java
├── protocol/AiRequest.java
├── protocol/AiResponse.java
├── history/AiSchemaHistoryManager.java (迁移)
└── service/AiSchemaManager.java (重构)
```

### CLI 集成新文件
```
justdb-cli/src/main/java/org/verydb/justdb/cli/
├── interactive/AiInteractiveSession.java
├── interactive/ConversationDisplay.java
└── commands/AiCommand.java (简化)
```

---------------------------

## 七、验证计划

### 单元测试
- `AiProviderTest` - 测试各提供商的请求/响应
- `ConversationMemoryTest` - 测试记忆存储、检索、压缩
- `TokenManagerTest` - 测试 Token 计数和压缩触发
- `ToolTest` - 测试各工具的执行逻辑

### 集成测试
- `JustdbAgentTest` - 端到端 Agent 测试
- `AiInteractiveSessionTest` - 交互模式测试
- `JsonProtocolTest` - JSON 序列化/反序列化测试

### 手动验证
1. 启动 interactive 模式
2. 直接与 AI 对话（不使用 /ai 命令）
3. 验证对话历史显示
4. 验证访谈问题展示
5. 验证 Schema 历史保存和恢复
6. 验证上下文压缩触发

---------------------------

## 八、参考资料

- `docs/schema-structure.md` - Schema 结构定义
- `docs/template-system-design.md` - 模板系统设计
- `justdb-core/src/main/resources/default-plugins.xml` - 内置插件

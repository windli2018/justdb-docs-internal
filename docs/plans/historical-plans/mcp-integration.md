# JustDB AI MCP 工具实现计划

## 需求概述

实现一个 JustDB AI MCP (Model Context Protocol) 工具，让其他 AI 工具可以使用 JustDB 的能力：

1. **核心功能**
   - Schema 读取和修改
   - 数据转换（格式转换）
   - Schema 导出
   - Schema 验证
   - 数据库迁移

2. **安全配置**
   - 通过配置限制能力范围
   - 控制是否允许操作真实数据库

3. **模块结构**
   - 创建独立的 justdb-mcp module
   - 编写相应的 MCP tools

---

## 架构设计

### 1. 模块结构

```
justdb-mcp/
├── pom.xml                          # Maven 配置
├── justdb-mcp-api/                  # API 模块
│   └── src/main/java/org/verydb/justdb/mcp/api/
│       ├── McpConfig.java           # MCP 配置类
│       ├── McpTool.java             # Tool 接口
│       └── McpService.java          # 服务接口
├── justdb-mcp-core/                 # 核心实现模块
│   └── src/main/java/org/verydb/justdb/mcp/core/
│       ├── server/                  # MCP 服务器
│       │   ├── JustdbMcpServer.java # MCP 服务器主类
│       │   └── McpServerLauncher.java
│       ├── tools/                   # MCP Tools 实现
│       │   ├── SchemaReadTool.java      # 读取 schema
│       │   ├── SchemaModifyTool.java    # 修改 schema
│       │   ├── SchemaConvertTool.java   # 格式转换
│       │   ├── SchemaExportTool.java    # 导出 schema
│       │   ├── SchemaValidateTool.java  # 验证 schema
│       │   ├── SchemaMigrateTool.java   # 数据库迁移
│       │   ├── Db2SchemaTool.java       # 从数据库提取 schema
│       │   └── AiHistoryTool.java       # AI 历史记录
│       ├── config/                  # 配置管理
│       │   └── McpConfigManager.java
│       └── handler/                 # 请求处理
│           └── ToolInvocationHandler.java
├── justdb-mcp-cli/                  # CLI 启动模块
│   └── src/main/java/org/verydb/justdb/mcp/cli/
│       └── McpCommand.java          # `justdb mcp` 命令
└── justdb-mcp-integration-tests/    # 集成测试
    └── src/test/java/org/verydb/justdb/mcp/
        └── McpServerIntegrationTest.java
```

### 2. MCP Tools 定义

| Tool Name | Description | Input Schema | 安全级别 |
|-----------|-------------|--------------|----------|
| `read_schema` | 读取数据库 schema | `{path: string, format: string}` | SAFE |
| `modify_schema` | 修改 schema | `{path: string, operations: []}` | MODERATE |
| `convert_schema` | 转换 schema 格式 | `{input: string, output: string, format: string}` | SAFE |
| `export_schema` | 导出 schema | `{path: string, target: string, format: string}` | SAFE |
| `validate_schema` | 验证 schema | `{path: string, dbConnection?: string}` | MODERATE |
| `migrate_database` | 执行数据库迁移 | `{schema: string, dbConnection: string, dryRun?: boolean}` | DANGEROUS |
| `db2schema` | 从数据库提取 schema | `{dbConnection: string, output: string}` | MODERATE |
| `ai_history` | 查看 AI schema 历史记录 | `{action: string, id?: string, limit?: number}` | SAFE |

### 3. 配置结构

#### `justdb-mcp-config.yaml`
```yaml
mcp:
  server:
    name: "justdb-mcp"
    version: "1.0.0"
    transport: "stdio"  # stdio, sse, http

  # 安全配置
  security:
    allowRealDatabase: false      # 是否允许操作真实数据库
    allowedPaths:                 # 允许访问的路径（支持相对路径和通配符）
      - "./"                      # 当前目录
      - "./schemas"               # schemas 子目录
      - "~/.justdb"               # 用户 JustDB 配置目录
      - "./projects/*/schemas"    # 支持通配符：所有项目的 schemas 目录
    blockedPaths:                 # 禁止访问的路径
      - "/etc"
      - "/sys"
      - "/proc"
      - "/root"

  # 工具过滤
  tools:
    enabled:
      - "read_schema"
      - "convert_schema"
      - "export_schema"
      - "validate_schema"
      - "ai_history"
    requiresPermission:
      migrate_database: "dangerous"
      db2schema: "moderate"

  # 数据库连接配置（可选）
  databases:
    - name: "dev"
      type: "h2"
      jdbcUrl: "jdbc:h2:mem:testdb"
      username: "sa"
      password: ""
```

---

## 实现步骤

### Step 1: 创建模块结构

1. 在根 pom.xml 添加 `<module>justdb-mcp</module>`
2. 创建 justdb-mcp/pom.xml
3. 创建子模块 pom.xml 文件

### Step 2: 实现 MCP API 模块 (justdb-mcp-api)

**文件**: `justdb-mcp-api/src/main/java/org/verydb/justdb/mcp/api/McpConfig.java`

```java
package org.verydb.justdb.mcp.api;

import lombok.Data;
import java.util.List;

/**
 * MCP server configuration.
 * MCP 服务器配置
 */
@Data
public class McpConfig {
    private String name = "justdb-mcp";
    private String version = "1.0.0";
    private String transport = "stdio";
    private SecurityConfig security = new SecurityConfig();
    private ToolsConfig tools = new ToolsConfig();
    private List<DatabaseConfig> databases = new ArrayList<>();

    @Data
    public static class SecurityConfig {
        private boolean allowRealDatabase = false;
        private List<String> allowedPaths = new ArrayList<>();
        private List<String> blockedPaths = Arrays.asList("/etc", "/sys", "/proc");
    }

    @Data
    public static class ToolsConfig {
        private List<String> enabled = Arrays.asList(
            "read_schema", "convert_schema", "export_schema", "validate_schema", "ai_history"
        );
        private Map<String, String> requiresPermission = new HashMap<>();
    }

    @Data
    public static class DatabaseConfig {
        private String name;
        private String type;
        private String jdbcUrl;
        private String username;
        private String password;
    }
}
```

### Step 3: 实现 MCP Core 模块

**依赖配置** (pom.xml):
```xml
<dependency>
    <groupId>io.modelcontextprotocol.sdk</groupId>
    <artifactId>mcp</artifactId>
    <version>0.15.0</version>
</dependency>
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-core</artifactId>
</dependency>
```

**文件**: `justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/server/JustdbMcpServer.java`

```java
package org.verydb.justdb.mcp.core.server;

import io.modelcontextprotocol.sdk.server.McpSyncServer;
import io.modelcontextprotocol.sdk.server.McpServer;
import io.modelcontextprotocol.sdk.transport.stdio.StdioServerTransportProvider;
import io.modelcontextprotocol.sdk.json.JacksonMcpJsonMapper;
import io.modelcontextprotocol.sdk.schema.McpSchema;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.mcp.api.McpConfig;
import org.verydb.justdb.mcp.core.tools.*;

import java.util.List;

/**
 * JustDB MCP Server implementation.
 * JustDB MCP 服务器实现
 */
public class JustdbMcpServer {

    private final McpConfig config;
    private final JustdbManager justdbManager;
    private McpSyncServer server;

    public JustdbMcpServer(McpConfig config, JustdbManager justdbManager) {
        this.config = config;
        this.justdbManager = justdbManager;
    }

    public McpSyncServer start() {
        JacksonMcpJsonMapper jsonMapper = new JacksonMcpJsonMapper(new ObjectMapper());
        StdioServerTransportProvider transportProvider = new StdioServerTransportProvider(jsonMapper);

        McpSchema.ServerCapabilities capabilities = McpSchema.ServerCapabilities.builder()
            .tools(true)
            .resources(true, false)
            .prompts(true)
            .logging()
            .build();

        // Create tool specifications
        List<McpServerFeatures.SyncToolSpecification> tools = createTools();

        this.server = McpServer.sync(transportProvider)
            .serverInfo(config.getName(), config.getVersion())
            .capabilities(capabilities)
            .tools(tools.toArray(new McpServerFeatures.SyncToolSpecification[0]))
            .build();

        return server;
    }

    private List<McpServerFeatures.SyncToolSpecification> createTools() {
        List<McpServerFeatures.SyncToolSpecification> tools = new ArrayList<>();

        // Only add enabled tools
        McpConfig.ToolsConfig toolsConfig = config.getTools();

        if (toolsConfig.getEnabled().contains("read_schema")) {
            tools.add(SchemaReadTool.create(justdbManager, config));
        }
        if (toolsConfig.getEnabled().contains("modify_schema")) {
            tools.add(SchemaModifyTool.create(justdbManager, config));
        }
        if (toolsConfig.getEnabled().contains("convert_schema")) {
            tools.add(SchemaConvertTool.create(justdbManager, config));
        }
        if (toolsConfig.getEnabled().contains("export_schema")) {
            tools.add(SchemaExportTool.create(justdbManager, config));
        }
        if (toolsConfig.getEnabled().contains("validate_schema")) {
            tools.add(SchemaValidateTool.create(justdbManager, config));
        }
        if (toolsConfig.getEnabled().contains("migrate_database")) {
            tools.add(SchemaMigrateTool.create(justdbManager, config));
        }
        if (toolsConfig.getEnabled().contains("db2schema")) {
            tools.add(Db2SchemaTool.create(justdbManager, config));
        }
        if (toolsConfig.getEnabled().contains("ai_history")) {
            tools.add(AiHistoryTool.create(justdbManager, config));
        }

        return tools;
    }

    public void stop() {
        if (server != null) {
            server.close();
        }
    }
}
```

### Step 4: 实现 MCP Tools

**文件**: `justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/SchemaReadTool.java`

```java
package org.verydb.justdb.mcp.core.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.modelcontextprotocol.sdk.schema.McpSchema;
import io.modelcontextprotocol.sdk.server.McpServerFeatures;
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.mcp.api.McpConfig;
import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.util.SchemaLoaderFactory;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

/**
 * MCP Tool for reading JustDB schema.
 * 读取 JustDB schema 的 MCP Tool
 */
public class SchemaReadTool {

    private static final String SCHEMA = """
        {
          "type": "object",
          "properties": {
            "path": {
              "type": "string",
              "description": "Path to schema file (yaml, json, xml, toml)"
            },
            "format": {
              "type": "string",
              "enum": ["yaml", "json", "xml", "toml"],
              "description": "Schema format (auto-detect if not specified)"
            }
          },
          "required": ["path"]
        }
        """;

    public static McpServerFeatures.SyncToolSpecification create(
            JustdbManager justdbManager, McpConfig config) {

        return new McpServerFeatures.SyncToolSpecification(
            new McpSchema.Tool(
                "read_schema",
                "Read Database Schema",
                "Reads a JustDB schema file and returns its content as JSON",
                SCHEMA,
                null,
                null,
                null
            ),
            (exchange, args) -> {
                try {
                    String path = (String) args.get("path");

                    // Security check: validate path
                    if (!isPathAllowed(path, config.getSecurity())) {
                        return new McpSchema.CallToolResult(
                            List.of(new McpSchema.TextContent(
                                "Access denied: path is not in allowed list"
                            )),
                            true
                        );
                    }

                    // Load schema
                    Loaded<Justdb> loaded = SchemaLoaderFactory.load(path, justdbManager);
                    Justdb schema = loaded.getData();

                    // Convert to JSON
                    ObjectMapper mapper = new ObjectMapper();
                    String json = mapper.writerWithDefaultPrettyPrinter()
                        .writeValueAsString(schema);

                    return new McpSchema.CallToolResult(
                        List.of(new McpSchema.TextContent(json)),
                        false
                    );

                } catch (Exception e) {
                    return new McpSchema.CallToolResult(
                        List.of(new McpSchema.TextContent(
                            "Error reading schema: " + e.getMessage()
                        )),
                        true
                    );
                }
            }
        );
    }

    private static boolean isPathAllowed(String path, McpConfig.SecurityConfig security) {
        // Check blocked paths
        for (String blocked : security.getBlockedPaths()) {
            if (path.startsWith(blocked)) {
                return false;
            }
        }

        // If no allowed paths specified, allow all non-blocked
        if (security.getAllowedPaths().isEmpty()) {
            return true;
        }

        // Check allowed paths
        for (String allowed : security.getAllowedPaths()) {
            if (path.startsWith(allowed)) {
                return true;
            }
        }

        return false;
    }
}
```

### Step 5: 实现 CLI 命令

**文件**: `justdb-mcp-cli/src/main/java/org/verydb/justdb/mcp/cli/McpCommand.java`

```java
package org.verydb.justdb.mcp.cli;

import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.cli.BaseCommand;
import org.verydb.justdb.cli.CliContext;
import org.verydb.justdb.mcp.api.McpConfig;
import org.verydb.justdb.mcp.core.server.JustdbMcpServer;
import picocli.CommandLine;
import picocli.CommandLine.Option;

import java.io.File;
import java.util.concurrent.Callable;

/**
 * MCP command for JustDB CLI.
 * 启动 MCP 服务器的命令
 */
@CommandLine.Command(name = "mcp", description = "Start JustDB MCP server")
public class McpCommand extends BaseCommand implements Callable<Integer> {

    @Option(names = {"--config", "-c"}, description = "MCP config file")
    private String configFile;

    @Option(names = {"--allow-db"}, description = "Allow real database operations")
    private Boolean allowRealDatabase;

    @Option(names = {"--transport"}, description = "Transport type (stdio, sse, http)")
    private String transport;

    public McpCommand() {
        this(JustdbManager.getInstance());
    }

    public McpCommand(JustdbManager justdbManager) {
        super(justdbManager);
    }

    public McpCommand(JustdbManager justdbManager, CliContext cliContext) {
        super(justdbManager, cliContext);
    }

    @Override
    public Integer call() throws Exception {
        handleGlobalOptions();

        // Load config
        McpConfig config = loadConfig();

        // Override with CLI options
        if (allowRealDatabase != null) {
            config.getSecurity().setAllowRealDatabase(allowRealDatabase);
        }
        if (transport != null) {
            config.setTransport(transport);
        }

        // Start MCP server
        JustdbMcpServer server = new JustdbMcpServer(config, justdbManager);
        server.start();

        // Keep running (stdio mode)
        System.out.println("JustDB MCP server started on " + config.getTransport());

        // Wait indefinitely (will be terminated by client)
        Thread.currentThread().join();

        return 0;
    }

    private McpConfig loadConfig() {
        if (configFile != null) {
            // Load from file
            return FormatFactory.readValueByExtension(
                justdbManager.getExtensionPointRegistry(),
                new File(configFile),
                configFile,
                McpConfig.class
            );
        }

        // Default config
        McpConfig config = new McpConfig();
        config.getSecurity().setAllowRealDatabase(false);
        return config;
    }
}
```

### Step 6: 集成到 JustDBCli

**文件**: `justdb-core/src/main/java/org/verydb/justdb/cli/JustDBCli.java`

在 `JustDBCli` 中添加 MCP 命令注册：

```java
@CommandLine.Command(name = "justdb", subcommands = {
    InitCommand.class,
    LoadCommand.class,
    DiffCommand.class,
    MigrateCommand.class,
    ValidateCommand.class,
    SqlCommand.class,
    ShowCommand.class,
    ConvertCommand.class,
    Db2SchemaCommand.class,
    TestCommand.class,
    PluginCommand.class,
    DriverCommand.class,
    InteractiveCommand.class,
    WatchCommand.class,
    AiCommand.class,
    AiHistoryCommand.class,
    TestrunCommand.class,
    McpCommand.class  // Add this
})
```

### Step 7: 更新根 pom.xml

在 `/home/wind/workspace/justdb/pom.xml` 的 `<modules>` 中添加：

```xml
<module>justdb-mcp</module>
```

---

## 关键文件列表

### 新建文件

1. `/home/wind/workspace/justdb/justdb-mcp/pom.xml`
2. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-api/pom.xml`
3. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-api/src/main/java/org/verydb/justdb/mcp/api/McpConfig.java`
4. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/pom.xml`
5. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/server/JustdbMcpServer.java`
6. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/SchemaReadTool.java`
7. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/SchemaModifyTool.java`
8. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/SchemaConvertTool.java`
9. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/SchemaExportTool.java`
10. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/SchemaValidateTool.java`
11. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/SchemaMigrateTool.java`
12. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/Db2SchemaTool.java`
13. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-core/src/main/java/org/verydb/justdb/mcp/core/tools/AiHistoryTool.java`
14. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-cli/pom.xml`
15. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-cli/src/main/java/org/verydb/justdb/mcp/cli/McpCommand.java`
16. `/home/wind/workspace/justdb/justdb-mcp/justdb-mcp-integration-tests/pom.xml`

### 修改文件

1. `/home/wind/workspace/justdb/pom.xml` - 添加模块引用
2. `/home/wind/workspace/justdb/justdb-core/src/main/java/org/verydb/justdb/cli/JustDBCli.java` - 注册 McpCommand

---

## 验证计划

### 1. 单元测试

```bash
# 运行 MCP 模块测试
mvn test -pl justdb-mcp/justdb-mcp-core
```

### 2. 集成测试

```bash
# 启动 MCP 服务器
justdb mcp

# 从另一个客户端调用 MCP tool
# (需要 MCP 客户端实现)
```

### 3. 端到端测试

```bash
# 测试 schema 读取
echo '{"method": "tools/call", "params": {"name": "read_schema", "arguments": {"path": "schema.yaml"}}}' | justdb mcp

# 测试格式转换
echo '{"method": "tools/call", "params": {"name": "convert_schema", "arguments": {"input": "schema.yaml", "format": "json"}}}' | justdb mcp
```

---

## 配置示例

### 客户端配置 (Claude Desktop)

`~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "justdb": {
      "command": "java",
      "args": [
        "-jar", "/path/to/justdb-cli.jar",
        "mcp",
        "--config", "/path/to/justdb-mcp-config.yaml"
      ],
      "env": {
        "JAVA_HOME": "/usr/lib/jvm/java-17"
      }
    }
  }
}
```

---

## 风险与注意事项

1. **安全性**: 默认禁止真实数据库操作，需要显式启用
2. **路径验证**: 实现严格的路径访问控制
3. **资源管理**: 确保数据库连接正确关闭
4. **错误处理**: 提供清晰的错误信息给客户端
5. **向后兼容**: 不影响现有 CLI 命令功能

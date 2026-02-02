# jdwp-debug

Java 应用程序调试 Skill - 通过 JDWP 协议远程调试 Java 应用

## 功能概述

使用 JDWP (Java Debug Wire Protocol) 协议连接到运行中的 Java 应用程序，提供完整的调试功能，包括断点管理、单步执行、变量查看、表达式求值等。

## 前置条件

### 1. MCP 配置

确保已在 MCP 配置文件中添加 jdwp-debugger：

**配置文件路径**: `C:\Users\night\AppData\Roaming\Qoder\SharedClientCache\mcp.json`

```json
{
  "jdwp-debugger": {
    "command": "d:\\workspace\\jdwp-mcp\\target\\release\\jdwp-mcp.exe"
  }
}
```

### 2. 启动 Java 应用并开启 JDWP

```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar myapp.jar
```

**JDWP 参数说明**:
- `transport=dt_socket`: 使用 socket 传输协议
- `server=y`: JVM 作为调试服务器
- `suspend=n`: 启动时不暂停（`y` 则等待调试器连接后再启动）
- `address=*:5005`: 监听所有网卡的 5005 端口

### 3. Kubernetes 部署的应用

```bash
# 端口转发 JDWP 端口到本地
kubectl port-forward pod/my-app-pod 5005:5005
```

## 可用调试工具

| 工具 | 说明 | 使用示例 |
|------|------|----------|
| `debug.attach` | 连接到 JVM 调试端口 | "连接到 localhost:5005" |
| `debug.set_breakpoint` | 在指定类和行号设置断点 | "在 com.example.HelloController 第 65 行设置断点" |
| `debug.list_breakpoints` | 列出所有已设置的断点 | "显示所有断点" |
| `debug.clear_breakpoint` | 清除指定断点 | "清除 HelloController:65 的断点" |
| `debug.continue` | 继续执行到下一个断点 | "继续执行" |
| `debug.step_over` | 单步跳过（不进入方法） | "单步执行" |
| `debug.step_into` | 单步进入方法内部 | "进入这个方法" |
| `debug.step_out` | 跳出当前方法 | "跳出当前方法" |
| `debug.get_stack` | 获取当前调用栈和局部变量 | "显示调用栈" |
| `debug.evaluate` | 在当前上下文中执行表达式 | "求值 userList.size()" |
| `debug.list_threads` | 列出 JVM 中所有线程 | "列出所有线程" |
| `debug.pause` | 暂停所有线程执行 | "暂停执行" |
| `debug.disconnect` | 断开调试连接 | "断开连接" |

## 使用示例

### 基础调试流程

```
用户: 连接到 localhost:5005 的 JVM
助手: [使用 debug.attach 连接]

用户: 在 com.example.service.UserService 第 42 行设置断点
助手: [使用 debug.set_breakpoint 设置断点]

用户: 当断点命中时，显示调用栈
助手: [使用 debug.get_stack 获取栈信息]

用户: 显示变量 userId 的值
助手: [从栈信息中找到 userId 变量值]

用户: 单步执行下一行
助手: [使用 debug.step_over 单步执行]

用户: 继续执行
助手: [使用 debug.continue 继续]
```

### 表达式求值

```
用户: 在断点处求值表达式: userList.size()
助手: [使用 debug.evaluate 执行表达式]

用户: 求值: request.getHeader("Authorization")
助手: [使用 debug.evaluate 获取请求头]
```

### 线程管理

```
用户: 列出所有线程
助手: [使用 debug.list_threads 列出线程]

用户: 暂停所有线程
助手: [使用 debug.pause 暂停]

用户: 恢复线程执行
助手: [使用 debug.continue 恢复]
```

## 调试架构

```
Qoder ➔ MCP Server ➔ JDWP Client ➔ TCP Socket ➔ JVM
      ⬆️
  智能摘要与上下文过滤
```

**MCP Server 核心功能**:
- **协议转换**: MCP JSON-RPC ↔ JDWP 二进制协议
- **智能摘要**: 自动截断大对象，限制深度，避免信息过载
- **状态管理**: 跟踪断点、线程状态、调试会话

## 常见使用场景

### 1. 本地开发调试

```bash
# 启动 Spring Boot 应用
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 \
     -jar target/myapp.jar
```

```
> 连接 localhost:5005
> 在 UserController.createUser 方法设置断点
> 触发请求后查看变量值
```

### 2. 微服务调试

```bash
# K8s 端口转发
kubectl port-forward svc/user-service 5005:5005
```

```
> 连接 localhost:5005
> 在 UserService 第 100 行设置断点
> 当断点命中时检查服务间调用参数
```

### 3. 生产问题排查（谨慎使用）

```
> 连接到生产环境 JVM（确保有监控和备份）
> 列出所有线程
> 查看特定线程的调用栈
> 不要设置断点，仅查看状态
```

### 4. 单元测试调试

```bash
# Maven 以调试模式运行测试
mvn test -Dmaven.surefire.debug

# 等待调试器连接（默认 5005 端口）
```

```
> 连接 localhost:5005
> 在测试方法中设置断点
> 单步执行查看测试流程
```

## 功能状态

### ✅ 已实现功能
- ✅ JDWP 协议完整实现（握手、数据包编解码）
- ✅ 13 个调试工具的 MCP 接口
- ✅ VirtualMachine 命令（版本、线程管理、挂起/恢复）
- ✅ 类查找和方法信息获取
- ✅ 断点管理（设置、列出、清除）
- ✅ 调用栈获取和局部变量读取
- ✅ 值格式化和智能显示
- ✅ 跨平台支持（Intel/ARM）

### 🚧 开发中功能
- ⏳ 异步断点事件通知
- ⏳ 表达式求值增强
- ⏳ 对象深度检查和字符串解引用
- ⏳ 条件断点支持

## 安全注意事项

⚠️ **生产环境使用警告**:
1. **端口安全**: JDWP 端口不应暴露在公网，建议仅监听 localhost
2. **性能影响**: 调试会话会显著影响 JVM 性能，生产环境需谨慎
3. **暂停风险**: 使用 `suspend=y` 会导致应用启动时暂停
4. **访问控制**: JDWP 无内置认证，依赖网络层安全控制

💡 **最佳实践**:
- ✅ 开发/测试环境优先使用
- ✅ 使用 SSH 隧道或端口转发而非直接暴露端口
- ✅ 调试完成后及时断开连接
- ✅ 生产环境仅在紧急情况下使用，且有监控保护
- ✅ 记录断点位置便于后续调试会话复用

## 故障排查

### 连接失败

**问题**: "无法连接到 localhost:5005"

**解决方案**:
1. 检查 Java 应用是否启动并带有 JDWP 参数
2. 确认端口未被占用: `netstat -ano | findstr 5005`
3. 检查防火墙规则
4. 验证 address 参数（`*:5005` 或 `0.0.0.0:5005`）

### 断点未命中

**问题**: 设置断点后代码执行但未暂停

**可能原因**:
1. 类名或行号不正确
2. 代码已被 JIT 编译优化
3. 类尚未加载

**解决方案**:
1. 验证完整类名（包含包名）
2. 使用 `list_breakpoints` 确认断点已设置
3. 尝试在方法入口行设置断点

### 变量值显示为 null

**问题**: 调用栈中某些变量显示为 null

**可能原因**:
1. 变量作用域问题
2. 编译器优化移除了变量
3. 对象尚未初始化

## 技术细节

### 项目结构

```
jdwp-mcp/
├── jdwp-client/        # JDWP 协议客户端
│   ├── connection.rs   # TCP 连接和握手
│   ├── protocol.rs     # 数据包编解码
│   ├── commands.rs     # JDWP 命令常量
│   ├── types.rs        # JDWP 类型定义
│   └── events.rs       # 事件处理
├── mcp-server/         # MCP 服务器实现
│   ├── main.rs         # Stdio 传输层
│   ├── protocol.rs     # MCP JSON-RPC 协议
│   ├── handlers.rs     # 请求路由和分发
│   ├── tools.rs        # 工具定义和描述
│   └── session.rs      # 调试会话状态管理
└── examples/           # 示例和测试用例
```

### 编译信息

- **源码路径**: `d:\workspace\jdwp-mcp`
- **可执行文件**: `d:\workspace\jdwp-mcp\target\release\jdwp-mcp.exe`
- **编译命令**: `cargo build --release`
- **文件大小**: ~2.4 MB

## 相关资源

- 📚 [JDWP 官方规范](https://docs.oracle.com/javase/8/docs/platform/jpda/jdwp/jdwp-protocol.html)
- 🌐 [Model Context Protocol](https://modelcontextprotocol.io/)
- 💻 [项目 GitHub 仓库](https://github.com/navicore/jdwp-mcp)
- 📖 [Java Platform Debugger Architecture](https://docs.oracle.com/javase/8/docs/technotes/guides/jpda/)

## 自动加载

**支持**: ❌ 不支持自动加载

此 skill 需要手动调用 MCP 工具。在使用前需确保：
1. MCP 配置文件已正确配置 jdwp-debugger
2. Qoder 已重启以加载 MCP 配置
3. 目标 Java 应用已启动并开启 JDWP

## 许可证

MIT License - 详见 [LICENSE](https://github.com/navicore/jdwp-mcp/blob/main/LICENSE)

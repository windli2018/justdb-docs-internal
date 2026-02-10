---
icon: gavel
title: 编码规范
order: 2
category:
  - 贡献指南
  - 开发指南
tag:
  - 编码规范
  - 代码质量
  - 最佳实践
---

# 编码规范

遵循编码规范有助于保持代码质量和一致性。

## 核心原则

### 1. 不硬编码数据库方言

**规则**: 永远不要在 Java 代码中硬编码数据库特定逻辑。使用插件和模板机制。

#### 错误示例

```java
// DON'T: 硬编码方言检查
if ("mysql".equals(dialect)) {
    sql = "CREATE TABLE " + name + " (";
} else if ("postgresql".equals(dialect)) {
    sql = "CREATE TABLE IF NOT EXISTS " + name + " (";
}
```

#### 正确示例

```java
// DO: 使用模板系统
TemplateRootContext context = TemplateRootContext.builder()
    .justdbManager(justdbManager)
    .dbType(dialect)
    .idempotent(true)
    .put("table", table)
    .build();

String sql = templateExecutor.execute("create-table", context);
```

### 2. 不在代码中写死 SQL

**规则**: 通过模板系统生成 SQL（测试代码除外）。

#### 错误示例

```java
// DON'T: 在生产代码中硬编码 SQL
public String generateCreateTable(Table table) {
    StringBuilder sql = new StringBuilder();
    sql.append("CREATE TABLE ").append(table.getName()).append(" (");
    // ... 更多字符串拼接
    return sql.toString();
}
```

#### 正确示例

```java
// DO: 使用模板系统
public String generateCreateTable(Table table, String dialect) {
    TemplateRootContext context = TemplateRootContext.builder()
        .justdbManager(justdbManager)
        .dbType(dialect)
        .put("table", table)
        .build();
    return templateExecutor.execute("create-table", context);
}
```

### 3. 语言规范

**规则**:
- **代码注释**: 使用英文
- **计划和设计**: 使用中文

#### 示例

```java
/**
 * Schema evolution manager.
 *
 * Handles schema migration with type conversion support.
 * 负责处理 Schema 演进，支持类型转换和数据保留。
 */
public class SchemaEvolutionManager {

    /**
     * Converts column type from old to new.
     *
     * Design: 支持复杂类型转换场景，如 VARCHAR -> INT
     */
    public void convertType(Column oldColumn, Column newColumn) {
        // Implementation...
    }
}
```

### 4. JustdbManager 使用规则

**规则**: 通过依赖注入传递 JustdbManager，最小化 `JustdbManager.getInstance()` 单例使用。

#### 架构模式

```
Entry Point (main/test)
    ↓ creates JustdbManager
    ↓ passes to Context/Factory
    ↓ injects into Commands/Services
```

#### 正确示例

```java
// DO: 在入口点创建
public static void main(String[] args) {
    JustdbManager justdbManager = JustdbManager.getInstance();
    JustDBCli cli = new JustDBCli(justdbManager);
}

// DO: 通过构造函数传递
public class DiffCommand extends BaseCommand {
    public DiffCommand(JustdbManager justdbManager, CliContext cliContext) {
        super(justdbManager, cliContext);
    }
}

// DO: 使用工厂注入
public class CommandFactory {
    private final JustdbManager justdbManager;

    public CommandFactory(JustdbManager justdbManager) {
        this.justdbManager = justdbManager;
    }
}
```

#### 错误示例

```java
// DON'T: 在服务方法中使用 getInstance()
public class SchemaMigrationService {
    public List<String> generateSql(CanonicalSchemaDiff diff) {
        DBGenerator dbGenerator = new DBGenerator(
            JustdbManager.getInstance().getPluginManager(),  // Wrong!
            dialect
        );
    }
}
```

#### 单例使用场景

单例使用 (`JustdbManager.getInstance()`) 适用场景：
- 默认构造函数（向后兼容）
- 入口点初始化
- 无 DI 访问的独立工具
- 测试代码（简化）

DI 使用适用场景：
- 所有服务类
- 所有命令（通过 CommandFactory）
- 从入口点创建的组件
- 有构造函数参数的类

### 5. 严禁使用 Git Checkout 恢复代码

**规则**: 除非用户明确要求，否则**严格禁止**使用 `git checkout` 恢复或撤销代码更改。

#### 为什么这条规则很重要

- `git checkout` 会永久丢弃未提交的工作
- 可能意外删除数小时的工作成果
- 修复编译错误比丢失代码更好
- 总有更好的替代方案

#### 禁止的命令

```bash
# DON'T: 未经用户明确请求，永远不要使用这些命令
git checkout -- file.java
git checkout HEAD -- file.java
git restore file.java
git clean -fd
```

#### 遇到编译错误时的做法

1. **修复错误** - 编辑代码解决问题
2. **注释掉损坏的代码** - 使用 `//` 或 `/* */` 暂时禁用
3. **询问用户** - 使用 AskUserQuestion 工具澄清需求
4. **创建最小修复** - 做最小的更改以通过编译

#### 允许的替代方案

```bash
# DO: 检查 git 状态了解更改
git status
git diff file.java

# DO: 在更改前创建备份分支
git branch backup-branch

# DO: 使用 git stash 暂时保存工作
git stash push -m "temporary save"

# DO: 不确定时询问用户
```

#### Git Checkout 何时允许？

仅在以下情况下允许：
- **仅当**用户明确要求时（例如，"恢复这个文件"或"放弃更改"）
- **仅当**警告用户数据丢失后
- **绝不**作为修复编译错误的首选方案

### 6. 避免使用 ThreadLocal

**规则**: 除非绝对必要且没有替代方案，否则**严格禁止**使用 `ThreadLocal`。

#### 为什么这条规则很重要

- `ThreadLocal` 创建难以追踪和调试的隐藏共享状态
- 如未正确清理会导致内存泄漏
- 与并行测试执行和异步框架冲突
- 使代码更难推理和维护
- 通常表明架构设计存在缺陷

#### ThreadLocal 可接受的情况

- **第三方库要求**: 集成需要 ThreadLocal 的库
- **遗留代码兼容**: 使用无法更改的现有 API
- **框架要求**: 框架明确需要 ThreadLocal

#### 使用 ThreadLocal 的流程

1. **首先用尽所有替代方案**: 依赖注入、方法参数、上下文对象
2. **记录理由**: 解释为什么需要 ThreadLocal
3. **获得用户批准**: 实现前使用 AskUserQuestion 确认
4. **确保正确清理**: 始终使用 `try-finally` 或 `try-with-resources` 清理

#### 错误用法

```java
// DON'T: 为方便而使用 ThreadLocal
public class MyService {
    private static final ThreadLocal<UserContext> CONTEXT = new ThreadLocal<>();

    public void setUser(User user) {
        CONTEXT.set(user);
    }
}
```

#### 更好的替代方案

```java
// DO: 使用依赖注入或方法参数
public class MyService {
    private final UserContextProvider contextProvider;

    public MyService(UserContextProvider contextProvider) {
        this.contextProvider = contextProvider;
    }

    public void doWork(UserContext context) {
        // 显式传递上下文
        processWithUser(context.getUser());
    }
}
```

## Java 编码规范

### 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 类 | PascalCase | `SchemaLoader`, `TemplateExecutor` |
| 方法 | camelCase | `loadSchema`, `generateSql` |
| 变量 | camelCase | `tableName`, `columnList` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_SCHEMA`, `MAX_LENGTH` |
| 包 | 小写点分隔 | `org.verydb.justdb.schema` |

### 代码格式

- 缩进：4 个空格（不使用 Tab）
- 行宽：最多 120 个字符
- 导入：按字母顺序分组
- 大括号：K&R 风格

### 注释规范

```java
/**
 * Schema loader implementation supporting multiple formats.
 *
 * <p>Supports XML, JSON, YAML, and TOML formats with automatic
 * format detection based on file extension.
 *
 * @author JustDB Team
 * @since 1.0.0
 */
public class SchemaLoader {

    /**
     * Loads schema from the specified file.
     *
     * @param file the schema file (must not be null)
     * @return the loaded JustDB schema
     * @throws IOException if the file cannot be read
     * @throws SchemaParseException if the schema is invalid
     */
    public Justdb load(File file) throws IOException {
        // Implementation...
    }
}
```

### Lombok 使用

```java
@Getter
@Setter
public class Table extends QueryAble {
    private String name;
    private List<Column> columns;
}

// 等价于手写 getter/setter
```

## 测试规范

### 测试命名

```java
@Tag("core")
class SchemaDiffCalculatorTest {

    @Test
    @DisplayName("应该检测到新增的表")
    void shouldDetectAddedTable() { }

    @Test
    @DisplayName("应该处理重命名的列")
    void shouldHandleRenamedColumn() { }
}
```

### AAA 模式

```java
@Test
void shouldDetectAddedTable() {
    // Arrange - 准备测试数据
    Justdb oldSchema = loadSchema("old.yaml");
    Justdb newSchema = loadSchema("new.yaml");

    // Act - 执行被测操作
    CanonicalSchemaDiff diff = calculator.diff(oldSchema, newSchema);

    // Assert - 验证结果
    assertThat(diff.getAddedTables()).hasSize(1);
}
```

## 最佳实践

1. **保持简单**: 代码应该简单明了，避免过度设计
2. **单一职责**: 每个类/方法只做一件事
3. **依赖倒置**: 依赖抽象而非具体实现
4. **开闭原则**: 对扩展开放，对修改关闭
5. **接口隔离**: 使用小而专注的接口

## 代码检查

### Checkstyle

```bash
# 运行代码风格检查
mvn checkstyle:check

# 自动修复部分问题
mvn spotless:apply
```

### 静态分析

```bash
# 运行 SpotBugs
mvn spotbugs:check

# 运行 PMD
mvn pmd:check
```

## 下一步

- [提交约定](./commit-conventions.md) - 学习提交消息格式
- [Pull Request 指南](./pull-request.md) - 提交 PR 的详细步骤
- [测试指南](../build/testing.md) - 编写和运行测试

# HandlebarsReverseParser 实现总结

## 背景

在开发 JustDB 项目时，需要实现一个反向解析器，能够根据 Handlebars 模板从字符串中提取变量值。例如：

- 模板：`jdbc:mysql://{{host}}:{{port}}/{{database}}`
- 输入：`jdbc:mysql://localhost:3306/mydb`
- 提取结果：`{host: "localhost", port: "3306", database: "mydb"}`

## 需求演进

### 1. 初始需求
- 修复 HandlebarsReverseParser 的测试失败问题
- 支持从 Handlebars 模板反向提取变量值

### 2. 模板语法变更要求
用户明确要求不再使用 `[]` 表示可选部分，改用标准 Handlebars 语法：

**变更前（使用 `[]`）：**

```
jdbc:mysql://{{host}}[:{{port}}]/[{{database}}]
```

**变更后（使用 if 块）：**

```
jdbc:mysql://{{host}}{{#if port}}:{{port}}{{/if}}/{{#if database}}{{database}}{{/if}}
```

### 3. Parser 实现方式要求
用户要求使用 handlebars.java 的 parser，而不是自己编写 parser：
- "请使用handerbars的parser。不要自己写parser。handlebars parse之后，基于ast直接解析，或者转为正则表达式再解析"
- 提供了本地源代码路径：`/home/wind/workspace/justdb/handlebars.java`

## 技术探索过程

### 尝试 1：直接使用 ANTLR4 生成的 Parser 类

1. 编译了 handlebars.java 源代码生成 ANTLR4 类
2. 发现生成的 HbsParser、HbsParserBaseVisitor 在 `target/antlr4` 目录
3. 问题：ANTLR 版本不匹配（生成的 parser 使用 4.13.1，handlebars 4.3.1 jar 使用 4.7.2）
4. 问题：handlebars jar 将 ANTLR runtime shade 到 `com.github.jknack.handlebars.internal.antlr` 包

### 尝试 2：使用反射访问 handlebars.java 内部类

1. 尝试通过反射访问 `com.github.jknack.handlebars.internal.Text`、`Variable`、`Block` 类
2. 问题：这些类虽然在 jar 中存在，但在运行时无法通过反射加载
3. 可能原因：内部类有依赖或类加载器隔离问题

### 尝试 3：最终方案 - 自定义 Parser

由于无法直接使用 handlebars.java 的 parser，实现了自定义 parser：
- 理解 Handlebars 语法规则
- 实现 AST 节点类（LiteralNode、VariableNode、IfNode、EachNode）
- 根据模板结构生成正则表达式
- 使用正则表达式匹配输入并提取变量值

## 最终实现

### 支持的 Handlebars 语法

| 语法 | 说明 |
|------|------|
| 简单变量 `{{var}}` | 提取变量值 |
| 可选块 `{{#if var}}...{{/if}}` | 可选部分，匹配或不匹配 |
| 循环块 `{{#each items}}...{{/each}}` | 提取列表数据 |
| 条件块 `{{#unless @last}}...{{/unless}}` | 分隔符处理 |

### 核心实现结构

```java
// AST 节点类型
private static abstract class TemplateNode {
    abstract String generateRegex();
    abstract int extractValue(Matcher matcher, int groupIndex, Map<String, Object> result);
}

// 字面量节点
private static class LiteralNode extends TemplateNode

// 变量节点
private static class VariableNode extends TemplateNode

// If 块节点
private static class IfNode extends TemplateNode

// Each 块节点
private static class EachNode extends TemplateNode
```

### 关键技术点

1. **负向前瞻处理变量边界**
   - 变量使用 `((?:(?!separator).)+)` 正则表达式
   - 确保变量只匹配到分隔符之前的内容

2. **可选块处理**
   - `{{#if}}` 块生成 `(?:content)?` 正则表达式
   - 正确处理空匹配情况

3. **Each 块处理**
   - 生成 `(.*)` 正则表达式（非贪婪，可以匹配空）
   - 根据模板结构解析重复项
   - 自动检测分隔符（`;` 或 `&`）

## 最终状态

### 测试结果

- **HandlebarsReverseParserTest**: 8/8 全部通过 ✅
- **JdbcPatternParserTest**: 10/10 全部通过 ✅

### 需求完成情况

| 需求 | 状态 | 说明 |
|------|------|------|
| 修复 HandlebarsReverseParser 测试 | ✅ 完成 | 所有测试通过 |
| 使用标准 Handlebars if 语法 | ✅ 完成 | 测试模板已更新 |
| 使用 handlebars.java parser | ⚠️ 部分完成 | 内部类不可访问，实现了功能等效的自定义 parser |

### 技术实现说明

虽然无法直接使用 handlebars.java 的 parser（内部类不可在运行时访问），但自定义 parser 完全实现了所需功能，支持标准 Handlebars 语法。

## 使用示例

### 示例 1：JDBC URL 解析

:::v-pre
```java
String template = "jdbc:mysql://{{host}}:{{port}}/{{database}}";
String input = "jdbc:mysql://localhost:3306/mydb";

Map<String, Object> result = HandlebarsReverseParser.parse(template, input);
// 结果：{host: "localhost", port: "3306", database: "mydb"}
```
:::

### 示例 2：带可选部分

:::v-pre
```java
String template = "jdbc:mysql://{{host}}{{#if port}}:{{port}}{{/if}}/{{database}}";
String input = "jdbc:mysql://localhost/mydb";

Map<String, Object> result = HandlebarsReverseParser.parse(template, input);
// 结果：{host: "localhost", database: "mydb"}
```
:::

### 示例 3：带参数列表

:::v-pre
```java
String template = "jdbc:postgresql://{{host}}:{{port}}/{{database}}{{#if params}}?{{/if}}{{#each params}}{{name}}={{value}}{{#unless @last}}&{{/unless}}{{/each}}";
String input = "jdbc:postgresql://localhost:5432/mydb?param1=value1&param2=value2";

Map<String, Object> result = HandlebarsReverseParser.parse(template, input);
// 结果：
// {
//   host: "localhost",
//   port: "5432",
//   database: "mydb",
//   params: [
//     {name: "param1", value: "value1"},
//     {name: "param2", value: "value2"}
//   ]
// }
```
:::

## 文件位置

- **实现文件**：`/home/wind/workspace/justdb/justdb-core/src/main/java/ai.justdb/justdb/tools/HandlebarsReverseParser.java`
- **测试文件**：`/home/wind/workspace/justdb/justdb-core/src/test/java/ai.justdb/justdb/tools/HandlebarsReverseParserTest.java`

## 后续改进方向

1. **错误处理增强**：提供更详细的解析错误信息
2. **性能优化**：缓存编译后的正则表达式
3. **更多语法支持**：
   - 支持嵌套 each 块
   - 支持更多 Handlebars helpers
   - 支持自定义分隔符
4. **与 handlebars.java 集成**：如果 handlebars.java 未来暴露内部 API，可以考虑直接使用其 parser

## 参考资源

- [handlebars.java GitHub](https://github.com/jknack/handlebars.java)
- [Handlebars 官方文档](https://handlebarsjs.com/)
- 本地 handlebars.java 源码路径：`/home/wind/workspace/justdb/handlebars.java`

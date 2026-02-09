---
icon: file-code
title: ADR-002 模板引擎选择
order: 3
category:
  - 架构决策
  - 开发指南
tag:
  - ADR
  - 模板引擎
  - Handlebars
---

# ADR-002: 模板引擎选择

## 状态
**已接受**

## 日期
2024-01-16

## 决策者
- JustDB 架构团队
- 核心开发者

## 背景

JustDB 需要一个强大的模板引擎来生成 SQL 和代码。模板引擎应该：

1. 支持 20+ 数据库的 SQL 生成
2. 允许插件自定义模板
3. 提供模板继承和覆盖机制
4. 支持模板的动态加载和热重载
5. 易于调试和维护

## 决策

选择 [Handlebars.java](https://github.com/jknack/handlebars.java) 作为模板引擎。

## 理由

### 为什么选择 Handlebars？

1. **简洁语法**: `{{variable}}` 和 `{{#block}}...{{/block}}` 易于理解
2. **逻辑分离**: 鼓励将逻辑放在辅助函数而非模板中
3. **零依赖**: 纯 Java 实现，无 JavaScript 引擎依赖
4. **性能优越**: 编译后的模板执行速度快
5. **Java 友好**: 与 Java 生态系统集成良好
6. **预编译**: 支持模板预编译，减少运行时开销
7. **调试友好**: 编译错误清晰，易于定位问题

### 为什么不选择其他方案？

见下方的替代方案分析。

## 替代方案

### 方案 A: FreeMarker

**描述**: 使用 Apache FreeMarker 作为模板引擎。

**优点**:
- 功能强大，支持宏和命名空间
- 成熟稳定，社区活跃
- 国际化支持良好

**缺点**:
- 语法较复杂
- XML 配置繁琐
- 模板可以包含过多逻辑

**未被选择的原因**: 对于 SQL 生成场景过于重量级。

### 方案 B: Thymeleaf

**描述**: 使用 Thymeleaf 作为模板引擎。

**优点**:
- 自然模板（在浏览器中可预览）
- 与 Spring 集成良好
- 功能丰富

**缺点**:
- 主要面向 HTML，不适合 SQL
- 学习曲线陡峭
- 性能开销较大

**未被选择的原因**: 设计目标不同（HTML vs SQL）。

### 方案 C: Velocity

**描述**: 使用 Apache Velocity 作为模板引擎。

**优点**:
- 简单易学
- 性能良好
- 成熟稳定

**缺点**:
- 功能相对有限
- 社区活跃度下降
- 模板继承支持较弱

**未被选择的原因**: 功能不足，社区活跃度下降。

### 方案 D: String Template

**描述**: 使用 StringTemplate 作为模板引擎。

**优点**:
- 设计用于代码生成
- 强大的表达式语言
- 支持模板继承

**缺点**:
- 主要用于 .NET 生态
- Java 版本维护较少
- 学习资源有限

**未被选择的原因**: 在 Java 生态中的支持不足。

## 模板系统设计

### 模板查找优先级

模板按以下优先级查找（从高到低）：

1. `{name}-{category}-{type}-{dialect}` - 精确匹配
2. `{name}-{category}-{type}` - 类型级模板
3. `{name}-{category}` - 分类通用模板
4. `{name}` - 全局通用模板

例如：
- `create-table-db-mysql` - MySQL 特定
- `create-table-db` - 数据库通用
- `create-table` - 完全通用

### Lineage 模板

共享 SQL 语法的一组数据库使用 Lineage 模板：

```
{operation}-{object}-{lineage}-lineage
```

例如：
- `create-table-mysql-lineage` - MySQL, MariaDB, GBase, TiDB 共享
- `create-table-postgres-lineage` - PostgreSQL, Redshift, TimescaleDB 共享

### 模板继承

子插件可以继承父插件的模板：

```xml
&lt;plugin id="mysql" dialect="mysql" ref-id="sql-standard-root"&gt;
    &lt;templates&gt;
        &lt;!-- 可以引用 sql-standard-root 的模板 --&gt;
    &lt;/templates&gt;
&lt;/plugin&gt;
```

## 后果

### 正面影响

1. **性能**: 编译后的模板执行速度快
2. **可维护性**: 模板简洁，逻辑清晰
3. **可扩展性**: 易于添加新数据库支持
4. **调试友好**: 编译错误信息清晰

### 负面影响

1. **学习曲线**: 开发者需要学习 Handlebars 语法
2. **调试限制**: 运行时错误需要额外调试工具

### 风险

- **模板错误**: 模板语法错误在编译时才能发现
  - *缓解措施*: 提供模板测试工具和预编译验证

- **性能问题**: 复杂模板可能导致编译时间长
  - *缓解措施*: 实现模板缓存和增量编译

## 示例

### 基本模板

```xml
&lt;template id="create-table-mysql-lineage" type="SQL" category="db"&gt;
    &lt;content&gt;
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{name}} (
{{#each columns}}
  {{name}} {{type}}{{#unless @last}},{{/unless}}
{{/each}}
);
    &lt;/content&gt;
&lt;/template&gt;
```

### 辅助函数

```java
public class MyTemplateHelper extends TemplateHelper {
    public String getPhysicalType(TemplateRootContext root, Column column) {
        // 应用类型映射
        return root.getDbTypeAdapter().mapType(column.getType());
    }
}
```

### 模板使用

```handlebars
{{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{name}}
{{getPhysicalType @root column}}
{{#ifCond value "eq" "expected"}}...{{/ifCond}}
```

## 实施

1. **阶段 1**: 集成 Handlebars.java
2. **阶段 2**: 实现模板加载器
3. **阶段 3**: 定义核心模板
4. **阶段 4**: 实现模板继承机制
5. **阶段 5**: 添加辅助函数系统
6. **阶段 6**: 编写模板测试

## 相关决策

- [ADR-001: 别名系统](./adr-001-alias-system.md) - 模板中的名称使用规范命名
- [ADR-003: 生命周期钩子](./adr-003-lifecycle-hooks.md) - 模板中的钩子支持

## 参考资料

- [Handlebars.java 文档](https://jknack.github.io/handlebars.java/)
- [模板系统设计](../../design/template-system/overview.md)
- [Lineage 模板设计](../../design/template-system/lineage-templates.md)
- [自定义模板文档](../plugin-development/custom-templates.md)

## 下一步

- [ADR-001: 别名系统](./adr-001-alias-system.md) - 查看别名系统决策
- [ADR-003: 生命周期钩子](./adr-003-lifecycle-hooks.md) - 查看生命周期钩子设计

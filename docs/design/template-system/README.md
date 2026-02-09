---
icon: code
title: 模板系统
order: 3
---

# 模板系统

JustDB 的模板系统基于 Handlebars，提供了强大的 SQL 生成能力。

## 概述

模板系统是 JustDB 的核心组件，负责将 Schema 定义转换为特定数据库的 SQL 语句。

## 核心特性

- **多数据库支持**：通过模板继承支持 20+ 数据库
- **可扩展性**：支持自定义模板和辅助函数
- **类型安全**：基于 Schema 类型生成正确的 SQL
- **条件渲染**：支持基于 Schema 状态的条件 SQL 生成

## 模板类型

### SQL 模板

生成数据库 SQL 语句：

```handlebars
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
  {{#each columns}}
  {{> column-spec}}{{#unless @last}},{{/unless}}
  {{/each}}
);
```

### Java 模板

生成 Java 代码：

```handlebars
public class {{TableName}} {
  {{#each columns}}
  private {{javaType}} {{camelCase name}};
  {{/each}}
}
```

### 配置模板

生成配置文件：

```handlebars
{{#each tables}}
table.{{name}}.{{property}}={{value}}
{{/each}}
```

## 相关文档

- **[模板继承](./inheritance.md)** - 模板继承机制
- **[辅助函数](./helpers.md)** - 内置辅助函数
- **[自定义模板](./custom-templates.md)** - 创建自定义模板

## 最佳实践

1. 使用模板继承减少重复
2. 利用辅助函数简化逻辑
3. 保持模板简洁可读
4. 充分测试所有数据库方言

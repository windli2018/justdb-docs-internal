---
icon: wand-magic-sparkles
title: 模板辅助函数
order: 4
category:
  - 插件开发
  - 开发指南
tag:
  - 辅助函数
  - Handlebars
  - 模板
---

# 模板辅助函数

模板辅助函数 (Template Helper) 是 Handlebars 模板的扩展，用于在模板中执行自定义逻辑。

## 什么是辅助函数？

辅助函数是在模板中可调用的 Java 方法，用于：

- 类型转换和格式化
- 条件判断
- 字符串操作
- 访问 JustDB 内部功能

## 内置辅助函数

### getPhysicalType

获取列的物理类型（应用类型映射）：

```handlebars
{{getPhysicalType @root column}}
```

### ifCond

条件比较辅助函数：

```handlebars
{{#ifCond value1 "eq" value2}}
  值相等
{{/ifCond}}

{{#ifCond value1 "ne" value2}}
  值不相等
{{/ifCond}}
```

支持的操作符：
- `eq` - 等于
- `ne` - 不等于
- `gt` - 大于
- `lt` - 小于
- `gte` - 大于等于
- `lte` - 小于等于

### getFirst

获取集合的第一个元素：

```handlebars
{{#if formerNames}}
  旧名称: {{getFirst formerNames}}
{{/if}}
```

## 创建自定义辅助函数

### 实现 Helper 接口

```java
package com.example.justdb.helper;

import com.github.jknack.handlebars.Options;
import org.verydb.justdb.templates.TemplateHelper;

public class CustomTemplateHelper extends TemplateHelper {

    /**
     * 格式化列注释为数据库注释
     * 用法: {{formatComment comment}}
     */
    public String formatComment(String comment) {
        if (comment == null || comment.isEmpty()) {
            return "";
        }
        // 移除换行，转义单引号
        return comment.replace("\n", " ").replace("'", "''");
    }

    /**
     * 条件辅助函数
     * 用法: {{#ifEquals value1 value2}}...{{/ifEquals}}
     */
    public Object ifEquals(Object value1, Options options) {
        if (value1 == null) {
            return options.inverse();
        }
        if (value1.equals(options.params[0])) {
            return options.fn();
        }
        return options.inverse();
    }

    /**
     * 字符串截断
     * 用法: {{truncate text maxLength}}
     */
    public CharSequence truncate(String text, int maxLength) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }
}
```

### 注册辅助函数

#### XML 方式

在 `default-plugins.xml` 或插件文件中：

```xml
&lt;plugin id="my-plugin" name="My Plugin"&gt;
    &lt;helpers&gt;
        <TemplateHelper id="custom-helper"
                        class="com.example.justdb.helper.CustomTemplateHelper"/>
    &lt;/helpers&gt;
&lt;/plugin&gt;
```

#### 编程方式

```java
JustdbManager manager = JustdbManager.getInstance();
PluginManager pluginManager = manager.getPluginManager();

// 创建并注册辅助函数
CustomTemplateHelper helper = new CustomTemplateHelper();
pluginManager.registerHelper("formatComment", helper::formatComment);
pluginManager.registerHelper("ifEquals", helper::ifEquals);
```

## 在模板中使用

### 基本使用

```handlebars
{{formatComment column.comment}}

{{#ifEquals column.type "VARCHAR"}}
  VARCHAR 类型
{{/ifEquals}}
```

### 复杂场景

```handlebars
&lt;!-- 带注释的列定义 --&gt;
&lt;template id="column-with-comment" type="SQL" category="db"&gt;
    &lt;content&gt;
        {{column.name}} {{column.type}}
        {{#if column.comment}}
            COMMENT '{{formatComment column.comment}}'
        {{/if}}
    &lt;/content&gt;
&lt;/template&gt;
```

## 上下文感知辅助函数

### 访问模板上下文

```java
public class ContextAwareHelper extends TemplateHelper {

    /**
     * 根据数据库类型生成不同的 SQL
     */
    public String databaseSpecific(Object value, Options options) {
        // 获取 root 上下文
        TemplateRootContext root = options.context.get("@root");
        String dbType = root.getDbType();

        switch (dbType) {
            case "mysql":
                return mysqlFormat(value);
            case "postgresql":
                return postgresFormat(value);
            default:
                return value.toString();
        }
    }
}
```

## 常用辅助函数模式

### 1. 类型转换

```java
public String toJavaType(String dbType) {
    switch (dbType.toUpperCase()) {
        case "VARCHAR":
        case "TEXT":
            return "String";
        case "INT":
        case "INTEGER":
            return "Integer";
        case "BIGINT":
            return "Long";
        default:
            return "Object";
    }
}
```

### 2. 名称转换

```java
/**
 * 转换为 Java 驼峰命名
 */
public String toCamelCase(String snakeCase) {
    if (snakeCase == null || snakeCase.isEmpty()) {
        return "";
    }

    String[] parts = snakeCase.split("_");
    StringBuilder result = new StringBuilder(parts[0].toLowerCase());

    for (int i = 1; i < parts.length; i++) {
        if (!parts[i].isEmpty()) {
            result.append(Character.toUpperCase(parts[i].charAt(0)))
                  .append(parts[i].substring(1).toLowerCase());
        }
    }

    return result.toString();
}
```

### 3. 列表处理

```java
/**
 * 连接列表为字符串
 */
public String join(List&lt;?&gt; items, String delimiter) {
    if (items == null || items.isEmpty()) {
        return "";
    }

    return items.stream()
        .map(Object::toString)
        .collect(Collectors.joining(delimiter));
}
```

## 测试辅助函数

### 单元测试

```java
@Test
void testFormatComment() {
    CustomTemplateHelper helper = new CustomTemplateHelper();

    String result = helper.formatComment("Line 1\nLine 2's value");

    assertEquals("Line 1 Line 2''s value", result);
}

@Test
void testToCamelCase() {
    CustomTemplateHelper helper = new CustomTemplateHelper();

    assertEquals("userName", helper.toCamelCase("user_name"));
    assertEquals("id", helper.toCamelCase("id"));
}
```

### 模板集成测试

```java
@Test
void testHelperInTemplate() throws Exception {
    TemplateExecutor executor = new TemplateExecutor(justdbManager);

    // 注册辅助函数
    executor.registerHelper("toCamelCase", new CustomTemplateHelper()::toCamelCase);

    // 准备数据
    Map&lt;String, Object&gt; data = new HashMap&lt;&gt;();
    data.put("tableName", "user_profile");

    // 执行模板
    String result = executor.execute("{{toCamelCase tableName}}", data);

    assertEquals("userProfile", result);
}
```

## 最佳实践

1. **保持简单**: 辅助函数应该做一件事并做好
2. **无状态**: 辅助函数应该是无状态的，避免副作用
3. **命名清晰**: 使用描述性的名称
4. **文档注释**: 为每个辅助函数添加 JavaDoc
5. **错误处理**: 优雅处理 null 和无效输入

## 常见场景

### 生成 Java 代码

```handlebars
public class {{toPascalCase table.name}} {
    {{#each table.columns}}
    private {{toJavaType type}} {{toCamelCase name}};
    {{/each}}
}
```

### 条件渲染

```handlebars
{{#ifCond column.nullable "ne" true}}
    NOT NULL
{{/ifCond}}
```

### 格式化选项

```handlebars
OPTIONS ({{#each options}}{{key}}={{value}}{{#unless @last}}, {{/unless}}{{/each}})
```

## 下一步

- [自定义模板](./custom-templates.md) - 创建 SQL 模板
- [扩展点开发](./extension-points.md) - 定义扩展属性
- [插件开发概述](./README.md) - 返回插件开发概述

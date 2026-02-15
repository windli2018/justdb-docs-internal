---
icon: code
title: 模板辅助函数
order: 3
---

# 模板辅助函数

JustDB 提供的内置 Handlebars 辅助函数。

## 字符串函数

### camelCase

转换为驼峰命名：

```handlebars
{{camelCase table_name}}  <!-- table_name → tableName -->
```

### snakeCase

转换为蛇形命名：

```handlebars
{{snakeCase TableName}}  <!-- TableName → table_name -->
```

### kebabCase

转换为短横线命名：

```handlebars
{{kebabCase TableName}}  <!-- TableName → table-name-spec -->
```

### pascalCase

转换为帕斯卡命名：

```handlebars
{{pascalCase table_name}}  <!-- table_name → TableName -->
```

### pluralize

复数化单词：

```handlebars
{{pluralize item}}  <!-- item → items -->
```

### singularize

单数化单词：

```bars
{{singularize items}}  <!-- items → item -->
```

## SQL 函数

### quoteIdentifier

引用标识符（添加数据库特定的引号）：

```handlebars
{{quoteIdentifier column_name}}
-- MySQL: `column_name`
-- PostgreSQL: "column_name"
-- SQL Server: [column_name]
```

### escapeLiteral

转义字符串字面量：

```handlebars
{{escapeLiteral user's input}}
-- user''s input
```

### formatType

格式化数据类型：

```handlebars
{{formatType type length}}
-- VARCHAR(50)
```

## 条件函数

### eq

等于比较：

```handlebars
{{#eq type "VARCHAR"}}字符串类型{{/eq}}
```

### ne

不等于比较：

```handlebars
{{#ne type "INTEGER"}}非整数类型{{/ne}}
```

### and

逻辑与：

```handlebars
{{#and (eq type "INTEGER") (eq nullable false)}}整数且非空{{/and}}
```

### or

逻辑或：

```handlebars
{{#or (eq type "BIGINT") (eq type "INTEGER")}}整数类型{{/or}}
```

### not

逻辑非：

```handlebars
{{#not nullable}}非空{{/not}}
```

## 集合函数

### first

获取第一个元素：

```handlebars
{{first columns}}
```

### last

获取最后一个元素：

```handlebars
{{last columns}}
```

### join

连接数组元素：

```handlebars
{{join columns ", "}}  <!-- 用逗号连接列名 -->
```

### length

获取数组长度：

```handlebars
{{length columns}}
```

## 默认值函数

### default

提供默认值：

```handlebars
{{default comment "无注释"}}
```

### or

提供替代值：

```handlebars
{{or comment "无注释"}}
```

## 自定义 Helper

### 创建自定义 Helper

```java
@TemplateHelper("formatTimestamp")
public class TimestampHelper {

    public Object apply(Options options) {
        Date date = options.param(0, Date.class);
        String format = options.param(1, String.class);

        SimpleDateFormat sdf = new SimpleDateFormat(format);
        return sdf.format(date);
    }
}
```

### 注册 Helper

```java
TemplateHelper helper = new TemplateHelper() {
    @Override
    public String getName() {
        return "formatTimestamp";
    }

    @Override
    public Object apply(Object context, Object[] args) {
        // 实现逻辑
    }
};

pluginManager.registerHelper(helper);
```

## 使用示例

### 复杂表定义

```handlebars
CREATE TABLE {{> table-name-spec}} (
{{#each columns}}
  {{name}} {{formatType type length}}{{#unless @last}},{{/unless}}
{{/each}}
{{#if (eq primaryKey "true")}}
,
  PRIMARY KEY ({{name}})
{{/if}}
);
```

### 条件索引

```handlebars
{{#if unique}}
CREATE UNIQUE INDEX {{name}}
{{else}}
CREATE INDEX {{name}}
{{/if}}
ON {{> table-name-spec}} ({{join columns ", "}});
```

### 外键约束

```handlebars
ALTER TABLE {{> table-name-spec}}
ADD CONSTRAINT {{name}}
FOREIGN KEY ({{foreignKey}})
REFERENCES {{referencedTable}}({{referencedColumn}})
{{#if (eq onDelete "CASCADE")}} ON DELETE CASCADE{{/if}}
{{#if (eq onUpdate "RESTRICT")}} ON UPDATE RESTRICT{{/if}};
```

## 相关文档

- **[模板继承](./inheritance.html)** - 模板继承机制
- **[自定义模板](./custom-templates.html)** - 创建自定义模板
- **[模板系统设计](/design/template-system/)** - 设计文档

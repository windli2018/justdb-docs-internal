---
icon: puzzle-piece
title: 自定义模板
order: 4
---

# 自定义模板

创建和使用自定义 JustDB 模板。

## 概述

自定义模板允许你：
- 扩展 SQL 生成功能
- 添加项目特定的模式
- 覆盖默认模板

## 模板位置

### 项目目录

```
myapp/
├── justdb/
│   └── templates/
│       ├── create-table-db-mydb.hbs
│       └── drop-table-db-mydb.hbs
```

### Maven 资源

```
src/main/resources/
└── justdb/
    └── templates/
        └── create-table-db-custom.hbs
```

### 外部目录

```yaml
schema:
  templateLocations:
    - /path/to/templates
```

## 模板语法

### 文件名格式

```
{name}-{category}-{type}{-dialect}.hbs
```

| 组件 | 说明 | 示例 |
|------|------|------|
| `name` | 模板名称 | `create-table` |
| `category` | 模板分类 | `db`, `java` |
| `type` | 模板类型 | 空字符串（通用）或具体类型 |
| `dialect` | 数据库方言（可选） | `mysql`, `postgresql` |

### 示例文件名

```
create-table-db-mysql.hbs       # MySQL 表创建
create-index-db-postgresql.hbs   # PostgreSQL 索引
drop-table-db.hbs                # 通用表删除
```

## 模板内容

### Handlebars 语法

```handlebars
<!-- create-table-db-mysql.hbs -->
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (
{{#each columns}}
  {{name}} {{type}}
  {{#if (eq nullable false)}}NOT NULL{{/if}}
  {{#if defaultValue}}DEFAULT {{defaultValue}}{{/if}}
  {{#if comment}}COMMENT '{{comment}}'{{/if}}
  {{#unless @last}},{{/unless}}
{{/each}}
{{#if primaryKey}}
,
  PRIMARY KEY ({{#each primaryKey}}{{this}}{{#unless @last}}, {{/unless}}{{/each}})
{{/if}}
);
```

## 模板注入

### 注入位置

- `injectBefore` - 在模板之前注入
- `injectAfter` - 在模板之后注入
- `injectReplace` - 替换模板内容

### XML 配置

```xml
<GenericTemplate id="custom-create" name="create-table" type="SQL" category="db"
                 injectAfter="create-table"
                 dialect="mydb">
  <content>
    -- Custom table creation logic
    CREATE TABLE {{> table-name-spec}} (
      {{#each columns}}
      {{name}} {{type}}
      {{#unless @last}},{{/unless}}
      {{/each}}
    ) {{#if comment}}COMMENT '{{comment}}'{{/if}};
  </content>
</GenericTemplate>
```

### Java 配置

```java
GenericTemplate template = GenericTemplate.builder()
    .id("custom-create")
    .name("create-table")
    .type(TemplateType.SQL)
    .category(TemplateCategory.DB)
    .dialect("mydb")
    .injectAfter("create-table")
    .content("...")
    .build();

pluginManager.registerTemplate(template);
```

## 覆盖默认模板

### 覆盖特定数据库的模板

```
justdb/templates/create-table-db-mysql.hbs
```

这个模板会覆盖 `create-table` + `db` + `mysql` 的默认模板。

### 覆盖所有数据库的模板

```
justdb/templates/create-table-db.hbs
```

这个模板会覆盖所有 `create-table` + `db` 的默认模板。

## 使用自定义 Helper

### 定义 Helper

```java
@TemplateHelper("myCustomHelper")
public class MyHelper {

    public Object apply(Options options) {
        String input = options.param(0, String.class);
        // 处理逻辑
        return input.toUpperCase();
    }
}
```

### 在模板中使用

```handlebars
{{myCustomHelper column_name}}  <!-- COLUMN_NAME -->
```

## 模板开发最佳实践

### 1. 保持简洁

```handlebars
<!-- 好的实践：简洁 -->
CREATE TABLE {{> table-name-spec}} (
  {{> columns}}
);

<!-- 避免：复杂逻辑 -->
CREATE TABLE {{> table-name-spec}} (
  {{#each columns}}
  {{name}} {{#if (eq type 'VARCHAR')}}VARCHAR({{length}}){{else}}{{type}}{{/if}}
  {{#each this}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/each}}
);
```

### 2. 使用 Partial

```handlebars
<!-- 定义可重用的 partial -->
{{#* table-name-spec.hbs *}}
{{#if (eq @root.dbType "mysql")}}`{{name}}`{{/if}}
{{#if (eq @root.dbType "postgresql")}}"{{name}}"{{/if}}
{{#if (eq @root.dbType "sqlserver")}}[{{name}}]{{/if}}
{{/table-name-spec*}}
```

### 3. 条件渲染

```handlebars
{{#if @root.idempotent}}
IF NOT EXISTS
{{/if}}
{{#if @root.safeDrop}}
-- Safe drop: RENAME before DROP
{{/if}}
```

### 4. 测试多数据库

```bash
# 测试 MySQL
justdb migrate --dialect mysql

# 测试 PostgreSQL
justdb migrate --dialect postgresql

# 测试 SQL Server
justdb migrate --dialect sqlserver
```

## 调试模板

### 启用详细输出

```bash
justdb --verbose migrate
```

### 预览生成的 SQL

```bash
justdb migrate --dry-run
```

### 检查模板加载

```bash
justdb info templates
```

## 示例

### 自定义表创建模板

```handlebars
<!-- create-table-db-custom.hbs -->
CREATE TABLE {{> table-name-spec}} (
{{#each columns}}
  {{name}} {{formatType type size}}{{#if (eq nullable false)}} NOT NULL{{/if}}
  {{#if defaultValue}}DEFAULT {{defaultValue}}{{/if}}
  {{#if autoIncrement}}AUTO_INCREMENT{{/if}}
  {{#if comment}}COMMENT '{{comment}}'{{/if}}
  {{#unless @last}},{{/unless}}
{{/each}}
{{#if primaryKey}},
  PRIMARY KEY ({{name}})
{{/if}}
{{#if unique}}
,
  UNIQUE KEY {{name}} ({{name}})
{{/if}}
) ENGINE={{engine}} DEFAULT CHARSET={{charset}};
```

### 自定义索引创建模板

```handlebars
<!-- create-index-db-custom.hbs -->
CREATE {{#if unique}}UNIQUE {{/if}}INDEX {{name}}
ON {{> table-name-spec}} ({{#each columns}}{{name}}{{#unless @last}}, {{/unless}}{{/each}})
{{#if comment}}COMMENT '{{comment}}'{{/if}}
{{#if (eq type "BTREE")}}USING BTREE{{/if}}
{{#if (eq type "HASH")}}USING HASH{{/if}};
```

## 相关文档

- **[模板继承](./inheritance.html)** - 模板继承机制
- **[辅助函数](./helpers.html)** - 内置辅助函数
- **[模板系统设计](/design/template-system/)** - 设计文档

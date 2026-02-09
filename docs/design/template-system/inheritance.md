---
icon: project-diagram
title: 模板继承机制
order: 2
---

# 模板继承机制

JustDB 的模板系统支持多级继承，减少模板重复并提高可维护性。

## 继承层次

模板按优先级选择（从高到低）：

```
1. (name + category + type + dialect)  - 最具体
   例如: create-table-db-mysql

2. (name + category + type)           - 类型级别
   例如: create-table-db

3. (name + category, type='')         - 类别通用模板
   例如: create-table-

4. (name, type='' + category='')      - 全局通用模板
   例如: create-table
```

## Lineage 模板

Lineage 模板是共享的 SQL 语法，用于相关数据库组：

| Lineage | 支持的数据库 |
|---------|-------------|
| `-mysql-lineage` | MySQL, MariaDB, GBase, TiDB |
| `-postgres-lineage` | PostgreSQL, Redshift, TimescaleDB, KingBase |
| `-ansi-lineage` | Oracle, DB2, Derby, HSQLDB, Dameng |
| `-sqlserver-lineage` | SQL Server |
| `-sqlite-lineage` | SQLite, H2 |

## 模板定义

### Lineage 模板（共享）

```xml
<!-- SQL 标准根插件 -->
<plugin id="sql-standard-root">
  <templates>
    <template id="create-table-mysql-lineage" name="create-table-mysql-lineage"
             type="SQL" category="db">
      <content><![CDATA[
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
  {{> columns}}
);
      ]]></content>
    </template>
  </templates>
</plugin>
```

### 引用 Lineage（数据库插件）

```xml
<!-- MySQL 插件 -->
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
  <templates>
    <template id="create-table" name="create-table" type="SQL" category="db">
      <content><![CDATA[
{{> create-table-mysql-lineage}}
      ]]></content>
    </template>
  </templates>
</plugin>
```

## 模板引用语法

### 基本引用

```handlebars
<!-- 引用当前上下文 -->
{{> template-name}}

<!-- 引用父级上下文 -->
{{> template-name ..}}
```

### 条件渲染

```handlebars
{{#if condition}}
  <!-- 当条件为真时显示 -->
{{/if}}

{{#unless condition}}
  <!-- 当条件为假时显示 -->
{{/unless}}
```

### 循环

```handlebars
{{#each items}}
  {{name}}: {{value}}
{{/each}}

{{#each tables}}
  {{> table-spec}}
{{/each}}
```

### 上下文变量

```handlebars
{{@root.justdbManager}}  <!-- JustDB 管理器实例 -->
{{@root.dbType}}         <!-- 数据库类型 -->
{{@root.idempotent}}     <!-- 幂等模式 -->
{{@root.safeDrop}}       <!-- 安全删除模式 -->
{{@root.newtable}}       <!-- 新表对象（安全删除时使用） -->
```

## 内置 Partial

### table-name

生成带引号的表名：

```handlebars
{{> table-name}}  -- `users`, "users", [users]
```

### column-spec

生成列定义：

```handlebars
{{name}} {{type}}{{#if nullable}} NULL{{/if}}{{#unless @last}},{{/unless}}
```

### columns

遍历所有列：

```handlebars
{{#each columns}}
  {{> column-spec}}
{{/each}}
```

## 示例

### 创建表模板

```handlebars
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
{{#each columns}}
  {{> column-spec}}{{#unless @last}},{{/unless}}
{{/each}}
);
```

### 索引模板

```handlebars
CREATE {{#if unique}}UNIQUE {{/if}}INDEX {{name}}
ON {{> table-name}} ({{#each columns}}{{name}}{{#unless @last}}, {{/unless}}{{/each}});
```

### 外键模板

```handlebars
ALTER TABLE {{> table-name}}
ADD CONSTRAINT {{name}}
FOREIGN KEY ({{foreignKey}})
REFERENCES {{referencedTable}}({{referencedColumn}})
{{#if onDelete}} ON DELETE {{onDelete}}{{/if}}
{{#if onUpdate}} ON UPDATE {{onUpdate}}{{/if}};
```

## 模板注入

可以在现有模板前后注入内容：

```xml
<GenericTemplate id="custom-drop" name="custom-drop" type="SQL" category="db"
                 injectAfter="drop-table">
  <content><![CDATA[
DROP TABLE IF EXISTS {{> table-name}} CASCADE;
  ]]></content>
</GenericTemplate>
```

## 最佳实践

1. **使用 Lineage 模板** - 避免重复相同 SQL
2. **保持模板简洁** - 复杂逻辑放在 Helper 中
3. **正确使用条件** - 使用 `{{#if}}` 而非字符串拼接
4. **测试多数据库** - 确保模板在所有方言中工作
5. **注释复杂逻辑** - 帮助维护者理解意图

## 相关文档

- **[辅助函数](./helpers.html)** - 内置辅助函数
- **[自定义模板](./custom-templates.html)** - 创建自定义模板
- **[模板系统设计](/design/template-system/)** - 设计文档

# Plugin 插件扩展速查

Plugin（插件）是 JustDB 的核心扩展机制，支持自定义数据库适配、SQL 模板、类型映射等。

## 快速示例

### 最小插件配置

```xml
<plugin id="custom-db" version="1.0.0" name="Custom Database">
    <!-- 数据库适配器 -->
    <databaseAdapters>
        <DatabaseAdapter id="custom-db">
            <urlPattern>jdbc:custom-db://.*</urlPattern>
            <driverClass>com.custom.jdbc.Driver</driverClass>
        </DatabaseAdapter>
    </databaseAdapters>

    <!-- 类型映射 -->
    <typeMappings>
        <TypeMapping dbType="VARCHAR512" javaType="String" jdbcType="VARCHAR"/>
    </typeMappings>
</plugin>
```

### 自定义 SQL 模板

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <templates>
        <template id="create-table" name="create-table" type="SQL" category="db">
            <content>{{> create-table-mysql-lineage}}</content>
        </template>
    </templates>
</plugin>
```

## 常用场景

### 场景 1: 新增数据库支持

```xml
<plugin id="clickhouse" version="1.0.0" name="ClickHouse">
    <databaseAdapters>
        <DatabaseAdapter id="clickhouse">
            <urlPattern>jdbc:clickhouse://.*</urlPattern>
            <driverClass>com.clickhouse.jdbc.ClickHouseDriver</driverClass>
            <connectionProperties>
                <property name="socket_timeout" value="30000"/>
            </connectionProperties>
        </DatabaseAdapter>
    </databaseAdapters>

    <typeMappings>
        <TypeMapping dbType="String" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="UInt32" javaType="Long" jdbcType="BIGINT"/>
        <TypeMapping dbType="DateTime" javaType="LocalDateTime" jdbcType="TIMESTAMP"/>
    </typeMappings>

    <functionMappings>
        <FunctionMapping name="now" template="now()"/>
        <FunctionMapping name="date_add" template="addDays({0}, {1})"/>
    </functionMappings>
</plugin>
```

### 场景 2: 自定义类型映射

```xml
<plugin id="postgres-custom" version="1.0.0">
    <typeMappings>
        <!-- PostgreSQL 特有类型 -->
        <TypeMapping dbType="JSONB" javaType="String" jdbcType="OTHER"/>
        <TypeMapping dbType="UUID" javaType="java.util.UUID" jdbcType="OTHER"/>
        <TypeMapping dbType="INET" javaType="String" jdbcType="VARCHAR"/>

        <!-- 自定义类型 -->
        <TypeMapping dbType="money" javaType="java.math.BigDecimal" jdbcType="DECIMAL"/>
    </typeMappings>
</plugin>
```

### 场景 3: 自定义模板 Helper

```xml
<plugin id="custom-helpers">
    <templateHelpers>
        <TemplateHelper name="encrypt">
            <parameter>value</parameter>
            <code>AES_ENCRYPT({{value}}, '${secret_key}')</code>
        </TemplateHelper>

        <TemplateHelper name="formatDate">
            <parameter>date</parameter>
            <parameter>format</parameter>
            <code>DATE_FORMAT({{date}}, '{{format}}')</code>
        </TemplateHelper>
    </templateHelpers>
</plugin>
```

### 场景 4: 扩展点定义

```xml
<plugin id="mysql-extensions">
    <extensionPoints>
        <!-- MySQL 表引擎 -->
        <ExtensionPoint id="table-engine" target="Table">
            <ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
            <ExtensionAttribute name="row_format" type="String"/>
            <ExtensionAttribute name="charset" type="String" defaultValue="utf8mb4"/>
        </ExtensionPoint>

        <!-- MySQL 分区 -->
        <ExtensionPoint id="partition" target="Table">
            <ExtensionAttribute name="partitionBy" type="String"/>
            <ExtensionAttribute name="partitions" type="Integer"/>
        </ExtensionPoint>
    </extensionPoints>
</plugin>
```

## 插件结构

```xml
<plugin id="plugin-id" version="1.0.0" name="Plugin Name" ref-id="parent-plugin">
    <!-- 1. 数据库适配器 -->
    <databaseAdapters>...</databaseAdapters>

    <!-- 2. 类型映射 -->
    <typeMappings>...</typeMappings>

    <!-- 3. 函数映射 -->
    <functionMappings>...</functionMappings>

    <!-- 4. SQL 模板 -->
    <templates>...</templates>

    <!-- 5. 模板 Helper -->
    <templateHelpers>...</templateHelpers>

    <!-- 6. 扩展点 -->
    <extensionPoints>...</extensionPoints>

    <!-- 7. Schema 格式 -->
    <schemaFormats>...</schemaFormats>
</plugin>
```

## 模板系统

### 模板继承

```xml
<!-- 父插件：定义通用模板 -->
<plugin id="sql-standard-root">
    <templates>
        <template id="create-table-mysql-lineage" name="create-table-mysql-lineage">
            <content>CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (...)</content>
        </template>
    </templates>
</plugin>

<!-- 子插件：引用父模板 -->
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <templates>
        <template id="create-table">
            <content>{{> create-table-mysql-lineage}}</content>
        </template>
    </templates>
</plugin>
```

### 模板变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `@root.dbType` | 数据库类型 | `mysql`, `postgresql` |
| `@root.idempotent` | 幂等模式 | `true/false` |
| `@root.safeDrop` | 安全删除模式 | `true/false` |
| `{{this}}` | 当前对象 | Table, Column 等 |
| `{{@root.justdbManager}}` | JustDB Manager | 管理器实例 |

### 模板引用语法

```handlebars
<!-- 使用当前上下文 -->
{{> template-name}}

<!-- 使用父上下文 -->
{{> template-name ..}}

<!-- 条件渲染 -->
{{#if this.primaryKey}}PRIMARY KEY{{/if}}

<!-- 循环 -->
{{#each this.columns}}
  {{name}} {{type}}{{#unless @last}},{{/unless}}
{{/each}}
```

## 类型映射

### 基本类型映射

```xml
<typeMappings>
    <TypeMapping dbType="VARCHAR" javaType="String" jdbcType="VARCHAR"/>
    <TypeMapping dbType="INT" javaType="Integer" jdbcType="INTEGER"/>
    <TypeMapping dbType="BIGINT" javaType="Long" jdbcType="BIGINT"/>
    <TypeMapping dbType="DECIMAL" javaType="BigDecimal" jdbcType="DECIMAL"/>
    <TypeMapping dbType="DATETIME" javaType="LocalDateTime" jdbcType="TIMESTAMP"/>
</typeMappings>
```

### 复杂类型映射

```xml
<typeMappings>
    <!-- 数组类型 -->
    <TypeMapping dbType="TEXT[]" javaType="String[]" jdbcType="ARRAY"/>

    <!-- JSON 类型 -->
    <TypeMapping dbType="JSON" javaType="String" jdbcType="VARCHAR"/>

    <!-- 枚举类型 -->
    <TypeMapping dbType="ENUM" javaType="String" jdbcType="VARCHAR">
        <parameters>
            <parameter name="values" value="A,B,C"/>
        </parameters>
    </TypeMapping>
</typeMappings>
```

## 扩展点

### Table 扩展点

```xml
<ExtensionPoint id="mysql-table" target="Table">
    <ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
    <ExtensionAttribute name="charset" type="String" defaultValue="utf8mb4"/>
    <ExtensionAttribute name="collate" type="String" defaultValue="utf8mb4_unicode_ci"/>
    <ExtensionAttribute name="row_format" type="String"/>
</ExtensionPoint>
```

**使用**：

```xml
<Table name="users" engine="InnoDB" charset="utf8mb4" row_format="COMPRESSED">
    ...
</Table>
```

### Column 扩展点

```xml
<ExtensionPoint id="mysql-column" target="Column">
    <ExtensionAttribute name="unsigned" type="Boolean" defaultValue="false"/>
    <ExtensionAttribute name="zerofill" type="Boolean" defaultValue="false"/>
    <ExtensionAttribute name="characterSet" type="String"/>
    <ExtensionAttribute name="collation" type="String"/>
</ExtensionPoint>
```

**使用**：

```xml
<Column name="age" type="INT" unsigned="true" zerofill="true"/>
```

## 插件发现

### 内置插件

`default-plugins.xml` 自动加载。

### 外部插件

通过 JAR 包加载：

```
META-INF/services/ai.justdb.justdb.plugin.JustdbPlugin
```

## 注意事项

### 1. 插件 ID 唯一性

```xml
<!-- ❌ 错误：重复 ID -->
<plugin id="mysql"/>
<plugin id="mysql"/>

<!-- ✅ 正确：唯一 ID -->
<plugin id="mysql"/>
<plugin id="mysql-extensions"/>
```

### 2. 模板引用顺序

```xml
<!-- 父插件必须先定义 -->
<plugin id="root">
    <template id="base">...</template>
</plugin>

<!-- 子插件才能引用 -->
<plugin id="child" ref-id="root">
    <template id="derived">{{> base}}</template>
</plugin>
```

### 3. 方言冲突

```xml
<!-- ❌ 错误：同一 dialect -->
<plugin id="mysql1" dialect="mysql"/>
<plugin id="mysql2" dialect="mysql"/>

<!-- ✅ 正确：使用 ref-id 继承 -->
<plugin id="mysql-base" dialect="mysql"/>
<plugin id="mysql-ext" ref-id="mysql-base"/>
```

## 进阶技巧

### 技巧 1: 条件模板

```handlebars
{{#if (eq @root.dbType "mysql")}}
    ENGINE=InnoDB
{{else if (eq @root.dbType "postgresql")}}
    WITH (OIDS=FALSE)
{{/if}}
```

### 技巧 2: 自定义 Helper

```xml
<TemplateHelper name="quote">
    <parameter>value</parameter>
    <code>{{#if (eq @root.dbType "mysql")}}`{{value}}`{{else}}"{{value}}"{{/if}}</code>
</TemplateHelper>
```

### 技巧 3: 模板注入

```xml
<GenericTemplate id="custom-index" injectAfter="create-table">
    CREATE INDEX {{#if @root.idempotent}}IF NOT EXISTS {{/if}}idx_{{name}} ON {{name}}({{columns}});
</GenericTemplate>
```

## 参考链接

- [插件开发指南](../development/plugin-development/)
- [模板系统设计](../design/template-system/)
- [API 参考](../reference/api/)

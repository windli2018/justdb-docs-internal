# Reference System 引用系统速查

引用系统（Reference System）允许在 Schema 中定义可复用的组件，通过 `referenceId` 引用实现组件继承和复用。

## 快速示例

### 定义全局列

```xml
<!-- 定义可复用的列模板 -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="global_username" name="username" type="VARCHAR(50)" nullable="false"/>

<!-- 引用全局列 -->
<Table name="users">
    <Column referenceId="global_id" name="id"/>
    <Column referenceId="global_username" name="username"/>
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>
```

### 定义全局表片段

```xml
<!-- 定义审计列组 -->
<Table id="audit_columns" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- 引用审计列 -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <!-- 包含审计列 -->
    <Column referenceId="audit_columns.created_at"/>
    <Column referenceId="audit_columns.updated_at"/>
</Table>
```

## 常用场景

### 场景 1: 主键复用

```xml
<!-- 定义标准主键 -->
<Column id="pk_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="pk_uuid" name="id" type="CHAR(36)" primaryKey="true"/>

<!-- 使用自增 ID -->
<Table name="users">
    <Column referenceId="pk_id"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>

<!-- 使用 UUID -->
<Table name="products">
    <Column referenceId="pk_uuid"/>
    <Column name="name" type="VARCHAR(100)"/>
</Table>
```

### 场景 2: 时间戳列

```xml
<!-- 定义标准时间戳 -->
<Column id="ts_created" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="ts_updated" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
<Column id="ts_deleted" name="deleted_at" type="TIMESTAMP"/>

<!-- 应用到所有表 -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column referenceId="ts_created"/>
    <Column referenceId="ts_updated"/>
    <Column referenceId="ts_deleted"/>
</Table>
```

### 场景 3: 约束模板

```xml
<!-- 定义标准约束 -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<Constraint id="uk_email" type="UNIQUE">
    <column>email</column>
</Constraint>

<!-- 使用约束模板 -->
<Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="user_id" type="BIGINT"/>
    <Column name="email" type="VARCHAR(100)"/>

    <Constraint referenceId="fk_user">
        <column>user_id</column>
    </Constraint>
    <Constraint referenceId="uk_email"/>
</Table>
```

### 场景 4: 索引模板

```xml
<!-- 定义标准索引 -->
<Index id="idx_created" name="idx_created_at">
    <column>created_at</column>
</Index>

<Index id="idx_search" name="idx_search">
    <column>name</column>
    <column>status</column>
</Index>

<!-- 使用索引模板 -->
<Table name="products">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="name" type="VARCHAR(100)"/>
    <Column name="status" type="VARCHAR(20)"/>
    <Column name="created_at" type="TIMESTAMP"/>

    <Index referenceId="idx_created"/>
    <Index referenceId="idx_search"/>
</Table>
```

## 引用语法

### 基本引用

```xml
<!-- 引用列 -->
<Column referenceId="global_id"/>

<!-- 引用时覆盖名称 -->
<Column referenceId="global_id" name="user_id"/>

<!-- 引用时覆盖属性 -->
<Column referenceId="global_id" name="user_id" autoIncrement="false"/>
```

### 命名空间引用

```xml
<!-- 使用点号分隔 -->
<Column referenceId="common.pk_id"/>
<Column referenceId="common.ts_created"/>

<!-- 或者使用前缀 -->
<Column referenceId="pk_id" xmlns="common"/>
```

## 引用规则

### 1. 属性合并规则

| 引用属性 | 本地属性 | 合并结果 |
|---------|---------|---------|
| 未设置 | 未设置 | 使用引用定义 |
| 未设置 | 已设置 | **使用本地属性** |
| 已设置 | 未设置 | 使用引用属性 |
| 已设置 | 已设置 | **使用本地属性** |

### 2. 列引用示例

```xml
<!-- 定义 -->
<Column id="username" name="username" type="VARCHAR(50)" nullable="false" comment="User login name"/>

<!-- 完全引用 -->
<Column referenceId="username"/>
<!-- 结果：name=username, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- 覆盖名称 -->
<Column referenceId="username" name="login_name"/>
<!-- 结果：name=login_name, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- 覆盖类型 -->
<Column referenceId="username" type="VARCHAR(100)"/>
<!-- 结果：name=username, type=VARCHAR(100), nullable=false, comment="User login name" -->

<!-- 覆盖多个属性 -->
<Column referenceId="username" name="email" type="VARCHAR(255)" comment="Email address"/>
<!-- 结果：name=email, type=VARCHAR(255), nullable=false, comment="Email address" -->
```

### 3. 约束引用示例

```xml
<!-- 定义 -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<!-- 引用并指定列 -->
<Constraint referenceId="fk_user">
    <column>created_by</column>
</Constraint>

<!-- 覆盖引用行为 -->
<Constraint referenceId="fk_user">
    <column>updated_by</column>
    <onDelete>SET NULL</onDelete>
</Constraint>
```

## 作用域

### 全局作用域

```xml
<Justdb>
    <!-- 全局定义，所有表可引用 -->
    <Column id="global_pk" name="id" type="BIGINT" primaryKey="true"/>

    <Table name="users">
        <Column referenceId="global_pk"/>
    </Table>

    <Table name="orders">
        <Column referenceId="global_pk"/>
    </Table>
</Justdb>
```

### 局部作用域

```xml
<Justdb>
    <Table name="users">
        <!-- 仅在 users 表内可见 -->
        <Column id="local_col" name="status" type="VARCHAR(20)"/>
        <Column referenceId="local_col" name="user_status"/>
    </Table>
</Justdb>
```

## 循环引用检测

JustDB 会检测循环引用并报错：

```xml
<!-- ❌ 错误：循环引用 -->
<Column id="a" referenceId="b"/>
<Column id="b" referenceId="a"/>

<!-- ✅ 正确：无循环 -->
<Column id="base" name="id" type="BIGINT"/>
<Column id="extended" referenceId="base" name="user_id"/>
```

## 最佳实践

### 1. 命名约定

```xml
<!-- 使用前缀区分类型 -->
<Column id="pk_id"/>           <!-- Primary Key -->
<Column id="fk_user"/>         <!-- Foreign Key -->
<Column id="uk_email"/>        <!-- Unique Key -->
<Column id="idx_created"/>     <!-- Index -->
<Column id="chk_status"/>      <!-- Check -->

<!-- 使用模块前缀 -->
<Column id="auth.username"/>   <!-- Auth module -->
<Column id="common.created_at"/> <!-- Common module -->
```

### 2. 分层定义

```xml
<!-- 第 1 层：基础类型 -->
<Column id="base.int" type="INT"/>
<Column id="base.varchar50" type="VARCHAR(50)"/>
<Column id="base.timestamp" type="TIMESTAMP"/>

<!-- 第 2 层：业务列 -->
<Column id="common.username" referenceId="base.varchar50" nullable="false"/>
<Column id="common.email" referenceId="base.varchar50"/>
<Column id="common.created_at" referenceId="base.timestamp" defaultValue="CURRENT_TIMESTAMP"/>

<!-- 第 3 层：表特定 -->
<Column id="users.username" referenceId="common.username"/>
```

### 3. 抽象表模板

```xml
<!-- 定义抽象表（不生成 DDL） -->
<Table id="audit_table" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- 扩展抽象表 -->
<Table name="users" extends="audit_table">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>
```

## 注意事项

### 1. 引用必须存在

```xml
<!-- ❌ 错误：引用不存在 -->
<Column referenceId="nonexistent_id"/>

<!-- ✅ 正确：先定义再引用 -->
<Column id="my_id" name="id" type="BIGINT"/>
<Column referenceId="my_id"/>
```

### 2. 类型兼容性

```xml
<!-- 定义 -->
<Column id="base_col" type="VARCHAR(50)"/>

<!-- ✅ 正确：兼容的类型修改 -->
<Column referenceId="base_col" type="VARCHAR(100)"/>

<!-- ⚠️ 警告：不兼容的类型修改 -->
<Column referenceId="base_col" type="INT"/>
```

### 3. 引用链长度

```xml
<!-- 支持多级引用 -->
<Column id="a" name="id" type="BIGINT"/>
<Column id="b" referenceId="a"/>
<Column id="c" referenceId="b"/>
<Column id="d" referenceId="c"/>

<!-- ⚠️ 建议：不超过 3 级 -->
```

## 进阶技巧

### 技巧 1: 动态引用

```xml
<!-- 使用变量 -->
<Column id="pk_{table}" name="id" type="BIGINT" primaryKey="true"/>

<!-- 使用时展开 -->
<Table name="users">
    <Column referenceId="pk_users"/>
</Table>
```

### 技巧 2: 条件引用

```xml
<!-- 根据环境选择不同引用 -->
<Column referenceId="pk_id" if="env='production'"/>
<Column referenceId="pk_uuid" if="env='development'"/>
```

### 技巧 3: 引用组合

```xml
<!-- 组合多个引用 -->
<Column id="full_user">
    <include referenceId="base.username"/>
    <include referenceId="base.email"/>
    <include referenceId="base.created_at"/>
</Column>
```

## 参考链接

- [Schema 定义](../reference/schema/)
- [Column 参考](../reference/schema/column.md)
- [引用系统设计](../design/schema-system/reference-system.md)

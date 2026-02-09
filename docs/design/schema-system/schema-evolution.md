---
title: Schema 演进
icon: git-branch
order: 4
category: 设计文档
tags:
  - schema
  - evolution
  - migration
---

# Schema 演进

## 概述

JustDB 提供两种互补的 Schema 演进追踪机制，实现组件复用和变更追踪：

1. **referenceId 系统**：实现组件复用和继承
2. **formerNames 系统**：追踪重命名历史，支持自动生成迁移 SQL

## referenceId 系统

### 设计目标

- **组件复用**：定义一次，多处使用
- **继承覆盖**：在引用基础上修改特定属性
- **减少重复**：避免重复定义相同的列、索引等

### 使用场景

1. **全局列定义**：定义常用的列（如 id、created_at）
2. **通用索引**：定义常见的索引模式
3. **标准约束**：定义常用的约束配置

### 基本用法

```xml
<!-- 定义全局列模板 -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="global_updated_at" name="updated_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>

<!-- 在表中引用 -->
<Table name="users">
    <!-- 直接引用，继承所有属性 -->
    <Column id="col_users_id" referenceId="global_id" name="id"/>
    <Column id="col_users_username" name="username" type="VARCHAR(50)" nullable="false"/>
    <Column id="col_users_email" name="email" type="VARCHAR(100)" nullable="false"/>
    <Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/>
    <Column id="col_users_updated_at" referenceId="global_updated_at" name="updated_at"/>
</Table>

<Table name="orders">
    <!-- 复用全局列定义 -->
    <Column id="col_orders_id" referenceId="global_id" name="id"/>
    <Column id="col_orders_user_id" name="user_id" type="BIGINT" nullable="false"/>
    <!-- ... -->
</Table>
```

### 继承与覆盖

引用的列可以覆盖特定属性：

```xml
<!-- 全局定义 -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>

<!-- 引用时覆盖 name -->
<Table name="users">
    <Column id="col_users_id" referenceId="global_id" name="user_id"/>
</Table>

<!-- 引用时覆盖 type -->
<Table name="config">
    <Column id="col_config_id" referenceId="global_id" name="id" type="VARCHAR(50)"/>
</Table>
```

### 依赖解析

JustDB 在加载 Schema 时会：
1. 解析 `referenceId` 引用
2. 将被引用对象的属性合并到当前对象
3. 应用当前对象的覆盖属性
4. 验证循环依赖

### 循环依赖检测

系统会检测并阻止循环依赖：

```xml
<!-- 错误：循环依赖 -->
<Column id="a" referenceId="b"/>
<Column id="b" referenceId="a"/>
```

抛出异常：
```
Circular reference detected: a -> b -> a
```

## formerNames 系统

### 设计目标

- **自动追踪**：记录对象的重命名历史
- **自动迁移**：生成 RENAME 语句
- **向后兼容**：保持历史记录

### 基本用法

```xml
<!-- 追踪表名变更 -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>
```

生成的迁移 SQL：
```sql
ALTER TABLE user RENAME TO users;
```

### 多次重命名

```xml
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
        <oldName>sys_user</oldName>
    </formerNames>
</Table>
```

生成的迁移 SQL：
```sql
ALTER TABLE sys_user RENAME TO user;
ALTER TABLE user RENAME TO users;
```

### 列重命名

```xml
<Table name="users">
    <Column name="email">
        <formerNames>
            <oldName>email_address</oldName>
        </formerNames>
    </Column>
</Table>
```

生成的迁移 SQL：
```sql
ALTER TABLE users RENAME COLUMN email_address TO email;
```

## Schema Diff 变更类型

### ChangeType 枚举

```java
public enum ChangeType {
    ADDED,      // 新增对象
    REMOVED,    // 删除对象
    MODIFIED,   // 修改对象
    RENAMED     // 重命名对象（通过 formerNames）
}
```

### CanonicalSchemaDiff

用于表示两个 Schema 之间的差异：

```java
public class CanonicalSchemaDiff {
    private Justdb sourceSchema;      // 源 Schema
    private Justdb targetSchema;      // 目标 Schema
    private List<Table> tables;       // 变更的表
    private List<Column> columns;     // 变更的列
    private List<Index> indexes;      // 变更的索引
    private List<Constraint> constraints; // 变更的约束
}
```

## 演进场景

### 场景 1：表重命名

**初始状态**：
```xml
<Table name="user">
    <columns>...</columns>
</Table>
```

**演进**：
```xml
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
    <columns>...</columns>
</Table>
```

**生成的 SQL**：
```sql
ALTER TABLE user RENAME TO users;
```

### 场景 2：列类型修改

**初始状态**：
```xml
<Column name="username" type="VARCHAR(50)"/>
```

**演进**：
```xml
<Column name="username" type="VARCHAR(100)"/>
```

**生成的 SQL**（MySQL）：
```sql
ALTER TABLE users MODIFY COLUMN username VARCHAR(100);
```

### 场景 3：添加索引

**初始状态**：
```xml
<Table name="users">
    <columns>...</columns>
</Table>
```

**演进**：
```xml
<Table name="users">
    <columns>...</columns>
    <indexes>
        <Index name="idx_users_email" unique="true" columns="email"/>
    </indexes>
</Table>
```

**生成的 SQL**：
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### 场景 4：使用 referenceId 复用

**全局定义**：
```xml
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
```

**多个表引用**：
```xml
<Table name="users">
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>

<Table name="orders">
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>

<Table name="products">
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>
```

**优势**：
- 统一修改：只需修改全局定义
- 保证一致性：所有引用自动更新
- 减少重复：避免重复定义

## SchemaEvolutionManager

### 职责

`SchemaEvolutionManager` 负责 Schema 的演进执行：

- 解析差异 Schema
- 生成变更 SQL
- 执行变更并记录历史

### 使用示例

```java
// 加载当前 Schema
Justdb currentSchema = SchemaLoader.loadFromDatabase(connection);

// 加载目标 Schema
Justdb targetSchema = SchemaLoader.loadFromFile("schema.yaml");

// 计算差异
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
diff.calculateAll();

// 生成 SQL
List<String> sqlStatements = diff.generateSql("mysql");

// 执行变更
SchemaEvolutionManager manager = new SchemaEvolutionManager(connection);
manager.evolve(diff);
```

## 最佳实践

### 1. 使用 referenceId 复用常用定义

```xml
<!-- 好的做法 -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>

<!-- 避免：重复定义 -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
</Table>
```

### 2. 记录重命名历史

```xml
<!-- 好的做法 -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>

<!-- 避免：直接改名不记录历史 -->
<Table name="users"/>
```

### 3. 版本控制

将 Schema 文件纳入 Git 版本控制：

```bash
git add schema.yaml
git commit -m "Rename user table to users"
```

### 4. 增量演进

避免大规模重命名，分步进行：

```xml
<!-- 步骤 1：重命名 -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>

<!-- 步骤 2：添加新列（下一次提交） -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
    <Column name="avatar" type="VARCHAR(500)"/>
</Table>
```

## 相关文档

- [Schema 系统概述](./overview.md)
- [类型层次结构](./type-hierarchy.md)
- [别名系统](./alias-system.md)
- [迁移系统设计](../migration-system/overview.md)

# JustDB 虚拟列与可读列支持设计文档

## 版本信息

**版本**: 7.1
**日期**: 2026-02-08
**作者**: Claude Code
**状态**: 实现中 - SELECT 运行时解析调试中

---------------------------

## 快速开始

```xml
&lt;!-- 推荐配置：两者兼得（最佳体验） --&gt;
<Column name="username"
         type="VARCHAR(255)"
         virtual="true"
         preferColumn="true"
         from="users.username"
         on="user_id"/>
```

**效果**：
- ✅ DDL 包含生成列（MySQL）
- ✅ 预制数据时自动解析
- ✅ 运行时双向查询支持（物理列 ↔ 虚拟列互相解析）

---------------------------

## 目录

1. [问题背景](#1-问题背景)
2. [现有方案整理](#2-现有方案整理)
3. [JustDB 方案定位](#3-justdb-方案定位)
4. [核心概念](#4-核心概念)
5. [属性命名规范](#5-属性命名规范)
6. [虚拟列定义](#6-虚拟列定义)
7. [可读列定义](#7-可读列定义)
8. [运行时支持架构](#8-运行时支持架构)
9. [实现方案](#9-实现方案)
10. [关键文件清单](#10-关键文件清单)
11. [测试验证](#11-测试验证)
12. [完整示例](#12-完整示例)
13. [实施进度](#13-实施进度)

---------------------------

## 1. 问题背景

### 1.1 数据库范式设计的关联表

**现状**：符合第三范式的关联表设计是标准实践

```sql
-- 符合数据库范式的标准设计
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rolename VARCHAR(50) NOT NULL
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

**这是正确的设计**：
- ✅ 符合第三范式，避免数据冗余
- ✅ 便于维护数据一致性
- ✅ 节省存储空间
- ✅ 关联查询性能良好

### 1.2 两大问题场景

#### 场景 1：预制数据时的可读性困境

**问题**：当需要预制数据到系统时，使用 ID 导致数据难以理解

```xml
&lt;!-- Schema 中定义 --&gt;
&lt;Table name="user_roles"&gt;
    &lt;Column name="user_id" type="BIGINT"/&gt;
    &lt;Column name="role_id" type="BIGINT"/&gt;
&lt;/Table&gt;

&lt;!-- Data 预制：难以理解 --&gt;
&lt;Data table="user_roles"&gt;
    &lt;!-- 开发者需要手动维护映射：alice=1, admin=1, bob=2, viewer=2 --&gt;
    &lt;Row user_id="1" role_id="1"/&gt;  &lt;!-- alice 是 admin? --&gt;
    &lt;Row user_id="1" role_id="2"/&gt;  &lt;!-- alice 是 viewer? --&gt;
    &lt;Row user_id="2" role_id="1"/&gt;  &lt;!-- bob 是 admin? --&gt;
    &lt;Row user_id="2" role_id="2"/&gt;  &lt;!-- bob 是 viewer? --&gt;
&lt;/Data&gt;
```

**痛点**：
- ❌ 开发者需要手动维护 ID 映射关系（alice=1, admin=1）
- ❌ 代码审查时无法直观理解数据含义
- ❌ 数据变更时（如 alice 改名为 alice2）需要全局查找替换 ID
- ❌ 容易出错：ID 搞错导致数据关联错误
- ❌ 协作困难：其他开发者不知道 ID 对应的业务含义

#### 场景 2：运行时查询的可读性需求

**问题**：运行时 SQL 查询时，无法直接获取可读值

```sql
-- 当前：需要手动 JOIN 才能获取可读值
SELECT u.username, r.rolename
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 1;

-- 期望：直接查询虚拟列
SELECT username, rolename FROM user_roles WHERE user_id = 1;
```

### 1.3 设计意图

**核心目标**：提供两套互补的解决方案

| 场景 | 解决方案 | 使用属性 |
|------------------------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| **预制数据可读性** | 可读列（PreferColumn） | `preferColumn="true"` |
| **运行时查询可读性** | 虚拟列运行时支持 | `virtual="true"` |

**不是要改变数据库设计**：
- ✅ 关联表仍然只存储 ID（符合范式）
- ✅ 数据库结构不变
- ✅ SQL 查询性能受控

**只是在 Schema 层面提供更好的可读性**：
- ✅ Schema 定义即文档
- ✅ Data 定义使用业务语言
- ✅ 查询时自动解析
- ✅ 框架级系统性支持

---------------------------

## 2. 现有方案整理

### 2.1 方案 1: SQL 注释 + 文档

```xml
&lt;Data table="user_roles"&gt;
    &lt;!-- alice has admin role --&gt;
    &lt;Row user_id="1" role_id="1"/&gt;
&lt;/Data&gt;
```

| 优点 | 缺点 |
|------------------------------------------------------|------------------------------------------------------|
| ✅ 简单直接 | ❌ 注释易过期 |
| ✅ 不改变数据结构 | ❌ 代码无法验证注释正确性 |
| ✅ 无额外依赖 | ❌ 不同步风险 |

### 2.2 方案 2: 单独的数据导入脚本

```sql
-- scripts/init_data.sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM (SELECT 1 AS id, 'alice' AS username) u
JOIN (SELECT 1 AS id, 'admin' AS rolename) r;
```

| 优点 | 缺点 |
|------------------------------------------------------|------------------------------------------------------|
| ✅ SQL 灵活强大 | ❌ 与 Schema 分离 |
| ✅ 可利用 SQL 全部能力 | ❌ 无法复用逻辑 |
| ✅ 数据库原生支持 | ❌ 需要手写 SQL |

### 2.3 方案 3: ORM/应用层处理

```java
@Service
public class UserRoleService {
    public void assignRole(String username, String rolename) {
        User user = userRepository.findByUsername(username).get();
        Role role = roleRepository.findByRolename(rolename).get();
        UserRole userRole = new UserRole(user, role);
        userRoleRepository.save(userRole);
    }
}
```

| 优点 | 缺点 |
|------------------------------------------------------|------------------------------------------------------|
| ✅ 类型安全 | ❌ 需要启动整个应用 |
| ✅ 面向对象 | ❌ 无法纯 SQL 解决预制数据 |
| ✅ 编译期检查 | ❌ 增加应用复杂度 |

### 2.4 方案 4: 数据库视图 + 存储过程

```sql
CREATE VIEW v_user_roles AS
SELECT u.username, r.rolename, ur.user_id, ur.role_id
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id;
```

| 优点 | 缺点 |
|------------------------------------------------------|------------------------------------------------------|
| ✅ 数据库层面解决 | ❌ 增加数据库对象 |
| ✅ 可读性好 | ❌ 维护复杂 |
| ✅ 原生支持 | ❌ 依赖特定数据库特性 |

### 2.5 方案 5: 可计算列/生成列

```sql
-- MySQL 8.0+ 生成列
ALTER TABLE user_roles
ADD COLUMN username VARCHAR(50)
AS (SELECT username FROM users WHERE id = user_id) STORED;
```

| 优点 | 缺点 |
|------------------------------------------------------|------------------------------------------------------|
| ✅ 数据库原生支持 | ❌ 存储冗余数据 |
| ✅ 自动同步更新 | ❌ 需要数据库版本支持 |
| ✅ 查询时无需 JOIN | ❌ 占用额外存储空间 |

### 2.6 方案对比总结

| 方案 | 可读性 | 维护性 | 自动化 | Schema集成 | 额外复杂度 |
|------------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| SQL 注释 | ⭐ | ⭐ | ⭐☆ | ⭐⭐⭐ | ⭐ |
| 导入脚本 | ⭐⭐ | ⭐⭐ | ⭐⭐☆ | ⭐☆ | ⭐⭐ |
| ORM 处理 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐☆ | ⭐⭐⭐ |
| 视图触发器 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 计算列 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **JustDB (合并)** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐** |

---------------------------

## 3. JustDB 方案定位

### 3.1 核心定位

**JustDB 提供两套互补的可读性解决方案**：

| 功能 | 使用场景 | 标记属性 | 处理时机 |
|------------------------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| **可读列（PreferColumn）** | 预制数据时 | `preferColumn="true"` | Schema 部署时 |
| **虚拟列运行时支持** | 运行时 SQL 查询 | `virtual="true"` | SQL 查询时 |

### 3.2 设计原则

1. **声明式定义**：在 Schema 中显式声明映射关系
2. **单一数据源**：Schema 即文档，避免分离维护
3. **框架级支持**：系统内置，无需额外工具
4. **显式控制**：用户明确启用转换，不隐式执行
5. **保持范式**：不改变数据库设计，只优化可读性

### 3.3 两功能对比

| 特性 | 可读列（PreferColumn） | 虚拟列运行时 |
|------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **使用场景** | 预制数据 | 运行时 SQL 查询 |
| **标记属性** | `preferColumn="true"` | `virtual="true"` |
| **处理时机** | Schema 部署时 | SQL 执行时 |
| **SQL 支持** | INSERT（预处理） | SELECT/INSERT/UPDATE/DELETE |
| **性能影响** | 一次性解析 | 每次查询时解析 |
| **DDL 包含** | 根据 `virtual` 属性 | `virtual=true` 时不包含 |

### 3.4 组合使用（推荐）

```xml
&lt;!-- 两者兼得：DDL 包含 + 预制时解析 + 运行时查询 --&gt;
<Column name="username"
         type="VARCHAR(255)"
         virtual="true"
         preferColumn="true"
         from="users.username"
         on="user_id"/>
```

---------------------------

## 4. 属性命名规范

### 4.1 命名标准

| 属性 | Canonical 名称 | 支持的别名 | 说明 |
|------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|------------------------------------------------------|
| **可读列标记** | `preferColumn` | `prefercolumn`, `preferedColumn`, `PreferColumn` | 遵循 camelCase 规范 |
| **虚拟列标记** | `virtual` | - | Boolean 类型，已有实现 |
| **引用表字段** | `from` | - | 格式: `table.field` |
| **外键列** | `on` | - | 当前表的外键列名 |
| **环境特定列** | `noMigrate` | `nomigrate`, `NoMigrate` | 支持 camelCase 别名 |

### 4.2 Java 代码定义

```java
// Column.java 属性定义
@JsonProperty("preferColumn")
@JsonAlias({"prefercolumn", "preferedColumn", "PreferColumn"})
@XmlAttribute(name = "preferColumn")
protected Boolean preferColumn;

public boolean isPreferColumn() {
    return preferColumn != null && preferColumn;
}

// 检查拼写错误兼容性
// preferedColumn -> preferColumn (自动纠正)
```

### 4.3 XML/JSON 使用示例

```xml
&lt;!-- 推荐：使用 canonical 名称 --&gt;
&lt;Column name="username" preferColumn="true" from="users.username" on="user_id"/&gt;

&lt;!-- 兼容：旧格式继续支持 --&gt;
&lt;Column name="username" prefercolumn="true" from="users.username" on="user_id"/&gt;

&lt;!-- 兼容：拼写错误自动纠正 --&gt;
&lt;Column name="username" preferedColumn="true" from="users.username" on="user_id"/&gt;
```

---------------------------

## 5. 核心概念

### 5.1 属性独立性

| 属性 | 作用 | 影响范围 |
|------------------------------------------------------|------------------------------------------------------|----------------------------------------------------------------------------------|
| `type` | 定义列类型 | DDL 生成（物理列定义） |
| `virtual` | 标记是否为虚拟列（DDL 是否包含） | DDL 生成、运行时查询 |
| `preferColumn` | 标记用于 Data 解析 | Data 处理 |
| `noMigrate` | 标记值环境特定 | Data 处理优先级 |

### 5.2 判断标准

**虚拟列判断**（唯一标准）：
- `virtual="true"` → 虚拟列
- 其他情况（无 virtual 属性、`virtual="false"`、有 type 等）→ 物理列

**可读列判断**：
- `preferColumn="true"` → 可读列
- 与 `virtual` 属性独立

---------------------------

## 6. 虚拟列定义

### 6.1 核心定义

**虚拟列**（Virtual Column）：`virtual="true"` 属性标注的列

**判断标准**：
- `virtual="true"` → 虚拟列（**唯一标准**）
- 其他情况（无 virtual 属性、`virtual="false"`、有 type 等）→ 物理列

```xml
&lt;!-- 物理列：有 type，DDL 包含 --&gt;
&lt;Column name="user_id" type="BIGINT"/&gt;

&lt;!-- 虚拟列：virtual=true，DDL 不包含，运行时解析 --&gt;
&lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
```

### 6.2 属性说明

| 属性 | 说明 | 必填 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| `virtual="true"` | 标记为虚拟列 | 是 |
| `from="table.field"` | 引用表和字段 | 是 |
| `on="fk_column"` | 当前表的外键列名 | 是 |
| `preferColumn="true"` | 同时支持预制数据解析（可选） | 否 |

### 6.3 DDL 生成与计算列选项

#### 计算列生成策略

**命令行配置选项**：控制虚拟列在 DDL 中的生成方式

| 选项值 | 说明 | 数据库支持时 | 数据库不支持时 |
|--------------------------------------------------------|------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `auto` (默认) | 支持时生成 | 生成计算列 | 不生成（运行时解析） |
| `always` | 必然生成 | 生成计算列 | 生成物理列（需 app 填补数据） |
| `never` | 不生成 | 不生成（运行时解析） | 不生成（运行时解析） |

**配置方式**：

**方式 1: 命令行参数**
```bash
# migrate 命令指定计算列策略
justdb migrate --computed-column auto
justdb migrate --computed-column always
justdb migrate --computed-column never
```

**方式 2: CLI 配置文件**
```xml
&lt;!-- justdb-config.xml --&gt;
&lt;Configuration&gt;
    &lt;Migrate computedColumn="auto"/&gt;
&lt;/Configuration&gt;
```

**方式 3: 代码配置**
```java
// MigrateCommand.java
public class MigrateCommand extends BaseCommand {
    @Option(name = "--computed-column", description = "Computed column generation strategy")
    private ComputedColumnStrategy computedColumnStrategy = ComputedColumnStrategy.AUTO;

    public int execute() {
        // 从命令行参数或配置文件读取
        ComputedColumnStrategy strategy = computedColumnStrategy
            ?? config.getComputedColumnStrategy()
            ?? ComputedColumnStrategy.AUTO;

        // 传递给 DBGenerator
        DBGenerator dbGenerator = new DBGenerator(pluginManager, dialect, strategy);
        // ...
    }
}
```

**各选项详细说明**：

**选项 1: `auto`（推荐，默认）**
```xml
&lt;Migrate computedColumn="auto"/&gt;
```
- MySQL 8.0+/PostgreSQL 12+: 生成 `AS (SELECT ...) STORED` 计算列
- MySQL 5.7/PostgreSQL 11-: 不生成，运行时解析
- SQLite/Oracle: 根据版本决定

**选项 2: `always`（强制生成）**
```xml
&lt;Migrate computedColumn="always"/&gt;
```
- MySQL 8.0+: 生成 `AS (SELECT ...) STORED`
- MySQL 5.7: 生成物理列 `VARCHAR(255)`，需 app 通过触发器或其他机制填补数据
- 适用场景：确信应用能维护数据一致性

**选项 3: `never`（从不生成）**
```xml
&lt;Migrate computedColumn="never"/&gt;
```
- 所有数据库：不生成，始终运行时解析
- 适用场景：完全依赖 JustDB JDBC Driver 的双向补正能力

#### DDL 生成示例

```xml
&lt;!-- Schema --&gt;
&lt;Table name="user_roles"&gt;
    &lt;Column name="user_id" type="BIGINT"/&gt;
    &lt;Column name="username" virtual="true" type="VARCHAR(255)" from="users.username" on="user_id"/&gt;
&lt;/Table&gt;
```

**不同配置下的 DDL 生成结果**：

**场景 A: `computedColumn="auto"` + MySQL 8.0+**
```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

**场景 B: `computedColumn="auto"` + MySQL 5.7**
```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username 不包含在 DDL 中，运行时解析
```

**场景 C: `computedColumn="always"` + MySQL 8.0+**
```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

**场景 D: `computedColumn="always"` + MySQL 5.7**
```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255)  -- 物理列，需 app 维护数据
);
```

**场景 E: `computedColumn="never"` + 任意数据库**
```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username 始终运行时解析
```

#### 模板变量

计算列生成逻辑通过模板变量控制：

```xml
&lt;!-- default-plugins.xml --&gt;
&lt;template id="column-spec" name="column-spec" type="SQL" category="db"&gt;
  &lt;content&gt;{{#if this.virtual}}
    {{#if @root.computedColumn.always}}
      {{> computed-column-spec}}
    {{else if @root.computedColumn.auto}}
      {{#if @root.dbSupportsComputedColumns}}
        {{> computed-column-spec}}
      {{/if}}
    {{/if}}
  {{else}}
    {{name}} {{type}}
  {{/if}}&lt;/content&gt;
&lt;/template&gt;
```

#### 与 SQL Translate 的集成

**未来扩展**：基于 JustDB Schema 的 SQL Translate 功能

```
JustDB Schema
    ↓
SQL Translate 模块
    ↓
双向补正逻辑跟随
    ↓
生成目标数据库 SQL
```

- SQL Translate 将读取 JustDB Schema 中的虚拟列定义
- 根据目标数据库的能力调整生成策略
- 双向补正逻辑同样应用于 SQL Translate 场景
- 确保跨数据库迁移时虚拟列行为一致

### 6.4 组合场景

```xml
&lt;!-- 场景 1: 纯虚拟列（仅运行时查询） --&gt;
&lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
&lt;!-- DDL 不包含，仅运行时查询支持 --&gt;

&lt;!-- 场景 2: 虚拟列 + 可读列（两者兼得，推荐） --&gt;
&lt;Column name="username" type="VARCHAR(255)" virtual="true" preferColumn="true" from="users.username" on="user_id"/&gt;
&lt;!-- DDL 包含生成列，预制时支持解析，运行时支持查询 --&gt;

&lt;!-- 场景 3: 用户自主冗余存储 + 系统协助解析 --&gt;
&lt;Column name="user_id" type="BIGINT" noMigrate="true"/&gt;
&lt;Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/&gt;
&lt;!-- username 是物理列（有 type），DDL 包含 --&gt;
&lt;!-- 预制时：username='alice' → 自动解析并填充 user_id=1 --&gt;
&lt;!-- 结果：两列都有值（user_id=1, username='alice'）--&gt;
```

---------------------------

## 7. 可读列定义

### 7.1 PreferColumn（可读列）

**定义**：用于 Schema 定义和预制数据的可读性解析

**关键点**：`preferColumn` **独立于** 列是否为虚拟列

| 属性 | 物理列 | 非物理列 |
|------------------------------------------------------|--------------------------------------------------------|----------------------------------------------------------------------------------|
| 有 `type` | ✅ 物理列（DDL 包含） | ❌ 非物理列（DDL 不包含） |
| `preferColumn="true"` | 用于 Data 解析 | 用于 Data 解析 |

### 7.2 环境特定列 (noMigrate)

**定义**：标记列值为环境实例特定，不支持跨环境迁移

**使用场景**：自增 ID、序列值等在不同环境（dev/staging/prod）中可能不同的列

```xml
&lt;Column name="user_id" type="BIGINT" noMigrate="true"/&gt;
```

**行为规则**：

| 场景 | 行为 |
|------------------------------------------------------|------------------------------------------------------|
| **只提供 preferColumn** | 解析 preferColumn 为 ID，插入数据库 |
| **只提供 noMigrate 列值** | 直接使用该值，不转换 |
| **同时提供两者** | **优先 preferColumn**，忽略 noMigrate 列值 |

### 7.3 转换流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Schema 部署阶段                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  输入: &lt;Data table="user_roles"&gt;                                  │
│          &lt;Row user_id="999" username="alice" preferColumn=true/&gt;     │
│        (user_id 是 noMigrate 列，username 是 preferColumn)          │
│         │                                                            │
│         ▼                                                            │
│  VirtualColumnResolver.resolve()                                    │
│    1. 检查 preferColumn 标记                                        │
│    2. 查询数据库: username='alice' → id=1                             │
│    3. 检查 noMigrate: user_id=999 被忽略，使用解析的 id=1              │
│    4. 转换结果: &lt;Row user_id="1"/&gt;                                   │
│         │                                                            │
│         ▼                                                            │
│  INSERT INTO user_roles (user_id) VALUES (1)                       │
└─────────────────────────────────────────────────────────────────────┘
```

---------------------------

## 8. 运行时支持架构

**设计目标**：JustDB JDBC Driver 为用户提供透明的双向补正机制，让用户保持原有工作习惯的同时自动维护 Schema 的一致性。

**核心特性**：

1. **双向补正**：
   - 用户直接操作 `user_id` → 自动补正 `username`（从引用表查询）
   - 用户直接操作 `username` → 自动补正 `user_id`（反向查找 ID）
   - 任何修改都会同步到内存中的 Schema

2. **Schema 写盘规则**：
   - `preferColumn` 值（如 `username`）：**始终写入** schema 文件
   - id 值（如 `user_id`）：如果标记为 `noMigrate="true"` 则**不写入** schema 文件
   - 这样确保环境特定值（如自增 ID）不会跨环境迁移

3. **加载策略**：
   - 启动时：从 schema 文件加载所有数据到内存（包括 noMigrate 列的当前值）
   - 便于 SqlExecutor 执行查询和数据补正
   - 确保 SQL 执行时数据完整可用

4. **使用场景**：
   - **外部工具操作**：用户通过 MySQL Workbench、DBeaver 等工具直接连接 JustDB，保持原有工作习惯
   - **Schema 文件生成**：自动为用户生成高质量的 schema 文件（包含所有预制数据和表结构）
   - **应用直连**：用户的应用可以使用 MySQL 兼容的 JDBC URL（如 `jdbc:mysql://localhost:3306/dbname`）直接连接到 JustDB MySQL Protocol 服务器
   - **透明代理**：JustDB 作为透明代理，拦截 SQL 操作并进行双向补正，用户无感知

**架构价值**：

```
用户工具/应用
    ↓ MySQL 兼容的 JDBC
JustDB MySQL Protocol Server
    ↓ SQL 解析 + 双向补正
SqlExecutor + VirtualColumnResolver
    ↓ 自动维护
内存 Schema → 写盘（高质量 schema.xml）
```

### 8.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    JustDB JDBC Engine                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SqlExecutor                            │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │     VirtualColumnResolver (NEW)                 │  │   │
│  │  │  - SELECT: 虚拟列 → 运行时解析                  │  │   │
│  │  │  - INSERT: 虚拟列值 → ID 解析                  │  │   │
│  │  │  - UPDATE: 虚拟列值 → ID 查找 + 更新           │  │   │
│  │  │  - DELETE: 虚拟列值 → ID 查找 + 删除           │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │    ExpressionEngine (扩展)                   │    │   │
│  │  │    - evaluateExprForRow() 中拦截虚拟列        │    │   │
│  │  │    - 调用 VirtualColumnResolver 解析          │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              JustdbDataSource                          │   │
│  │  - 提供表数据访问                                     │   │
│  │  - 支持虚拟列查找                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 JustDB JDBC Driver SQL 双向补正机制

**说明**：以下描述的是 JustDB JDBC Driver **内部**的双向补正处理逻辑。

**双向补正原理**：

```
┌─────────────────────────────────────────────────────────────────┐
│                      双向补正流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户操作 A: UPDATE user_roles SET user_id=1 WHERE id=1        │
│    → 检测到 user_id 变化                                        │
│    → 查询 users 表: SELECT username FROM users WHERE id=1      │
│    → 获取: username='alice'                                     │
│    → 补正内存 Schema: user_id=1, username='alice'              │
│                                                                 │
│  用户操作 B: UPDATE user_roles SET username='bob' WHERE id=1   │
│    → 检测到 username 变化（虚拟列）                             │
│    → 查询 users 表: SELECT id FROM users WHERE username='bob'  │
│    → 获取: user_id=2                                           │
│    → 补正内存 Schema: user_id=2, username='bob'               │
│                                                                 │
│  Schema 写盘时:                                                 │
│    → username (preferColumn): 写入 schema.xml                  │
│    → user_id (noMigrate=true): 不写入 schema.xml               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### SELECT 虚拟列处理（双向查询支持）

```
输入: SELECT username FROM user_roles WHERE user_id = 1

1. Druid SQL Parser 解析 SQL
   ↓
2. 构建查询条件，获取数据行
   ↓
3. evaluateExprForRow() 处理每一行：
   - 检查 username 是否为虚拟列 (column.isVirtual())
   - 获取 row.get("user_id") = 1
   - 在 users 表中查找 id=1 的行
   - 返回 username="alice"
   ↓
4. 返回结果集
```

**双向查询支持**：
```sql
-- 查询物理列（始终支持）
SELECT user_id FROM user_roles;  -- 返回: [1, 2, 3]

-- 查询虚拟列（自动解析）
SELECT username FROM user_roles;  -- 返回: ["alice", "bob", "charlie"]

-- 混合查询
SELECT user_id, username FROM user_roles;
-- 返回: [{user_id: 1, username: "alice"}, ...]
```

#### INSERT 虚拟列处理（反向解析 + 双向存储）

```
输入: INSERT INTO user_roles (username) VALUES ('alice')

1. Druid SQL Parser 解析
   ↓
2. 识别 username 是虚拟列 (from="users.username" on="user_id")
   ↓
3. 反向解析：
   - 查询 users 表: SELECT id FROM users WHERE username='alice'
   - 获取结果: user_id = 1
   ↓
4. 双向存储（基于 noMigrate 规则）：
   - username (preferColumn): 存储值 'alice'
   - user_id (noMigrate=false): 同步存储 1
   ↓
5. 执行插入：
   INSERT INTO user_roles (user_id, username) VALUES (1, 'alice')
```

**关键点**：
- ✅ preferColumn 值**必然存储**
- ✅ 对应的 id 是否存储取决于 `noMigrate` 属性
- ✅ 逻辑同 deploy 阶段的 `VirtualColumnResolver`

#### UPDATE 虚拟列处理（双向同步）

**核心理解**：虚拟列和物理列可以**互相解析**，更新任何一个都要**补正同步**

```
输入: UPDATE user_roles SET username='bob' WHERE user_id = 1

1. Druid SQL Parser 解析
   ↓
2. 识别 username 是虚拟列 (from="users.username" on="user_id")
   ↓
3. 反向解析：
   - 查询 users 表: SELECT id FROM users WHERE username='bob'
   - 获取结果: user_id = 2
   ↓
4. 补正同步（基于 noMigrate 规则）：
   - username (preferColumn): 必然存储 'bob'
   - user_id (noMigrate=false): 同步更新为 2
   ↓
5. 执行更新：
   UPDATE user_roles SET user_id=2, username='bob' WHERE id=1
```

**关键点**：
- ✅ 支持双向查询：SELECT 物理列 OR 虚拟列
- ✅ 数据同步：更新任何一个 → 查询补正另一个
- ✅ 保留规则：
  - `preferColumn` 值（如 username）: **必然存储**
  - id 值（如 user_id）: 取决于 `noMigrate` 属性
- ✅ 逻辑同 deploy 阶段的 `VirtualColumnResolver`
- ⚠️ 如果查找的可读值不存在，抛出异常

**复杂场景示例**：

```sql
-- 场景 1: 同时更新多个虚拟列
UPDATE user_roles SET username='charlie', rolename='guest' WHERE id=1;
-- 转换为:
UPDATE user_roles SET user_id=3, role_id=4 WHERE id=1;

-- 场景 2: 混合虚拟列和物理列
UPDATE user_roles SET username='bob', active=true WHERE id=1;
-- 转换为:
UPDATE user_roles SET user_id=2, active=true WHERE id=1;

-- 场景 3: WHERE 子句中的虚拟列（本次计划支持）
UPDATE user_roles SET active=true WHERE username='alice';
-- 转换为:
UPDATE user_roles SET active=true WHERE user_id=1;
```

**错误处理**：

```sql
-- 可读值不存在时
UPDATE user_roles SET username='nonexistent' WHERE id=1;
-- 抛出: VirtualColumnResolutionException:
--       Cannot resolve virtual column 'username': no user found with username='nonexistent'
```

#### DELETE 虚拟列处理（本次计划支持）

```
输入: DELETE FROM user_roles WHERE username='alice'

1. Druid SQL Parser 解析
   ↓
2. 识别 WHERE 子句中的虚拟列
   ↓
3. 预处理：
   - 在 users 表中查找 username='alice' 的行
   - 获取 id = 1
   ↓
4. 重写 SQL：
   DELETE FROM user_roles WHERE user_id = 1
   ↓
5. 执行重写后的 SQL
```

---------------------------

## 9. 实现方案

### 推荐架构：运行时解析（Runtime Resolution）

**理由**：
1. SqlExecutor 已有完整的表达式求值引擎
2. Druid SQL Parser 提供了 AST 遍历能力
3. 可以直接访问 JustdbDataSource 中的表数据
4. 避免复杂的 SQL 字符串操作

### Phase 1: 创建虚拟列解析器

**新建文件**：`justdb-core/src/main/java/org/verydb/justdb/jdbc/virtual/VirtualColumnResolver.java`

```java
package org.verydb.justdb.jdbc.virtual;

import org.verydb.justdb.jdbc.JustdbDataSource;
import org.verydb.justdb.schema.Column;
import org.verydb.justdb.schema.Table;

import java.util.Map;

/**
 * Runtime resolver for virtual columns.
 * 虚拟列运行时解析器：在查询时动态解析虚拟列值
 */
public class VirtualColumnResolver {

    private final JustdbDataSource dataSource;

    public VirtualColumnResolver(JustdbDataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Resolve virtual column value for a given row.
     * 解析虚拟列值（用于 SELECT）
     */
    public Object resolveVirtualColumn(Table table, Column column, Map&lt;String, Object&gt; row) {
        if (!column.isVirtual()) {
            return null;
        }

        Column.VirtualColumnRef ref = column.getVirtualColumnRef();
        if (ref == null) {
            return null;
        }

        // Get foreign key value from row
        String fkColumn = column.getOn();  // e.g., "user_id"
        Object fkValue = row.get(fkColumn);
        if (fkValue == null) {
            return null;
        }

        // Lookup in referenced table
        String refTableName = ref.getTable();  // e.g., "users"
        String refFieldName = ref.getField();  // e.g., "username"

        Table refTable = dataSource.getTable(refTableName);
        if (refTable == null) {
            throw new RuntimeException("Referenced table not found: " + refTableName);
        }

        // Find the row with matching id and return the field value
        return lookupFieldValue(refTable, "id", fkValue, refFieldName);
    }

    /**
     * Reverse lookup: find ID by readable value.
     * 反向查找：通过可读值查找 ID（用于 INSERT/UPDATE）
     */
    public Object reverseLookup(Table table, String keyField, Object keyValue, String returnField) {
        // TODO: Implement using JustdbDataSource.select()
        return null;
    }

    private Object lookupFieldValue(Table table, String keyField, Object keyValue, String targetField) {
        // TODO: Implement using JustdbDataSource.select()
        return null;
    }
}
```

### Phase 2: 集成到 SqlExecutor

**修改文件**：`justdb-core/src/main/java/org/verydb/justdb/jdbc/SqlExecutor.java`

**关键集成点**：`evaluateExprForRow()` 方法（约 5253-5600 行）

```java
// 在 SqlExecutor 类中添加
private final VirtualColumnResolver virtualColumnResolver;

// 在构造函数中初始化
public SqlExecutor(JustdbConnection connection) {
    // ...existing code...
    this.virtualColumnResolver = new VirtualColumnResolver(connection.getDataSource());
}

// 修改 evaluateExprForRow 方法
private Object evaluateExprForRow(SQLExpr expr, Map&lt;String, Object&gt; row) {
    // NEW: 检查是否是虚拟列引用
    if (expr instanceof SQLIdentifierExpr) {
        String columnName = ((SQLIdentifierExpr) expr).getName();
        Table currentTable = getCurrentTable();

        if (currentTable != null) {
            Column column = currentTable.getColumn(columnName);
            if (column != null && column.isVirtual()) {
                return virtualColumnResolver.resolveVirtualColumn(currentTable, column, row);
            }
        }
    }

    // Existing: 处理其他表达式类型
    // ...existing code...
}
```

### Phase 3: INSERT/UPDATE 预处理

在 `executeUpdate()` 方法中添加虚拟列预处理：

```java
public int executeUpdate(String sql) throws SQLException {
    SQLStatement statement = parseStatementWithDialectFallback(sql);

    if (statement instanceof MySqlInsertStatement) {
        return executeInsertWithVirtualColumns((MySqlInsertStatement) statement);
    } else if (statement instanceof MySqlUpdateStatement) {
        return executeUpdateWithVirtualColumns((MySqlUpdateStatement) statement);
    }
    // ...existing code...
}
```

### Phase 4: GeneralContextParams 扩展（本次实现）

**说明**：利用现有上下文机制，无需添加枚举或修改 DBGenerator 构造函数

**修改文件**：
- `justdb-core/src/main/java/org/verydb/justdb/generator/GeneralContextParams.java` - 添加 `computedColumn` 字段
- `justdb-core/src/main/java/org/verydb/justdb/templates/TemplateExecutor.java` - 传递 computedColumn 到模板上下文（已有 additionalParams 机制）
- `justdb-core/src/main/java/org/verydb/justdb/cli/MigrateCommand.java` - 添加 `--computed-column` 参数
- `justdb-core/src/main/java/org/verydb/justdb/cli/ValidateCommand.java` - 添加 `--computed-column` 参数

**GeneralContextParams 扩展**：

```java
// GeneralContextParams.java - 新增字段
public class GeneralContextParams {
    // ...existing fields...

    /**
     * Computed column generation strategy
     * 计算列生成策略：auto, always, never
     * 默认: auto
     */
    private String computedColumn = "auto";

    public String getComputedColumn() {
        return computedColumn;
    }

    public GeneralContextParams setComputedColumn(String computedColumn) {
        this.computedColumn = computedColumn;
        return this;
    }

    // 便捷判断方法
    public boolean isComputedColumnAuto() {
        return "auto".equalsIgnoreCase(computedColumn);
    }

    public boolean isComputedColumnAlways() {
        return "always".equalsIgnoreCase(computedColumn);
    }

    public boolean isComputedColumnNever() {
        return "never".equalsIgnoreCase(computedColumn);
    }
}
```

**TemplateExecutor 上下文传递**（已有 additionalParams 机制）：

```java
// TemplateExecutor.java - createContent() 方法
// 在已有代码中添加 computedColumn 参数传递
if (idempotentParams != null) {
    // ...existing code for idempotent, safeDrop...

    // 新增：添加 computedColumn 参数
    if (idempotentParams.getComputedColumn() != null) {
        builder.put("computedColumn", idempotentParams.getComputedColumn());
    }

    // 已有：additionalParams 处理
    if (idempotentParams.getAdditionalParams() != null) {
        for (Map.Entry&lt;String, Object&gt; entry : idempotentParams.getAdditionalParams().entrySet()) {
            builder.put(entry.getKey(), entry.getValue());
        }
    }
}
```

**CLI 命令支持**：

```java
// MigrateCommand.java
@CommandLine.Command(name = "migrate", mixinStandardHelpOptions = true,
        description = "Apply schema changes to database")
public class MigrateCommand extends BaseCommand implements Callable&lt;Integer&gt; {

    // ...existing mixins and fields...

    // 新增：计算列生成策略选项
    @Option(names = {"--computed-column"},
            defaultValue = "auto",
            description = "Computed column generation strategy: auto, always, never (default: auto)")
    private String computedColumn = "auto";

    @Override
    public Integer call() throws Exception {
        handleGlobalOptions();

        // 构建上下文参数（使用现有 fluent API）
        GeneralContextParams contextParams = new GeneralContextParams()
            .idempotent(justdbManager.getIdempotent())
            .computedColumn(computedColumn);

        // DBGenerator 使用已有构造函数（无需修改）
        DBGenerator generator = new DBGenerator(
            justdbManager.getPluginManager(),
            dialect,
            contextParams
        );

        // 生成 DDL
        List&lt;String&gt; ddl = generator.generateCreateTable(table, contextParams);
        // ...
    }
}

// ValidateCommand.java - 同样支持
@CommandLine.Command(name = "validate", mixinStandardHelpOptions = true,
        description = "Validate database schema")
public class ValidateCommand extends BaseCommand implements Callable&lt;Integer&gt; {

    @Option(names = {"--computed-column"},
            defaultValue = "auto",
            description = "Computed column generation strategy for validation")
    private String computedColumn = "auto";

    @Override
    public Integer call() throws Exception {
        handleGlobalOptions();

        // 构建上下文参数
        GeneralContextParams contextParams = new GeneralContextParams()
            .idempotent(justdbManager.getIdempotent())
            .computedColumn(computedColumn);

        // 验证时考虑计算列策略
        // ...
    }
}
```

**模板中使用**（通过 @root.computedColumn 访问）：

```xml
&lt;!-- default-plugins.xml --&gt;
&lt;template id="column-spec" name="column-spec" type="SQL" category="db"&gt;
  &lt;content&gt;{{#if this.virtual}}
    {{#if (eq @root.computedColumn "always")}}
      {{#if this.type}}
        {{name}} {{type}} AS (SELECT {{this.from}} FROM {{this.from.table}} WHERE {{this.from.table}}.id = {{this.on}}) STORED,
      {{/if}}
    {{else if (eq @root.computedColumn "auto")}}
      {{#if @root.dbSupportsComputedColumns}}
        {{#if this.type}}
          {{name}} {{type}} AS (SELECT {{this.from}} FROM {{this.from.table}} WHERE {{this.from.table}}.id = {{this.on}}) STORED,
        {{/if}}
      {{/if}}
    {{/if}}
  {{else}}
    {{name}} {{type}}{{#unless @last}},{{/unless}}
  {{/if}}&lt;/content&gt;
&lt;/template&gt;
```

### Phase 5: ORM 生成过滤

**修改文件**：`justdb-core/src/main/java/org/verydb/justdb/generator/JavaGenerator.java`

```java
// 在生成实体类字段时，过滤虚拟列
protected void generateEntityClassFields(Table table, JavaWriter writer) {
    for (Column column : table.getColumns()) {
        if (column.isVirtual()) {
            continue;  // 跳过虚拟列
        }
        // ...existing code to generate field...
    }
}
```

---------------------------

## 10. 关键文件清单

### 10.1 新建文件

| 文件 | 说明 |
|------------------------------------------------------|------------------------------------------------------|
| `jdbc/virtual/VirtualColumnResolver.java` | 运行时虚拟列解析器 |
| `jdbc/virtual/VirtualColumnMapping.java` | 虚拟列映射数据类 |

### 10.2 修改文件

| 文件 | 修改位置 | 说明 |
|------------------------------------------------------|----------------------------------------------------------------------------------|------------------------------------------------------|
| `jdbc/SqlExecutor.java` | `evaluateExprForRow()` (~5402行) | 添加虚拟列解析逻辑 |
| `jdbc/SqlExecutor.java` | `executeUpdate()` | 添加 INSERT/UPDATE 虚拟列预处理 |
| `cli/MigrateCommand.java` | 新增 `--computed-column` 参数 | 命令行参数支持 |
| `cli/CliConfiguration.java` | 新增配置项 | computedColumn 配置 |
| `generator/DBGenerator.java` | 构造函数新增参数 | 接收计算列策略 |
| `generator/TemplateRootContext.java` | 新增方法和字段 | computedColumnStrategy, dbSupportsComputedColumns |
| `generator/JavaGenerator.java` | 实体类生成方法 | 过滤虚拟列 |
| `schema/Column.java` | - | 已有 `virtual`, `from`, `on` 属性，无需修改 |
| `deploy/VirtualColumnResolver.java` | - | 已实现 preferColumn 解析，无需修改 |

### 10.3 已有代码（无需修改）

**Column.java** - 虚拟列属性已完整实现:
- `virtual` 属性: line 117
- `from` 属性: line 120
- `on` 属性: line 123
- `isVirtual()` 方法: lines 395-405
- `getVirtualColumnRef()` 方法: lines 407-448

**default-plugins.xml** - DDL 模板已过滤虚拟列:
```xml
&lt;template id="columns" name="columns" type="SQL" category="db"&gt;
  &lt;content&gt;{{#each this.columns}}
{{#unless this.virtual}}
  {{> column}}{{>comma-unless @last}}
{{/unless}}{{/each}}&lt;/content&gt;
&lt;/template&gt;
```

---------------------------

## 11. 测试验证

### 11.1 单元测试

```java
@Test
public void testResolveVirtualColumn() {
    Table userRoles = new Table();
    userRoles.setName("user_roles");
    userRoles.addColumn(new Column("user_id", "BIGINT"));
    userRoles.addColumn(new Column("username", null, true, "users.username", "user_id"));

    JustdbDataSource dataSource = createMockDataSource();

    VirtualColumnResolver resolver = new VirtualColumnResolver(dataSource);
    Map&lt;String, Object&gt; row = Map.of("user_id", 1L);

    Object result = resolver.resolveVirtualColumn(userRoles,
        userRoles.getColumn("username"), row);

    assertEquals("alice", result);
}
```

### 11.2 集成测试（通过 JustDB JDBC Driver）

**说明**：集成测试通过 JustDB JDBC Driver 进行，模拟真实的 JDBC 使用场景。

```java
@Test
public void testSelectWithVirtualColumn() throws SQLException {
    String schemaXml = """
        &lt;Justdb&gt;
            &lt;Table name="users"&gt;
                &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
                &lt;Column name="username" type="VARCHAR(50)"/&gt;
            &lt;/Table&gt;
            &lt;Table name="user_roles"&gt;
                &lt;Column name="user_id" type="BIGINT"/&gt;
                &lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
            &lt;/Table&gt;
            &lt;Data table="users"&gt;
                &lt;Row id="1" username="alice"/&gt;
                &lt;Row id="2" username="bob"/&gt;
            &lt;/Data&gt;
            &lt;Data table="user_roles"&gt;
                &lt;Row user_id="1"/&gt;
            &lt;/Data&gt;
        &lt;/Justdb&gt;
        """;

    // 通过 JustDB JDBC Driver 加载 Schema
    JustdbDataSource dataSource = new JustdbDataSource();
    dataSource.loadSchema(new StringReader(schemaXml));

    // 通过 DriverManager 获取 JDBC 连接（模拟真实使用场景）
    try (Connection conn = DriverManager.getConnection("jdbc:justdb:test", dataSource)) {
        // 执行查询（通过 JDBC Driver，不直接使用 SqlExecutor）
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT username FROM user_roles WHERE user_id = 1");

        // 验证虚拟列被正确解析
        assertTrue(rs.next());
        assertEquals("alice", rs.getString("username"));
        assertFalse(rs.next());
    }
}

@Test
public void testInsertWithVirtualColumn() throws SQLException {
    String schemaXml = """
        &lt;Justdb&gt;
            &lt;Table name="users"&gt;
                &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
                &lt;Column name="username" type="VARCHAR(50)"/&gt;
            &lt;/Table&gt;
            &lt;Table name="user_roles"&gt;
                &lt;Column name="user_id" type="BIGINT"/&gt;
                <Column name="username" virtual="true" preferColumn="true"
                         from="users.username" on="user_id"/>
            &lt;/Table&gt;
            &lt;Data table="users"&gt;
                &lt;Row id="1" username="alice"/&gt;
            &lt;/Data&gt;
        &lt;/Justdb&gt;
        """;

    JustdbDataSource dataSource = new JustdbDataSource();
    dataSource.loadSchema(new StringReader(schemaXml));

    try (Connection conn = DriverManager.getConnection("jdbc:justdb:test", dataSource)) {
        // 插入虚拟列值（反向解析为 ID）
        PreparedStatement pstmt = conn.prepareStatement(
            "INSERT INTO user_roles (username) VALUES (?)"
        );
        pstmt.setString(1, "alice");
        int affected = pstmt.executeUpdate();
        assertEquals(1, affected);

        // 验证双向存储：username 和 user_id 都被正确存储
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT user_id, username FROM user_roles");

        assertTrue(rs.next());
        assertEquals(1L, rs.getLong("user_id"));
        assertEquals("alice", rs.getString("username"));
    }
}

@Test
public void testUpdateWithVirtualColumn() throws SQLException {
    String schemaXml = """
        &lt;Justdb&gt;
            &lt;Table name="users"&gt;
                &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
                &lt;Column name="username" type="VARCHAR(50)"/&gt;
            &lt;/Table&gt;
            &lt;Table name="user_roles"&gt;
                &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
                &lt;Column name="user_id" type="BIGINT"/&gt;
                <Column name="username" virtual="true" preferColumn="true"
                         from="users.username" on="user_id"/>
            &lt;/Table&gt;
            &lt;Data table="users"&gt;
                &lt;Row id="1" username="alice"/&gt;
                &lt;Row id="2" username="bob"/&gt;
            &lt;/Data&gt;
            &lt;Data table="user_roles"&gt;
                &lt;Row id="1" user_id="1"/&gt;
            &lt;/Data&gt;
        &lt;/Justdb&gt;
        """;

    JustdbDataSource dataSource = new JustdbDataSource();
    dataSource.loadSchema(new StringReader(schemaXml));

    try (Connection conn = DriverManager.getConnection("jdbc:justdb:test", dataSource)) {
        // 更新虚拟列值（反向解析并双向同步）
        PreparedStatement pstmt = conn.prepareStatement(
            "UPDATE user_roles SET username = ? WHERE id = ?"
        );
        pstmt.setString(1, "bob");
        pstmt.setLong(2, 1L);
        int affected = pstmt.executeUpdate();
        assertEquals(1, affected);

        // 验证双向同步：username 和 user_id 都被正确更新
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT user_id, username FROM user_roles WHERE id = 1");

        assertTrue(rs.next());
        assertEquals(2L, rs.getLong("user_id"));  // 反向解析为 bob 的 ID
        assertEquals("bob", rs.getString("username"));
    }
}

@Test
public void testWhereClauseWithVirtualColumn() throws SQLException {
    String schemaXml = """
        &lt;Justdb&gt;
            &lt;Table name="users"&gt;
                &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
                &lt;Column name="username" type="VARCHAR(50)"/&gt;
            &lt;/Table&gt;
            &lt;Table name="user_roles"&gt;
                &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
                &lt;Column name="user_id" type="BIGINT"/&gt;
                &lt;Column name="active" type="BOOLEAN"/&gt;
                &lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
            &lt;/Table&gt;
            &lt;Data table="users"&gt;
                &lt;Row id="1" username="alice"/&gt;
            &lt;/Data&gt;
            &lt;Data table="user_roles"&gt;
                &lt;Row id="1" user_id="1" active="false"/&gt;
            &lt;/Data&gt;
        &lt;/Justdb&gt;
        """;

    JustdbDataSource dataSource = new JustdbDataSource();
    dataSource.loadSchema(new StringReader(schemaXml));

    try (Connection conn = DriverManager.getConnection("jdbc:justdb:test", dataSource)) {
        // WHERE 子句使用虚拟列（本次计划支持）
        PreparedStatement pstmt = conn.prepareStatement(
            "UPDATE user_roles SET active = ? WHERE username = ?"
        );
        pstmt.setBoolean(1, true);
        pstmt.setString(2, "alice");
        int affected = pstmt.executeUpdate();
        assertEquals(1, affected);

        // 验证更新成功
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT active FROM user_roles WHERE username = 'alice'");

        assertTrue(rs.next());
        assertTrue(rs.getBoolean("active"));
    }
}
                &lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
            &lt;/Table&gt;
            &lt;Data table="users"&gt;
                &lt;Row id="1" username="alice"/&gt;
            &lt;/Data&gt;
        &lt;/Justdb&gt;
        """;

    SqlExecutor executor = createSqlExecutor(schemaXml);
    SelectResult result = executor.executeSelect(
        "SELECT username FROM user_roles WHERE user_id = 1"
    );

    assertEquals(1, result.getRows().size());
    assertEquals("alice", result.getRows().get(0).get("username"));
}
```

### 11.3 验证步骤

```bash
# 1. 构建项目
mvn clean install -DskipTests

# 2. 运行单元测试
mvn test -Dtest=VirtualColumnResolverTest

# 3. 运行集成测试
mvn test -Dtest=VirtualColumnIntegrationTest
```

---------------------------

## 附录 A: 完整示例

### A.1 场景 1: 两者兼得（推荐）

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb name="example"&gt;

    &lt;!-- 主表 --&gt;
    &lt;Table name="users"&gt;
        &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
        &lt;Column name="username" type="VARCHAR(50)" nullable="false"/&gt;
    &lt;/Table&gt;

    &lt;Table name="roles"&gt;
        &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
        &lt;Column name="rolename" type="VARCHAR(50)" nullable="false"/&gt;
    &lt;/Table&gt;

    &lt;!-- 关联表：只存储 ID --&gt;
    &lt;Table name="user_roles"&gt;
        &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
        &lt;Column name="user_id" type="BIGINT" noMigrate="true"/&gt;
        &lt;Column name="role_id" type="BIGINT" noMigrate="true"/&gt;

        &lt;!-- 虚拟列 + 可读列：DDL 包含，预制时也支持，运行时也支持 --&gt;
        <Column name="username"
                type="VARCHAR(255)"
                virtual="true"
                preferColumn="true"
                from="users.username"
                on="user_id"/>
        <Column name="rolename"
                type="VARCHAR(255)"
                virtual="true"
                preferColumn="true"
                from="roles.rolename"
                on="role_id"/>
    &lt;/Table&gt;

    &lt;!-- 预制数据：使用可读值 --&gt;
    &lt;Data table="users"&gt;
        &lt;Row username="alice"/&gt;
        &lt;Row username="bob"/&gt;
    &lt;/Data&gt;

    &lt;Data table="roles"&gt;
        &lt;Row rolename="admin"/&gt;
        &lt;Row rolename="viewer"/&gt;
    &lt;/Data&gt;

    &lt;Data table="user_roles"&gt;
        &lt;Row username="alice" rolename="admin"/&gt;
        &lt;Row username="bob" rolename="viewer"/&gt;
    &lt;/Data&gt;

&lt;/Justdb&gt;
```

**生成的 DDL**（`computedColumn="auto"` + MySQL 8.0+）：
```sql
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    role_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED,
    rolename VARCHAR(255) AS (SELECT rolename FROM roles WHERE roles.id = role_id) STORED
);
```

**生成的 DDL**（`computedColumn="auto"` + MySQL 5.7）：
```sql
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    role_id BIGINT
);
-- username, rolename: 运行时解析，不包含在 DDL 中
```

**生成的 DDL**（`computedColumn="always"` + MySQL 5.7）：
```sql
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    role_id BIGINT,
    username VARCHAR(255),  -- 物理列，需应用维护
    rolename VARCHAR(255)   -- 物理列，需应用维护
);
```

**使用方式**：
1. **预制数据**：自动解析 `username="alice"` 为 ID
2. **运行时查询**：`SELECT username FROM user_roles` 自动返回可读值
3. **计算列策略**：通过命令行参数控制
   ```bash
   justdb migrate --computed-column auto  # 推荐：数据库支持时生成
   justdb migrate --computed-column always  # 强制生成
   justdb migrate --computed-column never   # 从不生成
   ```

---------------------------

## 附录 B: 属性组合说明

### B.1 属性组合矩阵

| type | virtual | preferColumn | DDL 包含 | 预制数据解析 | 运行时查询 |
|------------------------------------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| ✅ | 未设置/`false` | 未设置 | ✅ | ❌ | ❌ |
| ✅ | 未设置/`false` | `true` | ✅ | ✅ | ❌ |
| ✅ | `true` | 未设置 | ❌ | ❌ | ✅ |
| ✅ | `true` | `true` | ❌ | ✅ | ✅ |
| ❌ | 未设置 | `true` | ❌ | ✅ | ❌ |
| ❌ | `true` | 未设置 | ❌ | ❌ | ✅ |
| ❌ | `true` | `true` | ❌ | ✅ | ✅ |

### B.2 推荐使用方式

| 场景 | 推荐配置 |
|------------------------------------------------------|----------------------------------------------------------------------------------|
| **仅预制数据可读性** | `preferColumn="true"` (无 type) |
| **仅运行时查询可读性** | `virtual="true"` (无 type) |
| **两者兼得（最佳体验）** | `type="..."` + `virtual="true"` + `preferColumn="true"` |

---------------------------

## 13. 实施进度

### 13.1 版本 7.1 (2026-02-08)

**状态**: SELECT 运行时解析 - 调试中

#### ✅ 已完成

| 功能 | 状态 | 说明 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| **preferColumn 属性** | ✅ 完成 | `Column.java` 添加 `preferColumn` 属性，使用 `@Getter @Setter` 注解 |
| **VirtualColumnResolver 类** | ✅ 完成 | 创建 `jdbc/virtual/VirtualColumnResolver.java` |
| **正向解析** | ✅ 完成 | `resolveVirtualColumn()` - ID → 可读值 |
| **反向查找** | ✅ 完成 | `reverseLookupVirtualColumn()` - 可读值 → ID |
| **SqlExecutor.applyProjection** | ✅ 修复 | 使用 `evaluateExprForRow(expr, row, table)` 处理所有列表达式 |
| **IsVirtualColumnHelper** | ✅ 完成 | 模板 Helper 检测虚拟列 |
| **ORM 注解支持** | ✅ 完成 | JPA/MyBatis/Hibernate 模板添加虚拟列注解 |
| **集成测试框架** | ✅ 完成 | `VirtualColumnIntegrationTest.java` 创建 |

#### 📝 新发现

1. **Table 类缺少 `getColumn(String)` 方法**
   - 发现位置: SqlExecutor 集成时
   - 影响: 需要遍历 `getColumns()` 列表来查找列
   - 解决方案: 添加辅助方法 `findColumn(Table, String)`

2. **表上下文传递方案**
   - 初始方案: 使用 ThreadLocal (已否决)
   - 最终方案: 添加重载方法 `evaluateExprForRow(expr, row, table)`
   - 原因: 用户要求明确的参数传递，避免隐式状态

3. **虚拟列缓存机制**
   - 实现: 在 `evaluateExprForRow()` 中首次解析时缓存到 row
   - 优势: 避免重复解析，提升性能

4. **@Getter/@Setter 注解规范**
   - 用户要求: 使用 Lombok 注解，避免手动创建 getter/setter
   - 实现: Column.java 的 `virtual`, `from`, `on` 字段添加 `@Getter @Setter`

5. **applyProjection 方法修复**
   - 问题: 原代码直接从 row 取值，跳过了虚拟列解析
   - 修复: 改为调用 `evaluateExprForRow(expr, row, table)` 统一处理

6. **测试验证发现**
   - 表配置正确: 测试断言确认 table.getName() 和 table.getColumns() 正确
   - 虚拟列配置正确: isVirtual(), getFrom(), getOn() 均返回预期值
   - 待解决: 运行时解析仍返回 null，需要进一步调试

#### ⏳ 待实现

| 功能 | 优先级 | 说明 |
|------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------|
| **SELECT 虚拟列解析** | P0 | 当前返回 null，需要调试修复 |
| **INSERT 支持** | P1 | 插入时自动解析虚拟列值 → ID |
| **UPDATE 支持** | P1 | 更新时双向同步虚拟列 ↔ 物理列 |
| **DELETE 支持** | P2 | WHERE 子句虚拟列解析 |
| **单元测试** | P1 | VirtualColumnResolver 完整测试覆盖 |
| **集成测试** | P1 | 端到端 SQL 查询测试 |
| **性能优化** | P2 | 查询结果缓存机制 |

#### 🔧 技术债务

1. **辅助方法位置**
   - `findColumn(Table, String)` 目前作为测试辅助方法
   - 建议: 考虑添加到 `Table` 类作为正式方法

2. **异常处理**
   - `VirtualColumnResolver` 中的 SQLException 需要更好的处理策略
   - 建议: 添加更详细的错误信息和恢复机制

---------------------------

**文档结束**

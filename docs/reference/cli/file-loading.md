---
title: 文件加载机制
icon: file-alt
description: JustDB CLI Schema 文件发现、加载和引用机制
order: 5
---

# 文件加载机制

JustDB CLI 提供了灵活的 Schema 文件加载机制，支持多文件加载、远程加载和引用引用。

## Schema 文件发现

### 文件类型支持

JustDB 自动识别以下文件类型：

| 扩展名 | 格式 | 描述 |
|--------|------|------|
| `.yaml`, `.yml` | YAML | 人类可读的配置格式 |
| `.json` | JSON | 机器可读的配置格式 |
| `.xml` | XML | 传统的 JustDB 格式 |
| `.toml` | TOML | 简洁的配置格式 |
| `.properties` | Properties | Java 属性文件格式 |
| `.sql` | SQL | SQL 脚本 |
| `.java` | Java | Java 源代码 |
| `.class` | Class | 编译的 Java 类 |

### 自动发现规则

当未指定文件类型时，JustDB 按以下顺序查找：

1. **当前目录** - `./justdb.*`
2. **项目目录** - `&lt;project&gt;/justdb.*`
3. **标准位置** - `src/main/resources/justdb.*`
4. **类路径** - 从 JAR 资源加载

```bash
# 自动查找
justdb migrate              # 查找 justdb.yaml/xml/json

# 指定文件
justdb migrate schema.yaml

# 指定多个文件
justdb migrate schema1.yaml schema2.yaml
```

## Include/Import 机制

### Include 元素

在 XML Schema 中使用 include 包含其他文件：

```xml
&lt;!-- main.xml --&gt;
&lt;Justdb id="main" name="Main Schema"&gt;
    &lt;!-- 包含公共列定义 --&gt;
    &lt;include file="common-columns.xml" /&gt;

    &lt;!-- 包含表定义 --&gt;
    &lt;include file="tables/users.xml" /&gt;
    &lt;include file="tables/orders.xml" /&gt;

    &lt;!-- 包含远程文件 --&gt;
    &lt;include url="https://example.com/schemas/common.xml" /&gt;

    &lt;Tables&gt;
        &lt;!-- 本地表定义 --&gt;
    &lt;/Tables&gt;
&lt;/Justdb&gt;
```

### Import 指令

使用指令导入文件：

```xml
&lt;!-- main.xml --&gt;
&lt;Justdb id="main" name="Main Schema"&gt;
    &lt;!-- 导入指令 --&gt;
    &lt;import file="common-columns.xml" /&gt;
    &lt;import file="tables/" /&gt;

    &lt;Tables&gt;
        &lt;!-- 使用导入的列 --&gt;
        &lt;Table name="users"&gt;
            &lt;Column referenceId="global_id" name="id" /&gt;
            &lt;Column referenceId="global_created_at" name="created_at" /&gt;
        &lt;/Table&gt;
    &lt;/Tables&gt;
&lt;/Justdb&gt;
```

### YAML Include

YAML 格式使用特殊语法包含文件：

```yaml
# main.yaml
tables:
  - !include tables/users.yaml
  - !include tables/orders.yaml

columns:
  - !include common-columns.yaml

data:
  - !include data/users-data.yaml
```

## Ref-ID 引用

### 全局列定义

定义可重用的列：

```xml
&lt;!-- common-columns.xml --&gt;
&lt;Justdb id="common"&gt;
    &lt;Columns&gt;
        &lt;!-- 全局 ID 列 --&gt;
        <Column id="global_id" name="id" type="BIGINT"
                primaryKey="true" autoIncrement="true" />

        &lt;!-- 全局时间戳列 --&gt;
        <Column id="global_created_at" name="created_at"
                type="TIMESTAMP" nullable="false"
                defaultValue="CURRENT_TIMESTAMP" />

        <Column id="global_updated_at" name="updated_at"
                type="TIMESTAMP" nullable="false"
                defaultValue="CURRENT_TIMESTAMP" />
    &lt;/Columns&gt;
&lt;/Justdb&gt;
```

### 引用全局列

使用 `referenceId` 引用全局列：

```xml
&lt;!-- users.xml --&gt;
&lt;Table name="users"&gt;
    &lt;!-- 引用全局 ID 列 --&gt;
    &lt;Column referenceId="global_id" name="id" /&gt;

    &lt;!-- 本地列 --&gt;
    &lt;Column name="username" type="VARCHAR(50)" nullable="false" /&gt;
    &lt;Column name="email" type="VARCHAR(100)" nullable="false" /&gt;

    &lt;!-- 引用全局时间戳列 --&gt;
    &lt;Column referenceId="global_created_at" name="created_at" /&gt;
    &lt;Column referenceId="global_updated_at" name="updated_at" /&gt;
&lt;/Table&gt;
```

### 全局表继承

使用 `extends` 继承表定义：

```xml
&lt;!-- base-table.xml --&gt;
&lt;Table id="base_table" name="base"&gt;
    &lt;Column referenceId="global_id" name="id" /&gt;
    &lt;Column referenceId="global_created_at" name="created_at" /&gt;
&lt;/Table&gt;

&lt;!-- users.xml --&gt;
&lt;Table name="users" extends="base_table"&gt;
    &lt;Column name="username" type="VARCHAR(50)" /&gt;
    &lt;Column name="email" type="VARCHAR(100)" /&gt;
&lt;/Table&gt;
```

## 多文件加载

### 目录加载

加载整个目录的 Schema 文件：

```bash
# 加载目录下所有文件
justdb migrate ./schemas/

# 指定文件类型
justdb migrate ./schemas/ --type yaml
```

### 多文件指定

指定多个文件：

```bash
# 多个文件
justdb migrate schema1.yaml schema2.yaml schema3.yaml

# 使用通配符
justdb migrate schemas/*.yaml

# 递归加载
justdb migrate schemas/ --recursive
```

### 文件合并策略

多文件加载时的合并规则：

1. **Tables** - 累加所有表的定义
2. **Columns** - 累加所有列定义
3. **Data** - 累加所有数据定义
4. **Views** - 累加所有视图定义
5. **ID 冲突** - 后加载的覆盖先加载的

```xml
&lt;!-- file1.xml --&gt;
&lt;Justdb id="app"&gt;
    &lt;Columns&gt;
        &lt;Column id="col1" name="field1" type="INT" /&gt;
    &lt;/Columns&gt;
    &lt;Tables&gt;
        &lt;Table name="table1"&gt;
            &lt;Column name="col1" type="VARCHAR(50)" /&gt;
        &lt;/Table&gt;
    &lt;/Tables&gt;
&lt;/Justdb&gt;

&lt;!-- file2.xml --&gt;
&lt;Justdb id="app"&gt;
    &lt;Columns&gt;
        &lt;Column id="col2" name="field2" type="INT" /&gt;
    &lt;/Columns&gt;
    &lt;Tables&gt;
        &lt;Table name="table2"&gt;
            &lt;Column name="col1" type="INT" /&gt;
        &lt;/Table&gt;
    &lt;/Tables&gt;
&lt;/Justdb&gt;

&lt;!-- 合并结果 --&gt;
&lt;Justdb id="app"&gt;
    &lt;Columns&gt;
        &lt;Column id="col1" name="field1" type="INT" /&gt;
        &lt;Column id="col2" name="field2" type="INT" /&gt;
    &lt;/Columns&gt;
    &lt;Tables&gt;
        &lt;Table name="table1"&gt;
            &lt;Column name="col1" type="VARCHAR(50)" /&gt;
        &lt;/Table&gt;
        &lt;Table name="table2"&gt;
            &lt;Column name="col1" type="INT" /&gt;
        &lt;/Table&gt;
    &lt;/Tables&gt;
&lt;/Justdb&gt;
```

## 远程加载

### HTTP/HTTPS 加载

从 URL 加载 Schema：

```xml
&lt;Justdb id="main"&gt;
    &lt;!-- 远程 Schema --&gt;
    &lt;include url="https://example.com/schemas/common.xml" /&gt;
    &lt;include url="https://raw.githubusercontent.com/user/repo/main/schema.yaml" /&gt;

    &lt;Tables&gt;
        &lt;!-- 本地表 --&gt;
    &lt;/Tables&gt;
&lt;/Justdb&gt;
```

### Git 仓库加载

从 Git 仓库加载：

```bash
# 从 GitHub 加载
justdb migrate "git://github.com/user/repo:schema.yaml"

# 指定分支
justdb migrate "git://github.com/user/repo:main:schema.yaml"

# 从 Gitee 加载
justdb migrate "git://gitee.com/user/repo:schema.yaml"
```

### 类路径加载

从类路径加载资源：

```xml
&lt;Justdb id="main"&gt;
    &lt;!-- 类路径资源 --&gt;
    &lt;include resource="schemas/common.xml" /&gt;
    &lt;include resource="classpath:/schemas/base-tables.xml" /&gt;
&lt;/Justdb&gt;
```

## 文件解析选项

### 格式自动检测

JustDB 自动检测文件格式：

```bash
# 根据扩展名检测
justdb migrate schema.yaml   # YAML 格式
justdb migrate schema.json   # JSON 格式
justdb migrate schema.xml    # XML 格式
```

### 显式指定格式

使用 `--type` 选项指定格式：

```bash
# 指定格式
justdb migrate schema.txt --type yaml

# 多种格式
justdb migrate schema.yaml --type yaml --type json
```

### 编码处理

JustDB 支持多种字符编码：

```bash
# 指定编码
justdb migrate schema.yaml --encoding UTF-8

# 自动检测（默认）
justdb migrate schema.yaml
```

## 路径解析

### 绝对路径

```bash
# 绝对路径
justdb migrate /path/to/schema.yaml
justdb migrate C:\schemas\schema.xml
```

### 相对路径

相对路径相对于工作目录：

```bash
# 相对路径
justdb migrate ./schema.yaml
justdb migrate ../schemas/schema.xml
```

### 工作目录

在交互式模式中改变工作目录：

```bash
# 改变工作目录
justdb> cd /path/to/project

# 查看当前目录
justdb> pwd

# 加载当前目录的文件
justdb> load schema.yaml
```

## 文件监控

监控 Schema 文件变化：

```bash
# 监控单个文件
justdb watch schema.yaml

# 监控目录
justdb watch ./schemas/

# 执行命令
justdb watch schema.yaml --command "justdb validate %f"
```

## 加载错误处理

### 跳过错误文件

使用 `--continue-on-error` 继续：

```bash
# 跳过错误文件
justdb migrate *.xml --continue-on-error
```

### 详细错误信息

使用 `--verbose` 查看详细错误：

```bash
# 详细模式
justdb migrate schema.yaml --verbose

# 调试模式
justdb migrate schema.yaml -vv
```

## 性能优化

### 缓存机制

JustDB 缓存已加载的文件：

```bash
# 清除缓存
justdb migrate --clear-cache schema.yaml

# 禁用缓存
justdb migrate --no-cache schema.yaml
```

### 并行加载

并行加载多个文件：

```bash
# 并行加载
justdb migrate *.xml --parallel

# 指定线程数
justdb migrate *.xml --parallel --threads 4
```

## 最佳实践

1. **使用模块化结构**
   ```
   schemas/
   ├── common/
   │   ├── columns.xml
   │   └── tables.xml
   ├── tables/
   │   ├── users.xml
   │   └── orders.xml
   └── data/
       └── users-data.xml
   ```

2. **使用全局定义**
   - 在 `common/columns.xml` 中定义全局列
   - 使用 `referenceId` 引用全局列

3. **分离关注点**
   - 公共定义放 `common/` 目录
   - 表定义放 `tables/` 目录
   - 数据定义放 `data/` 目录

4. **使用版本控制**
   - 将 Schema 文件纳入版本控制
   - 使用 `.gitignore` 排除敏感数据

5. **文档化引用**
   - 为全局定义添加注释
   - 记录引用关系

## 相关文档

- [命令参考](./commands.md) - 加载命令选项
- [配置文件](./configuration.md) - 配置文件说明
- [Schema 定义参考](../schema/README.md) - Schema 结构说明

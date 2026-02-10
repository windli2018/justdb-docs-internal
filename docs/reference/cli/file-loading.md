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
2. **项目目录** - `<project>/justdb.*`
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
<!-- main.xml -->
<Justdb id="main" name="Main Schema">
    <!-- 包含公共列定义 -->
    <include file="common-columns.xml" />

    <!-- 包含表定义 -->
    <include file="tables/users.xml" />
    <include file="tables/orders.xml" />

    <!-- 包含远程文件 -->
    <include url="https://example.com/schemas/common.xml" />

    <Tables>
        <!-- 本地表定义 -->
    </Tables>
</Justdb>
```

### Import 指令

使用指令导入文件：

```xml
<!-- main.xml -->
<Justdb id="main" name="Main Schema">
    <!-- 导入指令 -->
    <import file="common-columns.xml" />
    <import file="tables/" />

    <Tables>
        <!-- 使用导入的列 -->
        <Table name="users">
            <Column referenceId="global_id" name="id" />
            <Column referenceId="global_created_at" name="created_at" />
        </Table>
    </Tables>
</Justdb>
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
<!-- common-columns.xml -->
<Justdb id="common">
    <Columns>
        <!-- 全局 ID 列 -->
        <Column id="global_id" name="id" type="BIGINT"
                primaryKey="true" autoIncrement="true" />

        <!-- 全局时间戳列 -->
        <Column id="global_created_at" name="created_at"
                type="TIMESTAMP" nullable="false"
                defaultValue="CURRENT_TIMESTAMP" />

        <Column id="global_updated_at" name="updated_at"
                type="TIMESTAMP" nullable="false"
                defaultValue="CURRENT_TIMESTAMP" />
    </Columns>
</Justdb>
```

### 引用全局列

使用 `referenceId` 引用全局列：

```xml
<!-- users.xml -->
<Table name="users">
    <!-- 引用全局 ID 列 -->
    <Column referenceId="global_id" name="id" />

    <!-- 本地列 -->
    <Column name="username" type="VARCHAR(50)" nullable="false" />
    <Column name="email" type="VARCHAR(100)" nullable="false" />

    <!-- 引用全局时间戳列 -->
    <Column referenceId="global_created_at" name="created_at" />
    <Column referenceId="global_updated_at" name="updated_at" />
</Table>
```

### 全局表继承

使用 `extends` 继承表定义：

```xml
<!-- base-table.xml -->
<Table id="base_table" name="base">
    <Column referenceId="global_id" name="id" />
    <Column referenceId="global_created_at" name="created_at" />
</Table>

<!-- users.xml -->
<Table name="users" extends="base_table">
    <Column name="username" type="VARCHAR(50)" />
    <Column name="email" type="VARCHAR(100)" />
</Table>
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
<!-- file1.xml -->
<Justdb id="app">
    <Columns>
        <Column id="col1" name="field1" type="INT" />
    </Columns>
    <Tables>
        <Table name="table1">
            <Column name="col1" type="VARCHAR(50)" />
        </Table>
    </Tables>
</Justdb>

<!-- file2.xml -->
<Justdb id="app">
    <Columns>
        <Column id="col2" name="field2" type="INT" />
    </Columns>
    <Tables>
        <Table name="table2">
            <Column name="col1" type="INT" />
        </Table>
    </Tables>
</Justdb>

<!-- 合并结果 -->
<Justdb id="app">
    <Columns>
        <Column id="col1" name="field1" type="INT" />
        <Column id="col2" name="field2" type="INT" />
    </Columns>
    <Tables>
        <Table name="table1">
            <Column name="col1" type="VARCHAR(50)" />
        </Table>
        <Table name="table2">
            <Column name="col1" type="INT" />
        </Table>
    </Tables>
</Justdb>
```

## 远程加载

### HTTP/HTTPS 加载

从 URL 加载 Schema：

```xml
<Justdb id="main">
    <!-- 远程 Schema -->
    <include url="https://example.com/schemas/common.xml" />
    <include url="https://raw.githubusercontent.com/user/repo/main/schema.yaml" />

    <Tables>
        <!-- 本地表 -->
    </Tables>
</Justdb>
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
<Justdb id="main">
    <!-- 类路径资源 -->
    <include resource="schemas/common.xml" />
    <include resource="classpath:/schemas/base-tables.xml" />
</Justdb>
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

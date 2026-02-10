---------------------------
title: 命令参考
icon: list
description: JustDB CLI 完整命令列表、语法和示例
order: 2
---------------------------

# 命令参考

本文档提供所有 JustDB CLI 命令的完整参考。

## 命令列表

### Schema 管理

#### init

初始化新的 JustDB 项目。

**语法**
```bash
justdb init [options] [project-name]
```

**选项**
```bash
-p, --project <name>     # 项目名称
-t, --format <fmt>       # 输出格式: xml, yaml, json (默认: xml)
-o, --output <file>      # 输出文件 (默认: <project>/justdb.<fmt>)
-f, --force              # 覆盖已存在的文件
```

**示例**
```bash
# 使用默认设置初始化项目
justdb init

# 指定项目名称和格式
justdb init -p myapp -t yaml

# 覆盖已存在的项目
justdb init -f myapp
```

**生成的文件结构**
```
myapp/
└── justdb.xml          # Schema 定义文件
    ├── Justdb
    ├── Columns         # 全局列定义
    └── Tables          # 表定义
        ├── users
        ├── orders
        └── products
```

---------------------------

#### db2schema

从数据库导出 Schema。

**语法**
```bash
justdb db2schema [options]
```

**选项**
```bash
# 数据库连接
-C, --current-database <name>    # 使用配置文件中的数据库
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # 用户名
-w, --db-password <pass>         # 密码
-D, --dialect <type>             # 数据库方言

# 表过滤
-I, --include-tables <patterns>  # 包含表模式
-X, --exclude-tables <patterns>  # 排除表模式

# Include 规则（增强功能）
-ir, --include-rule <rule>       # Include 规则
                                  # 格式: pattern&key1=value1&key2=value2
-d, --data-filter <rule>         # 简化数据过滤规则
                                  # 格式: pattern=condition

# 输出
-o, --output <file>              # 输出文件
-t, --format <fmt>               # 输出格式 (默认: json)

# 数据导出
--process-data                   # 导出数据
--data-filter <condition>        # 数据过滤条件
```

**Include 规则支持的键**
- `author` / `a`：作者
- `remark` / `r`：备注
- `module` / `m`：模块
- `dataFilter` / `df`：数据过滤条件

**示例**
```bash
# 导出所有表
justdb db2schema -C production -o schema.yaml

# 只导出特定模式的表
justdb db2schema -C production -I "sys_*" -o schema.yaml

# 使用 Include 规则
justdb db2schema -C production \
  -I "sys_*&author=admin&remark=系统表&dataFilter=deleted=0" \
  -o schema.yaml

# 使用简化数据过滤
justdb db2schema -C production \
  -d "sys_user=deleted=0" \
  -d "sys_role=is_system=1" \
  -o schema.yaml

# 多租户数据导出
justdb db2schema -C production \
  -I "user_data&remark=租户0&dataFilter=tenant_id='0'" \
  -I "user_data&remark=租户1&dataFilter=tenant_id='1'" \
  -o schema.yaml
```

**dataFilter 类型**
| 值 | 类型 | 说明 |
|---------------------------|---------------------------|---------------------------|
| 留空 或 `"none"` | NONE | 不导出数据，仅结构 |
| `"*"` 或 `"all"` | ALL | 导出全部数据 |
| 以 `"SELECT"` 开头 | CONDITION | 完整 SQL 语句 |
| 其他值 | CONDITION | WHERE 条件表达式 |

---------------------------

#### format

格式化 Schema 文件。

**语法**
```bash
justdb format [options] <files>...
```

**选项**
```bash
-i, --input <files>       # 输入文件
-o, --output <file>       # 输出文件（默认覆盖原文件）
-t, --format <fmt>        # 输出格式
--sort-keys               # 排序键
--indent <spaces>         # 缩进空格数
```

**示例**
```bash
# 格式化单个文件
justdb format schema.yaml

# 转换格式
justdb format -t json schema.xml -o schema.json

# 格式化多个文件
justdb format *.yaml
```

---------------------------

#### validate

验证 Schema 定义。

**语法**
```bash
justdb validate [options] [files...]
```

**选项**
```bash
# 数据库连接
-C, --current-database <name>    # 使用配置文件中的数据库
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # 用户名
-w, --db-password <pass>         # 密码

# 表过滤
-I, --include-tables <patterns>  # 包含表模式
-X, --exclude-tables <patterns>  # 排除表模式

# 验证选项
--validate-data-conditions       # 验证数据条件
```

**示例**
```bash
# 验证 Schema 文件
justdb validate schema.yaml

# 针对特定数据库验证
justdb validate -C production schema.yaml

# 验证特定表
justdb validate -I "user*" schema.yaml
```

**验证状态**
- **CONSISTENT** - 与数据库一致
- **INCONSISTENT** - 与数据库不一致
- **NOT_APPLIED** - 未应用到数据库
- **OUTDATED** - 数据库中的版本过期
- **EXISTS_IN_DB_NOT_IN_HISTORY** - 存在于数据库但不在历史中

---------------------------

### 迁移和部署

#### migrate

执行 Schema 迁移。

**语法**
```bash
justdb migrate [up|down|status] [options]
```

**子命令**
```bash
up      # 应用 Schema 变更（默认）
down    # 回滚 Schema 变更
status  # 查看迁移状态
```

**选项**
```bash
# 数据库连接
-C, --current-database <name>    # 使用配置文件中的数据库
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # 用户名
-w, --db-password <pass>         # 密码

# 表过滤
-I, --include-tables <patterns>  # 包含表模式
-X, --exclude-tables <patterns>  # 排除表模式

# 迁移选项
--delete-marked                  # 删除标记为删除的对象
--retention-days <days>          # 保留期（默认: 60）
--validate-data-conditions       # 验证数据条件

# 备份选项
--backup                         # 迁移前备份
--backup-provider <name>         # 备份提供者
--backup-location <path>         # 备份位置
--backup-encrypt                 # 加密备份
--backup-key <key>               # 加密密钥
```

**示例**
```bash
# 应用迁移
justdb migrate up schema.yaml

# 带备份的迁移
justdb migrate up --backup schema.yaml

# 查看状态
justdb migrate status schema.yaml

# 迁移特定表
justdb migrate up -I "user*" schema.yaml
```

---------------------------

#### diff

比较两个 Schema 的差异。

**语法**
```bash
justdb diff [options] [file1] [file2]
```

**选项**
```bash
-o, --output <file>        # 输出差异 Schema
-oq, --output-sql <file>   # 输出 SQL 迁移脚本
--report-format <fmt>      # 报告格式: text, md, html, json
```

**示例**
```bash
# 比较两个文件
justdb diff old-schema.yaml new-schema.yaml

# 生成差异报告
justdb diff old.yaml new.yaml -o diff.yaml

# 生成 SQL 迁移脚本
justdb diff old.yaml new.yaml -oq migration.sql

# 使用当前 Schema
justdb diff new-schema.yaml -o diff.yaml
```

**差异类型**
- **ADDED** - 新增对象
- **REMOVED** - 删除对象
- **MODIFIED** - 修改对象
- **RENAMED** - 重命名对象

---------------------------

#### deploy

部署 Schema 到数据库。

**语法**
```bash
justdb deploy [options] <files>...
```

**选项**
```bash
# 数据库连接
-C, --current-database <name>    # 使用配置文件中的数据库
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # 用户名
-w, --db-password <pass>         # 密码

# 部署选项
--dry-run                        # 模拟运行
--force                          # 强制部署
--idempotent                     # 幂等模式（IF NOT EXISTS）
```

**示例**
```bash
# 部署到数据库
justdb deploy -C production schema.yaml

# 模拟运行
justdb deploy --dry-run schema.yaml

# 幂等部署
justdb deploy --idempotent schema.yaml
```

---------------------------

### 代码生成

#### convert

转换 Schema 格式或生成代码。

**语法**
```bash
justdb convert [options] [files...]
```

**选项**
```bash
# 输入/输出
-i, --input <files>       # 输入文件
-o, --output <path>       # 输出文件或目录
-t, --format <fmt>        # 输出格式

# 代码生成选项
--java-orm-type <type>    # Java ORM 类型
                          # MYBATIS_BEAN (默认)
                          # JPA_ENTITY
                          # HIBERNATE_BEAN
                          # SPRING_DATA_JPA
                          # JDBC_TEMPLATE
                          # GENERIC_DAO

# 表过滤
-I, --include-tables <patterns>  # 包含表模式
-X, --exclude-tables <patterns>  # 排除表模式
```

**示例**
```bash
# 转换格式
justdb convert schema.xml -o schema.json

# 生成 SQL
justdb convert schema.yaml -t sql -o schema.sql

# 生成 Java 类
justdb convert schema.yaml -t java -o src/

# 生成 JPA 实体
justdb convert schema.yaml --java-orm-type JPA_ENTITY -o src/
```

**支持的输出格式**
- Schema 格式：`yaml`, `json`, `xml`, `toml`
- SQL：`sql`（需要指定方言）
- 代码：`java`（需要指定 ORM 类型）

---------------------------

### SQL 操作

#### sql

SQL 交互式模式或执行 SQL 语句。

**语法**
```bash
justdb sql [options] [statement...]
```

**选项**
```bash
-s, --schema <file>       # Schema 文件
--migrate <file>          # 迁移 Schema 文件
-o, --output <file>       # 输出文件
```

**示例**
```bash
# 进入 SQL 交互模式
justdb sql

# 执行单条 SQL
justdb sql "SELECT * FROM users"

# 执行多条 SQL
justdb sql "SELECT * FROM users" "SHOW TABLES"

# 使用特定 Schema
justdb sql -s schema.yaml "SHOW TABLES"
```

**SQL 交互模式命令**
```bash
sql> SELECT * FROM users;
sql> SHOW TABLES;
sql> DESC users;
sql> exit          # 退出
```

---------------------------

### AI 集成

#### ai

一次性 AI 查询。

**语法**
```bash
justdb ai [options] [message]
```

**选项**
```bash
-m, --message <text>           # 发送给 AI 的消息
--message-from-file <file>     # 从文件读取消息
-i, --input <file>             # Schema 文件
-o, --output <file>            # 保存生成的 Schema

# AI 配置
--provider <name>              # AI 提供者（默认: local）
--base-url <url>               # AI 服务 URL
--model <name>                 # 模型名称
```

**示例**
```bash
# 交互式查询
justdb ai "创建一个用户表，包含 id、用户名、邮箱"

# 从标准输入读取
echo "创建订单表" | justdb ai

# 从文件读取
justdb ai --message-from-file prompt.txt

# 保存结果
justdb ai "创建产品表" -o schema.yaml

# 使用特定提供者
justdb ai --provider openai "创建表"
```

**AI 提供者类型**
- `local` / `ollama` - 本地模型（Ollama）
- `openai` - OpenAI API
- `zhipu` / `glm` - 智谱 AI
- `qwen` - 通义千问

---------------------------

#### ai-history

管理 AI 历史记录。

**语法**
```bash
justdb ai-history [options] [command]
```

**子命令**
```bash
list        # 列出历史记录
show <id>   # 显示特定记录
delete <id> # 删除记录
clear       # 清空所有记录
```

**示例**
```bash
# 列出历史
justdb ai-history list

# 显示特定记录
justdb ai-history show abc123

# 删除记录
justdb ai-history delete abc123
```

---------------------------

### 配置和插件

#### config

管理 CLI 配置。

**语法**
```bash
justdb config [command] [options]
```

**子命令**
```bash
show        # 显示当前配置
edit        # 编辑配置文件
validate    # 验证配置
```

**示例**
```bash
# 显示配置
justdb config show

# 验证配置
justdb config validate
```

---------------------------

#### plugin

管理插件。

**语法**
```bash
justdb plugin [command] [options]
```

**子命令**
```bash
list            # 列出所有插件
install <url>   # 安装插件
remove <id>     # 移除插件
enable <id>     # 启用插件
disable <id>    # 禁用插件
```

**示例**
```bash
# 列出插件
justdb plugin list

# 禁用插件
justdb plugin disable mysql

# 启用插件
justdb plugin enable postgres
```

---------------------------

#### driver

管理 JDBC 驱动。

**语法**
```bash
justdb driver [command] [options]
```

**子命令**
```bash
list            # 列出所有驱动
install <url>   # 安装驱动
remove <id>     # 移除驱动
```

**示例**
```bash
# 列出驱动
justdb driver list

# 安装驱动
justdb driver install mysql:mysql-connector-java:8.0.33
```

---------------------------

### 其他工具

#### show

显示 Schema 信息。

**语法**
```bash
justdb show [what] [options]
```

**子命令**
```bash
schema              # 显示 Schema 概览
tables              # 列出所有表
columns <table>     # 显示表的列
indexes <table>     # 显示表的索引
constraints <table> # 显示表的约束
data <table>        # 显示表数据
```

**示例**
```bash
# 显示 Schema
justdb show schema schema.yaml

# 列出表
justdb show tables schema.yaml

# 显示列
justdb show columns users schema.yaml
```

---------------------------

#### test

测试数据库连接。

**语法**
```bash
justdb test [options]
```

**选项**
```bash
-C, --current-database <name>    # 使用配置文件中的数据库
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # 用户名
-w, --db-password <pass>         # 密码
```

**示例**
```bash
# 测试配置文件中的数据库
justdb test -C production

# 测试特定连接
justdb test -U "jdbc:mysql://localhost:3306/test" -u root
```

---------------------------

#### load

加载 Schema 文件到交互式上下文。

**语法**
```bash
justdb load [options] <files...>
```

**示例**
```bash
# 加载 Schema
justdb load schema.yaml

# 加载多个文件
justdb load schema1.yaml schema2.yaml
```

---------------------------

#### save

保存当前 Schema 到文件。

**语法**
```bash
justdb save [options] [file]
```

**选项**
```bash
-t, --format <fmt>        # 输出格式
```

**示例**
```bash
# 保存到文件
justdb save schema.yaml

# 转换格式保存
justdb save -t json schema.json
```

---------------------------

#### watch

监控 Schema 文件变化。

**语法**
```bash
justdb watch [options] [files...]
```

**选项**
```bash
--command <cmd>           # 文件变化时执行的命令
--delay <ms>              # 检查间隔（毫秒）
```

**示例**
```bash
# 监控文件
justdb watch schema.yaml

# 文件变化时自动验证
justdb watch --command "justdb validate %f" schema.yaml
```

---------------------------

## 相关文档

- [交互式模式](./interactive-mode.md) - 交互式 Shell 使用指南
- [配置文件](./configuration.md) - 配置文件详细说明
- [文件加载机制](./file-loading.md) - Schema 文件加载规则

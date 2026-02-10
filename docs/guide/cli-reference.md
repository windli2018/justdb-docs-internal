---
icon: terminal
date: 2024-01-01
title: CLI 参考
order: 15
category:
  - 指南
  - CLI
tag:
  - CLI
  - 命令
  - 参考
---

# CLI 参考

JustDB 命令行界面（CLI）的完整参考文档。

## 命令概览

### 核心命令

| 命令 | 说明 |
|:---|:---|
| `migrate` | 执行数据库迁移 |
| `validate` | 验证 Schema 定义 |
| `diff` | 查看 Schema 差异 |
| `db2schema` | 从数据库提取 Schema |
| `backup` | 备份数据库 |
| `history` | 查看迁移历史 |
| `rollback` | 回滚迁移 |
| `ai` | AI 助手 |

### 工具命令

| 命令 | 说明 |
|:---|:---|
| `convert` | 格式转换 |
| `doc` | 生成文档 |
| `health` | 健康检查 |
| `version` | 显示版本 |
| `help` | 显示帮助 |

## 全局选项

### 基本选项

```bash
justdb [global-options] [command] [command-options]
```

| 选项 | 简写 | 说明 | 默认值 |
|:---|:---|:---|:---|
| `--config` | `-c` | 配置文件路径 | - |
| `--dialect` | `-d` | 数据库方言 | 自动检测 |
| `--verbose` | `-v` | 详细输出 | false |
| `--quiet` | `-q` | 静默模式 | false |
| `--help` | `-h` | 显示帮助 | - |
| `--version` | `-V` | 显示版本 | - |

### 示例

```bash
# 使用配置文件
justdb -c config.yaml migrate

# 指定数据库方言
justdb -d postgresql migrate

# 详细输出
justdb -v migrate

# 静默模式
justdb -q migrate
```

## migrate 命令

执行数据库迁移。

### 语法

```bash
justdb migrate [options] [schema-files...]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--dry-run` | 预览变更，不执行 | false |
| `--baseline` | 设置基线版本 | false |
| `--idempotent` | 幂等模式 | true |
| `--safe-drop` | 安全删除 | false |
| `--auto-diff` | 自动计算差异 | true |
| `--force` | 强制执行 | false |
| `--validate` | 只验证 | false |

### 示例

```bash
# 基本迁移
justdb migrate

# 指定 Schema 文件
justdb migrate users.yaml orders.yaml

# 预览变更
justdb migrate --dry-run

# 设置基线
justdb migrate --baseline

# 安全删除模式
justdb migrate --safe-drop

# 强制执行
justdb migrate --force
```

### 输出示例

```bash
$ justdb migrate

[INFO] Loading schema from: ./justdb/
[INFO] Connecting to database: jdbc:mysql://localhost:3306/myapp
[INFO] Current database state: 2 table(s)
[INFO] Target schema: 2 table(s)
[INFO] Calculating schema diff...
[INFO] Changes to apply:
[INFO]   ~ Modify table: users
[INFO]     + Add column: phone
[INFO] Generated SQL:
[INFO]   ALTER TABLE users ADD COLUMN phone VARCHAR(20);
[INFO] Executing migration...
[INFO] Migration completed successfully
```

## validate 命令

验证 Schema 定义。

### 语法

```bash
justdb validate [options] [schema-files...]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--strict` | 严格模式 | false |
| `--verbose` | 显示详细信息 | false |

### 示例

```bash
# 验证所有 Schema
justdb validate

# 验证指定文件
justdb validate users.yaml

# 严格模式
justdb validate --strict

# 详细输出
justdb validate --verbose
```

### 输出示例

```bash
$ justdb validate

[INFO] Loading schema from: ./justdb/
[INFO] Validating schema...
[INFO] Schema validation passed
[INFO]   - 2 tables
[INFO]   - 15 columns
[INFO]   - 4 indexes
[INFO]   - 2 constraints
```

## diff 命令

查看 Schema 差异。

### 语法

```bash
justdb diff [options]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--schema` | `-s` | 指定 Schema 文件 | - |
| `--format` | `-f` | 输出格式（text/json/yaml） | text |
| `--output` | `-o` | 输出到文件 | - |

### 示例

```bash
# 查看差异
justdb diff

# 指定 Schema 文件
justdb diff -s schema.yaml

# JSON 格式输出
justdb diff -f json

# 保存到文件
justdb diff -o diff.txt
```

### 输出示例

```bash
$ justdb diff

Schema Differences:
===================

Table: users
  Columns:
    + ADDED: phone VARCHAR(20)
    ~ MODIFIED: username VARCHAR(50) -> VARCHAR(100)
    - REMOVED: old_field

  Indexes:
    + ADDED: idx_phone (phone)

Table: orders
  + ADDED: new table
```

## db2schema 命令

从数据库提取 Schema。

### 语法

```bash
justdb db2schema [options]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--url` | `-u` | 数据库 URL | - |
| `--username` | 数据库用户名 | - |
| `--password` | 数据库密码 | - |
| `--output` | `-o` | 输出文件 | schema.yaml |
| `--format` | 输出格式 | yaml |

### 示例

```bash
# 提取 Schema
justdb db2schema \
  -u jdbc:mysql://localhost:3306/myapp \
  -o schema.yaml

# 使用配置文件
justdb db2schema -c config.yaml

# JSON 格式
justdb db2schema -o schema.json
```

## backup 命令

备份数据库。

### 语法

```bash
justdb backup [options]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--output` | `-o` | 输出文件 | backup.sql |
| `--data` | 包含数据 | false |
| `--compress` | 压缩备份 | false |

### 示例

```bash
# 备份结构
justdb backup

# 备份结构和数据
justdb backup --data

# 压缩备份
justdb backup --compress

# 指定输出文件
justdb backup -o backup_$(date +%Y%m%d).sql
```

## history 命令

查看迁移历史。

### 语法

```bash
justdb history [options] [migration-id]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--number` | `-n` | 显示最近 N 条 | 10 |
| `--format` | 输出格式 | table |

### 示例

```bash
# 查看历史
justdb history

# 查看最近 20 条
justdb history -n 20

# 查看指定迁移
justdb history 001
```

### 输出示例

```bash
$ justdb history

Migration History:
===================

ID      | Timestamp           | Description         | Status
--------|---------------------|---------------------|--------
001     | 2024-01-15 10:30:00 | Initial schema      | SUCCESS
002     | 2024-01-16 14:20:00 | Add phone column    | SUCCESS
003     | 2024-01-17 09:15:00 | Rename username     | SUCCESS
```

## rollback 命令

回滚迁移。

### 语法

```bash
justdb rollback [options] [version]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--dry-run` | 预览回滚 | false |
| `--last` | 回滚最近一次 | false |

### 示例

```bash
# 回滚到指定版本
justdb rollback 002

# 回滚最近一次
justdb rollback --last

# 预览回滚
justdb rollback --dry-run 002
```

## ai 命令

AI 助手。

### 语法

```bash
justdb ai [options] [prompt]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--model` | AI 模型 | - |
| `--interactive` | 交互模式 | true |

### 示例

```bash
# 交互模式
justdb ai

# 直接提问
justdb ai "创建一个用户表"

# 使用指定模型
justdb ai --model qwen "添加订单表"
```

## convert 命令

格式转换。

### 语法

```bash
justdb convert [options] <input-file> [output-file]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--from` | `-f` | 输入格式 | auto |
| `--to` | `-t` | 输出格式 | yaml |

### 示例

```bash
# JSON 转 YAML
justdb convert -f json -t yaml schema.json schema.yaml

# XML 转 JSON
justdb convert schema.xml schema.json
```

## doc 命令

生成文档。

### 语法

```bash
justdb doc [options]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--format` | 文档格式 | markdown |
| `--output` | `-o` | 输出文件 | DATABASE.md |

### 示例

```bash
# 生成 Markdown 文档
justdb doc

# 生成 HTML 文档
justdb doc --format html

# 指定输出文件
justdb doc -o SCHEMA.md
```

## health 命令

健康检查。

### 语法

```bash
justdb health [options]
```

### 选项

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `--verbose` | 详细信息 | false |

### 示例

```bash
# 健康检查
justdb health

# 详细信息
justdb health --verbose
```

## 交互式模式

### 启动交互式模式

```bash
justdb
```

### 交互式命令

```bash
justdb> /load users.yaml
justdb> /migrate
justdb> /diff
justdb> /validate
justdb> /help
justdb> /exit
```

### AI 交互

```bash
justdb> /ai 创建一个用户表
justdb> /ai 添加手机号字段
justdb> /ai 生成用户角色表
```

## 环境变量

### 配置环境变量

```bash
# 数据库配置
export JUSTDB_DATABASE_URL="jdbc:mysql://localhost:3306/myapp"
export JUSTDB_DATABASE_USERNAME="root"
export JUSTDB_DATABASE_PASSWORD="password"

# 迁移配置
export JUSTDB_MIGRATION_DRY_RUN="false"
export JUSTDB_MIGRATION_SAFE_DROP="false"
```

### 使用环境变量

```bash
# 使用环境变量配置
justdb migrate

# 覆盖环境变量
justdb migrate --dry-run=true
```

## 退出代码

| 代码 | 说明 |
|:---|:---|
| 0 | 成功 |
| 1 | 一般错误 |
| 2 | 验证失败 |
| 3 | 迁移失败 |

### 示例

```bash
# 检查退出代码
justdb migrate
if [ $? -eq 0 ]; then
    echo "Migration successful"
else
    echo "Migration failed"
fi
```

## 配置文件

### 配置文件位置

```
./justdb-config.yaml
./justdb/config.yaml
~/.justdb/config.yaml
/etc/justdb/config.yaml
```

### 配置文件示例

```yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password

schema:
  locations:
    - ./justdb
  format: yaml

migrate:
  auto-diff: true
  safe-drop: false
  idempotent: true
```

## 最佳实践

### 1. 使用配置文件

```bash
# 创建配置文件
cat > justdb-config.yaml << EOF
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
EOF

# 使用配置文件
justdb -c justdb-config.yaml migrate
```

### 2. 预览变更

```bash
# 总是先预览
justdb migrate --dry-run

# 检查差异
justdb diff

# 确认后执行
justdb migrate
```

### 3. 验证 Schema

```bash
# 迁移前验证
justdb validate

# 迁移后验证
justdb migrate && justdb validate
```

### 4. 备份数据

```bash
# 迁移前备份
justdb backup -o backup.sql

# 执行迁移
justdb migrate

# 验证结果
justdb verify
```

## 下一步

<VPCard
  title="API 参考"
  desc="编程 API 文档"
  link="/guide/api-reference.html"
/>

<VPCard
  title="配置参考"
  desc="完整的配置选项"
  link="/guide/config-reference.html"
/>

<VPCard
  title="安装指南"
  desc="安装和配置 CLI 工具"
  link="/guide/installation.html"
/>

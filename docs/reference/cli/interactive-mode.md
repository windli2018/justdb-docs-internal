---
title: 交互式模式
icon: terminal
description: JustDB CLI 交互式 Shell 使用指南
order: 3
---

# 交互式模式

JustDB 交互式模式提供了一个功能强大的 Shell，支持命令补全、历史记录和 AI 助手集成。

## 启动交互式模式

```bash
# 基本启动
justdb interactive

# 使用别名
justdb i
justdb int

# 指定默认 AI 提供者
justdb interactive --provider openai

# 指定默认格式
justdb interactive --format yaml

# 查看版本信息
justdb --version
```

## 批处理模式

```bash
# 从文件读取命令
justdb interactive --batch commands.txt

# 指定工作目录
justdb interactive --batch commands.txt --current-dir /path/to/project

# 退出策略
justdb interactive --batch commands.txt --exit-on-error=false

# 回显命令
justdb interactive --batch commands.txt --echo
```

批处理选项：
- `--batch, -b &lt;file&gt;` - 从文件读取命令并执行
- `--current-dir, -C &lt;dir&gt;` - 设置工作目录
- `--exit-on-error, -e` - 首次错误时退出（默认: true）
- `--echo, -x` - 执行前回显命令（默认: false）

## 内置命令

### Schema 操作

```bash
# 加载 Schema
load schema.xml
load schema.yaml

# 保存 Schema
save schema.yaml
save --format json

# 显示 Schema
show schema
show tables
show columns FROM users
show indexes FROM orders
show constraints FROM products

# 验证 Schema
validate
validate --verbose

# 格式化 Schema
format
format --sort-keys
```

### Schema 编辑

```bash
# 添加表
ADD TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100)
);

# 添加列
ADD COLUMN username TO users VARCHAR(50) NOT NULL;

# 删除表
DROP TABLE temp_users;

# 删除列
DROP COLUMN old_field FROM users;

# 修改列
MODIFY COLUMN username VARCHAR(100);
```

### SQL 操作

```bash
# 进入 SQL 模式
sql

# 执行 SQL 查询
SELECT * FROM users;
SHOW TABLES;
DESC users;

# 返回主模式
back
exit
```

### AI 助手

```bash
# 发送消息给 AI
ai 创建一个用户表
ai "为用户表添加索引"

# 切换 AI 提供者
provider openai
provider local

# 查看 AI 历史记录
ai-history
ai-history show abc123

# 清空 AI 历史
ai-history clear
```

### 文件操作

```bash
# 改变工作目录
cd /path/to/project
cd ..

# 列出文件
ls
ls -la

# 查看文件内容
cat schema.yaml

# 编辑文件
edit schema.yaml

# 监控文件
watch schema.yaml
```

### 系统命令

```bash
# 显示当前状态
status

# 显示帮助
help
help &lt;command&gt;

# 清屏
clear

# 退出
exit
quit
q
```

## 命令补全

交互式模式支持智能命令补全：

### 命令补全
```bash
# TAB 补全命令
lo&lt;TAB&gt;          # load
sh&lt;TAB&gt;          # show
ai&lt;TAB&gt;          # ai
```

### 文件名补全
```bash
# TAB 补全文件路径
load sch&lt;TAB&gt;    # load schema.yaml
cd /path/to/p&lt;TAB&gt;  # cd /path/to/project/
```

### 表名补全
```bash
# TAB 补全表名
show columns FROM use&lt;TAB&gt;  # users
show ta&lt;TAB&gt;                # tables
```

## 历史记录

### 查看历史
```bash
# 使用上下箭头浏览历史
↑ / ↓

# 搜索历史
Ctrl+R

# 显示历史命令
history
```

### 历史扩展
```bash
# 执行上一条命令
!!

# 执行第 n 条命令
!n

# 搜索并执行
!?pattern?
```

## 快捷键

### 编辑快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+A` | 移动到行首 |
| `Ctrl+E` | 移动到行尾 |
| `Ctrl+U` | 删除到行首 |
| `Ctrl+K` | 删除到行尾 |
| `Ctrl+W` | 删除前一个单词 |
| `Ctrl+L` | 清屏 |
| `Ctrl+C` | 中断当前命令 |
| `Ctrl+D` | 退出 |

### 历史快捷键
| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 浏览历史 |
| `Ctrl+R` | 搜索历史 |
| `!!` | 上一条命令 |

## 状态栏

交互式模式底部显示状态信息：

```
[justdb] [yaml] [local] [3 tables] [~/project/schema.yaml]
```

状态栏包含：
- **模式** - 当前模式（如 `[justdb]`, `[sql]`）
- **格式** - 当前输出格式（如 `[yaml]`, `[json]`）
- **AI 提供者** - 当前 AI 提供者（如 `[local]`, `[openai]`）
- **Schema 信息** - 表数量等
- **当前文件** - 加载的 Schema 文件路径

## 配置选项

交互式模式可以通过配置文件自定义：

```yaml
# ~/.justdb-cli.yaml
interactive:
  # 默认 AI 提供者
  provider: local

  # 默认输出格式
  format: yaml

  # 历史记录大小
  historySize: 1000

  # 启用语法高亮
  syntaxHighlight: true

  # 启用自动补全
  autoCompletion: true

  # 提示符
  prompt: "justdb> "

  # 启动时执行的命令
  startupCommands:
    - "status"
    - "show schema"
```

## 管道和重定向

### 输出重定向
```bash
# 保存到文件
show schema > output.yaml

# 追加到文件
show tables >> list.txt
```

### 输入重定向
```bash
# 从文件读取
load < schema.yaml
```

### 管道
```bash
# 管道到其他命令
show schema | grep "table"
```

## 环境变量

交互式模式支持以下环境变量：

```bash
# 设置默认 AI 提供者
export JUSTDB_AI_PROVIDER=openai

# 设置默认格式
export JUSTDB_FORMAT=yaml

# 设置日志级别
export JUSTDB_LOG_LEVEL=debug

# 设置配置文件
export JUSTDB_CONFIG=~/.justdb-cli.yaml
```

## 最佳实践

1. **使用别名** - 为常用命令创建别名
2. **利用历史** - 使用历史记录快速重复命令
3. **Tab 补全** - 使用 Tab 减少输入
4. **批处理脚本** - 将重复操作保存为批处理文件
5. **状态检查** - 使用 `status` 命令确认当前状态

## 故障排除

### 无法启动
```bash
# 检查配置文件
justdb config validate

# 查看详细日志
justdb -vv interactive
```

### AI 助手无响应
```bash
# 检查 AI 提供者
provider

# 切换到本地模型
provider local

# 检查网络连接
ping api.openai.com
```

### Schema 加载失败
```bash
# 验证 Schema 文件
validate schema.yaml

# 检查文件路径
ls -la schema.yaml

# 查看详细错误
load --verbose schema.yaml
```

## 相关文档

- [命令参考](./commands.md) - 完整的命令列表
- [配置文件](./configuration.md) - 配置文件详细说明
- [AI 集成](../ai/README.md) - AI 功能说明

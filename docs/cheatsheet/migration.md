# Migration 迁移操作速查

Schema 迁移用于管理和应用数据库结构变更，支持版本控制、增量迁移和回滚。

## 快速示例

### 基本迁移命令

```bash
# 生成迁移 SQL
justdb diff --schema schema.xml --target db:mysql://localhost:3306/dbname

# 应用迁移
justdb migrate --schema schema.xml --url jdbc:mysql://localhost:3306/dbname

# 回滚迁移
justdb rollback --schema schema.xml --url jdbc:mysql://localhost:3306/dbname
```

### 迁移脚本生成

```bash
# 生成增量迁移
justdb migrate --incremental --output migrations/V001__initial_schema.xml

# 生成回滚脚本
justdb migrate --rollback --output migrations/rollback/V001__initial_schema.xml
```

## 常用场景

### 场景 1: 初始化 Schema

```bash
# 从零开始创建数据库
justdb migrate \
    --schema src/main/resources/schema.xml \
    --url jdbc:mysql://localhost:3306/mydb \
    --user root \
    --password secret
```

### 场景 2: 增量更新

```bash
# 只应用变更
justdb migrate \
    --schema new-schema.xml \
    --baseline current-schema.xml \
    --url jdbc:mysql://localhost:3306/mydb
```

### 场景 3: 预览变更

```bash
# 生成 SQL 但不执行
justdb diff \
    --schema schema.xml \
    --url jdbc:mysql://localhost:3306/mydb \
    --output migration.sql \
    --dry-run
```

### 场景 4: 跨数据库迁移

```bash
# MySQL → PostgreSQL
justdb migrate \
    --schema schema.xml \
    --source mysql://localhost:3306/mydb \
    --target postgresql://localhost:5432/mydb
```

## 命令参考

### migrate 命令

```bash
justdb migrate [options]

选项:
  --schema <file>       Schema 文件路径
  --url <jdbc-url>      数据库 JDBC URL
  --user <username>     数据库用户名
  --password <pwd>      数据库密码
  --baseline <file>     基线 Schema 文件
  --output <file>       输出文件路径
  --dry-run             预览模式，不执行
  --idempotent          幂等模式（IF NOT EXISTS）
  --safe-drop           安全删除（重命名而非删除）
  --computed-column     计算列策略：auto, always, never
  --format              输出格式：sql, xml, json
```

### diff 命令

```bash
justdb diff [options]

选项:
  --schema <file>       目标 Schema 文件
  --target <url>        目标数据库 URL
  --baseline <file>     基线 Schema（可选）
  --output <file>       输出文件
  --direction <dir>     差异方向：forward, backward, both
  --include-data        包含数据差异
```

### rollback 命令

```bash
justdb rollback [options]

选项:
  --schema <file>       当前 Schema 文件
  --to <version>        回滚到指定版本
  --steps <n>           回滚步数
  --output <file>       输出回滚脚本
```

### validate 命令

```bash
justdb validate [options]

选项:
  --schema <file>       Schema 文件
  --target <url>        目标数据库
  --strict              严格模式（警告视为错误）
  --computed-column     计算列策略
```

## 迁移策略

### 幂等迁移（Idempotent）

```bash
# 使用 IF NOT EXISTS / IF EXISTS
justdb migrate --idempotent
```

生成的 SQL：

```sql
CREATE TABLE IF NOT EXISTS users (...);
DROP TABLE IF EXISTS old_table;
```

### 安全删除（Safe Drop）

```bash
# 删除前重命名（备份）
justdb migrate --safe-drop
```

生成的 SQL：

```sql
RENAME TABLE users TO users_backup_20250210;
CREATE TABLE users (...);
```

### 计算列策略

```bash
# auto: 数据库支持时生成计算列
justdb migrate --computed-column auto

# always: 强制生成
justdb migrate --computed-column always

# never: 从不生成
justdb migrate --computed-column never
```

## 迁移文件

### 迁移文件命名

```
migrations/
├── V001__initial_schema.xml
├── V002__add_users_table.xml
├── V003__add_orders_table.xml
└── V004__add_indexes.xml
```

命名规则：
- `V` + 版本号 + `__` + 描述
- 版本号：零填充，3 位起步
- 描述：小写，下划线分隔

### 迁移文件内容

```xml
<!-- V001__initial_schema.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<Migration version="1" description="Initial schema">
    <Changes>
        <CreateTable name="users">
            <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
            <Column name="username" type="VARCHAR(50)" nullable="false"/>
            <Column name="email" type="VARCHAR(100)"/>
        </CreateTable>

        <CreateTable name="roles">
            <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
            <Column name="name" type="VARCHAR(50)" nullable="false"/>
        </CreateTable>
    </Changes>
</Migration>
```

### 回滚脚本

```xml
<!-- V001__initial_schema_rollback.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<Migration version="1" description="Rollback initial schema">
    <Changes>
        <DropTable name="users"/>
        <DropTable name="roles"/>
    </Changes>
</Migration>
```

## 变更类型

| 变更类型 | 命令 | 示例 |
|---------|------|------|
| **添加表** | `CreateTable` | `<CreateTable name="users">` |
| **删除表** | `DropTable` | `<DropTable name="users">` |
| **重命名表** | `RenameTable` | `<RenameTable from="users" to="members"/>` |
| **添加列** | `AddColumn` | `<AddColumn table="users" column="email"/>` |
| **删除列** | `DropColumn` | `<DropColumn table="users" column="old_col"/>` |
| **修改列** | `ModifyColumn` | `<ModifyColumn table="users" column="email" type="VARCHAR(255)"/>` |
| **添加索引** | `CreateIndex` | `<CreateIndex name="idx_email" table="users"/>` |
| **删除索引** | `DropIndex` | `<DropIndex name="idx_email"/>` |
| **添加约束** | `AddConstraint` | `<AddConstraint type="FOREIGN_KEY">` |
| **删除约束** | `DropConstraint` | `<DropConstraint name="fk_user"/>` |

## 版本管理

### 版本追踪

```xml
<Justdb>
    <!-- 迁移历史表 -->
    <Table name="schema_migrations">
        <Column name="version" type="BIGINT" primaryKey="true"/>
        <Column name="description" type="VARCHAR(255)"/>
        <Column name="applied_at" type="TIMESTAMP"/>
        <Column name="execution_time" type="INT"/>
    </Table>
</Justdb>
```

### 版本锁定

```bash
# 锁定版本（防止并发迁移）
justdb migrate --lock

# 释放锁
justdb migrate --unlock
```

## 数据迁移

### 包含数据迁移

```bash
# Schema + Data 一起迁移
justdb migrate --schema schema.xml --data data.xml
```

### 数据转换

```xml
<Data table="users" transform="true">
    <Row username="alice">
        <!-- 转换：小写转大写 -->
        <Column name="username" transform="toUpperCase"/>
    </Row>
</Data>
```

## 注意事项

### 1. 迁移前备份

```bash
# 自动备份
justdb migrate --backup --backup-dir /backups

# 手动备份
mysqldump -u root -p mydb > backup.sql
```

### 2. 事务处理

```bash
# 单个事务执行（失败时回滚）
justdb migrate --single-transaction

# 大批次分解
justdb migrate --batch-size 100
```

### 3. 依赖顺序

```xml
<!-- 先定义被依赖的表 -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
</Table>

<!-- 再定义依赖表 -->
<Table name="orders">
    <Column name="user_id" type="BIGINT"/>
    <Constraint type="FOREIGN_KEY">
        <referencedTable>users</referencedTable>
    </Constraint>
</Table>
```

### 4. 生产环境检查

```bash
# 验证模式
justdb validate --schema schema.xml --target $PROD_DB

# 预览 SQL
justdb diff --schema schema.xml --target $PROD_DB --dry-run

# 小范围测试
justdb migrate --schema schema.xml --target $TEST_DB
```

## 进阶技巧

### 技巧 1: 分阶段迁移

```bash
# 阶段 1：添加新列（可选）
justdb migrate --file V001__add_new_column.xml

# 阶段 2：填充数据
justdb migrate --file V002__populate_data.xml

# 阶段 3：删除旧列
justdb migrate --file V003__remove_old_column.xml
```

### 技巧 2: 条件迁移

```xml
<Migration version="1">
    <Changes>
        <AddColumn table="users" name="email" type="VARCHAR(100)">
            <!-- 仅当列不存在时添加 -->
            <condition>!columnExists('users', 'email')</condition>
        </AddColumn>
    </Changes>
</Migration>
```

### 技巧 3: 回滚点

```bash
# 创建回滚点
justdb migrate --savepoint sp1

# 回滚到回滚点
justdb migrate --rollback-to sp1
```

## 参考链接

- [迁移系统设计](../design/migration-system/)
- [CLI 命令参考](../reference/cli/commands.md)
- [Schema Diff](../reference/api/schema-diff.md)

---
icon: file-spreadsheet
title: Excel 格式
order: 18
category:
  - 参考文档
  - 格式支持
tag:
  - excel
  - xlsx
  - format
---

# Excel 格式

Excel（.xlsx）格式是业务友好的表格格式，特别适合非技术人员编辑数据库 Schema。

## 格式规范

### 文件扩展名

- `.xlsx` - 推荐（Excel 2007+）
- `.xls` - 旧版 Excel 格式

### 工作表结构

JustDB Excel 文件包含多个工作表（Sheet），每个工作表代表一种 Schema 对象：

#### 1. Justdb 工作表

根配置信息：

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| id | 是 | Schema 标识符 | myapp |
| namespace | 否 | 命名空间 | com.example |
| description | 否 | 描述 | 电商应用数据库 |

#### 2. Table 工作表

表定义：

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| name | 是 | 表名 | users |
| id | 否 | 表 ID | table_users |
| comment | 否 | 表注释 | 用户表 |
| expectedRecordCount | 否 | 预期记录数 | 1000000 |
| expectedGrowthRate | 否 | 预期增长率 | 10000 |

#### 3. Column 工作表

列定义：

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| tableName | 是* | 所属表名 | users |
| id | 否 | 列 ID | col_users_id |
| name | 是 | 列名 | id |
| type | 是 | 数据类型 | BIGINT |
| referenceId | 否 | 引用的列 ID | global_id |
| nullable | 否 | 是否可空 | false |
| defaultValue | 否 | 默认值 | 0 |
| defaultValueComputed | 否 | 计算默认值 | CURRENT_TIMESTAMP |
| primaryKey | 否 | 是否主键 | true |
| autoIncrement | 否 | 是否自增 | true |
| unique | 否 | 是否唯一 | true |
| comment | 否 | 列注释 | 用户ID |

* tableName 可省略，如果列定义紧跟在表定义之后

#### 4. Index 工作表

索引定义：

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| tableName | 是* | 所属表名 | users |
| name | 是 | 索引名 | idx_users_username |
| columns | 是 | 索引列 | username |
| unique | 否 | 是否唯一索引 | true |
| comment | 否 | 索引注释 | 用户名唯一索引 |

#### 5. Constraint 工作表

约束定义：

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| tableName | 是* | 所属表名 | orders |
| name | 是 | 约束名 | fk_orders_user_id |
| type | 是 | 约束类型 | FOREIGN_KEY |
| columns | 是 | 约束列 | user_id |
| referencedTable | 是* | 引用表 | users |
| referencedColumn | 是* | 引用列 | id |
| onDelete | 否 | 删除策略 | RESTRICT |
| onUpdate | 否 | 更新策略 | CASCADE |

#### 6. View 工作表

视图定义：

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| name | 是 | 视图名 | active_users |
| content | 是 | 视图 SQL | SELECT * FROM users... |
| comment | 否 | 视图注释 | 活跃用户视图 |

#### 7. Sequence 工作表

序列定义：

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| name | 是 | 序列名 | seq_user_id |
| startValue | 否 | 起始值 | 1 |
| increment | 否 | 增量 | 1 |
| minValue | 否 | 最小值 | 1 |
| maxValue | 否 | 最大值 | 999999 |
| cycle | 否 | 是否循环 | false |

## 命名约定

### 工作表命名

- 使用 PascalCase：`Table`, `Column`, `Index`
- 单数形式：`Table` 而非 `Tables`

### 列命名

- 使用 camelCase：`tableName`, `referenceId`
- 布尔值使用 is 前缀或直接使用：`nullable`, `autoIncrement`

### 值命名

- 表名、列名使用 snake_case：`users`, `user_id`
- ID 使用描述性名称：`global_id`, `col_users_id`

## 数据类型映射

### 通用类型

| Excel 类型 | 映射到 | 说明 |
|-----------|--------|------|
| Text | VARCHAR | 字符串类型，可指定长度 |
| Number | INTEGER/DECIMAL | 整数或小数 |
| Date | TIMESTAMP | 日期时间 |
| Boolean | BOOLEAN | 布尔值 |

### 数据库特定类型

在 Type 列中可以直接指定数据库类型：

```excel
VARCHAR(255)
BIGINT
DECIMAL(10,2)
TIMESTAMP
TEXT
BLOB
JSON
```

## 完整示例

### 电商数据库 Schema

```
工作表: Justdb
┌────────────────────────────────────────┐
│ id         │ namespace    │ description │
├────────────┼──────────────┼─────────────┤
│ ecommerce  │ com.example  │ 电商数据库  │
└────────────┴──────────────┴─────────────┘

工作表: Table
┌────────────┬─────────────────┬──────────────────────┐
│ name       │ comment         │ expectedRecordCount  │
├────────────┼─────────────────┼──────────────────────┤
│ users      │ 用户表          │ 1000000              │
│ orders     │ 订单表          │ 5000000              │
│ products   │ 商品表          │ 100000               │
└────────────┴─────────────────┴──────────────────────┘

工作表: Column
┌───────────┬─────────┬───────────┬──────────┬───────────┬────────────┬─────────┬──────────────┬──────────┐
│ tableName │ id      │ name      │ type     │ nullable │ primaryKey │ autoInc │ comment      │ refId   │
├───────────┼─────────┼───────────┼──────────┼──────────┼────────────┼─────────┼──────────────┼──────────┤
│ users     │ uid     │ id        │ BIGINT   │ false    │ true       │ true    │ 用户ID       │         │
│ users     │         │ username  │ VARCHAR(50)│ false │            │         │ 用户名       │         │
│ users     │         │ email     │ VARCHAR(100)│ true │            │         │ 邮箱         │         │
│ users     │         │ created_at│ TIMESTAMP│ false  │            │         │ 创建时间     │         │
│ orders    │ oid     │ id        │ BIGINT   │ false   │ true       │ true    │ 订单ID       │         │
│ orders    │         │ user_id   │ BIGINT   │ false   │            │         │ 用户ID       │         │
│ orders    │         │ order_no  │ VARCHAR(50)│ false │            │         │ 订单号       │         │
│ orders    │         │ amount    │ DECIMAL(10,2)│ false│         │         │ 订单金额     │         │
└───────────┴─────────┴───────────┴──────────┴──────────┴────────────┴─────────┴──────────────┴──────────┘

工作表: Index
┌───────────┬─────────────────────┬───────────┬────────┬──────────────────────┐
│ tableName │ name                │ columns   │ unique │ comment              │
├───────────┼─────────────────────┼───────────┼────────┼──────────────────────┤
│ users     │ idx_users_username  │ username  │ true   │ 用户名唯一索引       │
│ users     │ idx_users_email     │ email     │ true   │ 邮箱唯一索引         │
│ orders    │ idx_orders_user_id  │ user_id   │ false  │ 用户ID索引           │
│ orders    │ idx_orders_order_no │ order_no  │ true   │ 订单号唯一索引       │
└───────────┴─────────────────────┴───────────┴────────┴──────────────────────┘

工作表: Constraint
┌───────────┬──────────────────┬─────────────┬───────────┬─────────────────┬──────────────────┬───────────┬───────────┐
│ tableName │ name             │ type        │ columns   │ referencedTable │ referencedColumn │ onDelete  │ onUpdate  │
├───────────┼──────────────────┼─────────────┼───────────┼─────────────────┼──────────────────┼───────────┼───────────┤
│ orders    │ fk_orders_user   │ FOREIGN_KEY │ user_id   │ users           │ id               │ RESTRICT  │ CASCADE  │
└───────────┴──────────────────┴─────────────┴───────────┴─────────────────┴──────────────────┴───────────┴───────────┘

工作表: View
┌────────────────┬─────────────────────────────────────────────────────────────┬────────────────────┐
│ name           │ content                                                     │ comment            │
├────────────────┼─────────────────────────────────────────────────────────────┼────────────────────┤
│ active_users   │ SELECT u.id, u.username, COUNT(o.id) as order_count        │ 活跃用户视图       │
│                │ FROM users u                                                │                    │
│                │ LEFT JOIN orders o ON u.id = o.user_id                     │                    │
│                │ WHERE u.status = 'active'                                   │                    │
│                │ GROUP BY u.id, u.username                                   │                    │
└────────────────┴─────────────────────────────────────────────────────────────┴────────────────────┘
```

## 读取 Excel

### CLI 命令

```bash
# 加载 Excel Schema
justdb convert schema.xlsx

# 转换为其他格式
justdb convert -f xlsx -t yaml schema.xlsx > schema.yaml
justdb convert -f xlsx -t json schema.xlsx > schema.json
justdb convert -f xlsx -t xml schema.xlsx > schema.xml
```

### Java API

```java
import org.verydb.justdb.loader.SchemaLoader;
import org.verydb.justdb.schema.Justdb;

// 加载 Excel 文件
Loaded<Justdb> loaded = SchemaLoader.loadFromFile("schema.xlsx");
Justdb schema = loaded.getMainSchema();

// 访问 Schema
List<Table> tables = schema.getTables();
for (Table table : tables) {
    System.out.println("Table: " + table.getName());
    for (Column column : table.getColumns()) {
        System.out.println("  Column: " + column.getName() + " - " + column.getType());
    }
}
```

## 写入 Excel

### CLI 命令

```bash
# 从其他格式转换为 Excel
justdb convert -f yaml -t xlsx schema.yaml > schema.xlsx
justdb convert -f json -t xlsx schema.json > schema.xlsx
justdb convert -f xml -t xlsx schema.xml > schema.xlsx

# 从数据库导出为 Excel
justdb db2schema -o schema.xlsx
```

### Java API

```java
import org.verydb.justdb.excel.WriteToExcel;
import org.verydb.justdb.schema.Justdb;
import java.io.File;

// 创建 Schema
Justdb schema = new Justdb();
schema.setId("myapp");
schema.setNamespace("com.example");

// 添加表
Table table = new Table();
table.setName("users");
schema.getTables().add(table);

// 写入 Excel
File excelFile = new File("schema.xlsx");
WriteToExcel.write(excelFile, schema);
```

## 最佳实践

### 1. 工作表组织

```excel
# 推荐：按逻辑顺序组织工作表
1. Justdb    # 根配置
2. Column    # 全局列定义
3. Table     # 表定义
4. Index     # 索引定义
5. Constraint # 约束定义
6. View      # 视图定义
```

### 2. 使用全局列定义

```excel
# Column 工作表：定义可复用的列
┌─────────┬──────────┬─────────┬───────────┬────────────┬───────────┐
│ id      │ name     │ type    │ primaryKey │ autoIncrement │ comment  │
├─────────┼──────────┼─────────┼───────────┼────────────┼───────────┤
│ global  │ id       │ BIGINT  │ true      │ true       │ 主键ID    │
│ ts      │ created  │ TIMESTAMP│ false    │            │ 创建时间  │
│ ts      │ updated  │ TIMESTAMP│ false    │            │ 更新时间  │
└─────────┴──────────┴─────────┴───────────┴────────────┴───────────┘

# 在其他工作表中引用
┌──────────┬──────────┬────────────┐
│ tableName│ name     │ referenceId│
├──────────┼──────────┼────────────┤
│ users    │ id       │ global     │
│ users    │ created  │ ts         │
└──────────┴──────────┴────────────┘
```

### 3. 添加注释

```excel
# 使用 Excel 注释功能提供额外说明
# 选中单元格 → 右键 → 插入注释

# 示例注释
- "expectedRecordCount: 用于性能优化建议"
- "defaultValueComputed: 使用数据库函数计算默认值"
```

### 4. 数据验证

```excel
# 使用 Excel 数据验证功能
# 数据 → 数据验证 → 设置规则

# type 列：下拉列表
VARCHAR, INTEGER, BIGINT, TIMESTAMP, DECIMAL, TEXT, BLOB

# nullable 列：下拉列表
true, false

# onDelete 列：下拉列表
CASCADE, RESTRICT, SET NULL, NO ACTION
```

### 5. 条件格式

```excel
# 使用条件格式高亮重要信息
# 主键列：黄色背景
# 必填列：粗体
# 外键列：蓝色文字
```

## 与其他格式对比

### Excel 的优势

- **业务友好**：非技术人员也能编辑
- **可视化**：表格形式直观
- **协作方便**：可以使用共享 Excel
- **工具支持**：Excel 功能强大（排序、筛选、验证）

### Excel 的限制

- **不适合版本控制**：二进制格式，diff 困难
- **不适合大型 Schema**：性能和可维护性问题
- **无注释支持**：需要使用 Excel 注释功能
- **格式限制**：复杂的嵌套结构难以表达

## 格式转换

### Excel 转 YAML

```bash
justdb convert -f xlsx -t yaml schema.xlsx > schema.yaml
```

### YAML 转 Excel

```bash
justdb convert -f yaml -t xlsx schema.yaml > schema.xlsx
```

### 批量转换

```bash
# 转换目录下所有 Excel 文件为 YAML
for file in *.xlsx; do
    justdb convert -f xlsx -t yaml "$file" > "${file%.xlsx}.yaml"
done
```

## 相关文档

- [YAML 格式](./yaml.md)
- [JSON 格式](./json.md)
- [XML 格式](./xml.md)
- [格式支持概述](./README.md)
- [Schema 加载 API](../api/schema-loader.md)

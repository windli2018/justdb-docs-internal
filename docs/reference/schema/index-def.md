# 索引定义 (Index)

索引是用于提高数据库查询性能的数据库对象。JustDB 支持声明式索引定义，自动生成不同数据库的索引创建和删除语句。

## 基本语法

```xml
<Justdb>
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="email" type="VARCHAR(255)" notNull="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column name="created_at" type="TIMESTAMP"/>

    <!-- 普通索引 -->
    <Index name="idx_email" columns="email"/>

    <!-- 多列索引 -->
    <Index name="idx_username_email" columns="username, email"/>

    <!-- 唯一索引 -->
    <Index name="idx_unique_username" columns="username" unique="true"/>
  </Table>
</Justdb>
```

## 索引属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | 是 | 索引名称 |
| `columns` | String | 是 | 索引列，多个列用逗号分隔 |
| `unique` | Boolean | 否 | 是否唯一索引，默认 false |
| `type` | String | 否 | 索引类型（如 BTREE、HASH） |
| `comment` | String | 否 | 索引注释 |

## 索引类型

### 普通索引
```xml
<Index name="idx_user_email" columns="email"/>
```

### 唯一索引
```xml
<Index name="idx_unique_email" columns="email" unique="true"/>
```

### 复合索引
```xml
<Index name="idx_name_age" columns="last_name, first_name, age"/>
```

### 全文索引（MySQL）
```xml
<Index name="idx_fulltext_content" columns="content" type="FULLTEXT"/>
```

## 数据库差异

JustDB 自动处理不同数据库的索引语法差异：

### MySQL
```sql
CREATE INDEX idx_email ON users (email);
CREATE UNIQUE INDEX idx_unique_email ON users (email);
CREATE FULLTEXT INDEX idx_content ON articles (content);
```

### PostgreSQL
```sql
CREATE INDEX idx_email ON users (email);
CREATE UNIQUE INDEX idx_unique_email ON users (email);
CREATE INDEX idx_content_gin ON articles USING gin (to_tsvector('english', content));
```

### SQL Server
```sql
CREATE INDEX idx_email ON users (email);
CREATE UNIQUE INDEX idx_unique_email ON users (email);
```

## 命名规范

推荐使用 `idx_` 前缀：
- 普通索引：`idx_表名_列名`（如 `idx_users_email`）
- 唯一索引：`uk_表名_列名`（如 `uk_users_email`）
- 全文索引：`ft_表名_列名`（如 `ft_articles_content`）

## 迁移行为

### 创建索引
```xml
<!-- 旧版本 -->
<Table name="users">
  <Column name="email" type="VARCHAR(255)"/>
</Table>

<!-- 新版本：添加索引 -->
<Table name="users">
  <Column name="email" type="VARCHAR(255)"/>
  <Index name="idx_email" columns="email"/>
</Table>
```

生成的迁移 SQL：
```sql
CREATE INDEX idx_email ON users (email);
```

### 删除索引
从 Schema 定义中移除 `<Index>` 元素会生成删除语句：
```sql
DROP INDEX idx_email ON users;
```

### 修改索引
修改索引属性（如从普通索引改为唯一索引）会先删除再创建：
```sql
DROP INDEX idx_email ON users;
CREATE UNIQUE INDEX idx_email ON users (email);
```

## 最佳实践

1. **为频繁查询的列创建索引**：WHERE、JOIN、ORDER BY 子句中的列
2. **避免过度索引**：每个索引都会增加写操作开销
3. **选择合适的索引列顺序**：将区分度高的列放在前面
4. **使用覆盖索引**：包含查询所需的所有列，避免回表
5. **定期维护索引**：重建碎片化的索引

## 参见

- [Table 定义](./table.md)
- [Column 定义](./column.md)
- [Constraint 定义](./constraint.md)

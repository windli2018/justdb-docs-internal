# Go ORM 集成指南

JustDB 支持将 Schema 定义转换为 Go 的 GORM 和 sqlx 模型。

## 目录

1. [背景知识](#背景知识)
2. [快速开始](#快速开始)
3. [从现有数据库生成模型](#从现有数据库生成模型)
4. [GORM 使用指南](#gorm-使用指南)
5. [sqlx 使用指南](#sqlx-使用指南)
6. [常见场景](#常见场景)
7. [最佳实践](#最佳实践)

---

## 背景知识

### Go ORM/数据库库生态

Go 语言有多种数据库访问方式：

| 库 | 类型 | 特点 | 适用场景 |
|------|------|------|----------|
| **GORM** | 全功能 ORM | 功能丰富、链式调用、自动迁移 | 快速开发、复杂业务逻辑 |
| **sqlx** | 扩展标准库 | 轻量、类型安全、高性能 | 性能敏感、需要精细控制 |
| **sqlc** | 代码生成 | 从 SQL 生成类型安全代码 | SQL 优先、强类型约束 |

### GORM 架构

```
GORM
├── Callback (回调系统)
│   ├── Query (查询回调)
│   ├── Create (创建回调)
│   ├── Update (更新回调)
│   └── Delete (删除回调)
├── Scopes (作用域)
│   ├── Common Scopes (通用作用域)
│   └── Custom Scopes (自定义作用域)
├── Associations (关联)
│   ├── Has One (一对一)
│   ├── Has Many (一对多)
│   ├── Many To Many (多对多)
│   └── Preloading (预加载)
└── Plugins (插件系统)
```

### sqlx 架构

```
sqlx
├── Core Extensions (核心扩展)
│   ├── Get (查询单条)
│   ├── Select (查询多条)
│   └── Named (命名查询)
├── Struct Mapping (结构体映射)
│   ├── db tag (数据库标签)
│   └── json tag (JSON标签)
└── Transactions (事务支持)
    ├── Beginx (开始事务)
    └── Tx (事务对象)
```

---

## 快速开始

### 安装 JustDB

```bash
# 下载 JustDB CLI
wget https://github.com/justdb/justdb/releases/latest/download/justdb-cli.zip

# 解压
unzip justdb-cli.zip

# 添加到 PATH
export PATH=$PATH:$(pwd)/justdb-cli/bin
```

### 安装 Go 依赖

```bash
# 初始化 Go 模块
go mod init myapp

# GORM
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
go get -u gorm.io/driver/postgres
go get -u gorm.io/driver/sqlite

# sqlx
go get -u github.com/jmoiron/sqlx
go get -u github.com/lib/pq    # PostgreSQL
go get -u github.com/go-sql-driver/mysql    # MySQL
```

### Go 项目结构

```
myapp/
├── main.go           # 入口文件
├── models/           # 模型目录
│   ├── user.go
│   └── order.go
├── repository/       # 数据访问层
│   ├── user_repo.go
│   └── order_repo.go
├── service/          # 业务逻辑层
│   └── user_service.go
├── handler/          # HTTP 处理器
│   └── user_handler.go
└── go.mod
```

---

## 从现有数据库生成模型

### 方法一：使用 db2schema 命令

```bash
# 从数据库提取 schema
justdb db2schema \
  --db-url "jdbc:mysql://localhost:3306/mydb" \
  --username root \
  --password password \
  --output mydb.xml
```

### 方法二：使用 Markdown 定义 Schema

创建 `schema.md`:

```markdown
# 用户表 (users)

| Column Name | Type | Nullable | Primary Key | Default | Comment |
|-------------|------|----------|-------------|---------|---------|
| id | BIGINT | false | true | AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | false | false | NULL | 用户名 |
| email | VARCHAR(100) | true | false | NULL | 邮箱 |
| created_at | TIMESTAMP | false | false | CURRENT_TIMESTAMP | 创建时间 |

# 订单表 (orders)

| Column Name | Type | Nullable | Primary Key | Default | Comment |
|-------------|------|----------|-------------|---------|---------|
| id | BIGINT | false | true | AUTO_INCREMENT | 订单ID |
| user_id | BIGINT | false | false | NULL | 用户ID |
| amount | DECIMAL(10,2) | false | false | 0.00 | 订单金额 |
| status | VARCHAR(20) | false | false | 'pending' | 订单状态 |
```

### 方法三：直接使用 XML Schema

创建 `schema.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp">
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
    <Column name="email" type="VARCHAR(100)"/>
    <Column name="created_at" type="TIMESTAMP" nullable="false"/>
  </Table>

  <Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="user_id" type="BIGINT" nullable="false"/>
    <Column name="amount" type="DECIMAL(10,2)" nullable="false"/>
    <Column name="status" type="VARCHAR(20)" nullable="false"/>
  </Table>
</Justdb>
```

### 生成 Go 模型

```bash
# 生成 GORM 模型
justdb schema2orm \
  --input schema.md \
  --type gorm \
  --output models/

# 生成 sqlx 模型
justdb schema2orm \
  --input schema.md \
  --type sqlx \
  --output models/
```

生成的文件结构：

```
models/
├── user.go       # User 模型
├── order.go      # Order 模型
└── models.go     # 通用类型和常量
```

---

## GORM 使用指南

### 生成的模型示例

```go
// models/user.go
package models

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID        uint64         `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
    Username  string         `gorm:"column:username;size:50;not null" json:"username"`
    Email     *string        `gorm:"column:email;size:100" json:"email,omitempty"`
    CreatedAt time.Time      `gorm:"column:created_at;not null" json:"created_at"`
    Orders    []Order        `gorm:"foreignKey:UserID" json:"orders,omitempty"`
}

func (User) TableName() string {
    return "users"
}

// models/order.go
package models

import (
    "time"
    "gorm.io/gorm"
)

type Order struct {
    ID        uint64      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
    UserID    uint64      `gorm:"column:user_id;not null" json:"user_id"`
    Amount    float64     `gorm:"column:amount;type:decimal(10,2);not null" json:"amount"`
    Status    string      `gorm:"column:status;size:20;not null" json:"status"`
    User      User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Order) TableName() string {
    return "orders"
}
```

### 基本操作

#### 初始化连接

```go
package main

import (
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "log"
)

var DB *gorm.DB

func initDB() error {
    dsn := "user:password@tcp(127.0.0.1:3306)/mydb?charset=utf8mb4&parseTime=True&loc=Local"
    var err error
    DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
        SkipDefaultTransaction: true, // 跳过默认事务
        PrepareStmt:            true, // 预编译 SQL
    })
    if err != nil {
        return err
    }

    sqlDB, err := DB.DB()
    if err != nil {
        return err
    }

    // 连接池配置
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)

    return nil
}
```

#### 增删改查

```go
// 创建
user := User{
    Username:  "alice",
    Email:     pointer("alice@example.com"),
    CreatedAt: time.Now(),
}
result := DB.Create(&user)
if result.Error != nil {
    log.Fatal(result.Error)
}
fmt.Println("Created user ID:", user.ID)

// 查询单条
var user User
result = DB.First(&user, 1) // 通过主键查询
// 或
result = DB.Where("username = ?", "alice").First(&user)

// 查询多条
var users []User
result = DB.Where("email IS NOT NULL").Find(&users)
// 或
result = DB.Find(&users, "email LIKE ?", "%@example.com")

// 更新
result = DB.Model(&user).Update("email", "newemail@example.com")
// 或更新多个字段
result = DB.Model(&user).Updates(User{Email: pointer("new@example.com")})

// 删除
result = DB.Delete(&user)
```

#### 关联查询

```go
// Preload 预加载关联
var orders []Order
DB.Preload("User").Find(&orders)

// 创建关联数据
order := Order{
    UserID: 1,
    Amount: 99.99,
    Status: "pending",
}
DB.Create(&order)

// 使用 Association
var user User
DB.First(&user, 1)
DB.Model(&user).Association("Orders").Append([]Order{
    {Amount: 49.99, Status: "pending"},
    {Amount: 99.99, Status: "completed"},
})

// Joins
var results []struct {
    Username string
    Amount   float64
}
DB.Table("users").
    Select("users.username, orders.amount").
    Joins("LEFT JOIN orders ON orders.user_id = users.id").
    Scan(&results)
```

#### 高级查询

```go
// 分页
var users []User
DB.Offset(0).Limit(10).Order("created_at DESC").Find(&users)

// 条件查询
DB.Where("email IS NOT NULL").
   Where("created_at > ?", time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)).
   Find(&users)

// 链式条件
query := DB.Model(&User{})
if username != "" {
    query = query.Where("username LIKE ?", "%"+username+"%")
}
if email != "" {
    query = query.Where("email = ?", email)
}
query.Find(&users)

// 聚合查询
var result struct {
    Total       int64
    TotalAmount float64
}
DB.Model(&Order{}).
    Select("COUNT(*) as total, SUM(amount) as total_amount").
    Where("user_id = ?", 1).
    Scan(&result)

// Group By
var stats []struct {
    Status  string
    Count   int64
    Sum     float64
}
DB.Model(&Order{}).
    Select("status, COUNT(*) as count, SUM(amount) as sum").
    Group("status").
    Scan(&stats)
```

---

## sqlx 使用指南

### 生成的模型示例

```go
// models/user.go
package models

import "time"

type User struct {
    ID        uint64    `db:"id" json:"id"`
    Username  string    `db:"username" json:"username"`
    Email     *string   `db:"email" json:"email,omitempty"`
    CreatedAt time.Time `db:"created_at" json:"created_at"`
}
```

### 基本操作

#### 初始化连接

```go
package main

import (
    "database/sql"
    _ "github.com/go-sql-driver/mysql"
    "github.com/jmoiron/sqlx"
    "log"
)

var DB *sqlx.DB

func initDB() error {
    var err error
    DB, err = sqlx.Connect("mysql", "user:password@tcp(127.0.0.1:3306)/mydb")
    if err != nil {
        return err
    }

    // 连接池配置
    DB.SetMaxOpenConns(25)
    DB.SetMaxIdleConns(25)
    DB.SetConnMaxLifetime(5 * time.Minute)

    return nil
}
```

#### 增删改查

```go
// 查询单条
var user User
err := DB.Get(&user, "SELECT * FROM users WHERE id = ?", 1)
if err != nil {
    log.Fatal(err)
}

// 查询多条
var users []User
err = DB.Select(&users, "SELECT * FROM users WHERE email LIKE ?", "%@example.com")
if err != nil {
    log.Fatal(err)
}

// 命名查询
type UserQuery struct {
    ID       int    `db:"id"`
    Username string `db:"username"`
}
query := UserQuery{ID: 1}
err = DB.Get(&user, "SELECT * FROM users WHERE id = :id", query)

// 插入
result, err := DB.Exec(
    "INSERT INTO users (username, email, created_at) VALUES (?, ?, ?)",
    "bob", pointer("bob@example.com"), time.Now(),
)
if err != nil {
    log.Fatal(err)
}
id, _ := result.LastInsertId()

// 更新
result, err = DB.Exec(
    "UPDATE users SET email = ? WHERE id = ?",
    "newemail@example.com", 1,
)
if err != nil {
    log.Fatal(err)
}
rowsAffected, _ := result.RowsAffected()

// 删除
result, err = DB.Exec("DELETE FROM users WHERE id = ?", 1)
if err != nil {
    log.Fatal(err)
}
```

#### 事务处理

```go
// 自动提交/回滚
tx, err := DB.BeginTxx(context.Background(), nil)
if err != nil {
    log.Fatal(err)
}

defer tx.Rollback() // 如果没有 Commit，会自动 Rollback

_, err = tx.Exec(
    "INSERT INTO users (username, email, created_at) VALUES (?, ?, ?)",
    "charlie", pointer("charlie@example.com"), time.Now(),
)
if err != nil {
    log.Fatal(err)
}

_, err = tx.Exec(
    "INSERT INTO orders (user_id, amount, status) VALUES (?, ?, ?)",
    1, 100.00, "pending",
)
if err != nil {
    log.Fatal(err)
}

err = tx.Commit()
if err != nil {
    log.Fatal(err)
}

// 使用 tx 闭包
err = DB.Transaction(func(tx *sqlx.Tx) error {
    _, err := tx.Exec(...)
    if err != nil {
        return err // 返回错误会自动 Rollback
    }
    return nil // 返回 nil 会自动 Commit
})
```

---

## 常见场景

### 场景1：博客系统

```markdown
# 用户表 (users)
| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 用户ID |
| username | VARCHAR(50) | false | ✗ | 用户名 |
| email | VARCHAR(100) | true | ✗ | 邮箱 |

# 文章表 (posts)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 文章ID |
| author_id | BIGINT | false | ✗ | ✓ | 作者ID |
| title | VARCHAR(200) | false | ✗ | 标题 |
| content | TEXT | false | ✗ | 内容 |
| published | BOOLEAN | false | ✗ | 是否发布 |
| created_at | TIMESTAMP | false | ✗ | 创建时间 |

# 评论表 (comments)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 评论ID |
| post_id | BIGINT | false | ✗ | ✓ | 文章ID |
| user_id | BIGINT | false | ✗ | ✓ | 用户ID |
| content | TEXT | false | ✗ | 评论内容 |
| created_at | TIMESTAMP | false | ✗ | 创建时间 |
```

```bash
# 生成 GORM 模型
justdb schema2orm --input blog.md --type gorm --output models/

# 或生成 sqlx 模型
justdb schema2orm --input blog.md --type sqlx --output models/
```

### 场景2：电商系统

```markdown
# 商品表 (products)
| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 商品ID |
| name | VARCHAR(100) | false | ✗ | 商品名称 |
| price | DECIMAL(10,2) | false | ✗ | 价格 |
| stock | INT | false | ✗ | 库存 |
| sku | VARCHAR(50) | false | ✗ | SKU编码 |

# 购物车表 (cart_items)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 购物车项ID |
| user_id | BIGINT | false | ✗ | ✗ | 用户ID |
| product_id | BIGINT | false | ✗ | ✓ | 商品ID |
| quantity | INT | false | ✗ | ✗ | 数量 |

# 订单表 (orders)
| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 订单ID |
| user_id | BIGINT | false | ✗ | 用户ID |
| total | DECIMAL(10,2) | false | ✗ | 总金额 |
| status | VARCHAR(20) | false | ✗ | 状态 |

# 订单明细表 (order_items)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 明细ID |
| order_id | BIGINT | false | ✗ | ✓ | 订单ID |
| product_id | BIGINT | false | ✗ | ✓ | 商品ID |
| quantity | INT | false | ✗ | ✗ | 数量 |
| price | DECIMAL(10,2) | false | ✗ | 单价 |
```

---

## 最佳实践

### 1. 错误处理

```go
// 使用自定义错误类型
import (
    "errors"
    "gorm.io/gorm"
)

var ErrNotFound = errors.New("record not found")
var ErrDuplicate = errors.New("duplicate entry")

func GetUserByID(id uint64) (*User, error) {
    var user User
    result := DB.First(&user, id)
    if result.Error != nil {
        if errors.Is(result.Error, gorm.ErrRecordNotFound) {
            return nil, ErrNotFound
        }
        return nil, result.Error
    }
    return &user, nil
}

// sqlx 错误处理
import "database/sql"

func GetUser(id uint64) (*User, error) {
    var user User
    err := DB.Get(&user, "SELECT * FROM users WHERE id = ?", id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, err
    }
    return &user, nil
}
```

### 2. 使用 Repository 模式

```go
// repository/user_repository.go
package repository

import (
    "myapp/models"
    "gorm.io/gorm"
)

type UserRepository interface {
    Create(user *models.User) error
    FindByID(id uint64) (*models.User, error)
    FindByEmail(email string) (*models.User, error)
    Update(user *models.User) error
    Delete(id uint64) error
    List(offset, limit int) ([]models.User, int64, error)
}

type userRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
    return r.db.Create(user).Error
}

func (r *userRepository) FindByID(id uint64) (*models.User, error) {
    var user models.User
    err := r.db.First(&user, id).Error
    return &user, err
}

func (r *userRepository) List(offset, limit int) ([]models.User, int64, error) {
    var users []models.User
    var total int64
    err := r.db.Model(&models.User{}).Count(&total).Error
    if err != nil {
        return nil, 0, err
    }
    err = r.db.Offset(offset).Limit(limit).Find(&users).Error
    return users, total, err
}
```

### 3. 使用 Context 控制超时

```go
// GORM
import (
    "context"
    "time"
)

func GetUserWithContext(ctx context.Context, id uint64) (*User, error) {
    var user User
    result := DB.WithContext(ctx).First(&user, id)
    return &user, result.Error
}

// 使用示例
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
user, err := GetUserWithContext(ctx, 1)

// sqlx
func GetUser(ctx context.Context, id uint64) (*User, error) {
    var user User
    err := DB.GetContext(ctx, &user, "SELECT * FROM users WHERE id = ?", id)
    return &user, err
}
```

### 4. 钩子函数

```go
// GORM Hooks
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // 创建前验证
    if u.Username == "" {
        return errors.New("username cannot be empty")
    }
    // 密码加密
    if u.PasswordHash != "" {
        u.PasswordHash = hashPassword(u.PasswordHash)
    }
    return nil
}

func (u *User) AfterCreate(tx *gorm.DB) error {
    // 创建后发送通知
    sendWelcomeEmail(u.Email)
    return nil
}
```

### 5. 软删除

```go
// GORM
import "gorm.io/plugin/软删除"

type User struct {
    ID        uint64 `gorm:"primaryKey"`
    DeletedAt gorm.DeletedAt `gorm:"index"`
    // ... 其他字段
}

// 查询时自动过滤已删除记录
var users []User
DB.Find(&users) // 只返回未删除的记录

// 查询包括已删除的记录
DB.Unscoped().Find(&users)

// 永久删除
DB.Unscoped().Delete(&user)

// sqlx 软删除
type User struct {
    ID        uint64     `db:"id"`
    DeletedAt *time.Time `db:"deleted_at"`
    // ... 其他字段
}

// 查询时添加条件
DB.Select(&users, "SELECT * FROM users WHERE deleted_at IS NULL")
```

---

## 参考资源

- [GORM 官方文档](https://gorm.io/docs/)
- [sqlx GitHub](https://github.com/jmoiron/sqlx)
- [Go 数据库最佳实践](https://go.dev/doc/database/index)
- [Go SQL 驱动列表](https://github.com/golang/go/wiki/SQLDrivers)

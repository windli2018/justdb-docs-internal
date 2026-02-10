---
title: Go ORM Integration
icon: code
description: Generate GORM and sqlx models from JustDB schema
---

# Go ORM Integration Guide

JustDB supports generating Go ORM models for GORM and sqlx from Schema definitions.

## Table of Contents

1. [Background](#background)
2. [Quick Start](#quick-start)
3. [Generate from Existing Database](#generate-from-existing-database)
4. [GORM Usage](#gorm-usage)
5. [sqlx Usage](#sqlx-usage)
6. [Common Scenarios](#common-scenarios)
7. [Best Practices](#best-practices)

---

## Background

### Go ORM Ecosystem

| Framework | Characteristics | Use Cases |
|-----------|----------------|-----------|
| **GORM** | Feature-rich, convention over configuration | Full-featured applications |
| **sqlx** | Minimal overhead, type-safe scanning | Performance-critical applications |

---

## Quick Start

### Install JustDB

```bash
wget https://github.com/justdb/justdb/releases/latest/download/justdb-cli.zip
unzip justdb-cli.zip
export PATH=$PATH:$(pwd)/justdb-cli/bin
```

### Install Go Dependencies

```bash
# GORM
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
go get -u gorm.io/driver/postgres

# sqlx
go get -u github.com/jmoiron/sqlx
```

### Generate Models

```bash
# GORM
justdb schema2orm \
  --input schema.xml \
  --type gorm \
  --output models.go

# sqlx
justdb schema2orm \
  --input schema.xml \
  --type sqlx \
  --output models.go
```

---

## Generate from Existing Database

### Extract Schema from Database

```bash
justdb db2schema \
  --db-url "jdbc:postgresql://localhost:5432/mydb" \
  --username postgres \
  --password password \
  --output schema.xml
```

### Or Define Schema in Markdown

```markdown
# Users Table

| Column | Type | Primary Key | Comment |
|--------|------|-------------|---------|
| id | BIGINT | true | User ID |
| username | VARCHAR(50) | false | Username |
| email | VARCHAR(100) | false | Email |
```

---

## GORM Usage

### Generated Models Example

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID        uint           `gorm:"primary_key" json:"id"`
    Username  string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
    Email     *string        `gorm:"type:varchar(100);uniqueIndex" json:"email,omitempty"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

    Orders    []Order `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"orders,omitempty"`
}

func (User) TableName() string {
    return "users"
}
```

### Basic Operations

```go
package main

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "models"
)

func main() {
    dsn := "host=localhost user=postgres password=password dbname=mydb port=5432"
    db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{})

    // Create
    user := models.User{Username: "alice", Email: ptrStr("alice@example.com")}
    db.Create(&user)

    // Query
    var user models.User
    db.First(&user, "username = ?", "alice")

    // Update
    db.Model(&user).Update("email", "newemail@example.com")

    // Delete
    db.Delete(&user)
}

func ptrStr(s string) *string { return &s }
```

---

## sqlx Usage

### Generated Models Example

```go
package models

type User struct {
    ID        int       `db:"id" json:"id"`
    Username  string    `db:"username" json:"username"`
    Email     *string   `db:"email" json:"email,omitempty"`
    CreatedAt time.Time `db:"created_at" json:"created_at"`
}

func (User) TableName() string {
    return "users"
}
```

### Basic Operations

```go
package main

import (
    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
    "models"
)

func main() {
    db, _ := sqlx.Connect("postgres", "host=localhost dbname=mydb user=postgres password=password")

    // Create
    user := models.User{Username: "alice", Email: ptrStr("alice@example.com")}
    db.Exec("INSERT INTO users (username, email) VALUES ($1, $2)", user.Username, user.Email)

    // Query
    var user models.User
    db.Get(&user, "SELECT * FROM users WHERE username = $1", "alice")

    // Update
    db.Exec("UPDATE users SET email = $1 WHERE id = $2", "newemail@example.com", user.ID)

    // Delete
    db.Exec("DELETE FROM users WHERE id = $1", user.ID)
}
```

---

## Common Scenarios

### E-commerce Platform

```markdown
# Users Table
| Column | Type | Primary Key |
|--------|------|-------------|
| id | BIGINT | true |
| username | VARCHAR(50) | false |

# Orders Table
| Column | Type | Primary Key | Foreign Key |
|--------|------|-------------|-------------|
| id | BIGINT | true | - |
| user_id | BIGINT | false | users.id |
```

```bash
# Generate GORM models
justdb schema2orm --input ecommerce.md --type gorm --output models.go
```

---

## Best Practices

### 1. Use Pointer for Nullable Fields

```go
type User struct {
    Email *string `gorm:"type:varchar(100)" json:"email,omitempty"`
}
```

### 2. Handle Soft Deletes

```go
type User struct {
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
```

### 3. Connection Pooling

```go
db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{
    CreateBatchSize: 1000,
})
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
```

## Reference Links

- [GORM Documentation](https://gorm.io/docs/)
- [sqlx Documentation](https://jmoiron.github.io/sqlx/)
- [Go Database SQL](https://go.dev/database/sql)

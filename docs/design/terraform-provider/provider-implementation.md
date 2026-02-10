---
title: Terraform Provider 实现细节
order: 2
icon: code
parent: Terraform Provider 设计
category:
  - 设计文档
  - Terraform
---

# Terraform Provider 实现细节

本文档详细说明 JustDB Terraform Provider 的实现细节。

## 开发环境配置

### 项目结构

```
provider-justdb/
├── main.go                           # Provider 入口
├── provider.go                       # Provider 定义
├── provider_test.go                  # 测试
├── resources/
│   ├── resource_justdb_schema.go     # Schema 资源
│   ├── resource_justdb_migration.go  # Migration 资源
│   └── resource_justdb_database.go   # Database 资源
├── datasources/
│   ├── datasource_justdb_schema.go   # Schema Data Source
│   └── datasource_justdb_diff.go     # Diff Data Source
├── client.go                         # JustDB API 客户端
├── models.go                         # 数据模型
├── scripts/                          # 辅助脚本
└── examples/
    └── simple/
        ├── main.tf
        └── schema.yaml
```

### go.mod

```go
module github.com/justdb/terraform-provider-justdb

go 1.21

require (
    github.com/hashicorp/terraform-plugin-framework v1.0.0
    github.com/hashicorp/terraform-plugin-framework/providerserver v0.1.0
)

// 数据库驱动（空白导入用于注册驱动）
require (
    github.com/go-sql-driver/mysql      v1.7.1  // MySQL
    github.com/lib/pq                  v1.10.9 // PostgreSQL
    github.com/mattn/go-sqlite3        v1.14.17 // SQLite
    github.com/denisenkom/go-mssqldb   v1.5.0  // SQL Server
    github.com/sijms/go-ora/v2         v2.7.10 // Oracle
)
```

---

## Go database/sql - 类似 Java JDBC

### 对比

| Java JDBC | Go database/sql |
|:---|:---|
| `java.sql.Connection` | `sql.DB` |
| `java.sql.Statement` | `sql.Stmt` / `sql.DB.Exec()` |
| `java.sql.ResultSet` | `sql.Rows` |
| `DriverManager.getConnection()` | `sql.Open()` |
| `Class.forName()` 显式加载 | `_ import` 隐式注册 |
| 外部连接池（HikariCP） | 内置连接池 |

### 基本用法

```go
package database

import (
    "context"
    "database/sql"
    "fmt"

    // 空白导入注册驱动
    _ "github.com/go-sql-driver/mysql"
    _ "github.com/lib/pq"
    _ "github.com/mattn/go-sqlite3"
    _ "github.com/denisenkom/go-mssqldb"
    _ "github.com/sijms/go-ora/v2"
)

type SQLExecutor struct {
    drivers map[string]string
}

func NewSQLExecutor() *SQLExecutor {
    return &SQLExecutor{
        drivers: map[string]string{
            "mysql":      "mysql",
            "postgresql": "postgres",
            "sqlite":     "sqlite3",
            "sqlserver":  "sqlserver",
            "oracle":     "gora",
            "h2":         "h2",
        },
    }
}
```

---

## Resource 实现

### 1. Schema Resource

**resources/resource_justdb_schema.go**:

```go
package resources

import (
    "context"
    "fmt"
    "os/exec"
    "strings"

    "github.com/hashicorp/terraform-plugin-framework/resource"
    "github.com/hashicorp/terraform-plugin-framework/resource/schema"
    "github.com/hashicorp/terraform-plugin-framework/types"
    "github.com/hashicorp/terraform-plugin-framework/types/plan"
)

type resourceJustDbSchema struct {
    resource.BaseResource
}

type resourceJustDbSchemaModel struct {
    SchemaFile   types.String `tfsdk:"schema_file"`
    DatabaseUrl  types.String `tfsdk:"database_url"`
    Dialect      types.String `tfsdk:"dialect"`
    Idempotent   types.Bool   `tfsdk:"idempotent"`
    Version      types.String `tfsdk:"version"`  // 输出属性
    LastApplied  types.String `tfsdk:"last_applied"`  // 输出属性
}

func (r *resourceJustDbSchema) Schema(ctx context.Context, req resource.SchemaRequest, resp *resource.SchemaResponse) {
    resp.Schema = resourceJustDbSchemaSchema()
}

func resourceJustDbSchemaSchema() schema.Schema {
    return schema.Schema{
        Description: "JustDB database schema resource",

        Attributes: map[string]schema.Attribute{
            "schema_file": {
                Type:        types.StringType,
                Required:    true,
                Description: "Schema 文件路径 (支持 s3://, https://, file://)",
                PlanModifiers: plan.ModifierSet{
                    resource.SchemaRequired plan.RequiresReplace(),
                },
            },
            "database_url": {
                Type:        types.StringType,
                Required:    true,
                Sensitive:   true,
                Description: "JDBC 连接字符串",
                PlanModifiers: plan.ModifierSet{
                    resource.SchemaRequired plan.RequiresReplace(),
                },
            },
            "dialect": {
                Type:        types.StringType,
                Required:    true,
                Description: "数据库类型 (mysql, postgresql, oracle, etc.)",
                PlanModifiers: plan.ModifierSet{
                    resource.SchemaRequired plan.RequiresReplace(),
                },
            },
            "idempotent": {
                Type:        types.BoolType,
                Optional:    true,
                Default:     true,
                Description: "是否使用幂等模式 (IF NOT EXISTS)",
            },
            "version": {
                Type:        types.StringType,
                Computed:    true,
                Description: "Schema 版本号",
            },
            "last_applied": {
                Type:        types.StringType,
                Computed:    true,
                Description: "最后应用时间",
            },
        },
    }
}

func (r *resourceJustDbSchema) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
    var plan resourceJustDbSchemaModel
    resp.State = &plan

    // 获取参数
    schemaFile := plan.SchemaFile.ValueString()
    databaseUrl := plan.DatabaseUrl.ValueString()
    dialect := plan.Dialect.ValueString()
    idempotent := plan.Idempotent.ValueBool()

    // 方案 A：调用 Cloud API 生成 SQL
    sqlList, err := r.generateSQLFromCloud(schemaFile, dialect, idempotent)
    if err != nil {
        resp.Diagnostics.AddError("Failed to generate SQL", err.Error())
        return
    }

    // 方案 A：在 Provider 端执行 SQL
    if err := r.executeSQL(ctx, databaseUrl, sqlList); err != nil {
        resp.Diagnostics.AddError("Failed to execute SQL", err.Error())
        return
    }

    // 设置状态
    plan.LastApplied = types.StringValue(time.Now().Format(time.RFC3339))
}

// 从云端生成 SQL
func (r *resourceJustDbSchema) generateSQLFromCloud(
    schemaFile string,
    dialect string,
    idempotent bool,
) ([]string, error) {
    // 调用 POST /api/v1/schemas/generate-sql
    reqBody := GenerateSQLRequest{
        SchemaURL:  schemaFile,
        Dialect:    dialect,
        Idempotent: idempotent,
    }

    var respBody GenerateSQLResponse
    if err := r.client.Post("/api/v1/schemas/generate-sql", reqBody, &respBody); err != nil {
        return nil, err
    }

    return respBody.SQL, nil
}

// 在 Provider 端执行 SQL
func (r *resourceJustDbSchema) executeSQL(
    ctx context.Context,
    databaseUrl string,
    dialect string,
    sqlList []string,
) error {
    executor := NewSQLExecutor()
    db, err := executor.Open(ctx, dialect, databaseUrl)
    if err != nil {
        return fmt.Errorf("failed to open database: %w", err)
    }
    defer db.Close()

    return executor.ExecuteSQLList(ctx, db, sqlList)
}
```

### SQL 执行器实现

```go
// 打开数据库连接
func (e *SQLExecutor) Open(ctx context.Context, dialect, jdbcURL string) (*sql.DB, error) {
    // 转换 JDBC URL 到 Go 连接字符串
    goURL, err := e.convertJDBCUrl(jdbcURL, dialect)
    if err != nil {
        return nil, fmt.Errorf("failed to convert JDBC URL: %w", err)
    }

    driver, ok := e.drivers[dialect]
    if !ok {
        return nil, fmt.Errorf("unsupported dialect: %s", dialect)
    }

    db, err := sql.Open(driver, goURL)
    if err != nil {
        return nil, fmt.Errorf("failed to open database: %w", err)
    }

    // 配置连接池
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(5)
    db.SetConnMaxLifetime(5 * time.Minute)

    // 验证连接
    if err := db.PingContext(ctx); err != nil {
        db.Close()
        return nil, fmt.Errorf("failed to ping database: %w", err)
    }

    return db, nil
}

// 转换 JDBC URL 到 Go 连接字符串
func (e *SQLExecutor) convertJDBCUrl(jdbcURL, dialect string) (string, error) {
    switch dialect {
    case "mysql":
        // jdbc:mysql://host:3306/db?user=root&password=pass
        // → root:pass@tcp(host:3306)/db?parseTime=true
        return e.convertMySQLUrl(jdbcURL)
    case "postgresql":
        // jdbc:postgresql://host:5432/db?user=root&password=pass
        // → postgres://user:pass@host:5432/db?sslmode=disable
        return e.convertPostgreSQLUrl(jdbcURL)
    case "sqlite":
        // jdbc:sqlite:/path/to/db.sqlite
        // → file:/path/to/db.sqlite
        return e.convertSQLiteUrl(jdbcURL)
    case "sqlserver":
        // jdbc:sqlserver://host:1433;databaseName=db;user=sa;password=pass
        // → sqlserver://sa:pass@host:1433?database=db
        return e.convertSQLServerUrl(jdbcURL)
    case "oracle":
        // jdbc:oracle:thin:@host:1521:orcl
        // → oracle://user:pass@host:1521/orcl
        return e.convertOracleUrl(jdbcURL)
    default:
        return "", fmt.Errorf("unsupported dialect: %s", dialect)
    }
}

// MySQL URL 转换
func (e *SQLExecutor) convertMySQLUrl(jdbcURL string) (string, error) {
    // 使用 url.Parse 解析
    u, err := url.Parse(jdbcURL)
    if err != nil {
        return "", err
    }

    // 提取参数
    query := u.Query()
    user := query.Get("user")
    password := query.Get("password")
    dbname := strings.TrimPrefix(u.Path, "/")

    // 构建格式: user:password@tcp(host:port)/dbname
    host := u.Host
    if host == "" {
        host = "localhost:3306"
    }

    goURL := fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true", user, password, host, dbname)
    return goURL, nil
}

// PostgreSQL URL 转换
func (e *SQLExecutor) convertPostgreSQLUrl(jdbcURL string) (string, error) {
    u, err := url.Parse(jdbcURL)
    if err != nil {
        return "", err
    }

    query := u.Query()
    user := query.Get("user")
    password := query.Get("password")
    dbname := strings.TrimPrefix(u.Path, "/")
    host := u.Host
    if host == "" {
        host = "localhost:5432"
    }

    goURL := fmt.Sprintf("postgres://%s:%s@%s/%s?sslmode=disable", user, password, host, dbname)
    return goURL, nil
}

// SQLite URL 转换
func (e *SQLExecutor) convertSQLiteUrl(jdbcURL string) (string, error) {
    // jdbc:sqlite:/path/to/db.sqlite → file:/path/to/db.sqlite
    path := strings.TrimPrefix(jdbcURL, "jdbc:sqlite:")
    return "file:" + path, nil
}

// SQL Server URL 转换
func (e *SQLExecutor) convertSQLServerUrl(jdbcURL string) (string, error) {
    // jdbc:sqlserver://host:1433;databaseName=db;user=sa;password=pass
    // → sqlserver://sa:pass@host:1433?database=db

    // 解析 JDBC URL（简化版）
    parts := strings.Split(strings.TrimPrefix(jdbcURL, "jdbc:sqlserver://"), ";")
    hostPort := parts[0]

    params := make(map[string]string)
    for _, part := range parts[1:] {
        kv := strings.SplitN(part, "=", 2)
        if len(kv) == 2 {
            params[strings.ToLower(kv[0])] = kv[1]
        }
    }

    user := params["user"]
    password := params["password"]
    dbname := params["databasename"]

    goURL := fmt.Sprintf("sqlserver://%s:%s@%s?database=%s", user, password, hostPort, dbname)
    return goURL, nil
}

// Oracle URL 转换
func (e *SQLExecutor) convertOracleUrl(jdbcURL string) (string, error) {
    // jdbc:oracle:thin:@host:1521:orcl → oracle://user:pass@host:1521/orcl
    // 简化实现
    return "oracle://", fmt.Errorf("Oracle URL conversion not fully implemented")
}

// 执行 SQL 列表（带事务）
func (e *SQLExecutor) ExecuteSQLList(ctx context.Context, db *sql.DB, sqlList []string) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer tx.Rollback() // 如果提交成功，Rollback 是无操作

    for i, sql := range sqlList {
        if _, err := tx.ExecContext(ctx, sql); err != nil {
            return fmt.Errorf("failed to execute SQL [%d]: %s\nError: %w", i, sql, err)
        }
    }

    if err := tx.Commit(); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }

    return nil
}

func (r *resourceJustDbSchema) Update(ctx context.Context, req resource.UpdateRequest, resp *resource.UpdateResponse) {
    // Update 逻辑与 Create 类似
    var plan resourceJustDbSchemaModel
    resp.State = &plan

    schemaFile := plan.SchemaFile.ValueString()
    databaseUrl := plan.DatabaseUrl.ValueString()
    dialect := plan.Dialect.ValueString()
    idempotent := plan.Idempotent.ValueBool()

    sqlList, err := r.generateSQLFromCloud(schemaFile, dialect, idempotent)
    if err != nil {
        resp.Diagnostics.AddError("Failed to generate SQL", err.Error())
        return
    }

    if err := r.executeSQL(ctx, databaseUrl, dialect, sqlList); err != nil {
        resp.Diagnostics.AddError("Failed to execute SQL", err.Error())
        return
    }

    plan.LastApplied = types.StringValue(time.Now().Format(time.RFC3339))
}

func (r *resourceJustDbSchema) Delete(ctx context.Context, req resource.DeleteRequest, resp *resource.DeleteResponse) {
    // Schema 删除通常不删除数据库表
    // 只是从 Terraform state 中移除
}
```

### 2. Diff Data Source

**datasources/datasource_justdb_diff.go**:

```go
package datasources

import (
    "context"
    "encoding/json"

    "github.com/hashicorp/terraform-plugin-framework/datasource"
    "github.com/hashicorp/terraform-plugin-framework/datasource/schema"
    "github.com/hashicorp/terraform-plugin-framework/types"
)

type dataSourceJustDbDiff struct {
    dataSource.BaseDataSource
}

type dataSourceJustDbDiffModel struct {
    TargetSchema  types.String `tfsdk:"target_schema"`
    DatabaseUrl   types.String `tfsdk:"database_url"`
    CurrentSchema types.String `tfsdk:"current_schema"`  // 可选
    Dialect       types.String `tfsdk:"dialect"`
}

func (d *dataSourceJustDbDiff) Schema(ctx context.Context, req datasource.SchemaRequest, resp *datasource.SchemaResponse) {
    resp.Schema = dataSourceJustDbDiffSchema()
}

func dataSourceJustDbDiffSchema() schema.Schema {
    return schema.Schema{
        Attributes: map[string]schema.Attribute{
            "target_schema": {
                Type:     types.StringType,
                Required: true,
                Description: "目标 Schema（文件路径或直接内容）",
            },
            "database_url": {
                Type:     types.StringType,
                Required: true,
                Sensitive: true,
            },
            "current_schema": {
                Type:     types.StringType,
                Optional: true,
                Description: "当前 Schema（可选，用于 diff）",
            },
            "dialect": {
                Type:     types.StringType,
                Required: true,
            },
            "diff": {
                Type:     types.StringType,
                Computed: true,
                Description: "计算的 diff 结果 (JSON)",
            },
        },
    }
}

func (d *dataSourceJustDbDiff) Read(ctx context.Context, req datasource.ReadRequest, resp *datasource.ReadResponse) {
    var config dataSourceJustDbDiffModel
    resp.State = &config

    // 调用 JustDB API 计算 diff
    cmd := exec.Command("justdb", "diff",
        "--format", "json",
        "-c", config.DatabaseUrl.ValueString(),
        "-s", config.TargetSchema.ValueString(),
    )

    output, err := cmd.CombinedOutput()
    if err != nil {
        resp.Diagnostics.AddError(
            fmt.Sprintf("Failed to calculate diff: %s", err),
        )
        return
    }

    // 解析 JSON 结果
    var result DiffResult
    if err := json.Unmarshal(output, &result); err != nil {
        resp.Diagnostics.AddWarning(
            fmt.Sprintf("Failed to parse diff output: %s", err),
        )
    }

    config.Diff = types.StringValue(string(output))
}
```

---

## 数据模型

```go
// Cloud API 请求/响应模型
type GenerateSQLRequest struct {
    SchemaURL  string `json:"schema_url"`
    Dialect    string `json:"dialect"`
    Idempotent bool   `json:"idempotent"`
}

type GenerateSQLResponse struct {
    SQL          []string        `json:"sql"`
    Changes      []SchemaChange  `json:"changes"`
    Checksum     string          `json:"checksum"`
    SchemaVersion string         `json:"schema_version"`
}

type SchemaChange struct {
    Type    string                 `json:"type"`
    Table   string                 `json:"table,omitempty"`
    Column  string                 `json:"column,omitempty"`
    Properties map[string]interface{} `json:"properties,omitempty"`
}

// Provider 状态模型
type resourceJustDbSchemaModel struct {
    SchemaFile   types.String `tfsdk:"schema_file"`
    DatabaseUrl  types.String `tfsdk:"database_url"`
    Dialect      types.String `tfsdk:"dialect"`
    Idempotent   types.Bool   `tfsdk:"idempotent"`
    Version      types.String `tfsdk:"version"`
    LastApplied  types.String `tfsdk:"last_applied"`
    Checksum     types.String `tfsdk:"checksum"`
}
```

---

## 错误处理

### 重试逻辑

```go
package client

import (
    "net"
    "strings"
    "time"
)

const (
    maxRetries     = 3
    retryDelay     = 5 * time.Second
)

type JustDBClient struct {
    client  *http.Client
    baseURL string
    apiKey  string
}

func (c *JustDBClient) ApplyWithRetry(req *ApplyRequest) (*ApplyResult, error) {
    var lastError error

    for attempt := 1; attempt <= maxRetries; attempt++ {
        result, err := c.Apply(req)

        if err == nil {
            return result, nil
        }

        // 判断是否可重试
        if !isRetryableError(err) {
            return nil, err
        }

        lastError = err

        if attempt < maxRetries {
            time.Sleep(retryDelay * time.Duration(attempt))
        }
    }

    return nil, fmt.Errorf("failed after %d attempts: %w", maxRetries, lastError)
}

func isRetryableError(err error) bool {
    // 检查错误类型
    if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
        return true
    }
    if strings.Contains(err.Error(), "connection refused") {
        return true
    }
    return false
}
```

### 错误分类

```go
package errors

type JustDBError struct {
    Code       string `json:"code"`
    Message    string `json:"message"`
    Details    string `json:"details,omitempty"`
    Suggestion string `json:"suggestion,omitempty"`
}

func (e *JustDBError) Error() string {
    if e.Suggestion != "" {
        return fmt.Sprintf("[%s] %s\n建议: %s", e.Code, e.Message, e.Suggestion)
    }
    return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// 预定义错误
var (
    ErrSchemaNotFound   = &JustDBError{Code: "SCHEMA_NOT_FOUND", Message: "Schema file not found"}
    ErrInvalidSchema    = &JustDBError{Code: "INVALID_SCHEMA", Message: "Schema validation failed"}
    ErrDatabaseNotFound = &JustDBError{Code: "DATABASE_NOT_FOUND", Message: "Database connection failed"}
    ErrApplyFailed      = &JustDBError{Code: "APPLY_FAILED", Message: "Schema apply failed"}
)

// HTTP 错误映射
func mapHTTPError(statusCode int, body []byte) *JustDBError {
    switch statusCode {
    case 400:
        return &JustDBError{Code: "INVALID_REQUEST", Message: "Invalid request parameters"}
    case 404:
        return &JustDBError{Code: "SCHEMA_NOT_FOUND", Message: "Schema file not found"}
    case 409:
        return &JustDBError{Code: "CONFLICT", Message: "Schema has concurrent modifications"}
    case 500:
        return &JustDBError{Code: "SERVER_ERROR", Message: "Internal server error"}
    default:
        return &JustDBError{Code: "UNKNOWN_ERROR", Message: string(body)}
    }
}
```

---

## 测试

### 单元测试

**resources/resource_justdb_schema_test.go**:

```go
package resources

import (
    "testing"

    "github.com/hashicorp/terraform-plugin-framework/resource/test"
    "github.com/hashicorp/terraform-plugin-framework/tfsdk"
)

func TestJustDbSchemaResource(t *testing.T) {
    test.ResourceTestCase{
        ProtoV5ProviderFactories: []func() (map[string]func() (plugin.Plugin, error){
            return test.UnitTest(plugin.Provider())
        },
        ResourceUnit:     resourceJustDbSchema(),
        // 测试用例...
    }.Run(t)
}
```

### 集成测试

**examples/simple/provider_test.go**:

```go
func TestAccJustDBSchema_basic(t *testing.T) {
    // 跳过测试如果没有配置
    if os.Getenv("TF_ACC") == "" {
        t.Skip("Acceptance tests skipped unless TF_ACC=1")
    }

    resource.Test(t, resource.TestCase{
        Steps: []resource.TestStep{
            {
                Config: test.TestConfig{
                    Config: `
                        resource "justdb_schema" "test" {
                            schema_file   = "test_fixtures/schema.yaml"
                            database_url  = "jdbc:mysql://localhost:3306/test"
                            dialect       = "mysql"
                        }
                    `,
                },
                Check: resource.ComposeAggregateCheck(
                    resource.TestCheckResourceAttr("justdb_schema.test", "version", "v1.0.0"),
                ),
            },
        },
    })
}
```

---

## 构建和发布

### Makefile

```makefile
# 构建 Provider
.PHONY: build
build:
    go build -o terraform-provider-justdb

# 运行测试
.PHONY: test
test:
    go test ./...

# 生成文档
.PHONY: docs
docs:
    tfplugindocs generate

# 本地测试
.PHONY: local-test
local-test:
    go install .
    terraform init
    terraform plan
```

### 发布到 Terraform Registry

```bash
# 1. 登录 Terraform Registry
terraform login

# 2. 发布 Provider
go install .
export GITHUB_TOKEN=xxx
export TERRAFORM_REGISTRY_TOKEN=xxx
make publish

# 或使用 goreleaser
goreleaser release \
  --rm-dist \
  --publish-github \
  --publish-terraform-registry
```

---

## 相关文档

- [云 API 设计](cloud-api.md)
- [部署指南](deployment.md)
- [Terraform 集成指南](../../guide/terraform-integration.md)

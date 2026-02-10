---
title: Terraform Provider 设计
order: 1
icon: server
category:
  - 设计文档
  - Terraform
tag:
  - terraform
  - provider
  - design
  - design
---

# Terraform Provider 设计文档

本文档详细说明 JustDB Terraform Provider 和云服务的设计方案。

## 概述

### 设计目标

为 JustDB 提供完整的 Terraform 集成方案，包括：

1. **Terraform Provider**：使用 Go 开发，遵循 Terraform Plugin Protocol
2. **JustDB Cloud API**：HTTP 服务，提供 Schema 管理接口
3. **Terraform CDK 支持**：多语言绑定（Java/Python/TypeScript）

### 核心价值

- ✅ **统一管理**：数据库 Schema 与云资源一起管理
- ✅ **云原生**：JDBC 在云端，用户无需本地配置
- ✅ **审计追踪**：所有操作可追溯
- ✅ **多租户**：支持多团队、多环境

---

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         Terraform                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Terraform Plugin Protocol                  │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │   JustDB Terraform Provider (Go)            │   │  │
│  │  │   - Schema 资源                            │   │  │
│  │  │   - Migration 资源                         │   │  │
│  │  │   - Validation Data Source                 │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬────────────────────────────┘
                               │ HTTP/REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    JustDB Cloud Service                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Gateway (Spring Boot / Go)                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │ Schema API   │  │ Diff API     │  │ Validate  │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐      │  │
│  │  │    JustDB Engine (JDBC)                     │      │  │
│  │  │  - Schema 加载                               │      │  │
│  │  │  - SQL 生成                                  │      │  │
│  │  │  - Diff 计算                                 │      │  │
│  │  └──────────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬────────────────────────────┘
                               │ JDBC
                               ▼
                        ┌─────────┐
                        │Database │
                        └─────────┘
```

---

## 方案对比

### 方案 1：本地 CLI 方案（当前）

```
Terraform → local-exec → justdb migrate → Database
```

**优势**：
- ✅ 实现简单
- ✅ 无需额外服务
- ✅ 数据不离开本地网络

**劣势**：
- ❌ 需要本地安装 JustDB CLI
- ❌ 需要配置 JDBC 驱动
- ❌ 难以追踪和审计

### 方案 2：云端生成 SQL，Provider 执行（推荐）

```
Terraform → JustDB Provider → Cloud API (生成 SQL)
                                    ↓
                               返回 SQL 列表
                                    ↓
Provider → JDBC → Database (执行 SQL)
```

**优势**：
- ✅ 凭证在 Provider 端管理，不经过云端
- ✅ 云端无状态，只负责 Schema 解析和 SQL 生成
- ✅ 更简单的安全性模型
- ✅ Provider 可复用 Terraform database provider 的连接配置

**劣势**：
- ❌ Provider 仍需 JDBC 驱动
- ❌ 云端无法审计 SQL 执行

### 方案 3：云端执行（企业级）

```
Terraform → HTTP API → JustDB Cloud → JDBC → Database
         ↑
    需要传递数据库凭证
```

**优势**：
- ✅ 无需本地 JDBC 驱动
- ✅ 统一的审计和权限管理
- ✅ 支持 S3/Git 读取 Schema
- ✅ 团队协作友好

**劣势**：
- ❌ 需要运维云服务
- ❌ 需要解决数据库凭证传递问题

---

## 技术选型

### Terraform Provider 开发

| 组件 | 技术选择 | 理由 |
|:---|:---|:---|
| **语言** | Go 1.21+ | Terraform 官方要求 |
| **框架** | terraform-plugin-framework | 新一代 Provider 框架 |
| **HTTP 客户端** | net/http | 标准库 |
| **测试** | terraform-plugin-testing | 官方测试框架 |

### JustDB Cloud 服务

| 组件 | 技术选择 | 理由 |
|:---|:---|:---|
| **语言** | Java 21+ | JustDB 核心语言 |
| **框架** | Spring Boot 3.x | 成熟稳定 |
| | | 易于集成 JDBC |
| **API 文档** | OpenAPI 3.0 | 标准化 |
| **部署** | Docker + K8s | 云原生 |
| **数据库** | PostgreSQL | 存储配置和审计 |

---

## 数据流设计

### 1. Schema 应用流程

```
Terraform Plan:
1. 读取 HCL/CDK 配置
2. 读取当前 Schema 状态（可选）
3. 生成执行计划

Terraform Apply:
1. 调用 JustDB Cloud API
   POST /api/v1/schemas/apply
   Body: {
     schema_url: "s3://bucket/schema.yaml",
     database_url: "jdbc:mysql://...",
     dialect: "mysql",
     dry_run: false
   }

2. JustDB Cloud:
   - 从 S3/Git 读取 Schema
   - 使用 JustDB Engine 加载
   - 生成 SQL
   - 执行到数据库
   - 记录审计日志

3. 返回结果:
   {
     "schema_version": "v1.2.3",
     "changes": [
       {
         "type": "create_table",
         "table": "users"
       }
     ]
   }
```

### 2. Diff 计算流程

```
1. Terraform/Data Source:
   GET /api/v1/schemas/diff

2. JustDB Cloud:
   - 从当前数据库读取 Schema
   - 加载目标 Schema
   - 使用 CanonicalSchemaDiff 计算 diff
   - 返回变更列表

3. 返回结果:
   {
     "added": [...],
     "removed": [...],
     "modified": [...],
     "sql": "ALTER TABLE..."
   }
```

---

## API 设计

### REST API 端点

```yaml
paths:
  /api/v1/schemas/apply:
    post:
      summary: 应用数据库 Schema
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                schema_url:
                  type: string
                  description: Schema 文件 URL (s3://, https://git://, file://)
                schema_content:
                  type: string
                  description: 直接提供 Schema 内容
                database_url:
                  type: string
                  description: JDBC 连接字符串
                dialect:
                  type: string
                  enum: [mysql, postgresql, oracle, sqlserver, h2, sqlite]
                dry_run:
                  type: boolean
                  default: false
      responses:
        200:
          description: Schema 应用成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplyResult'

  /api/v1/schemas/diff:
    post:
      summary: 计算 Schema 差异
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                target_schema:
                  oneOf:
                    - $ref: '#/components/schemas/SchemaUrl'
                    - $ref: '#/components/schemas/SchemaContent'
                database_url:
                  type: string
      responses:
        200:
          description: Diff 计算成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DiffResult'

  /api/v1/schemas/validate:
    post:
      summary: 验证 Schema
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                schema:
                  oneOf:
                    - type: string
                    - type: object
      responses:
        200:
          description: 验证结果

  /api/v1/schemas/generate-sql:
    post:
      summary: 生成 SQL（不执行）
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                schema_url:
                  type: string
                  description: Schema 文件 URL
                dialect:
                  type: string
                  enum: [mysql, postgresql, oracle, sqlserver, h2, sqlite]
                idempotent:
                  type: boolean
                  default: true
      responses:
        200:
          description: SQL 生成成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  sql:
                    type: array
                    items:
                      type: string
                    description: 生成的 SQL 语句列表
                  changes:
                    type: array
                    description: 变更列表
                  checksum:
                    type: string
                    description: Schema 校验和
```

### 数据模型

```yaml
components:
  schemas:
    ApplyResult:
      type: object
      properties:
        success:
          type: boolean
        schema_version:
          type: string
        changes:
          type: array
          items:
            type: object
            properties:
              type:
                type: string
                enum: [add_table, drop_table, add_column, drop_column]
              table:
                type: string
              changes:
                type: integer
        sql:
          type: string
          description: 生成的 SQL 语句

    DiffResult:
      type: object
      properties:
        added:
          type: array
          items:
            $ref: '#/components/schemas/SchemaChange'
        removed:
          type: array
          items:
            $ref: '#/components/schemas/SchemaChange'
        modified:
          type: array
          items:
            $ref: '#/components/schemas/SchemaChange'

    SchemaChange:
      type: object
      properties:
        type:
          type: string
          enum: [table, view, column, index, constraint]
        name:
          type: string
        changes:
          type: array
          items:
            type: string
```

---

## 安全设计

### 1. 认证与授权

```java
// JWT 认证
@RestController
@RequestMapping("/api/v1")
public class AuthController {

    @PostMapping("/auth/token")
    public TokenResponse createToken(@RequestBody LoginRequest request) {
        // 验证 API Key
        ApiKey apiKey = apiKeyService.validate(request.getApiKey());

        // 生成 JWT Token
        String token = jwtService.generate(apiKey);

        return new TokenResponse(token);
    }
}

// API Key 权限
@Data
public class ApiKey {
    private String id;
    private String name;
    private String key;
    private Set<Permission> permissions;
    private Set<String> allowedDatabases;
    private Date expiresAt;
}
```

### 2. 请求限流

```java
@Component
public class RateLimiter {

    private final Map<String, RateLimit> limits = new ConcurrentHashMap<>();

    public boolean checkLimit(String apiKey, String endpoint) {
        RateLimit limit = limits.get(apiKey);
        if (limit == null) {
            limit = getDefaultLimit(apiKey);
            limits.put(apiKey, limit);
        }

        return limit.allow();
    }
}
```

### 3. 敏感信息保护

```java
// 数据库连接加密
@Data
public class DatabaseConfig {
    private transient String username;
    private transient String password;

    public String getEncryptedPassword() {
        return encryptionService.encrypt(password);
    }

    public String decryptPassword(String encrypted) {
        return encryptionService.decrypt(encrypted);
    }
}

// 不在日志中记录敏感信息
@Aspect
@Component
public class SecurityLoggingAspect {
    @Around("@annotation(SensitiveOperation)")
    public Object logSensitive(ProceedingJoinPoint pjp) {
        // 脱敏处理
        return pjp.proceed();
    }
}
```

---

## 数据库凭证管理

### 新数据库实例的问题

当使用 Terraform 创建新数据库实例时，面临以下挑战：

1. **动态 endpoint**：`mydb.xxxx.us-east-1.rds.amazonaws.com`
2. **安全访问**：需要配置安全组允许访问
3. **凭证传递**：数据库用户名/密码如何安全传递
4. **就绪等待**：新数据库需要初始化时间

### 方案对比

#### 方案 1：直接传递凭证（方案 2：云端生成 SQL）

```hcl
resource "justdb_schema" "app" {
  schema_file   = "s3://my-schemas/schema.yaml"
  database_url  = "jdbc:mysql://${aws_db_instance.main.endpoint}"
  username      = var.db_username
  password      = var.db_password
  dialect       = "mysql"
}
```

**优势**：简单直接
**劣势**：密码在 Terraform state 中可见

#### 方案 2：预注册数据库（方案 3：云端执行）

```hcl
# 1. 预先注册数据库连接配置
resource "justdb_database" "main" {
  name          = "myapp-prod-db"
  engine        = "mysql"
  host          = aws_db_instance.main.endpoint
  port          = 3306
}

# 2. Schema 应用时引用预注册的数据库
resource "justdb_schema" "app" {
  schema_file   = "s3://my-schemas/schema.yaml"
  database_id   = justdb_database.main.id
  dialect       = "mysql"
}
```

**优势**：
- ✅ 凭证在 JustDB Cloud 中统一管理
- ✅ 支持密钥轮换
- ✅ 审计追踪

**劣势**：需要预先配置

#### 方案 3：云原生凭证集成

```hcl
resource "justdb_schema" "app" {
  schema_file   = "s3://my-schemas/schema.yaml"
  database_url  = "jdbc:mysql://${aws_db_instance.main.endpoint}"
  dialect       = "mysql"

  # JustDB Cloud 从 AWS Secrets Manager 读取凭证
  secret_arn    = aws_secretsmanager_secret.db_credentials.arn
  auth_mode     = "aws_secrets_manager"
}
```

**流程**：
1. Terraform 创建数据库，将凭证存入 Secrets Manager
2. JustDB Cloud Pod 配置 IRSA 角色，有权读取该 Secret
3. JustDB Cloud 自动读取凭证并连接

### API 设计：数据库注册

```yaml
POST /api/v1/databases
{
  "name": "myapp-prod-db",
  "engine": "mysql",
  "host": "mydb.xxxx.us-east-1.rds.amazonaws.com",
  "port": 3306,
  "credentials": {
    "mode": "inline",  # | aws_secrets_manager | vault
    "username": "admin",
    "password": "password"
  }
}

# Schema 应用时使用预注册数据库
POST /api/v1/schemas/apply
{
  "schema_url": "s3://...",
  "database_id": "myapp-prod-db",
  "dialect": "mysql"
}
```

---

## 状态管理

### 1. Schema 版本追踪

```java
@Entity
@Table(name = "schema_versions")
public class SchemaVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String environment;      // dev/staging/prod
    private String schemaUrl;        // Schema 来源
    private String version;          // 版本号

    @Column(columnDefinition = "JSON")
    private List<SchemaChange> changes; // 变更记录

    private LocalDateTime appliedAt;
    private String appliedBy;        // 操作人

    @Column(length = 1000)
    private String checksum;        // Schema 文件校验和
}
```

### 2. 审计日志

```java
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String apiKeyId;
    private String operation;       // apply/diff/validate
    private String schemaUrl;
    private String databaseUrl;      // 脱敏处理
    private String result;

    private String status;          // SUCCESS/FAILED
    private String errorMessage;

    private LocalDateTime timestamp;

    @Column(length = 45)
    private String ipAddress;
}
```

---

## 高可用设计

### 1. 服务部署

```
                    ┌─────────────┐
                    │   Load       │
                    │  Balancer   │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │JustDB   │    │JustDB   │    │JustDB   │
      │Cloud 1  │    │Cloud 2  │    │Cloud 3  │
      └─────────┘    └─────────┘    └─────────�
            │              │              │
            └──────────────┴──────────────┘
                           │
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  (Shared DB)  │
                    └──────────────┘
```

### 2. 任务队列

```java
@Service
public class SchemaExecutionService {

    @Autowired
    private TaskExecutor taskExecutor;

    @Autowired
    private AuditLogService auditLogService;

    public CompletableFuture<ApplyResult> applyAsync(ApplyRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 执行 Schema 应用
                ApplyResult result = applySchema(request);

                // 记录审计日志
                auditLogService.log(request, result);

                return result;
            } catch (Exception e) {
                auditLogService.logError(request, e);
                throw e;
            }
        }, taskExecutor);
    }
}
```

---

## 监控和可观测性

### 1. 指标收集

```java
@Component
public class MetricsCollector {

    private final MeterRegistry meterRegistry;

    public void recordApply(String apiKey, String status, long duration) {
        Timer.Sample sample = Timer.start(meterRegistry);

        try {
            // 记录指标
            Counter.builder("justdb.apply")
                .tag("status", status)
                .tag("api_key", maskApiKey(apiKey))
                .register(meterRegistry)
                .increment();

        } finally {
            sample.stop(Timer.builder("justdb.apply.duration")
                .register(meterRegistry)
                .record(duration, TimeUnit.MILLISECONDS);
        }
    }
}
```

### 2. 健康检查

```java
@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();

        // 检查数据库连接
        health.put("database", checkDatabase());

        // 检查磁盘空间
        health.put("disk", checkDiskSpace());

        // 检查外部依赖
        health.put("s3", checkS3Connection());

        return ResponseEntity.ok(health);
    }
}
```

---

## 部署架构

### 开发环境

```yaml
# docker-compose.yml
version: '3.8'
services:
  justdb-cloud:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: dev
      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/justdb
    volumes:
      - ./schemas:/app/schemas
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: justdb
      POSTGRES_USER: justdb
      POSTGRES_PASSWORD: justdb
```

### 生产环境

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: justdb-cloud
spec:
  replicas: 3
  selector:
    matchLabels:
      app: justdb-cloud
  template:
    metadata:
      labels:
        app: justdb-cloud
    spec:
      containers:
      - name: justdb-cloud
        image: justdb/cloud:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          value: "http://jaeger:4317"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## 相关文档

- [Provider 实现细节](provider-implementation.md)
- [云 API 设计](cloud-api.md)
- [Terraform 集成指南](../../guide/terraform-integration.md)
- [部署指南](deployment.md)

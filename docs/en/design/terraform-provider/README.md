---
title: Terraform Provider Design
order: 1
icon: server
category:
  - Design Documentation
  - Terraform
tag:
  - terraform
  - provider
  - design
---

# Terraform Provider Design Document

This document details the design plan for JustDB Terraform Provider and cloud service.

## Overview

### Design Goals

Provide complete Terraform integration for JustDB, including:

1. **Terraform Provider**: Developed in Go, following Terraform Plugin Protocol
2. **JustDB Cloud API**: HTTP service providing Schema management interfaces
3. **Terraform CDK Support**: Multi-language bindings (Java/Python/TypeScript)

### Core Value

- ✅ **Unified Management**: Database Schema managed alongside cloud resources
- ✅ **Cloud Native**: JDBC in cloud, no local configuration needed
- ✅ **Audit Trail**: All operations traceable
- ✅ **Multi-tenant**: Support for multiple teams and environments

---

## Architecture Design

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Terraform                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Terraform Plugin Protocol                  │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │   JustDB Terraform Provider (Go)            │   │  │
│  │  │   - Schema Resource                         │   │  │
│  │  │   - Migration Resource                      │   │  │
│  │  │   - Validation Data Source                  │   │  │
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
│  │  │  - Schema loading                              │      │  │
│  │  │  - SQL generation                              │      │  │
│  │  │  - Diff calculation                           │      │  │
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

## Solution Comparison

### Solution 1: Local CLI (Current)

```
Terraform → local-exec → justdb migrate → Database
```

**Pros**:
- ✅ Simple implementation
- ✅ No additional service needed
- ✅ Data stays on local network

**Cons**:
- ❌ Requires local JustDB CLI installation
- ❌ Requires JDBC driver configuration
- ❌ Difficult to track and audit

### Solution 2: Cloud Generate SQL, Provider Execute (Recommended)

```
Terraform → JustDB Provider → Cloud API (generate SQL)
                                    ↓
                               Return SQL list
                                    ↓
Provider → JDBC → Database (execute SQL)
```

**Pros**:
- ✅ Credentials managed at Provider side
- ✅ Cloud stateless, only responsible for Schema parsing and SQL generation
- ✅ Simpler security model
- ✅ Provider can reuse Terraform database provider connection config

**Cons**:
- ❌ Provider still needs JDBC driver
- ❌ Cloud cannot audit SQL execution

### Solution 3: Cloud Execution (Enterprise)

```
Terraform → HTTP API → JustDB Cloud → JDBC → Database
         ↑
    Need to pass database credentials
```

**Pros**:
- ✅ No local JDBC driver needed
- ✅ Unified audit and permission management
- ✅ Support S3/Git Schema reading
- ✅ Team collaboration friendly

**Cons**:
- ❌ Requires cloud service operations
- ❌ Need to solve database credential passing

---

## Technology Selection

### Terraform Provider Development

| Component | Technology | Rationale |
|:---|:---|:---|
| **Language** | Go 1.21+ | Terraform official requirement |
| **Framework** | terraform-plugin-framework | Next-gen Provider framework |
| **HTTP Client** | net/http | Standard library |
| **Testing** | terraform-plugin-testing | Official testing framework |

### JustDB Cloud Service

| Component | Technology | Rationale |
|:---|:---|:---|
| **Language** | Java 21+ | JustDB core language |
| **Framework** | Spring Boot 3.x | Mature and stable |
| **API Doc** | OpenAPI 3.0 | Standardization |
| **Deployment** | Docker + K8s | Cloud native |

---

## API Design

### REST API Endpoints

```yaml
paths:
  /api/v1/schemas/apply:
    post:
      summary: Apply database Schema
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                schema_url:
                  type: string
                  description: Schema file URL (s3://, https://git://, file://)
                database_url:
                  type: string
                  description: JDBC connection string
                dialect:
                  type: string
                  enum: [mysql, postgresql, oracle, sqlserver, h2, sqlite]
                dry_run:
                  type: boolean
                  default: false

  /api/v1/schemas/diff:
    post:
      summary: Calculate Schema differences

  /api/v1/schemas/validate:
    post:
      summary: Validate Schema

  /api/v1/schemas/generate-sql:
    post:
      summary: Generate SQL (without execution)
```

---

## Security Design

### Authentication & Authorization

```java
// JWT Authentication
@RestController
@RequestMapping("/api/v1")
public class AuthController {
    @PostMapping("/auth/token")
    public TokenResponse createToken(@RequestBody LoginRequest request) {
        // Validate API Key
        ApiKey apiKey = apiKeyService.validate(request.getApiKey());
        // Generate JWT Token
        String token = jwtService.generate(apiKey);
        return new TokenResponse(token);
    }
}
```

### Rate Limiting

```java
@Component
public class RateLimiter {
    public boolean checkLimit(String apiKey, String endpoint) {
        RateLimit limit = limits.get(apiKey);
        return limit.allow();
    }
}
```

---

## Related Documentation

- [Provider Implementation Details](provider-implementation.md)
- [Cloud API Design](cloud-api.md)
- [Terraform Integration Guide](../../guide/terraform-integration.md)
- [Deployment Guide](deployment.md)

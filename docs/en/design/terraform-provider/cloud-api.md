# Cloud API Design

## Overview

JustDB Cloud API provides HTTP/REST endpoints for Schema management, enabling Terraform integration and cloud-native workflows.

## Base URL

```
https://api.justdb.io/api/v1
```

## Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer <your-api-token>
```

## Endpoints

### Apply Schema

```http
POST /api/v1/schemas/apply
Content-Type: application/json

{
  "schema_url": "s3://bucket/schema.yaml",
  "database_url": "jdbc:mysql://...",
  "dialect": "mysql",
  "dry_run": false
}
```

**Response**:

```json
{
  "success": true,
  "schema_version": "v1.2.3",
  "changes": [
    {
      "type": "create_table",
      "table": "users"
    }
  ],
  "sql": "CREATE TABLE users (...)"
}
```

### Calculate Diff

```http
POST /api/v1/schemas/diff
Content-Type: application/json

{
  "target_schema": "s3://bucket/schema.yaml",
  "database_url": "jdbc:mysql://..."
}
```

**Response**:

```json
{
  "added": [...],
  "removed": [...],
  "modified": [...],
  "sql": "ALTER TABLE..."
}
```

### Validate Schema

```http
POST /api/v1/schemas/validate
Content-Type: application/json

{
  "schema": "<schema-content>"
}
```

### Generate SQL

```http
POST /api/v1/schemas/generate-sql
Content-Type: application/json

{
  "schema_url": "s3://bucket/schema.yaml",
  "dialect": "postgresql",
  "idempotent": true
}
```

**Response**:

```json
{
  "sql": [
    "CREATE TABLE users (...)",
    "CREATE INDEX idx_users_email ON users(email)"
  ],
  "checksum": "a1b2c3d4..."
}
```

## Error Handling

All errors return consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid Schema format",
    "details": {...}
  }
}
```

## Rate Limits

- Free tier: 100 requests/hour
- Pro tier: 10,000 requests/hour
- Enterprise: Custom limits

## Related Documentation

- [Terraform Provider README](./README.md) - Provider design overview
- [Deployment Guide](./deployment.md) - Deployment instructions

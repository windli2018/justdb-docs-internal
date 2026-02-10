# Terraform Provider Implementation

## Resource: justdb_schema

Applies a database Schema from a JustDB definition file.

### Example Usage

```hcl
resource "justdb_schema" "app" {
  schema_file   = "s3://my-schemas/schema.yaml"
  database_url  = "jdbc:mysql://${aws_db_instance.main.endpoint}"
  username      = var.db_username
  password      = var.db_password
  dialect       = "mysql"
  idempotent    = true
}
```

### Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `schema_file` | string | Yes | Path to Schema file (s3://, https://, file://) |
| `database_url` | string | Yes | JDBC connection string |
| `username` | string | Yes | Database username |
| `password` | string | Yes | Database password |
| `dialect` | string | Yes | Database dialect (mysql, postgresql, oracle, etc.) |
| `idempotent` | bool | No | Use IF NOT EXISTS (default: true) |
| `dry_run` | bool | No | Preview changes without applying (default: false) |

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `version` | string | Applied Schema version |
| `changes` | list(string) | List of changes applied |
| `sql` | string | Generated SQL script |

## Resource: justdb_database

Pre-registers a database connection for secure credential management.

### Example Usage

```hcl
resource "justdb_database" "main" {
  name          = "myapp-prod-db"
  engine        = "mysql"
  host          = aws_db_instance.main.endpoint
  port          = 3306
  credentials {
    mode     = "aws_secrets_manager"
    secret_arn = aws_secretsmanager_secret.db_credentials.arn
  }
}
```

### Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Database identifier name |
| `engine` | string | Yes | Database engine |
| `host` | string | Yes | Database host |
| `port` | number | Yes | Database port |
| `credentials` | block | Yes | Credential configuration |

## Data Source: justdb_schema_validation

Validates a Schema without applying it.

### Example Usage

```hcl
data "justdb_schema_validation" "check" {
  schema_file = "./schema.yaml"
  dialect     = "mysql"
}

output "is_valid" {
  value = data.justdb_schema_validation.check.valid
}

output "errors" {
  value = data.justdb_schema_validation.check.errors
}
```

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `valid` | bool | Whether Schema is valid |
| `errors` | list(string) | List of validation errors |
| `warnings` | list(string) | List of validation warnings |

## Authentication

### API Key Authentication

```hcl
provider "justdb" {
  api_token = var.justdb_api_token
  api_url   = "https://api.justdb.io"
}
```

### Environment Variables

```bash
export JUSTDB_API_TOKEN="your-api-token"
export JUSTDB_API_URL="https://api.justdb.io"
```

## Import

Existing Schemas can be imported:

```bash
terraform import justdb_schema.app s3://my-schemas/schema.yaml
```

## Related Documentation

- [Cloud API Design](./cloud-api.md) - API endpoint details
- [Terraform Integration Guide](../../guide/terraform-integration.md) - User guide

---
icon: cloud
date: 2024-01-01
title: Terraform Integration
order: 8
category:
  - Guide
  - Integration
tag:
  - terraform
  - iac
  - devops
---

# Terraform Integration Guide

This document describes how to integrate JustDB with Terraform for Infrastructure as Code (IaC) database Schema management.

## Overview

### Why Terraform Integration?

Terraform is HashiCorp's Infrastructure as Code tool, widely used for managing cloud resources. Integrating JustDB with Terraform enables:

- ✅ **Unified Management**: Manage database Schema alongside cloud resources
- ✅ **Atomic Deployment**: Deploy all infrastructure at once
- ✅ **Version Control**: Schema changes managed in Git
- ✅ **Automation**: CI/CD pipeline automation

### Integration Solution Comparison

| Solution | Complexity | Type Safe | Ops Cost | Recommended For |
|:---|:---:|:---:|:---:|:---|
| **external Provider** | Low | ❌ | Low | Quick validation, simple projects |
| **local-exec Provisioner** | Low | ❌ | Low | Simplest, existing teams |
| **Terraform CDK** | Medium | ✅ | Low | Java/Python teams |
| **Custom Provider** | High | ✅ | Low | Long-term use, enterprise |
| **JustDB Cloud** | High | ✅ | High | Multi-team, need audit |

---

## Solution 1: local-exec Provisioner (Simplest)

### Use Cases

- Already using Terraform to manage cloud resources
- Need to integrate JustDB quickly
- Team familiar with basic Terraform

### Implementation

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# 1. Create RDS database instance
resource "aws_db_instance" "main" {
  identifier     = "myapp-db"
  engine         = "mysql"
  engine_version  = "8.0"
  instance_class  = "db.t3.micro"

  username = "admin"
  password = var.db_password

  allocated_storage     = 20
  max_allocated_storage  = 1000

  # Public access configuration (demo only)
  publicly_accessible  = true

  # Skip final snapshot
  skip_final_snapshot  = true

  tags = {
    Name = "myapp-database"
  }
}

# 2. Apply JustDB Schema after database is ready
resource "null_resource" "apply_justdb_schema" {
  # Depends on database creation completion
  depends_on = [aws_db_instance.main]

  # Re-apply when schema file changes
  triggers = {
    schema_md5 = md5(file("${path.module}/schema.yaml"))
  }

  # Use local-exec to call JustDB CLI
  provisioner "local-exec" {
    # Build database connection URL
    command = "justdb migrate -u jdbc:mysql://${aws_db_instance.main.endpoint} -s ${path.module}/schema.yaml"

    # Environment variables
    environment = {
      JUSTDB_WAIT = "30"  # Wait for database ready (seconds)
    }
  }
}

# 3. Output database connection info
output "database_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

output "database_username" {
  value     = aws_db_instance.main.username
  sensitive = false
}
```

### variables.tf

```hcl
variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Database instance type"
  type        = string
  default     = "db.t3.micro"
}
```

### Usage

```bash
# 1. Initialize Terraform
terraform init

# 2. Preview changes
terraform plan

# 3. Apply configuration
terraform apply

# 4. Output database connection info
terraform output database_endpoint
```

---

## Solution 2: external Provider (Recommended)

### Use Cases

- Need dynamic JustDB status
- Need JustDB output in Terraform
- Want schema changes to trigger resource updates

### Implementation

```hcl
# main.tf
terraform {
  required_providers {
    external = {
      source  = "hashicorp/external"
      version = "2.3.0"
    }
  }
}

# Use external data source to query JustDB status
data "external" "justdb_plan" {
  program = [
    "${path.module}/scripts/justdb-wrapper.sh",
    var.database_url,
    var.schema_file,
    "plan"  # Command type
  ]
}

# Use external script to apply Schema
resource "null_resource" "apply_justdb_schema" {
  triggers = {
    # Trigger when schema file hash changes
    schema_hash = data.external.justdb_plan.result.schema_hash
  }

  provisioner "local-exec" {
    command = "${path.module}/scripts/justdb-wrapper.sh ${var.database_url} ${var.schema_file} apply"
  }
}

# Cloud resources
resource "aws_db_instance" "main" {
  identifier = "myapp-db"
  engine     = "mysql"
  # ... other configuration
}
```

### scripts/justdb-wrapper.sh

```bash
#!/bin/bash

DB_URL="$1"
SCHEMA_FILE="$2"
COMMAND="$3"  # plan, apply, validate, etc.

case "$COMMAND" in
  plan)
    # Generate execution plan
    justdb migrate -u "$DB_URL" -s "$SCHEMA_FILE" --dry-run --format json
    ;;
  apply)
    # Apply Schema
    justdb migrate -u "$DB_URL" -s "$SCHEMA_FILE"
    ;;
  validate)
    # Validate Schema
    justdb validate -s "$SCHEMA_FILE" --format json
    ;;
  *)
    echo '{"error": "Unknown command: '"$COMMAND"'}" >&2
    exit 1
    ;;
esac
```

---

## Solution 3: Terraform CDK (Java Recommended)

### Use Cases

- Java/Kotlin development teams
- Need type-safe configuration
- Want to define infrastructure in programming language

### Terraform CDK Introduction

**Terraform CDK** lets you define infrastructure using familiar programming languages:

| Language | Support | Best For |
|:---|:---:|:---|
| TypeScript | ✅ Best | Frontend/Node.js |
| Python | ✅ Official | Backend/Data Science |
| Java | ✅ Official | **Enterprise/Backend** |
| Go | ✅ Official | Cloud Native |
| C# | ✅ Official | .NET |

### Project Initialization

```bash
# Install CDKTF CLI
npm install -g cdktf-cli

# Create Java project
cdktf init --template=java
cd my-infra

# Install dependencies
./gradlew build
```

### CDK Code Example

**src/main/java/com/myapp/MyStack.java**:

```java
package com.myapp;

import com.hashicorp.cdktf.*;
import com.hashicorp.cdktf.providers.aws.*;
import constructs.Construct;

public class MyStack extends TerraformStack {

    public MyStack(Construct scope, String id) {
        super(scope, id);

        // AWS Provider
        AwsProvider aws = new AwsProvider(this, "aws",
            AwsProviderConfig.builder()
                .region("us-east-1")
                .build()
        );

        // RDS database
        RdsInstance database = RdsInstance.Builder
            .create(this, "database")
            .identifier("myapp-db")
            .engine("mysql")
            .engineVersion("8.0")
            .instanceClass("db.t3.micro")
            .allocatedStorage(20)
            .username("admin")
            .password("password123")
            .publiclyAccessible(true)
            .skipFinalSnapshot(true)
            .build();

        // Output database endpoint
        TerraformOutput endpoint = new TerraformOutput(this, "database_endpoint",
            TerraformOutputConfig.builder()
                .value(database.getEndpoint())
                .build()
        );

        // Apply JustDB Schema (using LocalExec)
        LocalExec applySchema = LocalExec.Builder
            .create(this, "apply-justdb-schema")
            .triggers(Map.of(
                "database_id", database.getId(),
                "schema_hash", exec("md5 schema.yaml")
            ))
            .command(String.format(
                "justdb migrate -u jdbc:mysql://%s -s schema.yaml",
                database.getEndpoint()
            ))
            .workingDirectory("../")
            .build();
    }

    private static String exec(String cmd) {
        try {
            Process p = Runtime.getRuntime().exec(cmd);
            BufferedReader r = new BufferedReader(
                new InputStreamReader(p.getInputStream())
            );
            return r.readLine();
        } catch (Exception e) {
            return "";
        }
    }
}
```

**Main.java**:

```java
package com.myapp;

import software.constructs.Construct;

public class Main {
    public static void main(String[] args) {
        var app = new App();
        var stack = new MyStack(app, "justdb-demo");
        app.synth(); // Synthesize Terraform config
    }
}
```

### Deployment Flow

```bash
# 1. Compile
./gradlew build

# 2. Synthesize Terraform config
cdktf synth

# 3. View generated config
cat cdktf.out/cdktf.tf.json

# 4. Preview changes
cdktf plan

# 5. Deploy
cdktf deploy

# Or use Terraform CLI
terraform plan
terraform apply
```

### Generated Terraform Configuration

**cdktf.out/cdktf.tf.json**:

```json
{
  "provider": {
    "aws": [{}, {"region": "us-east-1"}],
    "null": [{}, {}],
    "local": [{}, {}]
  },
  "resource": {
    "aws_db_instance": {
      "database": {
        "identifier": "myapp-db",
        "engine": "mysql",
        # ... complete configuration
      }
    },
    "local_exec": {
      "apply-justdb-schema": {
        "command": "justdb migrate -u jdbc:mysql://...",
        "working_dir": "../"
      }
    }
  }
}
```

---

## Solution 4: Custom Terraform Provider (Advanced)

### Use Cases

- Enterprise long-term use
- Need complete resource lifecycle management
- Need state tracking and dependency management

### Provider Structure

```
provider-justdb/
├── main.go              # Provider entry
├── provider.go          # Provider config
├── resources/           # Resource definitions
│   ├── justdb_schema.go
│   └── justdb_migration.go
├── client.go            # JustDB API client
├── scripts/             # Helper scripts
└── examples/            # Examples
    └── simple/
        └── main.tf
```

### Provider Implementation

**main.go**:

```go
package main

import (
    "github.com/hashicorp/terraform-plugin-framework/providerserver"
)

func main() {
    providerserver.Serve{
        Address: "registry.opentofu.org/justdb/justdb",
    }
}
```

**provider.go**:

```go
package provider

import (
    "context"

    "github.com/hashicorp/terraform-plugin-framework/datasource"
    "github.com/hashicorp/terraform-plugin-framework/provider"
    "github.com/hashicorp/terraform-plugin-framework/providerserver"
    "github.com/hashicorp/terraform-plugin-framework/resource"
)

func New() provider.Provider {
    return provider.New(version("1.0.0"), func(p *provider.Schema) {
        p.AddDataSource("justdb_schema", dataSourceJustDbSchema())
        p.AddResource("justdb_schema", resourceJustDbSchema())
    })
}
```

**resources/justdb_schema.go**:

```go
package resources

import (
    "context"
    "fmt"

    "github.com/hashicorp/terraform-plugin-framework/resource"
    "github.com/hashicorp/terraform-plugin-framework/resource/schema"
    "github.com/hashicorp/terraform-plugin-framework/types"
)

func resourceJustDbSchema() resource.Resource {
    return &resourceJustDbSchemaResource{
        BaseResource: resource.BaseResource{
            Schema: resourceJustDbSchemaSchema(),
        },
    }
}

type resourceJustDbSchemaResource struct {
    resource.BaseResource
}

func (r *resourceJustDbSchemaResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
    var plan resourceJustDbSchemaModel
    resp.State = &plan

    // Get parameters
    schemaFile := req.Plan.GetAttribute("schema_file").(string)
    databaseUrl := req.Plan.GetAttribute("database_url").(string)

    // Call JustDB CLI
    cmd := fmt.Sprintf("justdb migrate -u %s -s %s", databaseUrl, schemaFile)
    if err := r.executeCommand(ctx, cmd); err != nil {
        resp.Diagnostics.AddError(err.Error())
        return
    }
}

type resourceJustDbSchemaModel struct {
    SchemaFile   types.String `tfsdk:"schema_file"`
    DatabaseUrl  types.String `tfsdk:"database_url"`
    LastApplied  types.String `tfsdk:"last_applied"`
}

func resourceJustDbSchemaSchema() schema.Schema {
    return schema.Schema{
        Attributes: map[string]schema.Attribute{
            "schema_file": {
                Type:     types.StringType,
                Required: true,
            },
            "database_url": {
                Type:     types.StringType,
                Required: true,
                Sensitive: true,
            },
            "last_applied": {
                Type:     types.StringType,
                Computed: true,
            },
        },
    }
}
```

### Using Custom Provider

```hcl
# main.tf
terraform {
  required_providers {
    justdb = {
      source  = "registry.opentofu.org/justdb/justdb"
      version = "1.0.0"
    }
  }
}

provider "justdb" {
  # Configuration options
}

resource "justdb_schema" "app" {
  schema_file   = "s3://my-schemas/schema.yaml"
  database_url  = "jdbc:mysql://${aws_db_instance.main.endpoint}"

  depends_on = [aws_db_instance.main]
}
```

---

## Complete Example: Multi-Stage Deployment

### Scenario

Deploy complete application architecture using Terraform, including:
1. VPC network
2. RDS database
3. ECS cluster
4. JustDB Schema

### Complete Configuration

**main.tf**:

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# ===== Network Layer =====

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "myapp-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"

  map_public_ip_on_launch = true

  tags = {
    Name = "myapp-public-subnet"
  }
}

# ===== Database Layer =====

resource "aws_db_instance" "main" {
  identifier     = "myapp-db"
  engine         = "mysql"
  engine_version  = "8.0"
  instance_class  = "db.t3.micro"

  allocated_storage     = 20
  storage_type           = "gp2"

  username = "admin"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name

  publicly_accessible  = true
  skip_final_snapshot  = true

  vpc_security_group_ids = [aws_security_group.db.id]

  tags = {
    Name = "myapp-database"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "myapp-db-subnet-group"
  subnet_ids = [aws_subnet.public.id]

  tags = {
    Name = "myapp-db-subnet-group"
  }
}

resource "aws_security_group" "db" {
  name        = "myapp-db-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "myapp-db-sg"
  }
}

# ===== Application Layer =====

resource "aws_ecs_cluster" "main" {
  name = "myapp-cluster"

  setting {
    name  = "name"
    value = "myapp-cluster"
  }
}

# ===== JustDB Schema =====

# Wait for database to be ready before applying Schema
resource "null_resource" "wait_for_db" {
  depends_on = [aws_db_instance.main]

  provisioner "local-exec" {
    command = "timeout 60 bash -c 'until mysqladmin ping -h ${aws_db_instance.main.endpoint} -u admin -p${var.db_password} 2>/dev/null; do sleep 5; done'"
  }
}

resource "null_resource" "apply_justdb_schema" {
  depends_on = [null_resource.wait_for_db]

  triggers = {
    schema_md5 = md5(file("${path.module}/schema.yaml"))
  }

  provisioner "local-exec" {
    command = "justdb migrate -u jdbc:mysql://${aws_db_instance.main.endpoint} -u admin -p${var.db_password} -s ${path.module}/schema.yaml"
  }
}

# ===== Outputs =====

output "vpc_id" {
  value = aws_vpc.main.id
}

output "database_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

output "database_username" {
  value     = aws_db_instance.main.username
  sensitive = false
}
```

### Usage

```bash
# 1. Initialize
terraform init

# 2. View plan
terraform plan

# 3. Apply configuration
terraform apply

# 4. View outputs
terraform output database_endpoint
```

---

## Best Practices

### 1. Schema Management

```yaml
# schema.yaml - Store in S3 or Git repo
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
```

### 2. Sensitive Information Management

```hcl
# variables.tf
variable "db_password" {
  type        = string
  sensitive   = true
}

# terraform.tfvars (don't commit to Git)
db_password = "SecurePassword123!"
```

### 3. State Management

```bash
# Remote state storage
terraform {
  backend "s3" {
    bucket = "myapp-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 4. Dependency Management

```hcl
# Ensure correct execution order
resource "aws_db_instance" "main" { }

# Wait for database to be ready
resource "null_resource" "wait_for_db" {
  depends_on = [aws_db_instance.main]
}

# Apply Schema
resource "null_resource" "apply_schema" {
  depends_on = [null_resource.wait_for_db]
}
```

---

## Troubleshooting

### Common Issues

**Q: Terraform cannot find JustDB CLI**

```bash
# Ensure JustDB is in PATH
which justdb

# Or use absolute path
provisioner "local-exec" {
  command = "/usr/local/bin/justdb migrate -u ..."
}
```

**Q: Database not ready causing Schema application failure**

```hcl
# Add wait logic
resource "null_resource" "wait_for_db" {
  provisioner "local-exec" {
    command = "timeout 60 bash -c 'while ! mysqladmin ping -h $DB_HOST; do sleep 5; done'"
  }
}
```

**Q: Schema file path issues**

```hcl
# Use path.module for relative path
provisioner "local-exec" {
  command = "justdb migrate -s ${path.module}/schema.yaml"
}
```

---

## Next Steps

<VPCard
  title="Design: Terraform Provider Design"
  desc="Learn how to develop custom Terraform Provider for JustDB"
  link="/design/terraform-provider/"
/>

<VPCard
  title="CI/CD Integration Guide"
  desc="Learn how to use Terraform and JustDB in CI/CD pipelines"
  link="/getting-started/cicd.html"
/>

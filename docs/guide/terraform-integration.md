---
icon: cloud
title: Terraform 集成
order: 8
category:
  - 指南
  - 集成
tag:
  - Terraform
  - IaC
  - DevOps
---

# Terraform 集成指南

本文档介绍如何将 JustDB 与 Terraform 集成，实现基础设施即代码（IaC）的数据库 Schema 管理。

## 概述

### 为什么需要 Terraform 集成？

Terraform 是 HashiCorp 的基础设施即代码工具，广泛用于管理云资源。将 JustDB 与 Terraform 集成可以实现：

- ✅ **统一管理**：数据库 Schema 与云资源一起管理
- ✅ **原子部署**：一次性部署全部基础设施
- ✅ **版本控制**：Schema 变更纳入 Git 管理
- ✅ **自动化**：CI/CD 流水线自动化

### 集成方案对比

| 方案 | 复杂度 | 类型安全 | 运维成本 | 推荐场景 |
|:---|:---:|:---:|:---:|:---|
| **external Provider** | 低 | ❌ | 低 | 快速验证、简单项目 |
| **local-exec Provisioner** | 低 | ❌ | 低 | 最简单、现有团队 |
| **Terraform CDK** | 中 | ✅ | 低 | Java/Python 团队 |
| **自定义 Provider** | 高 | ✅ | 低 | 长期使用、企业级 |
| **JustDB Cloud** | 高 | ✅ | 高 | 多团队、需要审计 |

---

## 方案 1：local-exec Provisioner（最简单）

### 适用场景

- 已使用 Terraform 管理云资源
- 需要快速集成 JustDB
- 团队熟悉 Terraform 基础功能

### 实现方式

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

# 1. 创建 RDS 数据库实例
resource "aws_db_instance" "main" {
  identifier     = "myapp-db"
  engine         = "mysql"
  engine_version  = "8.0"
  instance_class  = "db.t3.micro"

  username = "admin"
  password = var.db_password

  allocated_storage     = 20
  max_allocated_storage  = 1000

  # 公开访问配置（仅用于演示）
  publicly_accessible  = true

  # 跳过最终快照
  skip_final_snapshot  = true

  tags = {
    Name = "myapp-database"
  }
}

# 2. 等待数据库就绪后应用 JustDB Schema
resource "null_resource" "apply_justdb_schema" {
  # 依赖数据库创建完成
  depends_on = [aws_db_instance.main]

  # Schema 文件变化时重新应用
  triggers = {
    schema_md5 = md5(file("${path.module}/schema.yaml"))
  }

  # 使用 local-exec 调用 JustDB CLI
  provisioner "local-exec" {
    # 构建数据库连接 URL
    command = "justdb migrate -u jdbc:mysql://${aws_db_instance.main.endpoint} -s ${path.module}/schema.yaml"

    # 环境变量
    environment = {
      JUSTDB_WAIT = "30"  # 等待数据库就绪（秒）
    }
  }
}

# 3. 输出数据库连接信息
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
  description = "数据库管理员密码"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "数据库实例类型"
  type        = string
  default     = "db.t3.micro"
}
```

### 使用流程

```bash
# 1. 初始化 Terraform
terraform init

# 2. 预览变更
terraform plan

# 3. 应用配置
terraform apply

# 4. 输出数据库连接信息
terraform output database_endpoint
```

---

## 方案 2：external Provider（推荐）

### 适用场景

- 需要动态获取 JustDB 状态
- 需要在 Terraform 中使用 JustDB 输出
- 希望 Schema 变更能触发资源更新

### 实现方式

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

# 使用 external data source 查询 JustDB 状态
data "external" "justdb_plan" {
  program = [
    "${path.module}/scripts/justdb-wrapper.sh",
    var.database_url,
    var.schema_file,
    "plan"  # 命令类型
  ]
}

# 使用外部脚本应用 Schema
resource "null_resource" "apply_justdb_schema" {
  triggers = {
    # Schema 文件哈希变化时触发
    schema_hash = data.external.justdb_plan.result.schema_hash
  }

  provisioner "local-exec" {
    command = "${path.module}/scripts/justdb-wrapper.sh ${var.database_url} ${var.schema_file} apply"
  }
}

# 云资源
resource "aws_db_instance" "main" {
  identifier = "myapp-db"
  engine     = "mysql"
  # ... 其他配置
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
    # 生成执行计划
    justdb migrate -u "$DB_URL" -s "$SCHEMA_FILE" --dry-run --format json
    ;;
  apply)
    # 应用 Schema
    justdb migrate -u "$DB_URL" -s "$SCHEMA_FILE"
    ;;
  validate)
    # 验证 Schema
    justdb validate -s "$SCHEMA_FILE" --format json
    ;;
  *)
    echo '{"error": "Unknown command: '"$COMMAND"'}" >&2
    exit 1
    ;;
esac
```

---

## 方案 3：Terraform CDK（Java 推荐）

### 适用场景

- Java/Kotlin 开发团队
- 需要类型安全的配置
- 希望用编程语言定义基础设施

### Terraform CDK 简介

**Terraform CDK** 让你使用熟悉的编程语言定义基础设施：

| 语言 | 支持程度 | 适用团队 |
|:---|:---:|:---|
| TypeScript | ✅ 最佳支持 | 前端/Node.js |
| Python | ✅ 官方支持 | 后端/数据科学 |
| Java | ✅ 官方支持 | **企业级/后端** |
| Go | ✅ 官方支持 | 云原生 |
| C# | ✅ 官方支持 | .NET |

### 项目初始化

```bash
# 安装 CDKTF CLI
npm install -g cdktf-cli

# 创建 Java 项目
cdktf init --template=java
cd my-infra

# 安装依赖
./gradlew build
```

### CDK 代码示例

**src/main/java/com/myapp/MyStack.java**：

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

        // RDS 数据库
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

        // 输出数据库端点
        TerraformOutput endpoint = new TerraformOutput(this, "database_endpoint",
            TerraformOutputConfig.builder()
                .value(database.getEndpoint())
                .build()
        );

        // 应用 JustDB Schema（使用 LocalExec）
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

**Main.java**：

```java
package com.myapp;

import software.constructs.Construct;

public class Main {
    public static void main(String[] args) {
        var app = new App();
        var stack = new MyStack(app, "justdb-demo");
        app.synth(); // 合成 Terraform 配置
    }
}
```

### 部署流程

```bash
# 1. 编译
./gradlew build

# 2. 合成 Terraform 配置
cdktf synth

# 3. 查看生成的配置
cat cdktf.out/cdktf.tf.json

# 4. 预览变更
cdktf plan

# 5. 部署
cdktf deploy

# 或使用 Terraform CLI
terraform plan
terraform apply
```

### 生成的 Terraform 配置

**cdktf.out/cdktf.tf.json**：

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
        # ... 完整配置
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

## 方案 4：自定义 Terraform Provider（高级）

### 适用场景

- 企业级长期使用
- 需要完整的资源生命周期管理
- 需要状态跟踪和依赖管理

### Provider 结构

```
provider-justdb/
├── main.go              # Provider 入口
├── provider.go          # Provider 配置
├── resources/           # 资源定义
│   ├── justdb_schema.go
│   └── justdb_migration.go
├── client.go            # JustDB API 客户端
├── scripts/             # 辅助脚本
└── examples/            # 示例
    └── simple/
        └── main.tf
```

### Provider 实现

**main.go**：

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

**provider.go**：

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

**resources/justdb_schema.go**：

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

    // 获取参数
    schemaFile := req.Plan.GetAttribute("schema_file").(string)
    databaseUrl := req.Plan.GetAttribute("database_url").(string)

    // 调用 JustDB CLI
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

### 使用自定义 Provider

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
  # 配置选项
}

resource "justdb_schema" "app" {
  schema_file   = "s3://my-schemas/schema.yaml"
  database_url  = "jdbc:mysql://${aws_db_instance.main.endpoint}"

  depends_on = [aws_db_instance.main]
}
```

---

## 完整示例：多阶段部署

### 场景

使用 Terraform 部署完整的应用架构，包括：
1. VPC 网络
2. RDS 数据库
3. ECS 集群
4. JustDB Schema

### 完整配置

**main.tf**：

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

# ===== 网络层 =====

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

# ===== 数据库层 =====

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

# ===== 应用层 =====

resource "aws_ecs_cluster" "main" {
  name = "myapp-cluster"

  setting {
    name  = "name"
    value = "myapp-cluster"
  }
}

# ===== JustDB Schema =====

# 等待数据库就绪后应用 Schema
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

# ===== 输出 =====

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

### 使用流程

```bash
# 1. 初始化
terraform init

# 2. 查看计划
terraform plan

# 3. 应用配置
terraform apply

# 4. 查看输出
terraform output database_endpoint
```

---

## 最佳实践

### 1. Schema 管理

```yaml
# schema.yaml - 存放在 S3 或 Git 仓库
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

### 2. 敏感信息管理

```hcl
# variables.tf
variable "db_password" {
  type        = string
  sensitive   = true
}

# terraform.tfvars（不提交到 Git）
db_password = "SecurePassword123!"
```

### 3. 状态管理

```bash
# 远程状态存储
terraform {
  backend "s3" {
    bucket = "myapp-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 4. 依赖管理

```hcl
# 确保正确的执行顺序
resource "aws_db_instance" "main" { }

# 等待数据库就绪
resource "null_resource" "wait_for_db" {
  depends_on = [aws_db_instance.main]
}

# 应用 Schema
resource "null_resource" "apply_schema" {
  depends_on = [null_resource.wait_for_db]
}
```

---

## 故障排查

### 常见问题

**Q: Terraform 无法找到 JustDB CLI**

```bash
# 确保 JustDB 在 PATH 中
which justdb

# 或使用绝对路径
provisioner "local-exec" {
  command = "/usr/local/bin/justdb migrate -u ..."
}
```

**Q: 数据库未就绪导致 Schema 应用失败**

```hcl
# 添加等待逻辑
resource "null_resource" "wait_for_db" {
  provisioner "local-exec" {
    command = "timeout 60 bash -c 'while ! mysqladmin ping -h $DB_HOST; do sleep 5; done'"
  }
}
```

**Q: Schema 文件路径问题**

```hcl
# 使用 path.module 获取相对路径
provisioner "local-exec" {
  command = "justdb migrate -s ${path.module}/schema.yaml"
}
```

---

## 下一步

<VPCard
  title="设计文档：Terraform Provider 设计"
  desc="了解如何为 JustDB 开发自定义 Terraform Provider"
  link="/design/terraform-provider/"
/>

<VPCard
  title="CI/CD 集成指南"
  desc="学习如何在 CI/CD 流水线中使用 Terraform 和 JustDB"
  link="/getting-started/cicd.html"
/>

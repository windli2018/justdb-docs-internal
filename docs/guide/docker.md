---
icon: container
date: 2024-01-01
title: Docker 支持
order: 13
category:
  - 指南
  - Docker
tag:
  - Docker
  - 容器
  - 部署
---

# Docker 支持

学习如何使用 Docker 容器化 JustDB，简化部署和环境配置。

## Docker 镜像

### 官方镜像

JustDB 提供了预构建的 Docker 镜像：

```bash
# 拉取最新版本
docker pull verydb/justdb:latest

# 拉取指定版本
docker pull verydb/justdb:1.0.0

# 拉取 Alpine 版本（更小的镜像）
docker pull verydb/justdb:1.0.0-alpine
```

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/verydb/justdb.git
cd justdb

# 构建镜像
docker build -t my-justdb:latest .

# 构建 Alpine 版本
docker build -f Dockerfile.alpine -t my-justdb:alpine .
```

### Dockerfile 示例

```dockerfile
# Dockerfile
FROM maven:3.8-openjdk-11 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

# 运行时镜像
FROM openjdk:11-jre-slim

WORKDIR /app
COPY --from=builder /app/target/justdb-cli.jar app.jar

# 安装 JustDB
RUN apt-get update && \
    apt-get install -y justdb && \
    apt-get clean

ENTRYPOINT ["java", "-jar", "app.jar"]
CMD ["migrate"]
```

## Docker Compose

### 基本配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: justdb-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: myapp
      MYSQL_USER: justdb
      MYSQL_PASSWORD: justdbpass
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - justdb-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # JustDB CLI
  justdb:
    image: verydb/justdb:1.0.0
    container_name: justdb-cli
    volumes:
      - ./schemas:/schemas
      - ./config:/config
    environment:
      JUSTDB_DATABASE_URL: jdbc:mysql://mysql:3306/myapp
      JUSTDB_DATABASE_USERNAME: justdb
      JUSTDB_DATABASE_PASSWORD: justdbpass
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - justdb-network
    command: migrate

volumes:
  mysql-data:

networks:
  justdb-network:
    driver: bridge
```

### 完整配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 开发环境
  mysql-dev:
    image: mysql:8.0
    container_name: justdb-mysql-dev
    environment:
      MYSQL_ROOT_PASSWORD: dev_root
      MYSQL_DATABASE: myapp_dev
    ports:
      - "3307:3306"
    volumes:
      - mysql-dev-data:/var/lib/mysql
      - ./init/dev:/docker-entrypoint-initdb.d
    networks:
      - dev-network

  # 测试环境
  mysql-test:
    image: mysql:8.0
    container_name: justdb-mysql-test
    environment:
      MYSQL_ROOT_PASSWORD: test_root
      MYSQL_DATABASE: myapp_test
    ports:
      - "3308:3306"
    volumes:
      - mysql-test-data:/var/lib/mysql
    networks:
      - test-network

  # JustDB 迁移服务
  justdb-migrate:
    image: verydb/justdb:1.0.0
    container_name: justdb-migrate
    volumes:
      - ./schemas:/schemas:ro
      - ./logs:/logs
    environment:
      JUSTDB_DATABASE_URL: jdbc:mysql://mysql-dev:3306/myapp_dev
      JUSTDB_DATABASE_USERNAME: root
      JUSTDB_DATABASE_PASSWORD: dev_root
      JUSTDB_MIGRATION_AUTO_DIFF: "true"
      JUSTDB_MIGRATION_SAFE_DROP: "false"
    depends_on:
      - mysql-dev
    networks:
      - dev-network
    profiles:
      - migrate

  # JustDB 验证服务
  justdb-validate:
    image: verydb/justdb:1.0.0
    container_name: justdb-validate
    volumes:
      - ./schemas:/schemas:ro
    command: validate
    networks:
      - dev-network
    profiles:
      - validate

volumes:
  mysql-dev-data:
  mysql-test-data:

networks:
  dev-network:
    driver: bridge
  test-network:
    driver: bridge
```

## 使用示例

### 基本使用

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f justdb

# 执行迁移
docker-compose run --rm justdb migrate

# 验证 Schema
docker-compose run --rm justdb validate

# 停止服务
docker-compose down
```

### 多环境部署

```bash
# 开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 测试环境
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# 生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 环境配置

**docker-compose.dev.yml**：
```yaml
version: '3.8'

services:
  justdb:
    environment:
      JUSTDB_MIGRATION_DRY_RUN: "false"
      JUSTDB_MIGRATION_SAFE_DROP: "false"
    volumes:
      - ./schemas/dev:/schemas
```

**docker-compose.prod.yml**：
```yaml
version: '3.8'

services:
  justdb:
    environment:
      JUSTDB_MIGRATION_DRY_RUN: "false"
      JUSTDB_MIGRATION_SAFE_DROP: "true"
      JUSTDB_MIGRATION_BASELINE_ON_MIGRATE: "true"
    volumes:
      - ./schemas/prod:/schemas
      - ./backups:/backups
    command:
      - /bin/sh
      - -c
      - |
        justdb backup -o /backups/pre-migration.sql
        justdb migrate
        justdb verify
```

## Kubernetes 部署

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: justdb-config
data:
  database-url: jdbc:mysql://mysql-service:3306/myapp
  schema-locations: classpath:justdb
  migration-auto-diff: "true"
  migration-safe-drop: "false"
```

### Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: justdb-secret
type: Opaque
data:
  database-username: justViA=
  database-password: cGFzc3dvcmQxMjM=
```

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: justdb-migrate
spec:
  replicas: 1
  selector:
    matchLabels:
      app: justdb-migrate
  template:
    metadata:
      labels:
        app: justdb-migrate
    spec:
      containers:
      - name: justdb
        image: verydb/justdb:1.0.0
        command: ["justdb", "migrate"]
        env:
        - name: JUSTDB_DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: justdb-config
              key: database-url
        - name: JUSTDB_DATABASE_USERNAME
          valueFrom:
            secretKeyRef:
              name: justdb-secret
              key: database-username
        - name: JUSTDB_DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: justdb-secret
              key: database-password
        volumeMounts:
        - name: schemas
          mountPath: /schemas
          readOnly: true
      volumes:
      - name: schemas
        configMap:
          name: justdb-schemas
```

### Job

```yaml
# k8s/job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: justdb-migrate-$(date +%s)
spec:
  template:
    spec:
      containers:
      - name: justdb
        image: verydb/justdb:1.0.0
        command:
        - /bin/sh
        - -c
        - |
          justdb validate
          justdb migrate --dry-run
          justdb backup -o /backup/pre-migration.sql
          justdb migrate
          justdb verify
        env:
        - name: JUSTDB_DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: justdb-config
              key: database-url
        volumeMounts:
        - name: backup
          mountPath: /backup
      volumes:
      - name: backup
        persistentVolumeClaim:
          claimName: backup-pvc
      restartPolicy: Never
```

### CronJob

```yaml
# k8s/cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: justdb-backup
spec:
  schedule: "0 2 * * *"  # 每天凌晨 2 点
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: justdb
            image: verydb/justdb:1.0.0
            command:
            - justdb
            - backup
            - -o
            - /backup/backup-$(date +%Y%m%d_%H%M%S).sql
            env:
            - name: JUSTDB_DATABASE_URL
              valueFrom:
                configMapKeyRef:
                  name: justdb-config
                  key: database-url
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

## 最佳实践

### 1. 使用多阶段构建

```dockerfile
# 构建阶段
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# 运行阶段
FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2. 最小化镜像大小

```dockerfile
# 使用 Alpine 基础镜像
FROM openjdk:11-jre-alpine
WORKDIR /app
COPY app.jar .
RUN apk add --no-cache curl
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3. 健康检查

```yaml
healthcheck:
  test: ["CMD", "justdb", "health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 4. 日志管理

```yaml
services:
  justdb:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5. 资源限制

```yaml
services:
  justdb:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 故障排查

### 常见问题

**1. 容器启动失败**

```bash
# 查看日志
docker-compose logs justdb

# 检查配置
docker-compose config

# 重新构建
docker-compose build --no-cache
```

**2. 数据库连接失败**

```bash
# 检查网络
docker network inspect justdb-network

# 检查服务
docker-compose ps

# 测试连接
docker-compose exec justdb nc -zv mysql 3306
```

**3. Schema 文件未找到**

```bash
# 检查挂载
docker-compose exec justdb ls -la /schemas

# 检查权限
docker-compose exec justdb ls -l /schemas/*.yaml
```

## 下一步

<VPCard
  title="性能优化"
  desc="优化 Docker 容器性能"
  link="/guide/performance.html"
/>

<VPCard
  title="CI/CD 集成"
  desc="在 CI/CD 中使用 Docker"
  link="/guide/cicd.html"
/>

<VPCard
  title="配置参考"
  desc="完整的 Docker 配置选项"
  link="/guide/config-reference.html"
/>

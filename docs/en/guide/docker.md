---
icon: container
date: 2024-01-01
title: Docker Support
order: 13
category:
  - Guide
  - Docker
tag:
  - Docker
  - container
  - deployment
---

# Docker Support

Learn how to containerize JustDB with Docker to simplify deployment and environment configuration.

## Docker Images

### Official Images

JustDB provides pre-built Docker images:

```bash
# Pull latest version
docker pull justdb/justdb:latest

# Pull specific version
docker pull justdb/justdb:1.0.0

# Pull Alpine version (smaller image)
docker pull justdb/justdb:1.0.0-alpine
```

### Build from Source

```bash
# Clone repository
git clone https://github.com/justdb/justdb.git
cd justdb

# Build image
docker build -t my-justdb:latest .

# Build Alpine version
docker build -f Dockerfile.alpine -t my-justdb:alpine .
```

### Dockerfile Example

```dockerfile
# Dockerfile
FROM maven:3.8-openjdk-11 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

# Runtime image
FROM openjdk:11-jre-slim

WORKDIR /app
COPY --from=builder /app/target/justdb-cli.jar app.jar

# Install JustDB
RUN apt-get update && \
    apt-get install -y justdb && \
    apt-get clean

ENTRYPOINT ["java", "-jar", "app.jar"]
CMD ["migrate"]
```

## Docker Compose

### Basic Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MySQL database
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
    image: justdb/justdb:1.0.0
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

### Complete Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Development environment
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

  # Test environment
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

  # JustDB migration service
  justdb-migrate:
    image: justdb/justdb:1.0.0
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

  # JustDB validation service
  justdb-validate:
    image: justdb/justdb:1.0.0
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

## Usage Examples

### Basic Usage

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f justdb

# Execute migration
docker-compose run --rm justdb migrate

# Validate schema
docker-compose run --rm justdb validate

# Stop services
docker-compose down
```

### Multi-Environment Deployment

```bash
# Development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Test environment
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Configuration

**docker-compose.dev.yml**:
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

**docker-compose.prod.yml**:
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

## Kubernetes Deployment

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
        image: justdb/justdb:1.0.0
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
        image: justdb/justdb:1.0.0
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
  schedule: "0 2 * * *"  # Daily 2 AM
  jobTemplate:
    spec:
      containers:
      - name: justdb
        image: justdb/justdb:1.0.0
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

## Best Practices

### 1. Use Multi-Stage Builds

```dockerfile
# Build stage
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# Runtime stage
FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2. Minimize Image Size

```dockerfile
# Use Alpine base image
FROM openjdk:11-jre-alpine
WORKDIR /app
COPY app.jar .
RUN apk add --no-cache curl
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3. Health Checks

```yaml
healthcheck:
  test: ["CMD", "justdb", "health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 4. Log Management

```yaml
services:
  justdb:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5. Resource Limits

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

## Troubleshooting

### Common Issues

**1. Container startup failure**

```bash
# View logs
docker-compose logs justdb

# Check configuration
docker-compose config

# Rebuild
docker-compose build --no-cache
```

**2. Database connection failure**

```bash
# Check network
docker network inspect justdb-network

# Check services
docker-compose ps

# Test connection
docker-compose exec justdb nc -zv mysql 3306
```

**3. Schema file not found**

```bash
# Check mount
docker-compose exec justdb ls -la /schemas

# Check permissions
docker-compose exec justdb ls -l /schemas/*.yaml
```

## Next Steps

<VPCard
  title="Performance"
  desc="Optimize Docker container performance"
  link="/en/guide/performance.html"
/>

<VPCard
  title="CI/CD Integration"
  desc="Using Docker in CI/CD"
  link="/en/guide/cicd.html"
/>

<VPCard
  title="Configuration Reference"
  desc="Complete Docker configuration options"
  link="/en/guide/config-reference.html"
/>

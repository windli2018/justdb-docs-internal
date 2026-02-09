---
title: 部署指南
order: 4
icon: rocket
parent: Terraform Provider 设计
category:
  - 设计文档
  - 部署
---

# JustDB Cloud 部署指南

本文档详细说明如何部署和运维 JustDB Cloud Service。

## 部署架构

### 生产环境架构

```
                        ┌─────────────┐
                        │   DNS       │
                        └──────┬──────┘
                               │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
         ┌─────────┐        ┌─────────┐        ┌─────────┐
         │  Ingress │        │  Service│        │  Ingress │
         │ Controller│        │  Mesh  │        │ Controller│
         └────┬─────┘        └────┬─────┘        └────┬─────┘
              │                  │                   │
              │              ┌───┴───┐            │
              │              │Redis │            │
              │              └───────┘            │
        ┌─────┴─────────────────────┴─────┐          │
        │        JustDB Cloud Pods (x3)          │          │
        │  ┌────────────────────────────────┐│          │
        │  │ Pod 1              Pod 2  Pod 3││          │
        │  │  └────────────────────────────────┘│          │
        └─────────────────────────────────────┘          │
              │                                     │
              │              ┌────────────────────┐│
              │              │  PostgreSQL         ││
              │              │  (State DB)          ││
              │              └────────────────────┘│
              │                                     │
              │              ┌────────────────────┐│
              │              │  S3 / MinIO          ││
              │              │  (Schema Storage)    ││
              │              └────────────────────┘│
              └────────────────────────────────────┘
```

---

## Kubernetes 部署

### 1. Namespace 和 ConfigMap

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: justdb-cloud
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: justdb-config
  namespace: justdb-cloud
data:
  application.yml: |
    server:
      port: 8080

    spring:
      application:
        name: JustDB Cloud

      datasource:
        url: jdbc:postgresql://justdb-postgres:5432/justdb
        username: justdb
        password: ${DB_PASSWORD}
        hikari:
          maximum-pool-size: 20
          minimum-idle: 5
          connection-timeout: 30000
          connection-test-query: SELECT 1

    justdb:
      api:
        jwt:
          secret: ${JWT_SECRET:your-secret-key-change-in-production}
          expiration: 86400
        api-key:
          default-expiry: 90
          min-length: 32

      execution:
        async:
          enabled: true
          thread-pool-size: 10
          queue-capacity: 100
```

### 2. Secret 管理

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: justdb-secrets
  namespace: justdb-cloud
type: Opaque
stringData:
  db-password: cG9zc3dvcmUxMTIzNDU2
  jwt-secret: cGVucmVydXItc2VyZXRrLXNoYW5nZS1oY2hhbmdlLWluLXByb2R1Y3Rpb24=
---
apiVersion: v1
kind: Secret
metadata:
  name: aws-credentials
  namespace: justdb-cloud
type: Opaque
stringData:
  aws-access-key-id: Base64Encoded
  aws-secret-access-key: Base64Encoded
```

### 3. Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: justdb-cloud
  namespace: justdb-cloud
  labels:
    app: justdb-cloud
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
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
        - name: http
          containerPort: 8080
          protocol: TCP
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: justdb-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: justdb-secrets
              key: jwt-secret
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: aws-access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: aws-secret-access-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
            initialDelaySeconds: 30
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
        volumeMounts:
        - name: config
          mountPath: /app/config
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: config
        configMap:
          name: justdb-config
      - name: logs
        emptyDir: {}
```

### 4. Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: justdb-cloud
  namespace: justdb-cloud
spec:
  type: LoadBalancer
  selector:
    matchLabels:
      app: justdb-cloud
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  sessionAffinity: ClientIP
```

### 5. Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: justdb-cloud-hpa
  namespace: justdb-cloud
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: justdb-cloud
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      target:
        type: Utilization
        average:
          cpu: 70
          memory: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
```

---

## 监控和可观测性

### 1. Prometheus 配置

```yaml
# k8s/prometheus-service.yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: justdb-cloud
  namespace: justdb-cloud
spec:
  selector:
    matchLabels:
      app: justdb-cloud
  endpoints:
  - port: http
    path: /actuator/prometheus
    interval: 30s
```

### 2. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "JustDB Cloud Metrics",
    "tags": ["justdb", "cloud"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(justdb_http_requests_total{service=\"justdb-cloud\"}[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(justdb_http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, justdb_http_server_requests_seconds{service=\"justdb-cloud\"})"
          }
        ]
      }
    ]
  }
}
```

---

## 滚动更新策略

### Blue-Green Deployment

```yaml
apiVersion: argoproj.github.io/v1alpha1
kind: Rollout
metadata:
  name: justdb-cloud
  namespace: justdb-cloud
spec:
  replicas: 3
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: { duration: 1m }
      - setWeight: 50
      - pause: { duration: 5m }
      - setWeight: 100
```

---

## 数据库迁移

### Liquibase 迁移脚本

```sql
-- V1__create_api_keys_table.sql
CREATE TABLE api_keys (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    permissions TEXT NOT NULL,
    allowed_databases TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL
);

-- V2__create_audit_logs_table.sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    api_key_id BIGINT REFERENCES api_keys(id),
    operation VARCHAR(50) NOT NULL,
    schema_url TEXT,
    database_url VARCHAR(500),
    status VARCHAR(20),
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V3__create_schema_versions_table.sql
CREATE TABLE schema_versions (
    id BIGSERIAL PRIMARY KEY,
    environment VARCHAR(50) NOT NULL,
    schema_url TEXT,
    version VARCHAR(50),
    changes JSONB,
    checksum VARCHAR(64),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100)
);
```

---

## 备份和恢复

### 数据备份

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$DATE"

# 数据库备份
kubectl exec -n postgres-0 pg_dump -U justdb -d justdb > "$BACKUP_DIR/justdb.sql"

# Schema 备份到 S3
kubectl exec -n justdb-cloud-0 \
  aws s3 cp \
  /app/schemas/ \
  "s3://justdb-backups/schemas/$DATE/"
```

### 恢复流程

```bash
#!/bin/bash
# restore.sh

BACKUP_DIR="backups/20250209_120000"

# 恢复数据库
kubectl exec -i postgres-0 \
  psql -U justdb justdb < "$BACKUP_DIR/justdb.sql"

# 恢复 Schema
kubectl cp "$BACKUP_DIR/schemas/" \
  justdb-cloud-0:/app/schemas/
```

---

## 灾难恢复

### 回滚流程

```bash
#!/bin/bash
# rollback.sh

NEW_VERSION="v1.2.3"
OLD_VERSION="v1.2.2"

# 1. 更新镜像标签
kubectl set image deployment/justdb-cloud \
  justdb/cloud:$OLD_VERSION

# 2. 等待 rollout 完成
kubectl rollout status deployment/justdb-cloud

# 3. 如果失败，回滚
kubectl rollout undo deployment/justdb-cloud
```

### 故障排查

```bash
# 查看日志
kubectl logs -f deployment/justdb-cloud -n justdb-cloud

# 查看事件
kubectl get events -n justdb-cloud

# 进入 Pod 调试
kubectl exec -it justdb-cloud-0 -- bash

# 检查健康状态
curl http://justdb-cloud/health/live
curl http://justdb-cloud/health/ready
```

---

## 性能优化

### 1. 连接池配置

```yaml
# 实施 HikariCP 监控
management:
  endpoints:
    web:
      exposure:
        include: health,info,hikaric

spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

      # 性能指标
      metric-tracker: true
      metrics: true
      register-mbeans: true
```

### 2. 缓存策略

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = Caffeine.newBuilder()
            .build();
    }

    @Bean
    public Cache<String> schemaContentCache() {
        return Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .build();
    }
}
```

---

## 安全加固

### 1. Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: justdb-cloud-policy
  namespace: justdb-cloud
spec:
  podSelector:
    matchLabels:
      app: justdb-cloud
  policyTypes:
  - Pod
  - Ingress
  - Egress
  ingress:
    - from:
      - namespaceSelector:
          matchLabels:
            app: ingress-nginx
    ports:
      - protocol: TCP
        port: 8080
  egress:
    - to:
      - namespaceSelector:
          matchLabels:
            app: postgres
      ports:
      - protocol: TCP
        port: 5432
    - to:
      - namespaceSelector:
          matchLabels:
            app: redis
      ports:
      - protocol: TCP
        port: 6379
    - to:
      - podSelector:
          matchLabels:
            app: s3-gateway
      ports:
      - protocol: TCP
        port: 9000
```

### 2. Pod Security Policy

```yaml
# k8s/pod-security-policy.yaml
apiVersion: v1
kind: PodSecurityPolicy
metadata:
  name: justdb-cloud-psp
  namespace: justdb-cloud
spec:
  priviledged: false
  allowPrivilegeEscalation: false
  allowedCapabilities:
    - NET_BIND_SERVICE
    - CHOWN
  volumes:
    - name: logs
      emptyDir: {}
    - name: config
      configMap:
        default:
          readOnlyRoot: false
    hostNetwork: false
  seLinuxOptions:
    level: restricted
```

---

## 相关文档

- [云 API 设计](cloud-api.md)
- [Provider 实现细节](provider-implementation.md)

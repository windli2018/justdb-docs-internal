# Deployment Guide

## Development Environment

### Docker Compose

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

### Run Development Environment

```bash
docker-compose up -d
```

## Production Environment

### Kubernetes Deployment

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

### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: justdb-cloud
spec:
  type: LoadBalancer
  ports:
  - port: 443
    targetPort: 8080
  selector:
    app: justdb-cloud
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Spring profile | `dev` |
| `SPRING_DATASOURCE_URL` | PostgreSQL URL | - |
| `SPRING_DATASOURCE_USERNAME` | Database username | - |
| `SPRING_DATASOURCE_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `AWS_REGION` | AWS region for S3 | `us-east-1` |

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: justdb-cloud-config
data:
  application.yml: |
    spring:
      datasource:
        url: jdbc:postgresql://postgres:5432/justdb
        username: justdb
        password: justdb
    justdb:
      api:
        rate-limit:
          default: 1000
```

## Health Checks

```bash
# Check service health
curl https://api.justdb.io/health

# Expected response
{
  "status": "UP",
  "components": {
    "database": "UP",
    "disk": "UP",
    "s3": "UP"
  }
}
```

## Monitoring

### Prometheus Metrics

Metrics are exposed at `/actuator/prometheus`:

- `justdb_apply_total` - Total apply operations
- `justdb_apply_duration_seconds` - Apply operation duration
- `justdb_validation_total` - Total validation operations

### Distributed Tracing

Jaeger integration for distributed tracing:

```yaml
export OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
export OTEL_SERVICE_NAME=justdb-cloud
```

## Related Documentation

- [Cloud API Design](./cloud-api.md) - API endpoint details
- [Provider Implementation](./provider-implementation.md) - Provider code

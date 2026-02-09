---
icon: leaf
title: Spring Boot 集成
order: 11
category:
  - 指南
  - 集成
tag:
  - Spring Boot
  - 集成
  - 自动配置
---

# Spring Boot 集成

学习如何在 Spring Boot 项目中使用 JustDB，实现自动化的数据库迁移管理。

## 快速开始

### 1. 添加依赖

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 2. 配置文件

```yaml
# application.yml
justdb:
  enabled: true
  locations: classpath:justdb
  dry-run: false
  baseline-on-migrate: true

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 3. 创建 Schema

```yaml
# src/main/resources/justdb/users.yaml
id: myapp
namespace: com.example
Table:
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: 用户ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: 用户名
      - name: email
        type: VARCHAR(100)
        comment: 邮箱
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 创建时间
    Index:
      - name: idx_username
        columns: [username]
        unique: true
      - name: idx_email
        columns: [email]
        unique: true
```

### 4. 启动应用

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // 数据库已自动迁移！
    }
}
```

## 自动配置

### 配置选项

```yaml
justdb:
  # 是否启用 JustDB
  enabled: true

  # Schema 文件位置
  locations:
    - classpath:justdb
    - classpath:db
    - file:./schemas

  # 是否只预览不执行
  dry-run: false

  # 是否在迁移前设置基线
  baseline-on-migrate: true

  # 是否启用安全删除
  safe-drop: false

  # 是否启用幂等模式
  idempotent: true

  # 数据库方言（可选，自动检测）
  dialect: mysql

  # 是否在启动时执行迁移
  migrate-on-startup: true

  # 是否在启动时验证 Schema
  validate-on-startup: true
```

### 多环境配置

**开发环境**（application-dev.yml）：
```yaml
justdb:
  enabled: true
  dry-run: false
  locations: classpath:justdb

spring:
  datasource:
    url: jdbc:mysql://dev-db:3306/myapp_dev
    username: dev_user
    password: dev_pass
```

**测试环境**（application-test.yml）：
```yaml
justdb:
  enabled: true
  dry-run: true  # 测试环境只预览
  locations: classpath:justdb

spring:
  datasource:
    url: jdbc:h2:mem:testdb  # 使用内存数据库
    driver-class-name: org.h2.Driver
```

**生产环境**（application-prod.yml）：
```yaml
justdb:
  enabled: true
  dry-run: false
  baseline-on-migrate: true
  safe-drop: true  # 生产环境启用安全删除
  locations: classpath:justdb

spring:
  datasource:
    url: jdbc:mysql://prod-db:3306/myapp
    username: ${DB_USERNAME}  # 环境变量
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

## 高级配置

### 自定义配置

```java
@Configuration
public class JustdbConfiguration {

    @Bean
    public JustdbProperties justdbProperties() {
        JustdbProperties properties = new JustdbProperties();
        properties.setEnabled(true);
        properties.setLocations(Arrays.asList("classpath:justdb"));
        properties.setDryRun(false);
        properties.setBaselineOnMigrate(true);
        return properties;
    }

    @Bean
    public SchemaMigrationService schemaMigrationService(
            JustdbProperties properties,
            DataSource dataSource) {
        return new SchemaMigrationService(properties, dataSource);
    }
}
```

### 编程式迁移

```java
@Service
public class DatabaseService {

    @Autowired
    private SchemaMigrationService migrationService;

    public void migrateDatabase() {
        // 执行迁移
        MigrationResult result = migrationService.migrate();

        // 检查结果
        if (result.isSuccess()) {
            log.info("Migration completed successfully");
        } else {
            log.error("Migration failed: {}", result.getError());
        }
    }

    public void validateSchema() {
        // 验证 Schema
        ValidationResult result = migrationService.validate();

        if (!result.isValid()) {
            throw new SchemaValidationException(result.getErrors());
        }
    }
}
```

### 事件监听

```java
@Component
public class MigrationEventListener {

    @EventListener
    public void onMigrationStart(MigrationStartEvent event) {
        log.info("Migration started: {}", event.getSchemaVersion());
    }

    @EventListener
    public void onMigrationSuccess(MigrationSuccessEvent event) {
        log.info("Migration completed successfully");
        log.info("Changes applied: {}", event.getAppliedChanges());
    }

    @EventListener
    public void onMigrationFailure(MigrationFailureEvent event) {
        log.error("Migration failed: {}", event.getError());
        // 发送告警通知
        alertService.sendAlert("Database migration failed");
    }
}
```

## 测试支持

### 测试配置

```yaml
# application-test.yml
justdb:
  enabled: true
  locations: classpath:justdb/test

spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
```

### 测试基类

```java
@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.yml")
public abstract class DatabaseTest {

    @Autowired
    private SchemaMigrationService migrationService;

    @BeforeAll
    public static void setupDatabase() {
        // 测试前迁移数据库
        migrationService.migrate();
    }

    @AfterEach
    public void cleanupTables() {
        // 每个测试后清理数据
        // 保持表结构不变
    }
}
```

### Testcontainers 集成

```java
@Testcontainers
@SpringBootTest
public class IntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>(
        "mysql:8.0"
    );

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Test
    public void testMigration() {
        // 使用真实的 MySQL 数据库测试
    }
}
```

## 常见场景

### 1. 条件启用

```java
@Configuration
@ConditionalOnProperty(
    name = "justdb.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class JustdbAutoConfiguration {
    // 自动配置
}
```

### 2. 多数据源

```yaml
justdb:
  datasources:
    primary:
      locations: classpath:justdb/primary
      enabled: true
    secondary:
      locations: classpath:justdb/secondary
      enabled: true

spring:
  datasource:
    primary:
      url: jdbc:mysql://primary-db:3306/app1
    secondary:
      url: jdbc:mysql://secondary-db:3306/app2
```

### 3. Flyway 共存

```yaml
# 只在开发环境使用 JustDB
justdb:
  enabled: false
  profiles: dev

flyway:
  enabled: true
  profiles: prod
```

### 4. 手动触发迁移

```java
@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private SchemaMigrationService migrationService;

    @PostMapping("/migrate")
    public ResponseEntity<?> migrate() {
        try {
            MigrationResult result = migrationService.migrate();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        DatabaseStatus status = migrationService.getStatus();
        return ResponseEntity.ok(status);
    }
}
```

## 最佳实践

### 1. Schema 位置

```
src/main/resources/
├── justdb/
│   ├── core/
│   │   ├── users.yaml
│   │   └── roles.yaml
│   ├── business/
│   │   ├── orders.yaml
│   │   └── products.yaml
│   └── config/
│       ├── dev.yaml
│       └── prod.yaml
```

### 2. 配置管理

```yaml
# application.yml（通用配置）
justdb:
  enabled: true
  locations: classpath:justdb
  validate-on-startup: true

---------------------------

# application-dev.yml（开发环境）
justdb:
  dry-run: false
  migrate-on-startup: true

---------------------------

# application-test.yml（测试环境）
justdb:
  dry-run: true  # 测试环境不执行实际迁移

---------------------------

# application-prod.yml（生产环境）
justdb:
  dry-run: false
  baseline-on-migrate: true
  safe-drop: true
```

### 3. 错误处理

```java
@ControllerAdvice
public class MigrationExceptionHandler {

    @ExceptionHandler(MigrationException.class)
    public ResponseEntity<String> handleMigrationError(
            MigrationException e) {
        log.error("Migration error", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Database migration failed");
    }

    @ExceptionHandler(SchemaValidationException.class)
    public ResponseEntity<String> handleValidationError(
            SchemaValidationException e) {
        log.error("Schema validation error", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Schema validation failed");
    }
}
```

### 4. 监控和日志

```yaml
# application.yml
logging:
  level:
    org.verydb.justdb: DEBUG
    org.verydb.justdb.migration: INFO

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  metrics:
    export:
      prometheus:
        enabled: true
```

### 5. 健康检查

```java
@Component
public class JustdbHealthIndicator implements HealthIndicator {

    @Autowired
    private SchemaMigrationService migrationService;

    @Override
    public Health health() {
        try {
            DatabaseStatus status = migrationService.getStatus();
            return Health.up()
                .withDetail("version", status.getVersion())
                .withDetail("migrations", status.getMigrationCount())
                .withDetail("lastMigration", status.getLastMigrationTime())
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

## 故障排查

### 常见问题

**1. 迁移未执行**

```yaml
# 检查配置
justdb:
  enabled: true  # 确保启用
  migrate-on-startup: true
  locations: classpath:justdb  # 确保路径正确
```

**2. Schema 文件未找到**

```bash
# 检查文件位置
ls -la src/main/resources/justdb/

# 检查 classpath
java -jar app.jar --debug | grep justdb
```

**3. 数据库连接失败**

```yaml
# 检查数据源配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

## 下一步

<VPCard
  title="CI/CD 集成"
  desc="在 CI/CD 流程中使用 JustDB"
  link="/guide/cicd.html"
/>

<VPCard
  title="Docker 部署"
  desc="使用 Docker 部署 Spring Boot 应用"
  link="/guide/docker.html"
/>

<VPCard
  title="配置参考"
  desc="完整的 Spring Boot 配置选项"
  link="/guide/config-reference.html"
/>

---
icon: leaf
date: 2024-01-01
title: Spring Boot Integration
order: 11
category:
  - Guide
  - Integration
tag:
  - Spring Boot
  - integration
  - auto-configuration
---

# Spring Boot Integration

Learn how to use JustDB in Spring Boot projects for automated database migration management.

## Quick Start

### 1. Add Dependency

```xml
<!-- pom.xml -->
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 2. Configuration File

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

### 3. Create Schema

```yaml
# src/main/resources/justdb/users.yaml
namespace: com.example
Table:
  - name: users
    comment: User table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: User ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username
      - name: email
        type: VARCHAR(100)
        comment: Email
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Creation time
    Index:
      - name: idx_username
        columns: [username]
        unique: true
      - name: idx_email
        columns: [email]
        unique: true
```

### 4. Start Application

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // Database has been automatically migrated!
    }
}
```

## Auto-Configuration

### Configuration Options

```yaml
justdb:
  # Enable JustDB
  enabled: true

  # Schema file locations
  locations:
    - classpath:justdb
    - classpath:db
    - file:./schemas

  # Preview only without execution
  dry-run: false

  # Set baseline before migration
  baseline-on-migrate: true

  # Enable safe drop
  safe-drop: false

  # Enable idempotent mode
  idempotent: true

  # Database dialect (optional, auto-detected)
  dialect: mysql

  # Execute migration on startup
  migrate-on-startup: true

  # Validate Schema on startup
  validate-on-startup: true
```

### Multi-Environment Configuration

**Development Environment** (application-dev.yml):
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

**Test Environment** (application-test.yml):
```yaml
justdb:
  enabled: true
  dry-run: true  # Preview only in test
  locations: classpath:justdb

spring:
  datasource:
    url: jdbc:h2:mem:testdb  # Use in-memory database
    driver-class-name: org.h2.Driver
```

**Production Environment** (application-prod.yml):
```yaml
justdb:
  enabled: true
  dry-run: false
  baseline-on-migrate: true
  safe-drop: true  # Enable safe drop in production
  locations: classpath:justdb

spring:
  datasource:
    url: jdbc:mysql://prod-db:3306/myapp
    username: ${DB_USERNAME}  # Environment variable
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

## Advanced Configuration

### Custom Configuration

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

### Programmatic Migration

```java
@Service
public class DatabaseService {

    @Autowired
    private SchemaMigrationService migrationService;

    public void migrateDatabase() {
        // Execute migration
        MigrationResult result = migrationService.migrate();

        // Check result
        if (result.isSuccess()) {
            log.info("Migration completed successfully");
        } else {
            log.error("Migration failed: {}", result.getError());
        }
    }

    public void validateSchema() {
        // Validate Schema
        ValidationResult result = migrationService.validate();

        if (!result.isValid()) {
            throw new SchemaValidationException(result.getErrors());
        }
    }
}
```

### Event Listening

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
        // Send alert notification
        alertService.sendAlert("Database migration failed");
    }
}
```

## Testing Support

### Test Configuration

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

### Test Base Class

```java
@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.yml")
public abstract class DatabaseTest {

    @Autowired
    private SchemaMigrationService migrationService;

    @BeforeAll
    public static void setupDatabase() {
        // Migrate database before tests
        migrationService.migrate();
    }

    @AfterEach
    public void cleanupTables() {
        // Clean up data after each test
        // Keep table structure unchanged
    }
}
```

### Testcontainers Integration

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
        // Test with real MySQL database
    }
}
```

## Common Scenarios

### 1. Conditional Enablement

```java
@Configuration
@ConditionalOnProperty(
    name = "justdb.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class JustdbAutoConfiguration {
    // Auto-configuration
}
```

### 2. Multiple DataSources

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

### 3. Coexistence with Flyway

```yaml
# Use JustDB only in development
justdb:
  enabled: false
  profiles: dev

flyway:
  enabled: true
  profiles: prod
```

### 4. Manual Migration Trigger

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

## Best Practices

### 1. Schema Location

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

### 2. Configuration Management

```yaml
# application.yml (common configuration)
justdb:
  enabled: true
  locations: classpath:justdb
  validate-on-startup: true

---------------------------

# application-dev.yml (development)
justdb:
  dry-run: false
  migrate-on-startup: true

---------------------------

# application-test.yml (test)
justdb:
  dry-run: true  # Don't execute actual migrations in test

---------------------------

# application-prod.yml (production)
justdb:
  dry-run: false
  baseline-on-migrate: true
  safe-drop: true
```

### 3. Error Handling

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

### 4. Monitoring and Logging

```yaml
# application.yml
logging:
  level:
    ai.justdb.justdb: DEBUG
    ai.justdb.justdb.migration: INFO

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

### 5. Health Check

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

## Troubleshooting

### Common Issues

**1. Migration Not Executed**

```yaml
# Check configuration
justdb:
  enabled: true  # Ensure enabled
  migrate-on-startup: true
  locations: classpath:justdb  # Ensure path is correct
```

**2. Schema File Not Found**

```bash
# Check file location
ls -la src/main/resources/justdb/

# Check classpath
java -jar app.jar --debug | grep justdb
```

**3. Database Connection Failed**

```yaml
# Check datasource configuration
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

## Next Steps

<VPCard
  title="CI/CD Integration"
  desc="Using JustDB in CI/CD pipelines"
  link="/guide/cicd.html"
/>

<VPCard
  title="Docker Deployment"
  desc="Deploy Spring Boot applications with Docker"
  link="/guide/docker.html"
/>

<VPCard
  title="Configuration Reference"
  desc="Complete Spring Boot configuration options"
  link="/guide/config-reference.html"
/>

---
date: 2024-01-01
icon: leaf
title: Spring Boot Quick Integration
order: 6
category:
  - Quick Start
  - Integration
tag:
  - Spring Boot
  - integration
  - auto-configuration
---

# Spring Boot Integration

JustDB provides an out-of-the-box Spring Boot Starter, making database management simple and automated.

## Quick Start

### Add Dependency

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Configuration File

```yaml
# application.yml
justdb:
  enabled: true                    # Enable JustDB
  locations: classpath:justdb      # Schema file locations
  dry-run: false                   # Preview mode
  baseline-on-migrate: true        # Baseline mode
  validate-on-migrate: true        # Validate before migration

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### Create Schema File

```
src/main/resources/
└── justdb/
    └── users.yaml
```

```yaml
# src/main/resources/justdb/users.yaml
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
      - name: email
        type: VARCHAR(100)
```

### Start Application

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // Database has been automatically migrated to the latest state!
    }
}
```

## Configuration Options

### Basic Configuration

```yaml
justdb:
  # Enable JustDB
  enabled: true

  # Schema file locations (supports multiple)
  locations:
    - classpath:justdb
    - classpath:db
    - file:./schemas

  # Schema file format
  format: yaml

  # Preview mode (don't execute changes)
  dry-run: false

  # Auto calculate diff
  auto-diff: true

  # Safe drop mode
  safe-drop: false

  # Idempotent mode
  idempotent: true
```

### Migration Configuration

```yaml
justdb:
  # Set baseline on first migration
  baseline-on-migrate: true

  # Baseline description
  baseline-description: "Initial schema"

  # Validate before migration
  validate-on-migrate: true

  # Migrate on startup
  migrate-on-startup: true

  # Skip failed migrations
  skip-failed-migrations: false
```

### Database Configuration

```yaml
spring:
  datasource:
    # Primary datasource
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password

    # Hikari connection pool config
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000

justdb:
  # Use separate datasource
  datasource:
    url: jdbc:mysql://localhost:3306/myapp_admin
    username: admin
    password: admin_pass
```

### Multi-Datasource Configuration

```yaml
justdb:
  datasources:
    primary:
      locations: classpath:justdb/primary
      datasource:
        url: jdbc:mysql://localhost:3306/db1
    secondary:
      locations: classpath:justdb/secondary
      datasource:
        url: jdbc:mysql://localhost:3306/db2
```

## Auto Configuration

### Auto-Configured Components

JustDB Starter automatically configures:

1. **SchemaLoader** - Load Schema files
2. **SchemaDeployer** - Execute database migration
3. **SchemaValidator** - Validate Schema definitions
4. **SchemaHistoryManager** - Manage migration history

### Disable Auto Configuration

```yaml
justdb:
  enabled: false
```

Or using annotation:

```java
@SpringBootApplication(exclude = JustdbAutoConfiguration.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## Programmatic Configuration

### Custom Configuration Class

```java
@Configuration
public class JustdbConfiguration {

    @Bean
    public JustdbProperties justdbProperties() {
        JustdbProperties properties = new JustdbProperties();
        properties.setEnabled(true);
        properties.setLocations(Arrays.asList("classpath:justdb"));
        properties.setDryRun(false);
        return properties;
    }

    @Bean
    public SchemaDeployer schemaDeployer(DataSource dataSource) {
        return new SchemaDeployer(dataSource);
    }
}
```

### Conditional Configuration

```java
@Configuration
@Profile("dev")  // Only enable in dev environment
public class DevJustdbConfiguration {

    @Bean
    public SchemaDeployer devSchemaDeployer(DataSource dataSource) {
        SchemaDeployer deployer = new SchemaDeployer(dataSource);
        deployer.setDryRun(true);  // Preview mode in dev
        return deployer;
    }
}

@Configuration
@Profile("prod")  // Production environment config
public class ProdJustdbConfiguration {

    @Bean
    public SchemaDeployer prodSchemaDeployer(DataSource dataSource) {
        SchemaDeployer deployer = new SchemaDeployer(dataSource);
        deployer.setSafeDrop(true);  // Safe drop in production
        return deployer;
    }
}
```

## Lifecycle Hooks

### Migrate on Application Startup

```java
@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    @Autowired
    private SchemaDeployer schemaDeployer;

    @Autowired
    private JustdbManager justdbManager;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Load Schema
        List<Loaded&gt;<Justdb>> schemas = SchemaLoader.loadFromClasspath(
            "justdb", justdbManager
        );

        // Execute migration
        for (Loaded&lt;Justdb&gt; loaded : schemas) {
            schemaDeployer.deploy(loaded.getValue());
        }
    }
}
```

### Custom Migration Listener

```java
@Component
public class MigrationListener {

    @EventListener
    public void onMigrationStart(MigrationStartEvent event) {
        log.info("Migration started: {}", event.getSchemaId());
    }

    @EventListener
    public void onMigrationSuccess(MigrationSuccessEvent event) {
        log.info("Migration completed: {}", event.getSchemaId());
    }

    @EventListener
    public void onMigrationFailure(MigrationFailureEvent event) {
        log.error("Migration failed: {}", event.getSchemaId(), event.getException());
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
  dry-run: false

spring:
  datasource:
    url: jdbc:h2:mem:testdb  # Use in-memory database
```

### Test Base Class

```java
@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.yml")
abstract class BaseTest {

    @Autowired
    private SchemaDeployer schemaDeployer;

    @Autowired
    private JustdbManager justdbManager;

    @BeforeEach
    void setupDatabase() throws Exception {
        // Redeploy Schema before each test
        Justdb schema = SchemaLoader.loadFromClasspath(
            "justdb/test", justdbManager
        ).get(0).getValue();
        schemaDeployer.deploy(schema);
    }
}
```

### @DataJustdbTest

```java
@DataJustdbTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindUserByUsername() {
        // Test code
    }
}
```

## Common Scenarios

### Scenario 1: Multi-Environment Configuration

```yaml
# application-dev.yml
justdb:
  enabled: true
  dry-run: true  # Preview in dev

# application-test.yml
justdb:
  enabled: true
  dry-run: false

# application-prod.yml
justdb:
  enabled: true
  dry-run: false
  safe-drop: true  # Safe drop in production
  baseline-on-migrate: true
```

### Scenario 2: Multi-Module Project

```
project/
├── user-service/
│   └── src/main/resources/
│       └── justdb/
│           └── users.yaml
├── order-service/
│   └── src/main/resources/
│       └── justdb/
│           └── orders.yaml
└── api-gateway/
    └── src/main/resources/
        └── justdb/
            └── gateway.yaml
```

Each service independently manages its own database.

### Scenario 3: Migrate from Flyway to JustDB

```java
@Configuration
public class MigrationConfiguration {

    @Bean
    @ConditionalOnProperty(name = "justdb.migration.strategy", havingValue = "justdb")
    public SchemaDeployer justdbSchemaDeployer(DataSource dataSource) {
        return new SchemaDeployer(dataSource);
    }

    @Bean
    @ConditionalOnProperty(name = "justdb.migration.strategy", havingValue = "flyway")
    public Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
            .dataSource(dataSource)
            .load();
    }
}
```

```yaml
justdb:
  migration:
    strategy: justdb  # or flyway
```

## Best Practices

### 1. Schema File Organization

```
src/main/resources/
└── justdb/
    ├── core/
    │   ├── users.yaml
    │   └── roles.yaml
    ├── business/
    │   ├── orders.yaml
    │   └── products.yaml
    └── index.yaml  # Main file references other files
```

### 2. Environment Isolation

```yaml
# application.yml
justdb:
  locations: classpath:justdb/${spring.profiles.active}
```

```
justdb/
├── dev/
│   └── schema.yaml
├── test/
│   └── schema.yaml
└── prod/
    └── schema.yaml
```

### 3. Version Control

```yaml
justdb:
  baseline-on-migrate: true
  validate-on-migrate: true
```

### 4. Security Considerations

```yaml
# Production environment
justdb:
  safe-drop: true
  dry-run: false

spring:
  datasource:
    password: ${DB_PASSWORD}  # Read from environment variable
```

## Troubleshooting

### Migration Failure

```yaml
justdb:
  skip-failed-migrations: false  # Don't skip failed migrations
```

View logs:

```yaml
logging:
  level:
    org.verydb.justdb: DEBUG
```

### Connection Issues

```yaml
spring:
  datasource:
    hikari:
      connection-timeout: 60000  # Increase connection timeout
      maximum-pool-size: 20       # Increase pool size
```

### Performance Optimization

```yaml
justdb:
  batch-size: 100  # Batch execution size

spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
```

## Next Steps

<VPCard
  title="Common Tasks"
  desc="View common database operation examples"
  link="/en/getting-started/common-tasks.html"
/>

<VPCard
  title="Java API"
  desc="Learn JustDB Java API in depth"
  link="/en/reference/api/java-api.html"
/>

<VPCard
  title="CLI Reference"
  desc="Complete command-line tool reference"
  link="/en/reference/cli/commands.html"
/>

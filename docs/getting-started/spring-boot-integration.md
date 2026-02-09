---
icon: leaf
title: Spring Boot 集成
order: 6
category:
  - 快速开始
  - 集成
tag:
  - Spring Boot
  - 集成
  - 自动配置
---

# Spring Boot 集成

JustDB 提供了开箱即用的 Spring Boot Starter，让数据库管理变得简单自动化。

## 快速开始

### 添加依赖

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 配置文件

```yaml
# application.yml
justdb:
  enabled: true                    # 启用 JustDB
  locations: classpath:justdb      # Schema 文件位置
  dry-run: false                   # 是否预览模式
  baseline-on-migrate: true        # 基线模式
  validate-on-migrate: true        # 迁移前验证

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 创建 Schema 文件

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

### 启动应用

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // 数据库已自动迁移到最新状态！
    }
}
```

## 配置选项

### 基本配置

```yaml
justdb:
  # 是否启用 JustDB
  enabled: true

  # Schema 文件位置（支持多个）
  locations:
    - classpath:justdb
    - classpath:db
    - file:./schemas

  # Schema 文件格式
  format: yaml

  # 是否预览模式（不执行变更）
  dry-run: false

  # 是否自动计算差异
  auto-diff: true

  # 是否安全删除模式
  safe-drop: false

  # 是否幂等模式
  idempotent: true
```

### 迁移配置

```yaml
justdb:
  # 首次迁移时设置基线
  baseline-on-migrate: true

  # 基线描述
  baseline-description: "Initial schema"

  # 迁移前验证
  validate-on-migrate: true

  # 是否在启动时迁移
  migrate-on-startup: true

  # 是否跳过迁移失败
  skip-failed-migrations: false
```

### 数据库配置

```yaml
spring:
  datasource:
    # 主数据源
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password

    # Hikari 连接池配置
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000

justdb:
  # 使用独立数据源
  datasource:
    url: jdbc:mysql://localhost:3306/myapp_admin
    username: admin
    password: admin_pass
```

### 多数据源配置

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

## 自动配置

### 自动执行的组件

JustDB Starter 会自动配置：

1. **SchemaLoader** - 加载 Schema 文件
2. **SchemaDeployer** - 执行数据库迁移
3. **SchemaValidator** - 验证 Schema 定义
4. **SchemaHistoryManager** - 管理迁移历史

### 禁用自动配置

```yaml
justdb:
  enabled: false
```

或使用注解：

```java
@SpringBootApplication(exclude = JustdbAutoConfiguration.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## 编程式配置

### 自定义配置类

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

### 条件配置

```java
@Configuration
@Profile("dev")  // 只在开发环境启用
public class DevJustdbConfiguration {

    @Bean
    public SchemaDeployer devSchemaDeployer(DataSource dataSource) {
        SchemaDeployer deployer = new SchemaDeployer(dataSource);
        deployer.setDryRun(true);  // 开发环境预览模式
        return deployer;
    }
}

@Configuration
@Profile("prod")  // 生产环境配置
public class ProdJustdbConfiguration {

    @Bean
    public SchemaDeployer prodSchemaDeployer(DataSource dataSource) {
        SchemaDeployer deployer = new SchemaDeployer(dataSource);
        deployer.setSafeDrop(true);  // 生产环境安全删除
        return deployer;
    }
}
```

## 生命周期钩子

### 应用启动时迁移

```java
@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    @Autowired
    private SchemaDeployer schemaDeployer;

    @Autowired
    private JustdbManager justdbManager;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 加载 Schema
        List<Loaded<Justdb>> schemas = SchemaLoader.loadFromClasspath(
            "justdb", justdbManager
        );

        // 执行迁移
        for (Loaded<Justdb> loaded : schemas) {
            schemaDeployer.deploy(loaded.getValue());
        }
    }
}
```

### 自定义迁移监听器

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

## 测试支持

### 测试配置

```yaml
# application-test.yml
justdb:
  enabled: true
  locations: classpath:justdb/test
  dry-run: false

spring:
  datasource:
    url: jdbc:h2:mem:testdb  # 使用内存数据库
```

### 测试基类

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
        // 每个测试前重新部署 Schema
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
        // 测试代码
    }
}
```

## 常见场景

### 场景一：多环境配置

```yaml
# application-dev.yml
justdb:
  enabled: true
  dry-run: true  # 开发环境预览

# application-test.yml
justdb:
  enabled: true
  dry-run: false

# application-prod.yml
justdb:
  enabled: true
  dry-run: false
  safe-drop: true  # 生产环境安全删除
  baseline-on-migrate: true
```

### 场景二：多模块项目

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

每个服务独立管理自己的数据库。

### 场景三：Flyway 迁移到 JustDB

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
    strategy: justdb  # 或 flyway
```

## 最佳实践

### 1. Schema 文件组织

```
src/main/resources/
└── justdb/
    ├── core/
    │   ├── users.yaml
    │   └── roles.yaml
    ├── business/
    │   ├── orders.yaml
    │   └── products.yaml
    └── index.yaml  # 主文件引用其他文件
```

### 2. 环境隔离

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

### 3. 版本管理

```yaml
justdb:
  baseline-on-migrate: true
  validate-on-migrate: true
```

### 4. 安全考虑

```yaml
# 生产环境
justdb:
  safe-drop: true
  dry-run: false

spring:
  datasource:
    password: ${DB_PASSWORD}  # 从环境变量读取
```

## 故障排查

### 迁移失败

```yaml
justdb:
  skip-failed-migrations: false  # 不跳过失败的迁移
```

查看日志：

```bash
logging:
  level:
    org.verydb.justdb: DEBUG
```

### 连接问题

```yaml
spring:
  datasource:
    hikari:
      connection-timeout: 60000  # 增加连接超时
      maximum-pool-size: 20       # 增加连接池大小
```

### 性能优化

```yaml
justdb:
  batch-size: 100  # 批量执行大小

spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
```

## 下一步

<VPCard
  title="常见任务"
  desc="查看常见的数据库操作示例"
  link="/getting-started/common-tasks.html"
/>

<VPCard
  title="Java API"
  desc="深入了解 JustDB Java API"
  link="/reference/java-api.html"
/>

<VPCard
  title="CLI 参考"
  desc="命令行工具完整参考"
  link="/reference/cli.html"
/>

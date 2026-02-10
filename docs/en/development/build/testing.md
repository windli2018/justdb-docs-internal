---
icon: flask
title: 测试指南
order: 3
category:
  - 构建指南
  - 开发指南
tag:
  - 测试
  - JUnit
  - Testcontainers
---

# 测试指南

本指南介绍 JustDB 项目的测试框架、如何运行测试以及如何编写测试。

## 测试框架

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| JUnit | 5.x | 测试框架 |
| AssertJ | 3.x | 断言库 |
| Mockito | 4.x | Mock 框架 |
| Testcontainers | 1.17+ | 容器化集成测试 |

### 测试分组

使用 JUnit 5 的 `@Tag` 注解进行测试分组：

| 标签 | 说明 | 示例 |
|------|------|------|
| `smoke` | 冒烟测试，快速验证基本功能 | 配置加载、基本解析 |
| `core` | 核心功能测试 | Schema diff、迁移 |
| 无标签 | 功能测试 | 端到端场景 |

## 运行测试

### 命令行运行

```bash
# 运行所有测试
mvn test

# 仅运行冒烟测试（快速）
mvn test -Psmoke-test

# 仅运行核心测试
mvn test -Pcore-test

# 运行冒烟和核心测试
mvn test -Psmoke-core

# 跳过测试
mvn clean install -DskipTests
```

### IDE 运行

#### IntelliJ IDEA

1. 右键点击测试类或方法
2. 选择 "Run" 或 "Debug"
3. 使用运行配置选择特定 Profile

#### VS Code

1. 安装 "Java Test Runner" 扩展
2. 测试类/方法上方会显示运行按钮
3. 点击按钮运行测试

### 运行特定测试

```bash
# 运行特定测试类
mvn test -Dtest=ItemScopesTest

# 运行特定测试方法
mvn test -Dtest=ItemScopesTest#testTableScopesDeserialization

# 运行特定包下的所有测试
mvn test -Dtest=ai.justdb.justdb.schema.*
```

## Testcontainers 使用

JustDB 使用 Testcontainers 进行集成测试，在真实数据库中验证功能。

### 前置条件

```bash
# 确保 Docker 已安装并运行
docker --version
docker ps
```

### 数据库测试

默认支持的测试数据库：

| 数据库 | 镜像 | 用途 |
|--------|------|------|
| MySQL | `mysql:8.0` | MySQL 兼容性测试 |
| PostgreSQL | `postgres:14` | PostgreSQL 兼容性测试 |
| H2 | `h2:latest` | 内存数据库测试 |

### Testcontainers 示例

```java
@Testcontainers
class MySQLMigrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Test
    void testSchemaMigration() {
        // 使用容器提供的连接信息
        String url = mysql.getJdbcUrl();
        String username = mysql.getUsername();
        String password = mysql.getPassword();

        try (Connection conn = DriverManager.getConnection(url, username, password)) {
            // 执行迁移测试
            SchemaDeployer deployer = new SchemaDeployer(conn);
            deployer.deploy(schema);

            // 验证结果
            // ...
        }
    }
}
```

## 编写测试

### 测试结构

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.DisplayName;
import static org.assertj.core.api.Assertions.*;

@Tag("core")
@DisplayName("Schema 差异计算测试")
class SchemaDiffTest {

    @Test
    @DisplayName("应该检测到新增的表")
    void shouldDetectAddedTable() {
        // Arrange
        Justdb oldSchema = loadSchema("old-schema.yaml");
        Justdb newSchema = loadSchema("new-schema.yaml");

        // Act
        CanonicalSchemaDiff diff = SchemaDiffCalculator.diff(oldSchema, newSchema);

        // Assert
        assertThat(diff.getAddedTables())
                .hasSize(1)
                .extracting("name")
                .contains("new_table");
    }

    @Test
    @DisplayName("应该检测到重命名的列")
    void shouldDetectRenamedColumn() {
        // Given
        Column oldColumn = createColumn("old_name", "VARCHAR(50)");
        Column newColumn = createColumn("new_name", "VARCHAR(50)");
        newColumn.setFormerNames(Arrays.asList("old_name"));

        // When
        boolean isRenamed = ColumnNameComparator.isRenamed(oldColumn, newColumn);

        // Then
        assertThat(isRenamed).isTrue();
    }
}
```

### 最佳实践

1. **使用描述性名称**: 测试方法名称应清楚描述测试意图
2. **AAA 模式**: Arrange-Act-Assert 结构
3. **独立测试**: 每个测试应独立运行，不依赖其他测试
4. **使用 AssertJ**: 链式断言更易读
5. **Mock 外部依赖**: 使用 Mockito mock 数据库连接等

### 单元测试示例

```java
@ExtendWith(MockitoExtension.class)
class TemplateExecutorTest {

    @Mock
    JustdbManager mockManager;

    @InjectMocks
    TemplateExecutor executor;

    @Test
    void shouldExecuteTemplateWithCorrectContext() {
        // Given
        TemplateRootContext context = TemplateRootContext.builder()
                .justdbManager(mockManager)
                .dbType("mysql")
                .idempotent(true)
                .build();

        // When
        String result = executor.execute("create-table", context);

        // Then
        assertThat(result)
                .contains("CREATE TABLE IF NOT EXISTS")
                .doesNotContain("{{");
    }
}
```

### 集成测试示例

```java
@SpringBootTest
@Tag("integration")
class SchemaDeploymentIntegrationTest {

    @Autowired
    SchemaMigrationService migrationService;

    @Test
    void shouldDeploySchemaToDatabase(@Autowired DataSource dataSource) {
        // Given
        Justdb schema = loadTestSchema();

        // When
        List&lt;String&gt; sql = migrationService.generateMigrationSql(schema);

        // Then
        assertThat(sql).isNotEmpty();
        // 执行并验证...
    }
}
```

## 测试覆盖率

### 查看覆盖率

```bash
# 生成 JaCoCo 覆盖率报告
mvn clean test jacoco:report

# 报告位置: target/site/jacoco/index.html
```

### 覆盖率目标

| 模块 | 目标覆盖率 |
|------|------------|
| justdb-core | 70%+ |
| justdb-cli | 60%+ |
| justdb-jdbc | 60%+ |

## 持续集成

### GitHub Actions

项目使用 GitHub Actions 进行 CI：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: '11'
      - name: Run tests
        run: mvn test
```

### 本地预验证

在提交前运行：

```bash
# 完整测试
mvn clean verify

# 格式检查
mvn spotless:check

# 静态分析
mvn checkstyle:check
```

## 常见问题

### 测试超时

**问题**: Testcontainers 启动超时

**解决**: 增加超时时间或使用本地数据库

```bash
# 使用本地数据库
export TEST_DB_URL=jdbc:mysql://localhost:3306/test
mvn test
```

### 端口冲突

**问题**: 容器端口冲突

**解决**: Testcontainers 会自动分配端口，确保 Docker 网络正常

```bash
# 检查 Docker 网络
docker network ls
docker network prune
```

## 贡献测试

欢迎贡献测试！请遵循：

1. **新功能必须有测试**: 代码覆盖率不能下降
2. **Bug 修复需要回归测试**: 防止问题重现
3. **测试命名清晰**: 使用 `@DisplayName` 注解
4. **添加适当标签**: 使用 `@Tag("smoke")` 或 `@Tag("core")`

## 下一步

- [从源码构建](./build-from-source.md) - 构建项目
- [Maven 项目结构](./maven-structure.md) - 了解模块结构
- [编码规范](../contributing/coding-standards.md) - 代码风格指南

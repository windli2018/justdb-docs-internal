---
icon: java
title: Java ORM Integration
description: Generate JPA/Hibernate and MyBatis models from JustDB schema
order: 1
---

# Java ORM Integration

JustDB supports generating Java entity classes and MyBatis mapping files for mainstream Java ORM frameworks including JPA/Hibernate and MyBatis.

## Supported Frameworks

| Framework | Description | Template Type |
|-----------|-------------|---------------|
| **JPA/Hibernate** | Java Persistence API standard, Hibernate implementation | `jpa-entity` |
| **MyBatis** | SQL mapping framework, flexible SQL control | `mybatis-bean` |

## Quick Start

### Generate JPA Entities

```bash
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/
```

**Generated JPA Entity Example:**

```java
package com.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

### Generate MyBatis Beans

```bash
justdb schema2orm --input schema.xml --type mybatis-bean --output src/main/java/
```

**Generated MyBatis Bean Example:**

```java
package com.example.model;

import java.time.LocalDateTime;

public class User {
    private Long id;
    private String username;
    private String email;
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

## Type Mapping

JustDB automatically maps database types to appropriate Java types:

| Database Type | Java Type (JPA) | Java Type (MyBatis) |
|--------------|-----------------|---------------------|
| BIGINT | `Long` | `Long` |
| INTEGER | `Integer` | `Integer` |
| VARCHAR | `String` | `String` |
| TEXT | `String` | `String` |
| TIMESTAMP | `LocalDateTime` | `LocalDateTime` |
| DATE | `LocalDate` | `LocalDate` |
| BOOLEAN | `Boolean` | `Boolean` |
| DECIMAL | `BigDecimal` | `BigDecimal` |
| BLOB | `byte[]` | `byte[]` |

## JPA/Hibernate Features

### Entity Annotations

JustDB generates complete JPA annotations:

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_username", columnList = "username")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;
}
```

### Relationship Mapping

Foreign keys are automatically converted to JPA relationships:

```xml
<!-- JustDB Schema -->
<Table name="orders">
    <Column name="user_id" type="BIGINT" nullable="false">
        <referencedTable>users</referencedTable>
        <referencedColumn>id</referencedColumn>
    </Column>
</Table>
```

```java
// Generated JPA Entity with relationship
@Entity
@Table(name = "orders")
public class Order {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_orders_user"))
    private User user;
}
```

## MyBatis Features

### MyBatis Mapping Files

JustDB can generate MyBatis XML mapping files:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.UserMapper">

    <resultMap id="BaseResultMap" type="com.example.model.User">
        <id column="id" property="id" jdbcType="BIGINT"/>
        <result column="username" property="username" jdbcType="VARCHAR"/>
        <result column="email" property="email" jdbcType="VARCHAR"/>
        <result column="created_at" property="createdAt" jdbcType="TIMESTAMP"/>
    </resultMap>

    <select id="selectAll" resultMap="BaseResultMap">
        SELECT id, username, email, created_at FROM users
    </select>

    <select id="selectById" parameterType="java.lang.Long" resultMap="BaseResultMap">
        SELECT id, username, email, created_at FROM users WHERE id = #{id}
    </select>

    <insert id="insert" parameterType="com.example.model.User" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (username, email, created_at)
        VALUES (#{username}, #{email}, #{createdAt})
    </insert>

    <update id="update" parameterType="com.example.model.User">
        UPDATE users
        SET username = #{username},
            email = #{email}
        WHERE id = #{id}
    </update>

    <delete id="deleteById" parameterType="java.lang.Long">
        DELETE FROM users WHERE id = #{id}
    </delete>

</mapper>
```

## Using with Spring Boot

### Application Configuration

```yaml
# application.yml
justdb:
  enabled: true
  locations: classpath:justdb
```

### Entity Scan Configuration

```java
@SpringBootApplication
@EntityScan("com.example.model")
@MapperScan("com.example.mapper")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### Repository Example

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByEmailContaining(String email);
}
```

## Programmatic Usage

### Generate Entities in Code

```java
import org.verydb.justdb.orm.OrmIntegration;
import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.SchemaLoader;

// Load schema
Justdb schema = SchemaLoader.loadFromFile("schema.xml");

// Generate JPA entities
List<EntityGenerationResult> jpaEntities =
    OrmIntegration.generateEntitiesFromSchema(schema, "JPA_ENTITY");

// Generate MyBatis beans
List<EntityGenerationResult> mybatisBeans =
    OrmIntegration.generateEntitiesFromSchema(schema, "MYBATIS_BEAN");

// Generate MyBatis mapping files
List<String> mappings =
    OrmIntegration.generateMyBatisMappingsFromSchema(schema);

// Write to files
for (EntityGenerationResult result : jpaEntities) {
    Path path = Paths.get("src/main/java/" + result.getFilePath());
    Files.createDirectories(path.getParent());
    Files.write(path, result.getContent().getBytes());
}
```

## Advanced Features

### Custom Package Names

```bash
justdb schema2orm \
  --input schema.xml \
  --type jpa-entity \
  --output src/main/java/ \
  --package com.example.entities
```

### Naming Strategy

JustDB supports multiple naming conventions:

```bash
justdb schema2orm \
  --input schema.xml \
  --type jpa-entity \
  --naming-convention camelCase \
  --output src/main/java/
```

### Lombok Integration

JustDB can generate Lombok-annotated entities:

```java
@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false)
    private String username;
}
```

## Best Practices

### 1. Use JustDB with Spring Data JPA

```java
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring automatically implements CRUD operations
}
```

### 2. Combine with MyBatis for Complex Queries

```java
@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE username LIKE CONCAT('%', #{keyword}, '%')")
    List<User> searchByKeyword(String keyword);
}
```

### 3. Use Schema Comments as Javadoc

```xml
<Column name="username" type="VARCHAR(50)"
        comment="用户名，唯一且不能为空"/>
```

Generated Javadoc:

```java
/**
 * 用户名，唯一且不能为空
 */
@Column(name = "username", nullable = false)
private String username;
```

## Migration from Existing Code

### Reverse Engineer from Entities

JustDB can generate schema from existing entity classes:

```java
// Generate JustDB schema from entity class
Justdb schema = OrmIntegration.generateSchemaFromEntity(User.class);

// Save to file
FormatFactory.saveToFile(schema, "schema.xml", Format.XML);
```

### From Existing Database

```bash
# Extract schema from database
justdb db2schema \
  --db-url "jdbc:mysql://localhost:3306/mydb" \
  --username root \
  --password password \
  --output schema.xml

# Generate entities
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/
```

## Related Documentation

- [Python ORM Guide](./python.md)
- [TypeScript ORM Guide](./typescript.md)
- [Go ORM Guide](./go.md)
- [Schema Definition](../../reference/schema/)
- [CLI Commands](../../reference/cli/commands.md)

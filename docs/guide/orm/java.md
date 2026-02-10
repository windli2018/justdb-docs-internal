---
icon: java
title: Java ORM 集成
description: 从 JustDB Schema 生成 JPA/Hibernate 和 MyBatis 模型
order: 1
---

# Java ORM 集成

JustDB 支持为主流 Java ORM 框架生成实体类和 MyBatis 映射文件，包括 JPA/Hibernate 和 MyBatis。

## 支持的框架

| 框架 | 描述 | 模板类型 |
|------|------|----------|
| **JPA/Hibernate** | Java 持久化 API 标准，Hibernate 实现 | `jpa-entity` |
| **MyBatis** | SQL 映射框架，灵活的 SQL 控制 | `mybatis-bean` |

## 快速开始

### 生成 JPA 实体

```bash
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/
```

**生成的 JPA 实体示例：**

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

### 生成 MyBatis Bean

```bash
justdb schema2orm --input schema.xml --type mybatis-bean --output src/main/java/
```

**生成的 MyBatis Bean 示例：**

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

## 类型映射

JustDB 自动将数据库类型映射为合适的 Java 类型：

| 数据库类型 | Java 类型 (JPA) | Java 类型 (MyBatis) |
|----------|-----------------|---------------------|
| BIGINT | `Long` | `Long` |
| INTEGER | `Integer` | `Integer` |
| VARCHAR | `String` | `String` |
| TEXT | `String` | `String` |
| TIMESTAMP | `LocalDateTime` | `LocalDateTime` |
| DATE | `LocalDate` | `LocalDate` |
| BOOLEAN | `Boolean` | `Boolean` |
| DECIMAL | `BigDecimal` | `BigDecimal` |
| BLOB | `byte[]` | `byte[]` |

## JPA/Hibernate 特性

### 实体注解

JustDB 生成完整的 JPA 注解：

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

### 关系映射

外键自动转换为 JPA 关系：

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
// 生成的带关系的 JPA 实体
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

## MyBatis 特性

### MyBatis 映射文件

JustDB 可以生成 MyBatis XML 映射文件：

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

## 与 Spring Boot 集成

### 应用配置

```yaml
# application.yml
justdb:
  enabled: true
  locations: classpath:justdb
```

### 实体扫描配置

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

### Repository 示例

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User&gt;> findByEmailContaining(String email);
}
```

## 编程方式使用

### 在代码中生成实体

```java
import ai.justdb.justdb.orm.OrmIntegration;
import ai.justdb.justdb.schema.Justdb;
import ai.justdb.justdb.SchemaLoader;

// 加载 Schema
Justdb schema = SchemaLoader.loadFromFile("schema.xml");

// 生成 JPA 实体
List<EntityGenerationResult&gt;> jpaEntities =
    OrmIntegration.generateEntitiesFromSchema(schema, "JPA_ENTITY");

// 生成 MyBatis Bean
List<EntityGenerationResult&gt;> mybatisBeans =
    OrmIntegration.generateEntitiesFromSchema(schema, "MYBATIS_BEAN");

// 生成 MyBatis 映射文件
List&lt;String&gt; mappings =
    OrmIntegration.generateMyBatisMappingsFromSchema(schema);

// 写入文件
for (EntityGenerationResult result : jpaEntities) {
    Path path = Paths.get("src/main/java/" + result.getFilePath());
    Files.createDirectories(path.getParent());
    Files.write(path, result.getContent().getBytes());
}
```

## 高级特性

### 自定义包名

```bash
justdb schema2orm \
  --input schema.xml \
  --type jpa-entity \
  --output src/main/java/ \
  --package com.example.entities
```

### 命名策略

JustDB 支持多种命名约定：

```bash
justdb schema2orm \
  --input schema.xml \
  --type jpa-entity \
  --naming-convention camelCase \
  --output src/main/java/
```

### Lombok 集成

JustDB 可以生成带 Lombok 注解的实体：

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

## 最佳实践

### 1. 结合 Spring Data JPA 使用

```java
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring 自动实现 CRUD 操作
}
```

### 2. 结合 MyBatis 处理复杂查询

```java
@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE username LIKE CONCAT('%', #{keyword}, '%')")
    List<User&gt;> searchByKeyword(String keyword);
}
```

### 3. 使用 Schema 注释作为 Javadoc

```xml
<Column name="username" type="VARCHAR(50)"
        comment="用户名，唯一且不能为空"/>
```

生成的 Javadoc：

```java
/**
 * 用户名，唯一且不能为空
 */
@Column(name = "username", nullable = false)
private String username;
```

## 从现有代码迁移

### 从实体逆向生成 Schema

JustDB 可以从现有实体类生成 Schema：

```java
// 从实体类生成 JustDB Schema
Justdb schema = OrmIntegration.generateSchemaFromEntity(User.class);

// 保存到文件
FormatFactory.saveToFile(schema, "schema.xml", Format.XML);
```

### 从现有数据库生成

```bash
# 从数据库提取 Schema
justdb db2schema \
  --db-url "jdbc:mysql://localhost:3306/mydb" \
  --username root \
  --password password \
  --output schema.xml

# 生成实体
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/
```

## 相关文档

- [Python ORM 指南](./python.md)
- [TypeScript ORM 指南](./typescript.md)
- [Go ORM 指南](./go.md)
- [Schema 定义](../../reference/schema/)
- [CLI 命令](../../reference/cli/commands.md)

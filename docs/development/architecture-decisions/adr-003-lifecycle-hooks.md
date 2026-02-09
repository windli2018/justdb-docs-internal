---
icon: link
title: ADR-003 生命周期钩子
order: 4
category:
  - 架构决策
  - 开发指南
tag:
  - ADR
  - 生命周期
  - 钩子
---

# ADR-003: 生命周期钩子

## 状态
**已接受**

## 日期
2024-01-17

## 决策者
- JustDB 架构团队
- 核心开发者

## 背景

数据库 Schema 管理涉及多个操作阶段（创建、修改、删除），用户需要在特定阶段执行自定义逻辑：

1. **前置验证**: 在操作前验证条件
2. **数据迁移**: 在 Schema 变更前后迁移数据
3. **后置清理**: 在操作后清理资源
4. **条件执行**: 根据数据库类型执行不同逻辑
5. **审计日志**: 记录所有变更

需要设计一个灵活的钩子系统来支持这些需求。

## 决策

实施基于 `QueryAble` 基类的生命周期钩子系统：

1. **钩子类型**: 支持前置/后置钩子
2. **钩子阶段**: 支持所有 DDL 操作阶段
3. **条件执行**: 支持基于数据库类型的条件
4. **脚本格式**: 支持 SQL 和 Groovy 脚本

## 钩子阶段

### 支持的钩子阶段

| 操作 | 前置钩子 | 后置钩子 |
|------|----------|----------|
| CREATE | `beforeCreates` | `afterCreates` |
| DROP | `beforeDrops` | `afterDrops` |
| ALTER | `beforeAlters` | `afterAlters` |
| ADD | `beforeAdds` | `afterAdds` |

### 钩子执行顺序

```
beforeCreates (前置)
    ↓
[执行 CREATE 操作]
    ↓
afterCreates (后置)
```

## 理由

### 为什么使用钩子而非继承？

1. **灵活性**: 用户可以在不修改代码的情况下添加逻辑
2. **组合性**: 可以添加多个钩子
3. **解耦**: 钩子逻辑与核心逻辑分离
4. **可维护性**: 易于添加和移除钩子

### 为什么支持 SQL 和 Groovy？

1. **SQL**: 简单的数据库操作，无需编程
2. **Groovy**: 复杂的逻辑，可以访问 Java API

### 为什么使用条件钩子？

1. **数据库特定**: 不同数据库可能需要不同的处理
2. **环境感知**: 可以根据环境执行不同逻辑
3. **灵活控制**: 避免在代码中硬编码分支

## 替代方案

### 方案 A: 事件监听器模式

**描述**: 使用观察者模式，用户注册事件监听器。

**优点**:
- 符合 Java 惯例
- 类型安全
- 易于测试

**缺点**:
- 需要 Java 编程
- 难以在 Schema 文件中定义
- 与 Schema 序列化不兼容

**未被选择的原因**: 不支持声明式定义。

### 方案 B: 责任链模式

**描述**: 使用拦截器链，每个拦截器可以修改或终止操作。

**优点**:
- 灵活的控制流
- 支持操作修改

**缺点**:
- 复杂度高
- 难以理解和调试
- 可能影响性能

**未被选择的原因**: 对于 Schema 管理过于复杂。

### 方案 C: AOP（面向切面编程）

**描述**: 使用 AOP 框架如 Spring AOP 或 AspectJ。

**优点**:
- 强大的切面功能
- 与 Spring 集成良好

**缺点**:
- 需要额外的依赖
- 调试困难
- 学习曲线陡峭

**未被选择的原因**: 过于重量级。

## 钩子设计

### 钩子数据结构

```java
public class ConditionalSqlScript {
    /**
     * SQL 脚本内容
     */
    @JsonProperty("sql")
    private String sql;

    /**
     * Groovy 脚本内容
     */
    @JsonProperty("groovy")
    private String groovy;

    /**
     * 适用数据库类型
     */
    @JsonProperty("dbms")
    private String dbms;

    /**
     * 执行条件（SpEL 表达式）
     */
    @JsonProperty("condition")
    private String condition;
}
```

### 钩子定义（YAML）

```yaml
Table:
  - name: users
    beforeCreates:
      - sql: "CREATE TABLE audit_log (...)"
        dbms: "mysql"
      - groovy: |
          // 验证表不存在
          def tables = sql.connection.metaData.getTables(null, null, 'users', null)
          if (tables.next()) {
              throw new Exception('Table already exists')
          }
    afterCreates:
      - sql: "INSERT INTO audit_log (action, table_name) VALUES ('CREATE', 'users')"
```

### 钩子执行

```java
public class SchemaDeployer {
    public void deploy(Table table) {
        // 执行前置钩子
        executeHooks(table.getBeforeCreates(), table);

        try {
            // 执行创建操作
            createTable(table);

            // 执行后置钩子
            executeHooks(table.getAfterCreates(), table);
        } catch (Exception e) {
            // 错误处理
            throw new DeploymentException("Failed to deploy table: " + table.getName(), e);
        }
    }
}
```

## 后果

### 正面影响

1. **灵活性**: 用户可以在不修改代码的情况下添加逻辑
2. **可扩展性**: 易于添加新的钩子类型
3. **声明式**: 在 Schema 文件中定义，易于理解
4. **数据库感知**: 支持数据库特定的逻辑

### 负面影响

1. **复杂性**: 增加了系统的复杂度
2. **调试困难**: 钩子执行可能难以追踪
3. **性能开销**: 钩子执行增加额外开销

### 风险

- **钩子错误**: 用户定义的钩子可能包含错误
  - *缓解措施*: 提供钩子验证和测试工具

- **执行顺序**: 多个钩子的执行顺序可能不确定
  - *缓解措施*: 明确定义钩子执行顺序

- **安全性**: Groovy 脚本可能执行危险操作
  - *缓解措施*: 提供 Groovy 沙箱选项

## 最佳实践

1. **保持简单**: 钩子逻辑应该简单明了
2. **错误处理**: 钩子中应该处理可能的错误
3. **幂等性**: 钩子应该是幂等的，可以安全重复执行
4. **文档化**: 在 Schema 文件中注释钩子的用途

## 示例

### 数据迁移钩子

```yaml
Table:
  - name: users
    formerNames: [user]
    beforeAlters:
      - sql: |
          -- 将旧表数据迁移到新表
          INSERT INTO users (id, name, email)
          SELECT id, user_name, email_address FROM user;
    afterAlters:
      - sql: |
          -- 删除旧表
          DROP TABLE user;
```

### 验证钩子

```yaml
Table:
  - name: users
    beforeCreates:
      - groovy: |
          // 验证表名不以数字开头
          if (table.name =~ /^\d/) {
              throw new IllegalArgumentException('Table name cannot start with a number')
          }
```

## 实施

1. **阶段 1**: 定义钩子数据结构
2. **阶段 2**: 实现 `QueryAble` 基类钩子支持
3. **阶段 3**: 实现钩子执行引擎
4. **阶段 4**: 添加 SQL 和 Groovy 脚本支持
5. **阶段 5**: 实现条件执行
6. **阶段 6**: 编写文档和测试

## 相关决策

- [ADR-001: 别名系统](./adr-001-alias-system.md) - 钩子名称使用规范命名
- [ADR-002: 模板引擎选择](./adr-002-template-engine.md) - 钩子中的模板支持

## 参考资料

- [生命周期钩子设计](../../design/schema-system/overview.md#lifecycle-hooks)
- [条件 SQL 脚本](../../design/migration-system/overview.md#conditional-execution)

## 下一步

- [ADR-001: 别名系统](./adr-001-alias-system.md) - 查看别名系统决策
- [ADR-002: 模板引擎选择](./adr-002-template-engine.md) - 查看模板引擎决策

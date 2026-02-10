---
icon: at
title: ADR-001 别名系统
order: 2
category:
  - 架构决策
  - 开发指南
tag:
  - ADR
  - 别名系统
  - schema
---

# ADR-001: 别名系统

## 状态
**已接受**

## 日期
2024-01-15

## 决策者
- JustDB 架构团队
- 核心开发者

## 背景

JustDB 支持多种 Schema 序列化格式（XML、JSON、YAML、TOML）。不同格式有不同的命名约定：

- XML: 属性名通常使用连字符（kebab-case）
- JSON: 通常使用驼峰命名（camelCase）或下划线（snake_case）
- YAML: 支持多种命名风格
- TOML: 通常使用下划线（snake_case）

此外，用户可能使用不同的字段名表示相同的概念（例如 `refId` vs `referenceId`）。

为了支持灵活的输入和规范的输出，需要一个别名系统。

## 决策

实施基于 Jackson `@JsonAlias` 注解的别名系统：

1. **规范命名**: 使用 camelCase 作为规范字段名
2. **向后兼容**: 通过 `@JsonAlias` 支持别名
3. **规范化输出**: 序列化时仅使用规范名称
4. **SQL 标准术语**: 新字段优先使用 SQL 标准术语

## 理由

### 为什么选择 JsonAlias？

1. **零侵入**: 利用 Jackson 现有功能，无需自定义代码
2. **类型安全**: 编译时检查，减少运行时错误
3. **性能优越**: 无运行时反射开销
4. **文档化**: 注解即文档，清晰可见

### 为什么使用 camelCase 作为规范？

1. **Java 约定**: 与 Java 字段命名保持一致
2. **JSON 标准**: JSON 社区普遍采用 camelCase
3. **可读性**: 对英语使用者友好
4. **工具支持**: 大多数代码生成工具默认输出 camelCase

## 替代方案

### 方案 A: 自定义反序列化器

**描述**: 实现自定义的 Jackson 反序列化器，处理所有别名逻辑。

**优点**:
- 完全控制反序列化逻辑
- 可以添加额外的验证规则

**缺点**:
- 需要维护大量自定义代码
- 性能开销较大
- 容易出错

**未被选择的原因**: 过于复杂，Jackson 注解已足够。

### 方案 B: 运行时别名映射

**描述**: 在运行时维护别名到规范名称的映射表。

**优点**:
- 灵活，可以动态添加别名
- 不需要重新编译

**缺点**:
- 性能开销
- 类型不安全
- 难以维护

**未被选择的原因**: 性能和类型安全问题。

### 方案 C: 无别名系统

**描述**: 强制用户使用规范命名。

**优点**:
- 实现简单
- 无歧义

**缺点**:
- 用户体验差
- 迁移成本高
- 不符合渐进增强原则

**未被选择的原因**: 对用户不友好。

## 后果

### 正面影响

1. **灵活性**: 用户可以使用自己喜欢的命名风格
2. **兼容性**: 支持从其他工具迁移的 Schema
3. **规范化**: 输出始终保持一致
4. **可维护性**: 新字段遵循统一的命名规范

### 负面影响

1. **学习曲线**: 开发者需要记住规范名称
2. **文档维护**: 需要记录所有支持的别名

### 风险

- **别名冲突**: 不同用户可能希望使用相同的别名表示不同含义
  - *缓解措施*: 在文档中明确列出所有别名，鼓励使用规范名称

## 示例实现

```java
public class Table extends QueryAble {
    /**
     * Reference to a globally defined column template.
     * Canonical name: referenceId
     * Aliases: refId, ref-id, ref_id
     */
    @XmlAttribute(name = "ref-id")
    @JsonProperty("referenceId")
    @JsonAlias({"refId", "ref-id", "ref_id"})
    private String referenceId;

    /**
     * Former names of this table for rename tracking.
     * Canonical name: formerNames
     * Aliases: oldNames, oldName, formerName, previousNames
     */
    @XmlAttribute(name = "former-names")
    @JsonProperty("formerNames")
    @JsonAlias({"oldNames", "oldName", "formerName", "previousNames"})
    private List&lt;String&gt; formerNames = new ArrayList&lt;&gt;();
}
```

## 命名约定

### 规范命名规则

1. **使用 camelCase**: `tableName`, `columnType`
2. **集合使用复数**: `columns`, `tables`
3. **布尔值使用 is/has 前缀**: `nullable`, `autoIncrement`
4. **SQL 标准术语**: `referencedTable` (而非 `foreignTable`)

### 常用别名

| 规范名称 | 支持的别名 |
|----------|------------|
| `referenceId` | `refId`, `ref-id`, `ref_id` |
| `formerNames` | `oldNames`, `oldName`, `formerName`, `previousNames` |
| `beforeCreates` | `beforeCreate`, `preCreate` |
| `afterCreates` | `afterCreate`, `postCreate` |
| `referencedTable` | `foreignTable`, `refTable` |

## 实施

1. **阶段 1**: 定义规范命名约定
2. **阶段 2**: 在所有 Schema 类中添加 `@JsonAlias` 注解
3. **阶段 3**: 编写测试验证别名解析
4. **阶段 4**: 更新文档说明别名系统
5. **阶段 5**: 保持新字段遵循约定

## 相关决策

- [ADR-002: 模板引擎选择](./adr-002-template-engine.md) - 模板系统使用相同的别名概念
- [ADR-003: 生命周期钩子](./adr-003-lifecycle-hooks.md) - 钩子名称使用规范命名

## 参考资料

- [Jackson Annotations](https://github.com/FasterXML/jackson-annotations)
- [Schema 结构文档](../../design/schema-system/alias-system.md)
- [CLAUDE.md - 编码规则](https://github.com/verydb/justdb/blob/main/CLAUDE.md)

## 下一步

- [ADR-002: 模板引擎选择](./adr-002-template-engine.md) - 查看模板引擎决策
- [ADR-003: 生命周期钩子](./adr-003-lifecycle-hooks.md) - 查看生命周期钩子设计

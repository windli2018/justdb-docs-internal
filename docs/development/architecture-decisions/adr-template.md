---
icon: scroll
title: ADR 模板
order: 1
category:
  - 架构决策
  - 开发指南
tag:
  - ADR
  - 架构
  - 决策
---

# ADR 模板

本文档是架构决策记录 (Architecture Decision Record, ADR) 的模板。

## ADR 是什么？

ADR 是记录重要架构决策的文档，包含：

- 决策的背景和上下文
- 考虑的替代方案
- 决策的理由和后果
- 决策的状态

## 为什么使用 ADR？

- **知识传递**: 新团队成员了解设计决策
- **决策追溯**: 理解为什么做某些选择
- **避免重复讨论**: 防止重新讨论已解决的问题
- **文档化演进**: 记录架构的演变历史

## ADR 状态

| 状态 | 说明 |
|------|------|
| **提议** | 正在讨论中 |
| **已接受** | 已决定并实施 |
| **已弃用** | 不再使用，但保留在系统中 |
| **已替代** | 被新决策替代 |
| **已拒绝** | 考虑后未采纳 |

## ADR 模板

```markdown
# ADR-XXX: [决策标题]

## 状态
[提议 / 已接受 / 已弃用 / 已替代 / 已拒绝]

## 日期
YYYY-MM-DD

## 决策者
- [主要决策者 1]
- [主要决策者 2]

## 背景
[描述导致此决策的上下文和问题]

## 决策
[清晰陈述决策内容]

## 理由
[解释为什么做出此决策]

## 替代方案
### 方案 A: [方案名称]
**描述**: [方案描述]
**优点**: [优点列表]
**缺点**: [缺点列表]
**未被选择的原因**: [解释]

### 方案 B: [方案名称]
**描述**: [方案描述]
**优点**: [优点列表]
**缺点**: [缺点列表]
**未被选择的原因**: [解释]

## 后果
### 正面影响
- [影响 1]
- [影响 2]

### 负面影响
- [影响 1]
- [影响 2]

### 风险
- [风险 1] - [缓解措施]
- [风险 2] - [缓解措施]

## 实施
[描述实施计划和步骤]

## 相关决策
- [ADR-XXX]: [相关决策]
- [ADR-XXX]: [相关决策]

## 参考资料
- [链接 1]
- [链接 2]
```

## 使用指南

### 1. 创建新 ADR

从 ADR 模板开始，填充内容：

```bash
# 复制模板
cp adr-template.md adr-004-new-decision.md
```

### 2. ADR 编号

使用递增的编号：

```
adr-001-alias-system.md
adr-002-template-engine.md
adr-003-lifecycle-hooks.md
adr-004-new-decision.md
```

### 3. ADR 状态管理

更新 ADR 状态时：

1. 在文档顶部更新状态
2. 在目录中添加状态标记
3. 如被替代，链接到新 ADR

### 4. ADR 审查

- 定期审查已接受的 ADR
- 更新过时的 ADR
- 标记已弃用的决策

## 示例

### ADR-001: 别名系统

查看完整的 ADR 示例：
- [ADR-001: 别名系统](./adr-001-alias-system.md)
- [ADR-002: 模板引擎选择](./adr-002-template-engine.md)
- [ADR-003: 生命周期钩子](./adr-003-lifecycle-hooks.md)

## 最佳实践

1. **及时记录**: 在决策时记录，不要事后补充
2. **保持简洁**: 关注重要决策，避免过度记录
3. **定期审查**: 每季度审查 ADR 的有效性
4. **版本控制**: 所有 ADR 都应在 Git 中追踪
5. **易于查找**: 使用清晰的标题和标签

## 相关资源

- [Architecture Decision Records](https://adr.github.io/)
- [Lightweight Architecture Decision Records](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)

## 下一步

- [ADR-001: 别名系统](./adr-001-alias-system.md) - 查看第一个决策记录
- [ADR-002: 模板引擎选择](./adr-002-template-engine.md) - 模板引擎决策
- [ADR-003: 生命周期钩子](./adr-003-lifecycle-hooks.md) - 生命周期钩子设计

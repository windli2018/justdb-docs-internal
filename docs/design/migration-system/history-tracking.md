---
icon: clock
title: 历史追踪
order: 4
category:
  - 设计文档
  - 迁移系统
tag:
  - history
  - tracking
---

# 历史追踪

历史追踪机制记录所有 Schema 变更，提供完整的审计轨迹。

## 追踪信息

### 变更记录

- **变更时间**：记录变更发生时间
- **变更内容**：记录具体的变更内容
- **变更原因**：记录变更的原因（可选）
- **执行结果**：记录变更的执行结果

### 查询历史

```bash
# 查看迁移历史
justdb history list

# 查看特定迁移
justdb history show <migration-id>
```

## 相关文档

- [历史服务](../history-service/overview.md) - 历史服务概述

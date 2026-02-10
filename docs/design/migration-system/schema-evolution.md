---
icon: arrows-rotate
title: Schema 演进
order: 3
category:
  - 设计文档
  - 迁移系统
tag:
  - evolution
  - migration
---

# Schema 演进

Schema 演进机制负责管理 Schema 的变更过程，保证数据安全和一致性。

## 演进策略

### 安全演进

- **类型转换**：支持安全的数据类型转换
- **数据保留**：演进过程中保留现有数据
- **增量更新**：最小化对生产环境的影响

### 演进操作

- **添加列**：支持默认值
- **修改列类型**：支持类型转换
- **重命名表/列**：通过 formerNames 追踪
- **删除对象**：支持安全删除（备份机制）

## 相关文档

- [Schema 演进](../schema-system/schema-evolution.md) - Schema 系统演进

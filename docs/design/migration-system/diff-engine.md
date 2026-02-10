---
icon: git-compare
title: 差异引擎
order: 2
category:
  - 设计文档
  - 迁移系统
tag:
  - diff
  - migration
---

# 差异引擎

差异引擎负责计算两个 Schema 状态之间的差异，生成增量迁移脚本。

## 差异计算

### 变更类型

- **ADDED**: 新增对象
- **REMOVED**: 删除对象
- **MODIFIED**: 修改对象
- **RENAMED**: 重命名对象

### 差异算法

1. **对象匹配**：通过名称和 referenceId 匹配对象
2. **属性比较**：比较对象属性差异
3. **依赖分析**：分析变更依赖关系
4. **变更排序**：按依赖关系排序变更

## 相关文档

- [Schema 演进](../schema-system/schema-evolution.md) - Schema 演进机制

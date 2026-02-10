---
icon: clock-rotate-left
title: 历史服务概述
order: 1
category:
  - 设计文档
  - 历史服务
tag:
  - history
  - architecture
---

# 历史服务概述

历史服务负责追踪和管理 Schema 的变更历史，提供完整的审计轨迹和回滚能力。

## 核心功能

- **变更追踪**：记录所有 Schema 变更
- **历史查询**：查询任意时间点的 Schema 状态
- **回滚支持**：支持回滚到历史版本
- **审计日志**：完整的操作审计记录

## 相关文档

- [架构设计](./architecture.md) - 历史服务架构设计
- [基于 Hash 的历史](./hash-based-history.md) - Hash 历史实现详情

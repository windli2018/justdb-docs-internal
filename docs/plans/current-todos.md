---
title: 当前 TODO
icon: ✅
description: JustDB 项目当前开发任务列表，按优先级组织
---

# 当前 TODO

本文档列出了 JustDB 项目当前的开发任务，按优先级组织。社区贡献欢迎！

## 🔥 高优先级

### JDBC 驱动完善

**预计工时**: 2-3 周

- [ ] **多 Schema 加载支持**
  - JustDB JDBC 允许加载多个 schema，每个模拟一个库
  - 支持连接 URL 配置多个 Schema 文件
  - 实现 Schema 隔离和跨 Schema 查询

- [ ] **Merge Migrate 模式**
  - 添加 merge migrate 模式到 JDBC 驱动
  - 支持增量数据合并
  - 处理冲突数据

- [ ] **数据条件过滤**
  - 实现 Data 节点的 condition 逻辑
  - 支持一个表的多个 Data 列表
  - 条件按 SQL WHERE 解析和执行
  - Query 从所有 Data 查询并合并结果

- [ ] **完整函数支持**
  - 支持 MySQL、PostgreSQL、Oracle 所有函数
  - 基于 Calcite 函数注册
  - 自定义函数扩展

### CLI 增强

**预计工时**: 1-2 周

- [ ] **init 命令**
  - 在 CLI 和 interactive 模式增加 init 命令
  - 创建完整功能的 JustDB Schema
  - 支持 --project 和 --format 参数
  - 生成示例表和数据
  - 默认路径: `{projectname}/justdb.yml`

- [ ] **默认加载机制**
  - 增加默认加载的数据库 Schema 文件机制
  - 支持项目根目录自动发现
  - 可配置的搜索路径

- [ ] **Command Line 调整**
  - 优化 CLI 命令结构
  - 改进帮助信息
  - 统一参数命名

## ⚡ 中优先级

### Spring Boot 集成

**预计工时**: 2-3 周

- [ ] **justdb-spring-boot-starter**
  - Spring Boot 自动配置
  - 配置属性绑定 (justdb.*)
  - 条件装配支持

- [ ] **事务集成**
  - Spring 事务管理器集成
  - 编程式事务支持
  - @Transactional 注解支持

- [ ] **Actuator 集成**
  - 健康检查端点
  - 指标收集
  - Schema 状态信息

- [ ] **ORM 集成**
  - MyBatis Plus 集成
  - Spring Data JPA 兼容层
  - 多数据源支持

### 性能优化

**预计工时**: 2-3 周

- [ ] **大型项目支持**
  - 流式加载 Schema，避免一次性加载到内存
  - 分页处理 Data 数据
  - 延迟加载机制

- [ ] **计算 Hash 优化**
  - 计算 hash 时忽略 remark
  - 提高差异检测性能
  - 缓存机制

- [ ] **SQL 生成优化**
  - 模板编译缓存
  - 批量操作优化
  - 减少字符串拼接

### 测试完善

**预计工时**: 1-2 周

- [ ] **Testcontainers 标准化**
  - 统一 Testcontainers 使用模式
  - 所有数据库集成测试标准化
  - 测试数据管理

- [ ] **覆盖率提升**
  - 核心模块测试覆盖率 > 80%
  - 边界情况测试
  - 集成测试补充

## 💡 低优先级

### 文档完善

**预计工时**: 1 周

- [ ] **API 文档生成**
  - 自动生成 API 文档
  - JavaDoc 补充
  - 示例代码完善

- [ ] **教程和示例**
  - 快速入门教程
  - 常见场景示例
  - 最佳实践文档

- [ ] **多语言支持**
  - 系统支持多语言
  - 中英文文档对照
  - 国际化 (i18n)

### 功能增强

**预计工时**: 按需

- [ ] **Schema 嵌套创建**
  - 设计 JustDB 对象的嵌套结构
  - 连续创建结构方案
  - 嵌套验证机制

- [ ] **模板系统独立**
  - 模板系统单独拿出来可以任意使用
  - 独立的模板引擎模块
  - 外部集成 API

- [ ] **扩展 Script 插件**
  - 扩展支持更多的文本类型
  - 自定义脚本语言
  - 动态脚本加载

- [ ] **Import/Include/Ref-id 支持**
  - Schema 文件引用机制
  - 循环引用检测
  - 依赖管理

## 🤝 社区贡献欢迎

以下任务特别适合社区贡献：

### 文档相关

- [ ] 补充使用案例和示例
- [ ] 翻译文档到其他语言
- [ ] 录制视频教程
- [ ] 编写博客文章

### 测试相关

- [ ] 提供更多数据库的测试环境
- [ ] 编写边界测试用例
- [ ] 性能测试和基准
- [ ] 兼容性测试

### 功能扩展

- [ ] 新数据库适配器
- [ ] 自定义模板贡献
- [ ] 插件开发
- [ ] 工具集成

### Bug 修复

- [ ] 查看 [GitHub Issues](https://github.com/verydb/justdb/issues)
- [ ] 提交 Pull Request
- [ ] 参与代码审查

## 贡献指南

### 如何开始

1. **选择任务**
   - 从上述列表中选择感兴趣的任务
   - 在 GitHub Issue 中认领或创建新 Issue

2. **讨论方案**
   - 在 Issue 中讨论实现方案
   - 等待维护者确认
   - 避免重复工作

3. **开发实现**
   - Fork 项目并创建分支
   - 遵循代码规范 (参见 [CLAUDE.md](https://github.com/verydb/justdb/blob/main/CLAUDE.md))
   - 编写测试

4. **提交 PR**
   - 提交 Pull Request
   - 填写 PR 模板
   - 等待代码审查

### 代码规范

- **注释**: 使用英文
- **计划和设计**: 使用中文
- **不硬编码数据库方言**: 使用模板系统
- **不写死 SQL**: 通过模板生成
- **避免 ThreadLocal**: 使用依赖注入

详细规范请参考 [CLAUDE.md](https://github.com/verydb/justdb/blob/main/CLAUDE.md)

### 获取帮助

- GitHub Issues: 技术问题和 Bug 报告
- GitHub Discussions: 功能讨论和疑问
- 邮件: (待添加)

## 相关链接

- [产品路线图](./roadmap.md)
- [历史计划](./historical-plans/)
- [GitHub 项目](https://github.com/verydb/justdb)
- [文档首页](../README.md)

---

**最后更新**: 2026-02-09

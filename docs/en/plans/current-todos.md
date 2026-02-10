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
  - 支持连接 URL 配置多个 Schema 文件：`jdbc:mysql:localhost:33206/projectname`
  - 支持 MySQL `USE` 命令切换库
  - 支持带库前缀的查询
  - 实现 Schema 隔离和跨 Schema 查询

- [ ] **Create 参数支持**
  - JDBC URL 增加 `create=true` 参数
  - 如果指定的文件不存在则自动新建
  - 支持通过 URL 参数指定文件路径

- [ ] **Merge Migrate 模式**
  - 添加 merge migrate 模式到 JDBC 驱动
  - 支持增量数据合并
  - 处理冲突数据
  - 数据结构调整时保留业务数据（rename column、delete column、add column with default）
  - 表拆分场景支持（一个表拆分为两个表）

- [ ] **数据条件过滤**
  - 实现 Data 节点的 condition 逻辑
  - 支持一个表的多个 Data 列表（如 `deleted=0 and is_system=1`）
  - 条件按 SQL WHERE 解析和执行
  - 插入数据时自动匹配合适的 Data 节点，不匹配则创建新的
  - Query 从所有 Data 查询并合并结果
  - Schema diff 和 migrate 都支持此场景

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
  - 按优先级搜索：`justdb/justdb.*`、`db/justdb.*`、`justdb.*`
  - 支持项目根目录自动发现
  - 支持指定 project name 搜索
  - 文件系统和 resources 都搜索
  - interactive 模式增加 load 命令

- [ ] **Command Line 重构**
  - 优化 CLI 命令结构
  - 统一 input/output 参数处理
  - 支持 `diff file1 file2`、`convert input output` 简化语法
  - interactive 下命令省略 input（使用 current schema）
  - 增加 `--config -c` 加载配置文件
  - 自动加载 `~/.justdb-cli.{yaml,json,xml,toml}`
  - 短命令支持（单字符）
  - 短选项优化：`-w` 替代 `--db-password`、`-p` 替代旧密码选项
  - 增加 `--current-database -e` 选项（类似 env）
  - `--verbose` 改为 `-v`，支持多次（-v -v -v = debug）
  - `--output-format -t` 统一格式控制
  - 支持多种 report 格式：text, xml, md, html, json, yaml

- [ ] **JustdbManager/PluginManager 实例统一**
  - 全部不使用 `JustdbManager.getInstance()` 或 `PluginManager.getInstance()`
  - 引入 CliContext 包含 manager、当前 schema、命令参数、CLI 配置
  - 直接运行命令时创建，interactive 里由 interactive 管理
  - 其他命令继承基类
  - EmbeddedServer 传入 justdbmanager/pluginmanager，避免混用
  - 兼容旧构造函数（重载）

- [ ] **SQL Interactive 模式**
  - `sql` 命令不带参数进入 interactive 子命令
  - 只能执行 sql 子命令或直接 sql
  - 重用 interactive 的终端
  - exit/quit/back 退出到上一级 interactive

- [ ] **Show 和 Desc 命令**
  - 不单独使用，作为 sql 的子命令
  - show tables、show databases 等

## ⚡ 中优先级

### Plugin 系统增强

**预计工时**: 2-3 周

- [ ] **Schema 内置 Plugin**
  - Schema 里允许定义 plugin 或者 plugins
  - 正常 plugin 的功能它都有
  - 加载时和 generator 数据时，以自带的 plugins 优先
  - 保留 PluginManager 和 JustdbManager 基础上实现 merged/joint manager
  - 各种方法都是 justdb schema 的优先，有些方法需要合并查找
  - Schema 加载后检查是否有影响反序列化的 extpoint
  - 如有则使用新的 joint manager 重新加载

- [ ] **Adapter 集成 Driver 属性**
  - PluginManager 里的 adapter 集成 drivers 需要的属性
  - 版本号、maven groupid、artifactid 等
  - 不需要任何其他配置
  - 命令行 db2schema、validate、migrate 等支持所有数据库
  - 指定 jdbcurl、username、password 和其他必要连接属性
  - 数据库下载和驱动信息通过 plugin 机制加载

- [ ] **动态 Plugin 加载**
  - 命令行和配置允许配置 0 到多个 plugin jar 或者 url 地址
  - 动态加载这些 plugin
  - 支持 maven url：`maven:groupid:artifactid:version:/pathpattern`
  - 提取为公共能力，schemaload 也用
  - 支持 file 或者其他 url，和 schemaload 类似
  - 允许通过 plugin 扩展下载支持
  - Plugin 里可注册地址前缀：git:, myapp:, oss:, minio, s3 等
  - 使用 common-vfs 或类似机制

- [ ] **Pre-init Schema**
  - plugin、adapter 级别引入 preinit-schema
  - JustDB 对象作为预初始化配置

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
  - include 里加上标记，允许分批加载，直接渲染
  - 分页处理 Data 数据
  - 延迟加载机制

- [ ] **计算 Hash 优化**
  - 计算 hash 时忽略 remark
  - 忽略 unknownattrs 里 `_justdb_` 前缀的数据（临时数据）
  - unknownattrs 增加方法获取用户数据，排除这些
  - 提高差异检测性能
  - 缓存机制

- [ ] **SQL 生成优化**
  - 模板编译缓存
  - 批量操作优化
  - 减少字符串拼接

### 架构重构

**预计工时**: 2-3 周

- [ ] **SchemaLoader 依赖注入**
  - SchemaLoader.loadSchema 不使用 JustdbManager.getInstance()
  - 要求调用者传入 justdbmanager 实例
  - 处理 referenceId，查找引用的全局 column/table 等对象
  - 从引用对象复制缺失属性（如 column 可以没有 type，使用全局的）

- [ ] **模板系统独立**
  - 模板系统单独拿出来可以任意使用
  - 极高可扩展性，用于任意目的
  - 基于 Item/UnknownValues 体系
  - 其他语言可用
  - PluginManager/JustdbManager 可以扩展
  - 解决 getInstance 问题
  - ExtPoint 上下文改为接口传递
  - 核心功能移除 db 相关内容，adapter 可以保留

- [ ] **运行时引擎**
  - justdb-runtime 执行时引擎
  - 做 SQL 转换之类的操作

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
  - `/testcontainers-java/modules` 下所有 container 的支持
  - 不导入 jar 包，配置功能或 maven 地址
  - 创建 UniversalTestcontainersEmbeddedServer
  - 不创建具体 EmbeddedServer（MSSQLServerEmbeddedServer 等）
  - 基于配置覆盖所有数据库
  - TestcontainersModuleParser 使用 FormatFactory
  - cli 增加 testrun 功能
  - 支持任意 schema，指定目标 dbtype 启动 testcontainer
  - 类似 justdb-embedded-mssql 自动下载 jdbc 驱动
  - 完成 schema 到测试数据库的 migrate 操作
  - testrun 增加 keepdata 选项，保留数据
  - 数据库固定挂载在 `.data/{testcontainer-name}` 下
  - 不开启选项时启动时删除目录
  - Provider 类创建和 Container 类直接创建的逻辑优化
  - 如果配置了但 jar 未加载，参考 jdbc databaseconnector 下载加载
  - 默认先用 class.forname，失败则尝试 createContainerFromImage
  - 再失败则下载并加载 maven jar
  - testcontainer.name 使用短名字，和 id 一致
  - testrun 加入 interactive 命令

- [ ] **覆盖率提升**
  - 核心模块测试覆盖率 > 80%
  - 边界情况测试
  - 集成测试补充

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

### 文档与品牌

**预计工时**: 1 周

- [ ] **Logo 设计**
  - 生成 JustDB logo 图片（方形）
  - J 字母在左侧，右侧上半部分 DB，下半部分 ust
  - 通过斜体或其他方式优化
  - DB 右对齐，DB 与 J 之间有留白

- [ ] **官网生成**
  - 中英双语网站（justdb.ai）
  - 参考 https://opencode.ai/
  - 产品介绍、核心优势、工作流程
  - 适用场景、技术栈、开始使用
  - 用户案例、未来展望

- [ ] **API 文档生成**
  - 自动生成 API 文档
  - JavaDoc 补充
  - 示例代码完善

- [ ] **多语言支持**
  - 系统支持多语言
  - Maven 插件合并资源或各模块单独多语
  - justdb-core-message、justdb-cli-message 等模块
  - 中英文文档对照
  - 国际化 (i18n)

### 功能增强

**预计工时**: 按需

- [ ] **Schema 嵌套创建**
  - 设计 JustDB 对象的嵌套结构
  - 类似 Builder 模型，但更接近 SQL 规范
  - 支持 create、select 等操作
  - 连续创建结构方案
  - 嵌套验证机制

- [ ] **Import/Include/Ref-id 支持**
  - Schema 文件引用机制
  - include：类似 C++ include，支持相对路径、表达式、绝对路径、URL
  - import：类似 Java import，只是引用属性，需要 namespace
  - ref-id：引用内部或外部对象
  - table 等 include 复制另一个表的所有内部对象
  - 循环引用检测
  - 依赖管理

- [ ] **扩展 Script 插件**
  - 扩展支持更多的文本类型：
    - text：直接返回文本
    - list：多行文本，每行一个元素
    - json/xml/yaml/toml/properties：通过 Jackson 解析
  - 类型识别通过 type 指定：json/Justdb、json/Table、完整类名
  - 用户扩展 helper 返回固定数据时不用写 js 代码
  - 执行时不用加载 js 引擎
  - 直接改 ScriptHelper

- [ ] **关联表数据维护**
  - 设计维护关联表数据的方案（如用户所拥有的角色）
  - 基于 DatabaseExtractor、JustDB JDBC、SchemaDeploy、MigrateService
  - 优化关联表存储（不用 userid+rowid 这种难以维护的 id）
  - 基于规则的数据
  - 支持 condition SQL 执行
  - select user_id from users where user_name = 'xxx' join select role_id from roles where role_name = 'xxx'

- [ ] **外部 ORM 集成（MCP 配置）**
  - 通过外部程序类似 MCP 配置管理其他语言的 ORM 系统
  - 重用 Atlas provider 生成 create table SQL
  - 定义 importer 程序
  - justdb schema 文件支持 include-external
  - 命令行支持 --importerid.command=cmdpath
  - plugin 系统类似 MCP 定义 importer

- [ ] **Data 条件 SQL 更改**
  - data 条件允许 SQL 更改
  - 始终增加一个 justdb 库
  - justdb.datas 查看基本信息
  - 可以通过 SQL 新建、插入、查询、更新
  - 变更 condition 时重新分区数据
  - 数据写入时总是重新分区

- [ ] **ER 图生成**
  - CLI 增加 erd 命令
  - 生成 ER 图（需要 graphviz）
  - 支持 PNG、SVG 格式
  - 示例：`justdb erd -o erd.png`、`justdb erd -f svg -o erd.svg`

### 跨语言支持

**预计工时**: 4-6 周

- [ ] **JavaScript/TypeScript 版本**
  - justdb-docs/ 下有 js 文件，测试兼容性
  - 完备兼容现有的 plugin 系统和 schema 系统而不丢失数据
  - Node.js 版工具
  - 浏览器版工具
  - 类似 SQLPad 和 DrawDB
  - 可以加载、输出 plugins 和 schema，兼容 Java 版

### 架构改进

**预计工时**: 2-3 周

- [ ] **基类设计**
  - Item、Audit 等基类 implement interface
  - Scale 隐式转换
  - 虚接口支持
  - 增加 from、as
  - 基于 module 依赖关系实现
  - justdb 里定义
  - 或直接读编译系统 pom 等

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

---------------------------

**最后更新**: 2026-02-09

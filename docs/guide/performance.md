---
icon: gauge-high
date: 2024-01-01
title: 性能优化
order: 10
category:
  - 指南
  - 性能
tag:
  - 性能
  - 优化
  - 最佳实践
---

# 性能优化

学习如何优化 JustDB 的 Schema 加载、SQL 生成和迁移性能。

## Schema 加载性能

### 文件组织优化

#### 分模块组织

```yaml
# 好的做法：分模块
justdb/
├── core/
│   ├── users.yaml       # 100 行
│   ├── roles.yaml       # 50 行
│   └── permissions.yaml # 30 行
├── business/
│   ├── orders.yaml      # 200 行
│   ├── products.yaml    # 150 行
│   └── payments.yaml    # 100 行
└── config/
    ├── dev.yaml
    └── prod.yaml

# 避免：单文件
justdb/
└── schema.yaml          # 1000+ 行，加载慢
```

#### 延迟加载

```yaml
# config.yaml
schema:
  locations:
    - ./justdb/core       # 核心表优先加载
    - ./justdb/business   # 业务表按需加载
  lazyLoad: true          # 启用延迟加载
```

### 格式选择

**加载速度对比**（从快到慢）：

1. **YAML** - 推荐使用
   - 人类可读
   - 加载速度快
   - 支持注释

2. **JSON** - 机器可读
   - 加载速度快
   - 不支持注释

3. **XML** - 企业级
   - 加载速度中等
   - 支持 Schema 验证

```bash
# YAML（推荐）
justdb migrate justdb/schema.yaml

# JSON
justdb migrate justdb/schema.json

# XML
justdb migrate justdb/schema.xml
```

## SQL 生成性能

### 模板缓存

```java
// 启用模板缓存
TemplateExecutor executor = new TemplateExecutor();
executor.setCacheTemplates(true);  // 默认启用

// 预编译模板
executor.precompileTemplates();
```

### 批量操作

#### 批量生成 SQL

```java
// 好的做法：批量处理
List<Table> tables = schema.getTables();
DBGenerator generator = new DBGenerator(pluginManager, dialect);

// 批量生成
List<String> sqlStatements = generator.generateAll(tables);

// 批量执行
try (Statement stmt = connection.createStatement()) {
    for (String sql : sqlStatements) {
        stmt.addBatch(sql);
    }
    stmt.executeBatch();
}

// 避免：逐个处理
for (Table table : tables) {
    String sql = generator.generate(table);
    try (Statement stmt = connection.createStatement()) {
        stmt.execute(sql);
    }
}
```

### SQL 优化

#### 使用批量插入

```yaml
Table:
  - name: users
    beforeCreates:
      - sql: |
          -- 批量插入模式
          SET SESSION unique_checks=0;
          SET SESSION foreign_key_checks=0;
    afterCreates:
      - sql: |
          -- 恢复默认设置
          SET SESSION unique_checks=1;
          SET SESSION foreign_key_checks=1;
```

#### 优化索引创建

```yaml
Table:
  - name: users
    afterCreates:
      - sql: |
          -- 先创建表
          -- 批量创建索引（比逐个创建快）
          ALTER TABLE users
            ADD INDEX idx_username (username),
            ADD INDEX idx_email (email),
            ADD INDEX idx_phone (phone);
    # 避免：在表定义中逐个创建索引
    Index:
      - name: idx_username
        columns: [username]
      - name: idx_email
        columns: [email]
```

## 迁移性能

### 增量迁移

```bash
# 使用增量迁移而非全量迁移
justdb migrate --incremental

# 只处理变更的部分
# 而非重新处理整个 Schema
```

### 并行处理

```yaml
# config.yaml
migration:
  parallel: true          # 启用并行处理
  threads: 4             # 线程数
  batchSize: 1000        # 批处理大小
```

### 大表处理

#### 分批处理

```sql
-- 分批更新大表
UPDATE users SET status = 1 WHERE id BETWEEN 1 AND 10000;
UPDATE users SET status = 1 WHERE id BETWEEN 10001 AND 20000;
-- 继续分批...
```

#### 使用 pt-online-schema-change

```bash
# 在线修改大表
pt-online-schema-change \
  --alter "ADD COLUMN phone VARCHAR(20)" \
  --charset=utf8mb4 \
  --critical-load="Threads_running=50" \
  --execute \
  D=myapp,t=users
```

### 减少锁表时间

```yaml
Table:
  - name: users
    beforeAlters:
      - sql: |
          -- MySQL: 使用在线 DDL
          SET SESSION alter_algorithm='INPLACE';
          SET SESSION lock_wait_timeout=10;
    Column:
      - name: phone
        type: VARCHAR(20)
```

## 数据库性能

### 索引策略

#### 合理创建索引

```yaml
# 好的做法：选择性高的字段
Index:
  - name: idx_email
    columns: [email]
    unique: true           # email 唯一性高

  - name: idx_user_status
    columns: [user_id, status]
    # 复合索引：高选择性 + 常用查询条件

# 避免：低选择性字段
Index:
  - name: idx_gender
    columns: [gender]
    # gender 只有少数值，索引效果差
```

#### 索引数量控制

```yaml
# 好的做法：控制在 5 个以内
Table:
  - name: users
    Index:
      - name: PRIMARY
        columns: [id]
      - name: idx_username
        columns: [username]
      - name: idx_email
        columns: [email]
      - name: idx_user_status
        columns: [user_id, status]
      - name: idx_created_at
        columns: [created_at]

# 避免：过多索引影响写入性能
```

### 字段类型优化

#### 使用合适的类型

```yaml
Column:
  # 好的做法：使用最小够用的类型
  - name: status
    type: TINYINT          # 只有少量值
    # type: VARCHAR(20)   # 避免：浪费空间

  - name: amount
    type: DECIMAL(12, 2)   # 精确的金额
    # type: FLOAT         # 避免：不精确

  - name: created_at
    type: TIMESTAMP       # 4 字节
    # type: BIGINT        # 8 字节，浪费
```

#### 字符串长度

```yaml
Column:
  # 好的做法：合理的长度
  - name: username
    type: VARCHAR(50)     # 足够且不过长

  - name: email
    type: VARCHAR(100)    # 标准邮箱长度

  # 避免：过长或过短
  - name: phone
    type: VARCHAR(500)    # 过长
    # type: VARCHAR(10)   # 过短
```

### 分区策略

```yaml
Table:
  - name: orders
    comment: 订单表（按月分区）
    partitionBy: RANGE (TO_DAYS(created_at))
    partitions:
      - name: p202401
        value: TO_DAYS('2024-01-31')
      - name: p202402
        value: TO_DAYS('2024-02-29')
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: created_at
        type: TIMESTAMP
```

## JVM 优化

### 内存配置

```bash
# 增加堆内存
export JAVA_OPTS="-Xmx2g -Xms2g"

# 设置 G1 GC
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"

# 优化 GC
export JAVA_OPTS="$JAVA_OPTS -XX:MaxGCPauseMillis=200"
```

### JIT 编译

```bash
# 启用 JIT 编译
export JAVA_OPTS="$JAVA_OPTS -XX:+CompileThreshold=1000"

# 预热 JVM
justdb warmup
justdb migrate
```

## 监控和分析

### 性能监控

```bash
# 启用性能监控
justdb migrate --profile

# 输出：
# [INFO] Schema loading: 123ms
# [INFO] Diff calculation: 45ms
# [INFO] SQL generation: 67ms
# [INFO] Migration execution: 234ms
# [INFO] Total time: 469ms
```

### 慢查询分析

```yaml
# config.yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  options:
    - logSlowQueries=true
    - slowQueryThreshold=1000
```

### 执行计划分析

```bash
# 查看执行计划
justdb explain --sql "SELECT * FROM users WHERE email = 'test@example.com'"

# 输出：
# +----+-------------+-------+------+---------------+
# | id | select_type | table | type | possible_keys |
# +----+-------------+-------+------+---------------+
# |  1 | SIMPLE      | users | ref  | idx_email     |
# +----+-------------+-------+------+---------------+
```

## 最佳实践

### 1. 定期维护

```sql
-- 定期优化表
OPTIMIZE TABLE users;

-- 分析表
ANALYZE TABLE users;

-- 检查表
CHECK TABLE users;
```

### 2. 监控性能

```bash
# 定期检查性能
justdb health --verbose

# 查看统计信息
justdb stats
```

### 3. 缓存策略

```java
// 启用 Schema 缓存
JustdbManager manager = JustdbManager.getInstance();
manager.setCacheEnabled(true);
manager.setCacheSize(100);
```

### 4. 连接池配置

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 5. 批量操作

```java
// 使用批量操作
try (PreparedStatement ps = conn.prepareStatement(
    "INSERT INTO users (username, email) VALUES (?, ?)")) {

    for (User user : users) {
        ps.setString(1, user.getUsername());
        ps.setString(2, user.getEmail());
        ps.addBatch();
    }

    ps.executeBatch();
}
```

## 性能检查清单

### Schema 设计

- [ ] 使用合适的数据类型
- [ ] 字段长度合理
- [ ] 索引数量适中（3-5 个）
- [ ] 索引选择性高
- [ ] 避免过度规范化

### 迁移策略

- [ ] 使用增量迁移
- [ ] 大表分批处理
- [ ] 避免长事务
- [ ] 启用并行处理
- [ ] 减少锁表时间

### 运行时配置

- [ ] JVM 内存充足
- [ ] 连接池配置合理
- [ ] 启用缓存
- [ ] 监控性能指标
- [ ] 定期维护数据库

## 下一步

<VPCard
  title="Docker 部署"
  desc="使用 Docker 优化部署性能"
  link="/guide/docker.html"
/>

<VPCard
  title="配置参考"
  desc="完整的性能配置选项"
  link="/guide/config-reference.html"
/>

<VPCard
  title="API 参考"
  desc="性能相关的 API 文档"
  link="/guide/api-reference.html"
/>

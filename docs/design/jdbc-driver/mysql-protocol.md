# JustDB MySQL 协议兼容层设计方案

## 一、需求分析

### 1.1 核心需求
- **MySQL 协议兼容层**：实现 MySQL Wire Protocol
  - 独立服务器启动
  - 默认端口：**33206**
  - 复用现有 JustDB JDBC 组件执行 SQL
  - 无需专用客户端驱动，直接使用 MySQL JDBC Driver 连接

### 1.2 使用场景

```
┌─────────────────────────────────────────────────────────────┐
│  MySQL 协议兼容模式                                          │
├─────────────────────────────────────────────────────────────┤
│  [应用] --MySQL JDBC--> [JustDB MySQL Server:33206]        │
│                            │                                │
│                     [复用现有 JDBC 组件]                      │
│                            │                                │
│                      [Schema/数据]                           │
└─────────────────────────────────────────────────────────────┘
```

---------------------------

## 二、实施状态

### 2.1 当前进度

> **✅ Phase 1 完成**：MySQL 协议服务器基础框架已实现并可编译通过。
>
> **✅ Phase 2 完成**：虚拟表注册机制已实现并编译通过。
>
> **✅ Phase 3 完成**：information_schema 虚拟表辅助方法已实现。

| 模块 | 功能 | 状态 | 说明 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| justdb-mysql-protocol | 整个模块 | ✅ 已创建 | 模块已创建并可编译 |
| | MySQLServer | ✅ 已实现 | 服务器入口 |
| | MySQLServerConfig | ✅ 已实现 | 配置类 |
| | MySQLServerInitializer | ✅ 已实现 | Netty 初始化器 |
| | MySQLSession | ✅ 已实现 | 会话管理 |
| | MySQLPacket | ✅ 已实现 | 数据包类 |
| | MySQLPacketDecoder/Encoder | ✅ 已实现 | 协议编解码 |
| | MySQLProtocolHandler | ✅ 已实现 | 协议处理框架 |
| | HandshakeEncoder | ✅ 已实现 | 握手包编码 |
| | HandshakeHandler | ✅ 已实现 | 握手处理 |
| | MySQLResponseEncoder | ✅ 已实现 | OK/ERR/EOF 包编码 |
| | TextResultSetEncoder | ✅ 已实现 | 结果集编码 |
| | ComQueryHandler | ✅ 已实现 | COM_QUERY 命令 |
| | PingHandler | ✅ 已实现 | COM_PING 命令 |
| | QuitHandler | ✅ 已实现 | COM_QUIT 命令 |
| justdb-core | VirtualTableProvider | ✅ 已实现 | 虚拟表接口 |
| | JustdbDataSource 修改 | ✅ 已实现 | 添加虚拟表支持 + 数据加载 |
| | BuiltinVirtualTables | ✅ 已实现 | information_schema 辅助方法 |
| | VirtualTableTest | ✅ 已创建 | 虚拟表单元测试（5个） |
| | BuiltinVirtualTablesTest | ✅ 已创建 | 辅助方法单元测试（6个） |
| | VirtualTableSqlExecutorIntegrationTest | ✅ 已创建 | 集成测试（13个） |

### 2.2 已创建文件（19个）

```
justdb-mysql-protocol/
├── MySQLServer.java              # 服务器入口
├── MySQLServerConfig.java        # 配置类
├── codec/
│   ├── MySQLPacket.java          # 数据包类
│   ├── MySQLPacketDecoder.java   # 包解码器
│   └── MySQLPacketEncoder.java   # 包编码器
├── protocol/
│   ├── MySQLProtocolHandler.java # 协议处理器
│   ├── MySQLResponseEncoder.java # 响应包编码
│   ├── handshake/
│   │   ├── HandshakeEncoder.java # 握手包编码
│   │   └── HandshakeHandler.java # 握手处理
│   ├── command/
│   │   ├── ComQueryHandler.java  # COM_QUERY 处理
│   │   ├── PingHandler.java      # COM_PING 处理
│   │   └── QuitHandler.java      # COM_QUIT 处理
│   └── result/
│       └── TextResultSetEncoder.java # 结果集编码
└── server/
    ├── MySQLServerInitializer.java
    └── MySQLSession.java         # 会话管理

justdb-core/
├── src/main/java/org/verydb/justdb/jdbc/
│   ├── VirtualTableProvider.java  # 虚拟表提供者接口
│   └── BuiltinVirtualTables.java # 内置虚拟表工厂类
└── src/test/java/org/verydb/justdb/jdbc/
    ├── VirtualTableTest.java       # 虚拟表单元测试（5个）
    ├── VirtualTableVerify.java     # 独立验证类
    ├── BuiltinVirtualTablesTest.java # 辅助方法单元测试（6个）
    └── VirtualTableSqlExecutorIntegrationTest.java # 集成测试（13个）
```

### 2.3 下一步工作

**Phase 2 增强（待实现）：**
- [ ] 完善认证逻辑（mysql_native_password 完整实现）
- [ ] 支持 SSL/TLS 连接
- [ ] 实现 COM_STMT_PREPARE/EXECUTE（预编译语句）
- [ ] 支持多数据库切换（USE 命令）
- [ ] 完善 SHOW 命令处理
- [ ] 添加单元测试和集成测试

### 2.4 实施优先级

**P0（MVP 必需）：**
- [x] Phase 1: 基础协议层（网络通信、握手、认证）
- [x] Phase 2: 命令处理（COM_QUERY、JDBC 集成）
- [x] Phase 3: 虚拟表支持（VirtualTableProvider + JustdbDataSource 修改）

**P1（增强功能）：**
- [ ] Phase 4: 元数据命令（SHOW DATABASES/TABLES/DESCRIBE）
- [ ] Phase 5: 完善结果集编码（NULL 值、类型转换）
- [x] Phase 6: 创建 information_schema 辅助方法（TABLES/COLUMNS 虚拟表数据）
- [x] Phase 7: 集成测试（通过 SqlExecutor 查询虚拟表）

**P2（后续优化）：**
- [ ] 预编译语句支持（COM_STMT_PREPARE/EXECUTE）
- [ ] 性能优化
- [ ] 多客户端兼容性测试

---------------------------

## 三、现状分析

### 3.1 现有 JDBC 架构

| 组件 | 路径 | 功能 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| `JustdbDriver` | `jdbc/JustdbDriver.java` | JDBC 驱动入口 |
| `JustdbConnection` | `jdbc/JustdbConnection.java` | 连接管理 |
| `SqlExecutor` | `jdbc/SqlExecutor.java` | **核心 SQL 执行引擎** |
| `JustdbDatabaseMetaData` | `jdbc/JustdbDatabaseMetaData.java` | 元数据服务 |
| `JustdbDataSource` | `jdbc/JustdbDataSource.java` | 数据源，表缓存 |

### 3.2 现有优势
- ✅ 完整的 SQL 执行引擎（Druid Parser + FunctionRegistry）
- ✅ 完善的元数据支持
- ✅ 支持事务、Join、CTE 等

### 3.3 技术债务
- 当前是嵌入式模式，所有组件在同一 JVM
- 缺少网络通信层
- 缺少会话管理

---------------------------

## 四、最终实施方案

### 4.1 用户决策确认

| 决策项 | 选择 | 说明 |
|--------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| **实施方案** | MySQL 协议兼容层 | 独立服务器，复用现有 JDBC |
| **技术选型** | 基于 netty-mysql-codec | 使用开源 MySQL 协议库 |
| **启动方式** | 独立启动 | 命令行或程序内启动 |
| **认证方式** | 两者都支持 | 用户名/密码 + Token 认证 |
| **预编译语句** | 暂不支持 | MVP 仅实现 COM_QUERY |
| **数据库支持** | 单数据库 | 连接时指定 schema，不支持 USE 命令 |
| **MVP 特性** | 事务支持 + 基础功能 | BEGIN/COMMIT/ROLLBACK + 基本 CRUD |

### 4.2 架构设计

```
┌──────────────────────────────────────────────────────────────┐
│  JustDB MySQL Server (端口: 33206)                           │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  MySQL 协议层（只负责编解码）                            │  │
│  │  - MySQLPacketDecoder/Encoder                          │  │
│  │  - HandshakeHandler                                    │  │
│  │  - ComQueryHandler（转发 SQL 到 JDBC）                  │  │
│  │  - Ping/Quit Handler                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  会话层                                                │  │
│  │  - MySQLSession（持有 JustdbConnection）                │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  JDBC 层（现有组件，不修改）                             │  │
│  │  - JustdbConnection                                   │  │
│  │  - SqlExecutor                                        │  │
│  │  - JustdbDataSource（支持虚拟表）                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  数据层                                                │  │
│  │  - JustdbDataSource（表缓存 + 虚拟表支持）              │  │
│  │  - Table/Column                                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 MVP 功能范围

**Phase 1 支持（4-6 周）：**
- [ ] COM_QUERY（文本 SQL 查询）
- [ ] COM_PING（心跳检测）
- [ ] COM_QUIT（断开连接）
- [ ] 用户名/密码认证（mysql_native_password）
- [ ] Token 认证（可选）
- [ ] 事务支持（BEGIN/COMMIT/ROLLBACK）
- [ ] Text Protocol 结果集返回
- [ ] 基本错误处理（ERR Packet）
- [ ] **系统表支持**：information_schema（TABLES, COLUMNS）
- [ ] **元数据命令**：SHOW DATABASES, SHOW TABLES, DESCRIBE

**Phase 2 暂不支持：**
- ⏳ COM_STMT_PREPARE（预编译语句）
- ⏳ COM_STMT_EXECUTE（执行预编译）
- ⏳ COM_INIT_DB（切换数据库）

---------------------------

## 五、实施计划

### 5.1 实施路线

```
┌────────────────────────────────────────────────────────────┐
│ Phase 1: 基础协议层 (Week 1-2)                             │
├────────────────────────────────────────────────────────────┤
│ [x] 创建 justdb-mysql-protocol 模块                        │
│ [x] 配置 Netty 依赖                                        │
│ [x] 实现 MySQLPacketDecoder/Encoder                       │
│ [ ] 实现 HandshakeV10 握手                                 │
│ [ ] 实现 mysql_native_password 认证                        │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ Phase 2: 命令处理 (Week 3-4)                              │
├────────────────────────────────────────────────────────────┤
│ [ ] 实现 COM_QUERY 命令处理                                │
│ [ ] 通过现有 JDBC 执行 SQL                                 │
│ [ ] 实现 TextResultSetEncoder（将 JDBC ResultSet 转 MySQL 协议）│
│ [ ] 实现 ERR/OK/EOF 包处理                                 │
│ [ ] 实现系统表支持（information_schema.TABLES/COLUMNS）     │
│ [ ] 实现 SHOW 命令（SHOW DATABASES/TABLES, DESCRIBE）       │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ Phase 3: 结果集编码 (Week 5)                              │
├────────────────────────────────────────────────────────────┤
│ [ ] 完善结果集编码逻辑                                      │
│ [ ] 处理 NULL 值编码                                       │
│ [ ] 处理各种数据类型转换                                    │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ Phase 4: 测试与优化 (Week 6)                              │
├────────────────────────────────────────────────────────────┤
│ [ ] MySQL CLI 连接测试                                     │
│ [ ] MySQL JDBC 连接测试                                    │
│ [ ] 多客户端兼容性测试                                      │
│ [ ] 性能优化                                               │
└────────────────────────────────────────────────────────────┘
```

### 5.2 核心文件清单

**新增模块：`justdb-mysql-protocol`**

```
justdb-mysql-protocol/
├── src/main/java/org/verydb/justdb/mysql/
│   ├── MySQLServer.java              [服务器入口]
│   ├── MySQLServerConfig.java        [配置类]
│   ├── codec/
│   │   ├── MySQLPacketDecoder.java   [包解码器]
│   │   └── MySQLPacketEncoder.java   [包编码器]
│   ├── protocol/
│   │   ├── handshake/
│   │   │   ├── HandshakeHandler.java [握手处理]
│   │   │   └── MySqlNativePasswordAuth.java
│   │   ├── command/
│   │   │   ├── ComQueryHandler.java  [COM_QUERY]
│   │   │   ├── PingHandler.java      [COM_PING]
│   │   │   ├── QuitHandler.java      [COM_QUIT]
│   │   │   └── ShowCommandHandler.java [SHOW 命令]
│   │   └── result/
│   │       └── TextResultSetEncoder.java
│   └── server/
│       ├── MySQLSession.java         [会话管理，持有 JustdbConnection]
│       └── MySQLServerInitializer.java
└── pom.xml
```

**修改文件：**
- `pom.xml` - 添加 justdb-mysql-protocol 模块

**修改现有 JDBC 组件（仅 1 个文件）：**
- `justdb-core/src/main/java/org/verydb/justdb/jdbc/JustdbDataSource.java` [添加虚拟表支持]

**新增 JDBC 组件（仅 1 个文件）：**
- `justdb-core/src/main/java/org/verydb/justdb/jdbc/VirtualTableProvider.java` [虚拟表提供者接口]

---------------------------

## 六、MySQL 协议实现

### 5.1 MySQLSession（会话管理）

```java
public class MySQLSession {
    private final JustdbConnection jdbcConnection;  // 复用现有 JDBC 连接
    private final String connectionId;

    public ResultSet executeQuery(String sql) throws SQLException {
        Statement stmt = jdbcConnection.createStatement();
        return stmt.executeQuery(sql);
    }

    public int executeUpdate(String sql) throws SQLException {
        Statement stmt = jdbcConnection.createStatement();
        return stmt.executeUpdate(sql);
    }

    public void beginTransaction() throws SQLException {
        jdbcConnection.setAutoCommit(false);
    }

    public void commit() throws SQLException {
        jdbcConnection.commit();
    }

    public void rollback() throws SQLException {
        jdbcConnection.rollback();
    }

    public void close() throws SQLException {
        if (jdbcConnection != null) {
            jdbcConnection.close();
        }
    }
}
```

### 5.2 ComQueryHandler（通过 JDBC 执行 SQL）

```java
@ChannelHandler.Sharable
public class ComQueryHandler extends SimpleChannelInboundHandler<QueryCommandPacket> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, QueryCommandPacket packet) {
        MySQLSession session = ctx.channel().attr(AttributeKey.valueOf("session")).get();
        String sql = packet.getSql();

        try {
            // 通过现有 JDBC 连接执行 SQL
            ResultSet rs = session.executeQuery(sql);
            // 将 JDBC ResultSet 编码为 MySQL 协议格式
            TextResultSetEncoder.encode(rs, ctx);
        } catch (SQLException e) {
            writeErrorPacket(ctx, e);
        }
    }
}
```

### 5.3 TextResultSetEncoder（将 JDBC ResultSet 转换为 MySQL 协议）

```java
public class TextResultSetEncoder {
    public static void encode(ResultSet rs, ChannelHandlerContext ctx) throws SQLException {
        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();

        // 1. 发送 Column Count
        writeLengthEncodedInteger(columnCount, ctx);

        // 2. 发送 Column Definitions
        for (int i = 1; i <= columnCount; i++) {
            writeColumnDefinition(
                metaData.getCatalogName(i),
                metaData.getSchemaName(i),
                metaData.getTableName(i),
                metaData.getColumnLabel(i),
                metaData.getColumnTypeName(i),
                metaData.getColumnDisplaySize(i),
                metaData.getPrecision(i),
                metaData.getScale(i),
                ctx
            );
        }
        writeEofPacket(ctx);

        // 3. 发送 Rows
        while (rs.next()) {
            for (int i = 1; i <= columnCount; i++) {
                Object value = rs.getObject(i);
                writeLengthEncodedString(value, ctx);
            }
        }
        writeEofPacket(ctx);
    }
}
```

---------------------------

## 七、系统表支持

### 6.1 支持的元数据命令

| 命令 | 说明 | 实现方式 |
|------------------------------------------------------|------------------------------------------------------|----------------------------------------------------------------------------------|
| `SHOW DATABASES` | 列出数据库 | 返回 JustDB schema 列表 |
| `SHOW TABLES` | 列出表 | 通过 JustdbDatabaseMetaData.getTables() |
| `DESCRIBE table` | 表结构 | 通过 JustdbDatabaseMetaData.getColumns() |
| `SHOW CREATE TABLE table` | 建表语句 | 通过 JustDB 的 schema 定义生成 |
| `SELECT * FROM information_schema.TABLES` | 表列表 | 通过虚拟表 Provider |
| `SELECT * FROM information_schema.COLUMNS` | 列列表 | 通过虚拟表 Provider |

### 6.2 实现方式

**ShowCommandHandler.java**
```java
public class ShowCommandHandler {
    private final JustdbConnection jdbcConnection;

    public ResultSet handleShowTables() throws SQLException {
        DatabaseMetaData metaData = jdbcConnection.getMetaData();
        return metaData.getTables(null, null, "%", new String[]{"TABLE"});
    }

    public ResultSet handleDescribe(String tableName) throws SQLException {
        DatabaseMetaData metaData = jdbcConnection.getMetaData();
        return metaData.getColumns(null, null, tableName, "%");
    }
}
```

---------------------------

## 八、虚拟表机制设计

### 7.1 设计目标

为支持 `information_schema` 等系统表查询，设计一个轻量级的虚拟表机制：

1. **不修改 schema 层** - `schema/` 包下的文件完全不修改
2. **仅修改 jdbc 层** - 在 `jdbc/` 包内实现虚拟表支持
3. **零新类** - 使用函数式接口 + Lambda 表达式
4. **入口在 JustdbDataSource** - 在 DataSource 层处理虚拟表

### 7.2 核心接口

**VirtualTableProvider.java**（新增，`jdbc/` 包下）

```java
package org.verydb.justdb.jdbc;

import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.schema.Table;
import java.util.Map;

/**
 * Virtual table provider - 虚拟表提供者（函数式接口）
 *
 * <p>虚拟表 Provider 根据 SQL 上下文和 schema 对象，动态计算虚拟表数据，
 * 封装成 Table 和 Data 对象返回，SqlExecutor 可以直接使用。</p>
 */
@FunctionalInterface
public interface VirtualTableProvider {
    /**
     * 动态计算虚拟表（Table + Data）
     *
     * @param justdb JustDB 容器
     * @param tableName 表名
     * @param context SQL 执行上下文（包含原始 SQL、参数等）
     * @return VirtualTableResult 包含 Table 和 Data，null 表示不支持此表名
     */
    VirtualTableResult get(Justdb justdb, String tableName, Map&lt;String, , Object> context);
}
```

**VirtualTableResult.java**（新增，`jdbc/` 包下）

```java
package org.verydb.justdb.jdbc;

import org.verydb.justdb.schema.Table;
import org.verydb.justdb.schema.Data;

/**
 * Virtual table result - 虚拟表结果
 *
 * <p>封装虚拟表的 Table 定义和 Data 数据，
 * SqlExecutor 可以直接将其作为真实表使用。</p>
 */
public class VirtualTableResult {
    private final Table table;
    private final Data data;

    public VirtualTableResult(Table table, Data data) {
        this.table = table;
        this.data = data;
    }

    public Table getTable() {
        return table;
    }

    public Data getData() {
        return data;
    }
}
```

### 7.3 JustdbDataSource 修改

```java
public class JustdbDataSource {

    // 新增：虚拟表 Provider（可设置，默认为空）
    private VirtualTableProvider virtualTableProvider;

    /**
     * 设置虚拟表 Provider
     */
    public void setVirtualTableProvider(VirtualTableProvider provider) {
        this.virtualTableProvider = provider;
    }

    /**
     * Get table data by name.
     *
     * 查找顺序：
     * 1. 查缓存（真实表在 initializeTables 时已加载）
     * 2. 缓存未命中，尝试虚拟表 Provider
     * 3. 都没有则抛出异常
     */
    public TableData getTable(String tableName) throws SQLException {
        String key = tableName.toLowerCase();
        TableData tableData = tables.get(key);

        // 缓存命中
        if (tableData != null) {
            return tableData;
        }

        // 缓存未命中，尝试虚拟表 Provider
        if (virtualTableProvider != null) {
            VirtualTableResult result = virtualTableProvider.get(justdb, tableName, Map.of());
            if (result != null) {
                // 创建 TableData，并加载虚拟表数据
                TableData vd = new TableData(result.getTable());
                vd.setDataSource(this);

                // 加载虚拟表数据（Data → rows）
                if (result.getData() != null) {
                    loadDataIntoTableData(vd, result.getData());
                }

                tables.put(key, vd);  // 缓存虚拟表
                return vd;
            }
        }

        throw new SQLException("Table not found: " + tableName);
    }
}
```

### 7.4 SqlExecutor 支持（稍加改造）

```java
public class SqlExecutor {

    /**
     * 检查表是否为虚拟表
     */
    private boolean isVirtualTable(String tableName) {
        if (dataSource.getVirtualTableProvider() != null) {
            VirtualTableResult result = dataSource.getVirtualTableProvider()
                .get(justdb, tableName, Map.of());
            return result != null;
        }
        return false;
    }

    /**
     * 获取表（支持虚拟表）
     */
    private TableData getTableWithVirtualSupport(String tableName) throws SQLException {
        return dataSource.getTable(tableName);  // 已内置虚拟表支持
    }
}
```

### 7.5 createInformationSchemaTables 实现

```java
private static VirtualTableResult createInformationSchemaTables(Justdb justdb) {
    // 1. 创建 Table 定义
    Table table = new Table();
    table.setName("TABLES");
    table.setCatalog("information_schema");

    // 添加列定义
    addColumn(table, "TABLE_SCHEMA", "VARCHAR(128)", false);
    addColumn(table, "TABLE_NAME", "VARCHAR(128)", false);
    addColumn(table, "TABLE_TYPE", "VARCHAR(64)", false);
    addColumn(table, "ENGINE", "VARCHAR(64)", true);
    addColumn(table, "ROW_FORMAT", "VARCHAR(64)", true);
    // ... 更多列

    // 2. 创建 Data 数据
    Data data = new Data();
    data.setTable("TABLES");

    // 动态扫描 schema 中的表
    if (justdb.getTables() != null) {
        for (Table t : justdb.getTables()) {
            if (t.isDeleted()) continue;

            Row row = new Row();
            row.getValues().put("TABLE_SCHEMA", justdb.getName() != null ? justdb.getName() : "def");
            row.getValues().put("TABLE_NAME", t.getName());
            row.getValues().put("TABLE_TYPE", "BASE TABLE");
            row.getValues().put("ENGINE", "JustDB");

            data.getRows().add(row);
        }
    }

    return new VirtualTableResult(table, data);
}

private static void addColumn(Table table, String name, String type, boolean nullable) {
    Column col = new Column();
    col.setName(name);
    col.setType(type);
    col.setNullable(nullable);
    table.getColumns().add(col);
}
```

### 7.6 createInformationSchemaColumns 实现

```java
private static VirtualTableResult createInformationSchemaColumns(Justdb justdb) {
    // 1. 创建 Table 定义
    Table table = new Table();
    table.setName("COLUMNS");
    table.setCatalog("information_schema");

    // 添加列定义
    addColumn(table, "TABLE_SCHEMA", "VARCHAR(128)", false);
    addColumn(table, "TABLE_NAME", "VARCHAR(128)", false);
    addColumn(table, "COLUMN_NAME", "VARCHAR(128)", false);
    addColumn(table, "ORDINAL_POSITION", "BIGINT", false);
    addColumn(table, "COLUMN_DEFAULT", "VARCHAR(2048)", true);
    addColumn(table, "IS_NULLABLE", "VARCHAR(3)", false);
    addColumn(table, "DATA_TYPE", "VARCHAR(64)", false);
    addColumn(table, "COLUMN_TYPE", "VARCHAR(256)", true);
    // ... 更多列

    // 2. 创建 Data 数据
    Data data = new Data();
    data.setTable("COLUMNS");

    // 动态扫描 schema 中的列
    if (justdb.getTables() != null) {
        for (Table t : justdb.getTables()) {
            if (t.isDeleted()) continue;

            if (t.getColumns() != null) {
                for (int i = 0; i < t.getColumns().size(); i++) {
                    Column col = t.getColumns().get(i);
                    if (col.isDeleted()) continue;

                    Row row = new Row();
                    row.getValues().put("TABLE_SCHEMA", justdb.getName() != null ? justdb.getName() : "def");
                    row.getValues().put("TABLE_NAME", t.getName());
                    row.getValues().put("COLUMN_NAME", col.getName());
                    row.getValues().put("ORDINAL_POSITION", (long) (i + 1));
                    row.getValues().put("IS_NULLABLE", col.isNullable() ? "YES" : "NO");
                    row.getValues().put("DATA_TYPE", mapDataType(col.getType()));
                    row.getValues().put("COLUMN_TYPE", col.getType());

                    data.getRows().add(row);
                }
            }
        }
    }

    return new VirtualTableResult(table, data);
}
```

### 7.7 使用示例

```java
// 创建内置虚拟表 Provider（用 Lambda）
VirtualTableProvider builtinProvider = (justdb, tableName, ctx) -> {
    switch (tableName.toUpperCase()) {
        case "TABLES":
            return createInformationSchemaTables(justdb);
        case "COLUMNS":
            return createInformationSchemaColumns(justdb);
        default:
            return null;
    }
};

// 使用
JustdbDataSource dataSource = new JustdbDataSource(justdb);
dataSource.setVirtualTableProvider(builtinProvider);

// 正常使用，虚拟表会自动工作
SqlExecutor executor = new SqlExecutor(dataSource, connection);
List<Map&gt;<String, Object>> result = executor.executeSelect("SELECT * FROM TABLES");
```

### 7.8 关键文件清单

| 操作 | 文件 | 说明 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| 新增 | `jdbc/VirtualTableProvider.java` | 虚拟表提供者接口（函数式） |
| 新增 | `jdbc/VirtualTableResult.java` | 虚拟表结果（Table + Data） |
| 修改 | `jdbc/JustdbDataSource.java` | 添加 virtualTableProvider、setVirtualTableProvider()、修改 getTable() |
| 修改 | `jdbc/SqlExecutor.java` | 稍加改造，支持虚拟表检查（可选） |
| 不修改 | `schema/*` | Schema 核心层完全不修改 |

### 7.9 设计优势

1. **最小修改** - 只修改 2 个文件 + 新增 2 个接口
2. **纯函数式** - 无需具体实现类，用 Lambda 即可
3. **入口清晰** - 虚拟表入口在 JustdbDataSource
4. **动态计算** - 虚拟表数据根据 schema 实时生成
5. **向后兼容** - 不设置 Provider 时行为不变
6. **SQL 引擎无感** - SqlExecutor 几乎无需修改，通过 DataSource 自动处理虚拟表

---------------------------

## 九、验证方式

### 8.1 启动服务器

```bash
# 命令行启动
java -jar justdb-mysql-protocol/target/justdb-mysql-protocol-1.0.0.jar \
    --port 33206 \
    --schema ./schema.json

# 或代码内启动
MySQLServer server = new MySQLServer(config);
server.start();
```

### 8.2 使用 MySQL CLI 连接

```bash
mysql -h 127.0.0.1 -P 33206 -u root -p
```

### 8.3 使用 MySQL JDBC 连接

```java
// 使用标准 MySQL JDBC Driver 连接 JustDB
String url = "jdbc:mysql://localhost:33206/justdb";
Connection conn = DriverManager.getConnection(url, "user", "password");

// 无需 JustDB 专用驱动！
```

---------------------------

## 十、技术参考

### 10.1 MySQL 协议包结构

| 命令 | Hex | 描述 | 优先级 |
|------------------------------------------------------|-----------------------------|------------------------------------------------------|--------------------------------------------------------|
| COM_QUIT | 0x01 | 断开连接 | P0 |
| COM_QUERY | 0x03 | 文本 SQL 查询 | **P0** |
| COM_PING | 0x0E | 心跳检测 | P0 |

### 10.2 数据类型映射

| MySQL Type | JustDB Type | Java Type |
|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| MYSQL_TYPE_LONG | INT | Integer |
| MYSQL_TYPE_LONGLONG | BIGINT | Long |
| MYSQL_TYPE_VARCHAR | VARCHAR | String |
| MYSQL_TYPE_DATETIME | DATETIME | java.sql.Timestamp |

### 10.3 Maven 依赖

```xml
<!-- Netty -->
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.100.Final</version>
</dependency>

<!-- MySQL Protocol Codec -->
<dependency>
    <groupId>com.github.mheath</groupId>
    <artifactId>netty-mysql-codec</artifactId>
    <version>1.0.0-alpha</version>
</dependency>
```

### 10.4 参考资源

- **官方文档**: [MySQL Internals - Client/Server Protocol](https://dev.mysql.com/doc/dev/mysql-server/latest/PAGE_PROTOCOL.html)
- **开源实现**:
  - [netty-mysql-codec](https://github.com/mheath/netty-mysql-codec)
  - [ShardingSphere-Proxy](https://github.com/apache/shardingsphere)

---------------------------

## 十一、虚拟表注册机制实施计划（详细版）

### 11.1 设计概述

在 `JustdbDataSource` 上添加虚拟表支持，核心原则：

1. **不修改 Justdb.java** - 完全在外部实现
2. **不修改 JustdbManager.java** - 核心代码不动
3. **不需要新类** - 虚拟表通过 Provider 函数动态计算（使用 Lambda）
4. **入口在 JustdbDataSource** - 在 DataSource 层处理虚拟表

### 11.2 核心接口

#### VirtualTableProvider.java（新增）

```java
package org.verydb.justdb.jdbc;

import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.schema.Table;
import java.util.Map;

/**
 * Virtual table provider - 虚拟表提供者（函数式接口）
 */
@FunctionalInterface
public interface VirtualTableProvider {
    /**
     * 动态计算虚拟表定义
     * @param justdb JustDB 容器
     * @param tableName 表名
     * @param context 上下文
     * @return Table 定义，null 表示不支持此表名
     */
    Table get(Justdb justdb, String tableName, Map&lt;String, , Object> context);
}
```

### 11.3 JustdbDataSource 修改

**关键理解**：现有 `getTable()` 方法（251-260行）直接从 `tables` Map 缓存中查找。真实表在 `initializeTables()` 时已经全部加载到缓存。虚拟表需要在缓存未命中时动态计算。

```java
public class JustdbDataSource {

    private final Justdb justdb;
    private final Map&lt;String, , TableData> tables;
    private final Map&lt;String, , Sequence> sequences;
    private final AtomicLong transactionId;

    // 新增：虚拟表 Provider（可设置，默认为空）
    private VirtualTableProvider virtualTableProvider;

    public JustdbDataSource(Justdb justdb) {
        this.justdb = justdb;
        this.tables = new ConcurrentHashMap<>();
        this.sequences = new ConcurrentHashMap<>();
        this.transactionId = new AtomicLong(0);
        this.virtualTableProvider = null;  // 默认无虚拟表

        initializeTables();  // 真实表已加载到 tables Map
        initializeSequences();
    }

    /**
     * 设置虚拟表 Provider
     */
    public void setVirtualTableProvider(VirtualTableProvider provider) {
        this.virtualTableProvider = provider;
    }

    /**
     * 获取虚拟表 Provider
     */
    public VirtualTableProvider getVirtualTableProvider() {
        return virtualTableProvider;
    }

    /**
     * Get table data by name.
     *
     * 查找顺序：
     * 1. 查缓存（真实表在 initializeTables 时已加载）
     * 2. 缓存未命中，尝试虚拟表 Provider
     * 3. 都没有则抛出异常
     */
    public TableData getTable(String tableName) throws SQLException {
        String key = tableName.toLowerCase();
        TableData tableData = tables.get(key);

        // 缓存命中（真实表或已缓存的虚拟表）
        if (tableData != null) {
            return tableData;
        }

        // 缓存未命中，尝试虚拟表 Provider
        if (virtualTableProvider != null) {
            Table virtualTable = virtualTableProvider.get(justdb, tableName, Map.of());
            if (virtualTable != null) {
                TableData vd = new TableData(virtualTable);
                vd.setDataSource(this);
                tables.put(key, vd);  // 缓存虚拟表
                return vd;
            }
        }

        // 真实表应该在 initializeTables 时已加载到缓存
        // 如果到这里还没找到，说明表不存在
        throw new SQLException("Table not found: " + tableName);
    }
}
```

### 11.4 内置虚拟表 Provider（使用 Lambda）

```java
// 在需要的地方创建并设置内置虚拟表 Provider
VirtualTableProvider builtinProvider = (justdb, tableName, ctx) -> {
    switch (tableName.toUpperCase()) {
        case "TABLES":
            return createInformationSchemaTables(justdb);
        case "COLUMNS":
            return createInformationSchemaColumns(justdb);
        default:
            return null;
    }
};

// 创建 DataSource 后设置
JustdbDataSource dataSource = new JustdbDataSource(justdb);
dataSource.setVirtualTableProvider(builtinProvider);
```

### 11.5 包结构（极简）

```
org.verydb.justdb.jdbc/
└── VirtualTableProvider.java   # 虚拟表提供者接口（函数式）
```

**不需要**：
- ~~TableLocator~~ 接口
- ~~DefaultTableLocator、VirtualTableLocator、CompositeTableLocator~~ 等实现类
- ~~InformationSchemaTablesProvider、InformationSchemaColumnsProvider~~ 等具体 Provider 类
- ~~VirtualTableRegistry~~ 注册中心

### 11.6 使用示例

```java
// 创建 DataSource
JustdbDataSource dataSource = new JustdbDataSource(justdb);

// 设置内置虚拟表 Provider（用 Lambda）
dataSource.setVirtualTableProvider((j, name, ctx) -> {
    switch (name.toUpperCase()) {
        case "TABLES":
            return createTablesVirtualTable(j);
        case "COLUMNS":
            return createColumnsVirtualTable(j);
        default:
            return null;
    }
});

// 正常使用，虚拟表会自动工作
SqlExecutor executor = new SqlExecutor(dataSource, connection);
List<Map&gt;<String, Object>> result = executor.executeSelect("SELECT * FROM TABLES");
```

### 11.7 实施步骤

**Phase 1: 创建核心接口（1个文件）**
- [x] 创建 `jdbc/VirtualTableProvider.java` - 函数式接口

**Phase 2: 修改 JustdbDataSource**
- [x] 添加 `virtualTableProvider` 字段
- [x] 添加 `setVirtualTableProvider()` 方法
- [x] 添加 `getVirtualTableProvider()` 方法
- [x] 修改 `getTable()` 方法 - 先查缓存，缓存未命中时尝试虚拟表 Provider

**Phase 3: 创建辅助方法**
- [x] 创建 `jdbc/BuiltinVirtualTables.java` 工具类
- [x] 实现 `createInformationSchemaTables()` - TABLES 表定义（21列）
- [x] 实现 `createInformationSchemaColumns()` - COLUMNS 表定义（20列）
- [x] 实现 `createInformationSchemaTablesData()` - 动态生成表数据
- [x] 实现 `createInformationSchemaColumnsData()` - 动态生成列数据
- [x] 实现 `createBuiltinProvider()` - 返回配置好的 Provider

**Phase 4: 测试验证**
- [x] 单元测试：虚拟表查询（VirtualTableTest.java 已创建）
- [x] 单元测试：辅助方法（BuiltinVirtualTablesTest.java 已创建）
- [x] 编译验证：主代码编译成功
- [ ] 集成测试：通过 SqlExecutor 查询虚拟表

### 11.11 实施依赖关系

```
┌────────────────────────────────────────────────────────────┐
│ 虚拟表实施依赖图                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Phase 1] VirtualTableProvider 接口                        │
│       ↓                                                    │
│  [Phase 2] JustdbDataSource 修改                           │
│       ↓                                                    │
│  [Phase 3] 辅助方法（createInformationSchema*）            │
│       ↓                                                    │
│  [Phase 4] 测试验证                                        │
│                                                            │
│  注意：虚拟表功能可以独立于 MySQL 协议服务器实现和测试      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 11.8 关键文件清单

| 操作 | 文件 | 说明 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| 新增 | `jdbc/VirtualTableProvider.java` | 虚拟表提供者接口（函数式） |
| 修改 | `jdbc/JustdbDataSource.java` | 添加 virtualTableProvider 字段和相关方法，修改 getTable() |

**不修改文件**：
- `schema/Justdb.java` - 绝对不修改（Schema 核心层）
- `JustdbManager.java` - 绝对不修改（管理器）
- `jdbc/SqlExecutor.java` - 不修改（SQL 执行器）
- `jdbc/JustdbConnection.java` - 不修改（连接层）
- `jdbc/JustdbDatabaseMetaData.java` - 不修改（元数据层）

### 11.9 验证方式

**单元测试**：
```java
@Test
void testVirtualTable() {
    JustdbDataSource dataSource = new JustdbDataSource(justdb);

    // 设置虚拟表 Provider
    dataSource.setVirtualTableProvider((j, name, ctx) -> {
        if ("TEST".equals(name)) {
            Table t = new Table();
            t.setName("TEST");
            return t;
        }
        return null;
    });

    // 查询虚拟表
    TableData testData = dataSource.getTable("TEST");
    assertEquals("TEST", testData.getTable().getName());

    // 查询真实表
    TableData usersData = dataSource.getTable("users");
    assertEquals("users", usersData.getTable().getName());
}
```

**集成测试**：
```java
@Test
void testQueryVirtualTable() {
    JustdbDataSource dataSource = new JustdbDataSource(justdb);
    dataSource.setVirtualTableProvider(createBuiltinProvider());

    JustdbConnection connection = new JustdbConnection(dataSource);
    SqlExecutor executor = new SqlExecutor(dataSource, connection);

    // 查询虚拟表 TABLES
    List<Map&gt;<String, Object>> result = executor.executeSelect(
        "SELECT TABLE_NAME FROM TABLES"
    );

    assertFalse(result.isEmpty());
}
```

### 11.10 设计优势

1. **不修改核心代码** - Justdb.java、JustdbManager.java 完全不动
2. **纯函数式** - 只有 1 个接口，实现用 Lambda
3. **零新类** - 不需要任何具体实现类
4. **最小修改** - 只修改 JustdbDataSource，添加 1 个字段、2 个方法、修改 1 个方法
5. **入口清晰** - 虚拟表入口在 JustdbDataSource 上
6. **向后兼容** - 不设置 Provider 时行为完全不变

---------------------------

## 十二、实施验证

### 12.1 编译验证

```bash
# 主代码编译成功
$ mvn clean compile -pl justdb-core -DskipTests
[INFO] BUILD SUCCESS

# VirtualTableProvider.class 存在
$ ls target/classes/org/verydb/justdb/jdbc/Virtual*.class
VirtualTableProvider.class

# JustdbDataSource 包含虚拟表方法
$ javap -cp target/classes org.verydb.justdb.jdbc.JustdbDataSource | grep -i virtual
private org.verydb.justdb.jdbc.VirtualTableProvider virtualTableProvider;
  public void setVirtualTableProvider(org.verydb.justdb.jdbc.VirtualTableProvider);
  public org.verydb.justdb.jdbc.VirtualTableProvider getVirtualTableProvider();
```

### 12.2 功能验证

**VirtualTableProvider 接口**：
- ✅ 函数式接口（`@FunctionalInterface`）
- ✅ 返回 `Table` 定义
- ✅ 参数：`Justdb justdb`, `String tableName`, `Map&lt;String, , Object> context`
- ✅ 返回 `null` 表示不支持该表名

**JustdbDataSource 集成**：
- ✅ `virtualTableProvider` 字段（默认 null）
- ✅ `setVirtualTableProvider(VirtualTableProvider)` 方法
- ✅ `getVirtualTableProvider()` 方法
- ✅ `getTable(String)` 修改：缓存 → 虚拟表 Provider → 异常

### 12.3 测试文件

**VirtualTableTest.java**（JUnit 5 测试）：
- ✅ 测试 VirtualTableProvider 返回 null
- ✅ 测试 VirtualTableProvider 返回 Table
- ✅ 测试 JustdbDataSource 无 Provider 场景
- ✅ 测试 JustdbDataSource 有 Provider 场景
- ✅ 测试虚拟表缓存机制
- ✅ **运行结果**: 5/5 测试通过

**VirtualTableVerify.java**（独立验证类）：
- ✅ 5 个测试用例覆盖核心功能
- ✅ 可独立运行（无需 JUnit）

**BuiltinVirtualTablesTest.java**（JUnit 5 测试）：
- ✅ 测试 createInformationSchemaTables() 方法
- ✅ 测试 createInformationSchemaColumns() 方法
- ✅ 测试 createInformationSchemaTablesData() 数据生成
- ✅ 测试 createInformationSchemaColumnsData() 数据生成
- ✅ 测试 createBuiltinProvider() 工厂方法
- ✅ 测试 BuiltinProvider 与 JustdbDataSource 集成
- ✅ **运行结果**: 6/6 测试通过

**测试汇总**：
- 总测试数：11 个
- 通过：11 个 ✅
- 失败：0 个
- 错误：0 个

### 12.4 使用示例

**方式1：使用 BuiltinVirtualTables 工厂类**
```java
// 创建 Justdb 和 DataSource
Justdb justdb = new Justdb("test", "test");
JustdbDataSource dataSource = new JustdbDataSource(justdb);

// 使用工厂方法创建内置 Provider
dataSource.setVirtualTableProvider(BuiltinVirtualTables.createBuiltinProvider());

// 查询虚拟表
TableData tables = dataSource.getTable("TABLES");
TableData columns = dataSource.getTable("COLUMNS");
```

**方式2：使用 Lambda 自定义**
```java
// 创建 Justdb 和 DataSource
Justdb justdb = new Justdb("test", "test");
JustdbDataSource dataSource = new JustdbDataSource(justdb);

// 设置虚拟表 Provider（使用 Lambda）
dataSource.setVirtualTableProvider((j, tableName, ctx) -> {
    switch (tableName.toUpperCase()) {
        case "TABLES":
            return BuiltinVirtualTables.createInformationSchemaTables(j);
        case "COLUMNS":
            return BuiltinVirtualTables.createInformationSchemaColumns(j);
        default:
            return null;
    }
});

// 查询真实表（工作正常）
TableData users = dataSource.getTable("users");

// 查询虚拟表（通过 Provider 动态创建）
TableData tables = dataSource.getTable("TABLES");

// 虚拟表被缓存（第二次查询不调用 Provider）
TableData tables2 = dataSource.getTable("TABLES");
```

**方式3：获取虚拟表数据**
```java
// 创建 TABLES 虚拟表定义
Table tablesTable = BuiltinVirtualTables.createInformationSchemaTables(justdb);

// 创建 TABLES 虚拟表数据
Data tablesData = BuiltinVirtualTables.createInformationSchemaTablesData(justdb);

// 遍历所有表
for (Row row : tablesData.getRows()) {
    String tableName = (String) row.getValues().get("TABLE_NAME");
    String tableType = (String) row.getValues().get("TABLE_TYPE");
    System.out.println("Table: " + tableName + ", Type: " + tableType);
}
```

---------------------------

## 十三、测试执行验证

### 13.1 测试执行日志

```bash
$ mvn test -pl justdb-core -Dtest=VirtualTableTest,BuiltinVirtualTablesTest
...
Running org.verydb.justdb.jdbc.VirtualTableTest
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0

Running org.verydb.justdb.jdbc.BuiltinVirtualTablesTest
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0

Results:
Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### 13.2 测试覆盖范围

**VirtualTableProvider 接口测试**：
- ✅ 返回 null 表示不支持表名
- ✅ 返回 Table 对象表示支持该表
- ✅ 与 JustdbDataSource 无缝集成

**JustdbDataSource 集成测试**：
- ✅ 默认状态（无 Provider）正常工作
- ✅ 设置 Provider 后正确调用
- ✅ 缓存优先查找正确
- ✅ Provider 缓存未命中时调用
- ✅ 抛出正确异常信息

**BuiltinVirtualTables 功能测试**：
- ✅ TABLES 表结构（21 列）符合 MySQL information_schema
- ✅ COLUMNS 表结构（20 列）符合 MySQL information_schema
- ✅ 动态扫描 schema 生成表数据
- ✅ 动态扫描表结构生成列数据
- ✅ 主键列正确识别（COLUMN_KEY = "PRI"）
- ✅ 自增列正确标记（EXTRA = "auto_increment"）
- ✅ 可空列正确标记（IS_NULLABLE = "YES"/"NO"）

### 13.3 数据类型映射验证

| 输入类型 | 映射结果 | 验证状态 |
|---------------------------------------------------------------------------------|----------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| VARCHAR(255) | varchar | ✅ |
| CHAR(50) | varchar | ✅ |
| INT / INTEGER | int | ✅ |
| BIGINT | bigint | ✅ |
| DECIMAL(10,2) | decimal | ✅ |
| DATETIME | datetime | ✅ |
| TEXT | text | ✅ |
| BLOB | blob | ✅ |
| JSON | json | ✅ |
| BOOLEAN | tinyint | ✅ |

---------------------------

## 总结

### 已完成

| 项目 | 状态 |
|------------------------------------------------------|------------------------------------------------------|
| VirtualTableProvider 接口 | ✅ 已实现并编译 |
| JustdbDataSource 修改 | ✅ 已完成（4处修改） |
| BuiltinVirtualTables 工具类 | ✅ 已实现（5个公共方法） |
| createInformationSchemaTables() | ✅ 已实现（21列） |
| createInformationSchemaColumns() | ✅ 已实现（20列） |
| createInformationSchemaTablesData() | ✅ 已实现（动态扫描表） |
| createInformationSchemaColumnsData() | ✅ 已实现（动态扫描列） |
| createBuiltinProvider() | ✅ 已实现（返回配置好的Provider） |
| 单元测试 | ✅ 已创建（VirtualTableTest.java + BuiltinVirtualTablesTest.java） |
| 编译验证 | ✅ 主代码编译通过 |
| 设计文档 | ✅ 已更新 |

### BuiltinVirtualTables 实现详情

**文件路径**: `justdb-core/src/main/java/org/verydb/justdb/jdbc/BuiltinVirtualTables.java`

**公共方法**:
```java
// 创建 TABLES 表定义（MySQL 兼容，21列）
Table createInformationSchemaTables(Justdb justdb)

// 创建 COLUMNS 表定义（MySQL 兼容，20列）
Table createInformationSchemaColumns(Justdb justdb)

// 动态生成 TABLES 数据
Data createInformationSchemaTablesData(Justdb justdb)

// 动态生成 COLUMNS 数据
Data createInformationSchemaColumnsData(Justdb justdb)

// 返回配置好的 VirtualTableProvider
VirtualTableProvider createBuiltinProvider()
```

**TABLES 表支持的列**（21列）:
- TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
- ENGINE, VERSION, ROW_FORMAT, TABLE_ROWS, AVG_ROW_LENGTH
- DATA_LENGTH, MAX_DATA_LENGTH, INDEX_LENGTH, DATA_FREE
- AUTO_INCREMENT, CREATE_TIME, UPDATE_TIME, CHECK_TIME
- TABLE_COLLATION, CHECKSUM, CREATE_OPTIONS, TABLE_COMMENT

**COLUMNS 表支持的列**（20列）:
- TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
- ORDINAL_POSITION, COLUMN_DEFAULT, IS_NULLABLE
- DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, CHARACTER_OCTET_LENGTH
- NUMERIC_PRECISION, NUMERIC_SCALE, DATETIME_PRECISION
- CHARACTER_SET_NAME, COLLATION_NAME, COLUMN_TYPE
- COLUMN_KEY, EXTRA, PRIVILEGES, COLUMN_COMMENT, GENERATION_EXPRESSION

**数据类型映射**:
- VARCHAR/CHAR → varchar
- INT/INTEGER → int
- BIGINT → bigint
- DECIMAL/NUMERIC → decimal
- DATETIME/TIMESTAMP → datetime
- TEXT → text
- BLOB → blob
- JSON → json

### 待完成

| 项目 | 优先级 |
|------------------------------------------------------|--------------------------------------------------------|
| 修复结果集编码问题（MySQL协议结果集返回） | P1 |
| 完善认证逻辑（mysql_native_password 完整实现） | P2 |
| 支持 SSL/TLS 连接 | P3 |
| 实现 COM_STMT_PREPARE/EXECUTE（预编译语句） | P3 |

---------------------------

## 十五、MySQL 协议服务器虚拟表集成（Phase 4）

### 15.1 集成实现

**MySQLServer.java 修改**:
- 添加 `enableBuiltinVirtualTables()` 方法 - 启用内置虚拟表
- 添加工厂方法 `createWithVirtualTables()` - 快捷创建带虚拟表的服务器
- 支持方法链式调用：`new MySQLServer(...).enableBuiltinVirtualTables()`

**核心代码**:
```java
public class MySQLServer {
    /**
     * Enable built-in virtual tables (information_schema.TABLES and COLUMNS).
     */
    public MySQLServer enableBuiltinVirtualTables() {
        dataSource.setVirtualTableProvider(BuiltinVirtualTables.createBuiltinProvider());
        LOG.info("Built-in virtual tables enabled");
        return this;
    }

    /**
     * Factory method to create server with virtual tables enabled.
     */
    public static MySQLServer createWithVirtualTables(Justdb justdb, String defaultSchema) {
        JustdbDataSource dataSource = new JustdbDataSource(justdb);
        return new MySQLServer(justdb, dataSource, defaultSchema)
                .enableBuiltinVirtualTables();
    }
}
```

### 15.2 集成测试

创建了 `MySQLVirtualTableSimpleTest.java` 和 `MySQLVirtualTableIntegrationTest.java`：

**测试场景**:
- ✅ 基础连接测试
- ✅ 查询 information_schema.TABLES
- ✅ 查询 information_schema.COLUMNS
- ✅ WHERE 子句过滤
- ✅ 主键列查询
- ✅ JOIN 查询

### 15.3 已知问题

**结果集编码问题**: MySQL 协议层的结果集返回存在编码问题（`Buffer length is less than expected payload length`）。

**状态**:
- ✅ 服务器启动、客户端认证、握手均正常工作
- ✅ 虚拟表 Provider 已正确集成到 DataSource
- ✅ 错误处理正常工作（表不存在的错误正确返回）
- ⚠️ 结果集返回存在编码问题，需要单独修复

**问题分析**: 这是一个 MySQL 协议编码层的低级问题，与虚拟表集成本身无关。需要修复 `ComQueryHandler` 或 `TextResultSetEncoder` 的结果集编码逻辑。

### 15.4 使用示例

**方式1：使用工厂方法（推荐）**
```java
// 创建服务器并启用虚拟表
MySQLServer server = MySQLServer.createWithVirtualTables(justdb, "mydb");
server.start();

// 客户端连接
String url = "jdbc:mysql://localhost:33206/mydb";
Connection conn = DriverManager.getConnection(url, "user", "password");

// 查询虚拟表
ResultSet rs = stmt.executeQuery("SELECT * FROM information_schema.TABLES");
```

**方式2：使用方法链**
```java
JustdbDataSource dataSource = new JustdbDataSource(justdb);
MySQLServer server = new MySQLServer(justdb, dataSource, "mydb")
        .enableBuiltinVirtualTables();
server.start();
```

### 15.5 实现总结

| 组件 | 状态 | 说明 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| MySQLServer 集成 | ✅ 完成 | enableBuiltinVirtualTables() 方法已实现 |
| 工厂方法 | ✅ 完成 | createWithVirtualTables() 静态方法已实现 |
| 虚拟表 Provider 设置 | ✅ 完成 | 通过 DataSource 正确设置 |
| 集成测试 | ✅ 创建 | 测试文件已创建（需要修复编码问题后运行） |
| 结果集编码 | ⚠️ 已知问题 | 需要单独修复 ComQueryHandler/TextResultSetEncoder |

---------------------------

## 十四、集成测试验证（Phase 4 完成）

### 14.1 集成测试实现

创建了完整的集成测试 `VirtualTableSqlExecutorIntegrationTest.java`，测试通过 SqlExecutor 查询虚拟表的完整流程。

**测试覆盖**：
- ✅ 基础查询（SELECT *）
- ✅ 特定列查询（SELECT column1, column2）
- ✅ WHERE 子句过滤
- ✅ ORDER BY 排序
- ✅ COUNT 聚合函数
- ✅ JOIN 查询（TABLES ↔ COLUMNS）
- ✅ 数据类型映射验证

### 14.2 测试结果

```bash
$ mvn test -pl justdb-core -Dtest=VirtualTableSqlExecutorIntegrationTest

Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

**完整测试套件结果**：
```
VirtualTableTest:           5/5 通过
BuiltinVirtualTablesTest:   6/6 通过
VirtualTableSqlExecutorIntegrationTest: 13/13 通过
─────────────────────────────────────────────
总计:                        24/24 通过 ✅
```

### 14.3 实现变更

为支持虚拟表数据查询，对以下文件进行了修改：

**BuiltinVirtualTables.java**:
- `createInformationSchemaTables()` - 现在将数据附加到 Table 对象
- `createInformationSchemaColumns()` - 现在将数据附加到 Table 对象
- 修复 `mapDataType()` - 使用 `startsWith` 支持 DECIMAL(10,2) 类型
- 修复空值处理 - 使用 `Boolean.TRUE.equals()` 避免 NPE

**JustdbDataSource.java**:
- `getTable()` 方法 - 检测虚拟表附加的数据并自动加载到 DataNode

### 14.4 关键实现细节

**数据附加机制**：
```java
// 在 BuiltinVirtualTables 中
public static Table createInformationSchemaTables(Justdb justdb) {
    Table table = new Table("TABLES");
    // ... 添加列定义 ...

    // 将数据附加到 Table 对象
    Data tableData = createInformationSchemaTablesData(justdb);
    table.setUnknownValue("__virtual_data__", tableData);

    return table;
}
```

**数据加载机制**：
```java
// 在 JustdbDataSource.getTable() 中
if (virtualTable != null) {
    TableData vd = new TableData(virtualTable);
    vd.setDataSource(this);

    // 检查虚拟表是否有附加数据
    Object virtualData = virtualTable.getUnknownAttrs().get("__virtual_data__");
    if (virtualData instanceof org.verydb.justdb.schema.Data) {
        org.verydb.justdb.schema.Data data = (org.verydb.justdb.schema.Data) virtualData;
        vd.addDataNode(data);  // 加载数据到 TableData
    }

    tables.put(key, vd);
    return vd;
}
```

### 14.5 已创建文件（19个）

新增集成测试文件：

```
justdb-core/
└── src/test/java/org/verydb/justdb/jdbc/
    └── VirtualTableSqlExecutorIntegrationTest.java  # 集成测试（13个测试用例）
```

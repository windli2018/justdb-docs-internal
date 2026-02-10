# JustDB MySQL Protocol Compatibility Layer Design

## 1. Requirements Analysis

### 1.1 Core Requirements
- **MySQL Protocol Compatibility Layer**: Implement MySQL Wire Protocol
  - Standalone server startup
  - Default port: **33206**
  - Reuse existing JustDB JDBC components for SQL execution
  - No dedicated client driver needed, connect directly with MySQL JDBC Driver

### 1.2 Use Cases

```
┌─────────────────────────────────────────────────────────────┐
│  MySQL Protocol Compatibility Mode                            │
├─────────────────────────────────────────────────────────────┤
│  [App] --MySQL JDBC--> [JustDB MySQL Server:33206]          │
│                            │                                │
│                     [Reuse Existing JDBC Components]         │
│                            │                                │
│                      [Schema/Data]                          │
└─────────────────────────────────────────────────────────────┘
```

---------------------------

## 2. Implementation Status

### 2.1 Current Progress

> **✅ Phase 1 Complete**: MySQL protocol server framework implemented and compiling
>
> **✅ Phase 2 Complete**: Virtual table registration mechanism implemented
>
> **✅ Phase 3 Complete**: information_schema virtual table helper methods implemented

### 2.2 Implementation Roadmap

**P0 (MVP Required):**
- [x] Phase 1: Basic protocol layer (network, handshake, authentication)
- [x] Phase 2: Command processing (COM_QUERY, JDBC integration)
- [x] Phase 3: Virtual table support (VirtualTableProvider + JustdbDataSource modification)

**P1 (Enhancement):**
- [ ] Phase 4: Metadata commands (SHOW DATABASES/TABLES/DESCRIBE)
- [ ] Phase 5: Complete result set encoding (NULL values, type conversion)
- [x] Phase 6: Create information_schema helper methods
- [x] Phase 7: Integration testing (query virtual tables via SqlExecutor)

**P2 (Future Optimization):**
- [ ] Prepared statement support (COM_STMT_PREPARE/EXECUTE)
- [ ] Performance optimization
- [ ] Multi-client compatibility testing

---------------------------

## 3. Final Implementation Plan

### 3.1 User Decisions

| Decision | Choice | Description |
|----------|--------|-------------|
| **Implementation** | MySQL protocol compatibility layer | Standalone server, reuse existing JDBC |
| **Technology** | Based on netty-mysql-codec | Use open-source MySQL protocol library |
| **Startup** | Standalone startup | Command line or in-code startup |
| **Authentication** | Support both | Username/password + Token authentication |
| **Prepared Statements** | Not supported initially | MVP only implements COM_QUERY |
| **MVP Features** | Transaction support + basic features | BEGIN/COMMIT/ROLLBACK + basic CRUD |

### 3.2 Architecture Design

```
┌──────────────────────────────────────────────────────────────┐
│  JustDB MySQL Server (Port: 33206)                           │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  MySQL Protocol Layer (encoding/decoding only)         │  │
│  │  - MySQLPacketDecoder/Encoder                          │  │
│  │  - HandshakeHandler                                    │  │
│  │  - ComQueryHandler (forward SQL to JDBC)               │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Session Layer                                         │  │
│  │  - MySQLSession (holds JustdbConnection)               │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  JDBC Layer (existing components, unmodified)          │  │
│  │  - JustdbConnection                                   │  │
│  │  - SqlExecutor                                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---------------------------

## 4. MySQL Protocol Implementation

### 4.1 MySQLSession (Session Management)

```java
public class MySQLSession {
    private final JustdbConnection jdbcConnection;  // Reuse existing JDBC connection
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
}
```

### 4.2 ComQueryHandler (Execute SQL via JDBC)

```java
@ChannelHandler.Sharable
public class ComQueryHandler extends SimpleChannelInboundHandler<QueryCommandPacket> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, QueryCommandPacket packet) {
        MySQLSession session = ctx.channel().attr(AttributeKey.valueOf("session")).get();
        String sql = packet.getSql();

        try {
            // Execute SQL through existing JDBC connection
            ResultSet rs = session.executeQuery(sql);
            // Encode JDBC ResultSet as MySQL protocol format
            TextResultSetEncoder.encode(rs, ctx);
        } catch (SQLException e) {
            writeErrorPacket(ctx, e);
        }
    }
}
```

---------------------------

## 5. System Table Support

### 5.1 Supported Metadata Commands

| Command | Description | Implementation |
|---------|-------------|----------------|
| `SHOW DATABASES` | List databases | Return JustDB schema list |
| `SHOW TABLES` | List tables | Via JustdbDatabaseMetaData.getTables() |
| `DESCRIBE table` | Table structure | Via JustdbDatabaseMetaData.getColumns() |
| `SELECT * FROM information_schema.TABLES` | Table list | Via virtual table Provider |
| `SELECT * FROM information_schema.COLUMNS` | Column list | Via virtual table Provider |

---------------------------

## 6. Virtual Table Mechanism Design

### 6.1 Design Goals

Support `information_schema` system table queries with a lightweight virtual table mechanism:

1. **No Schema layer modifications** - `schema/` package files completely unmodified
2. **Only JDBC layer modifications** - Implement virtual table support in `jdbc/` package
3. **Zero new classes** - Use functional interfaces + Lambda expressions
4. **Entry point in JustdbDataSource** - Handle virtual tables at DataSource layer

### 6.2 Core Interface

**VirtualTableProvider.java**

```java
package ai.justdb.justdb.jdbc;

import ai.justdb.justdb.schema.Justdb;
import java.util.Map;

/**
 * Virtual table provider (functional interface)
 */
@FunctionalInterface
public interface VirtualTableProvider {
    /**
     * Dynamically calculate virtual table definition
     * @param justdb JustDB container
     * @param tableName Table name
     * @param context SQL execution context
     * @return Table definition, null means table name not supported
     */
    Table get(Justdb justdb, String tableName, Map<String, Object> context);
}
```

### 6.3 JustdbDataSource Modifications

```java
public class JustdbDataSource {
    private VirtualTableProvider virtualTableProvider;

    public void setVirtualTableProvider(VirtualTableProvider provider) {
        this.virtualTableProvider = provider;
    }

    public TableData getTable(String tableName) throws SQLException {
        String key = tableName.toLowerCase();
        TableData tableData = tables.get(key);

        // Cache hit
        if (tableData != null) {
            return tableData;
        }

        // Cache miss, try virtual table Provider
        if (virtualTableProvider != null) {
            Table virtualTable = virtualTableProvider.get(justdb, tableName, Map.of());
            if (virtualTable != null) {
                TableData vd = new TableData(virtualTable);
                vd.setDataSource(this);
                tables.put(key, vd);
                return vd;
            }
        }

        throw new SQLException("Table not found: " + tableName);
    }
}
```

---------------------------

## 7. Verification

### 7.1 Start Server

```bash
# Command line startup
java -jar justdb-mysql-protocol/target/justdb-mysql-protocol-1.0.0.jar \
    --port 33206 \
    --schema ./schema.json

# Or in-code startup
MySQLServer server = new MySQLServer(config);
server.start();
```

### 7.2 Connect with MySQL CLI

```bash
mysql -h 127.0.0.1 -P 33206 -u root -p
```

### 7.3 Connect with MySQL JDBC

```java
// Use standard MySQL JDBC Driver to connect to JustDB
String url = "jdbc:mysql://localhost:33206/justdb";
Connection conn = DriverManager.getConnection(url, "user", "password");
```

---------------------------

## 8. Summary

### Completed

| Item | Status |
|------|--------|
| VirtualTableProvider interface | ✅ Implemented and compiled |
| JustdbDataSource modifications | ✅ Complete (4 modifications) |
| BuiltinVirtualTables utility class | ✅ Implemented (5 public methods) |
| Unit tests | ✅ Created (24 tests passing) |

### To Be Completed

| Item | Priority |
|------|----------|
| Fix result set encoding issues | P1 |
| Complete authentication logic | P2 |
| SSL/TLS connection support | P3 |
| COM_STMT_PREPARE/EXECUTE support | P3 |

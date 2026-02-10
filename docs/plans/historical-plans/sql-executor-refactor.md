# SqlExecutor 拆分重构计划

## 一、背景

### 1.1 现状分析

**当前规模**：
- 文件：`justdb-core/src/main/java/ai.justdb/justdb/jdbc/SqlExecutor.java`
- 代码行数：**8252 行**（持续增长中）
- 方法数量：~200 个私有/公共方法
- 职责数量：6+ 个核心职责

### 1.2 存在问题

| 问题 | 描述 | 影响 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| 单一职责违背 | 一个类承担查询、变更、DDL、表达式、元数据处理等职责 | 代码难以理解和维护 |
| 修改风险高 | 修改一处可能影响多个功能模块 | 回归成本大 |
| 测试困难 | 需要准备大量测试环境来测试单一功能 | 测试效率低 |
| 新功能添加难 | 在 8000+ 行文件中找到正确位置不易 | 开发效率低 |
| 代码复用差 | 各功能耦合严重，难以独立复用 | 架构债累积 |

### 1.3 重构目标

| 指标 | 当前 | 目标 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| 单文件最大行数 | 8252 | ~2500 |
| 单一职责 | 否 | 是 |
| 可测试性 | 低 | 高 |
| 可维护性 | 低 | 高 |

---------------------------

## 二、拆分方案

### 2.1 职责边界分析

基于 SqlExecutor 中 ~200 个方法的功能分析，将其拆分为 **6 个核心处理器**：

```
SqlExecutor (8252 行)
    │
    ├─► QueryProcessor        [SELECT/UNION/CTE 查询]
    ├─► MutationProcessor     [INSERT/UPDATE/DELETE]
    ├─► DdlProcessor          [CREATE/DROP/ALTER]
    ├─► ExpressionEngine      [表达式求值/函数]
    ├─► ResultSetProcessor    [投影/聚合/排序]
    └─► MetadataProcessor     [SHOW/EXPLAIN/系统变量]
```

### 2.2 详细拆分设计

#### 2.2.1 QueryProcessor（查询处理器）

**职责**：所有 SELECT 相关的查询处理

**预计规模**：~2500 行，~50 个方法

**核心方法**：

| 分类 | 方法名 | 原行号范围 |
|------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| UNION 查询 | executeUnionQuery, normalizeUnionColumnNames, combineUnionResults, intersectResults, exceptResults | 325-465 |
| CTE/递归查询 | executeWithClauseQuery, extractMainQueryFromWith, parseCteDefinitions, splitCteDefinitions, executeRecursiveCte, executeMainQueryWithCte | 530-990 |
| FROM 子查询 | executeFromSubquery | 505-527 |
| JOIN 处理 | executeJoinQuery, performInnerJoin, performLeftJoin, performRightJoin, performFullOuterJoin, performInnerJoinWithRows, performLeftJoinWithRows, performRightJoinWithRows, performFullOuterJoinWithRows | 1087-1535 |
| JOIN 工具 | getTableColumns, addRowWithPrefix, getTableNameFromSource | 1538-1634 |
| SELECT INTO | executeSelectInto | 992-1084 |

**依赖关系**：
- 依赖：ExpressionEngine, ResultSetProcessor
- 被依赖：SqlExecutor

**接口定义**：
```java
package ai.justdb.justdb.jdbc.executor;

import ai.justdb.justdb.jdbc.JustdbDataSource;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * Query processor - handles all SELECT related queries
 */
public interface QueryProcessor {

    /**
     * Process UNION query
     */
    List<Map&gt;<String, Object>> processUnion(
        com.alibaba.druid.sql.ast.statement.SQLUnionQuery unionQuery
    ) throws SQLException;

    /**
     * Process WITH clause (CTE) query
     */
    List<Map&gt;<String, Object>> processWithClause(String sql) throws SQLException;

    /**
     * Process JOIN query
     */
    List<Map&gt;<String, Object>> processJoin(
        com.alibaba.druid.sql.ast.SQLJoinTableSource joinSource,
        List<Map&gt;<String, Object>> leftRows
    ) throws SQLException;

    /**
     * Process FROM subquery
     */
    List<Map&gt;<String, Object>> processFromSubquery(
        com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock queryBlock
    ) throws SQLException;

    /**
     * Process SELECT INTO
     */
    List<Map&gt;<String, Object>> processSelectInto(String sql) throws SQLException;
}
```

#### 2.2.2 MutationProcessor（数据变更处理器）

**职责**：INSERT/UPDATE/DELETE/REPLACE 操作

**预计规模**：~1200 行，~35 个方法

**核心方法**：

| 分类 | 方法名 | 原行号范围 |
|------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| INSERT | executeInsert, executeInsertMySql, executeInsertSelect, executeInsertOnDuplicateKeyUpdate, executeInsertSetFromString | 1786-2368 |
| REPLACE | executeReplace, executeReplaceFromSql | 1995-2185 |
| UPDATE | executeUpdate, executeUpdateMySql, executeUpdateWithJoin | 2610-2750 |
| DELETE | executeDelete, executeDeleteMySql, executeDeleteWithJoin | 2753-2850 |
| RETURNING | executeUpdateReturning, executeDeleteReturning | 8022-8223 |
| 工具方法 | getPrimaryKeyColumn, getPrimaryKeyValueFromInsert, evaluateExprForInsert | 2546-2574, 1831-1910 |

**依赖关系**：
- 依赖：ExpressionEngine
- 被依赖：SqlExecutor

**接口定义**：
```java
package ai.justdb.justdb.jdbc.executor;

import ai.justdb.justdb.jdbc.JustdbDataSource;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * Mutation processor - handles INSERT/UPDATE/DELETE/REPLACE operations
 */
public interface MutationProcessor {

    /**
     * Process INSERT statement
     */
    int processInsert(
        com.alibaba.druid.sql.ast.statement.SQLInsertStatement stmt
    ) throws SQLException;

    /**
     * Process MySQL INSERT statement
     */
    int processInsertMySql(
        com.alibaba.druid.sql.dialect.mysql.ast.statement.MySqlInsertStatement stmt
    ) throws SQLException;

    /**
     * Process REPLACE statement
     */
    int processReplace(
        com.alibaba.druid.sql.ast.statement.SQLReplaceStatement stmt
    ) throws SQLException;

    /**
     * Process UPDATE statement
     */
    int processUpdate(
        com.alibaba.druid.sql.ast.statement.SQLUpdateStatement stmt
    ) throws SQLException;

    /**
     * Process DELETE statement
     */
    int processDelete(
        com.alibaba.druid.sql.ast.statement.SQLDeleteStatement stmt
    ) throws SQLException;

    /**
     * Process INSERT/UPDATE/DELETE with RETURNING clause
     */
    List<Map&gt;<String, Object>> processMutationWithReturning(String sql) throws SQLException;
}
```

#### 2.2.3 DdlProcessor（DDL 处理器）

**职责**：CREATE/DROP/ALTER 操作

**预计规模**：~1800 行，~80 个方法

**核心方法**：

| 分类 | 方法名 | 原行号范围 |
|------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| TABLE | executeCreateTable, executeCreateTableAsSelect, executeDropTable, executeRenameTable | 2853-2993, 3866-3937 |
| COLUMN | executeAlterTableAddColumn, executeAlterTableDropColumn, executeAlterTableRenameColumn, executeMySqlAlterTableChangeColumn, executeAlterTableAlterColumn, executeMySqlAlterTableAlterColumn, executeMySqlAlterTableModifyColumn, executeAlterTableReplaceColumn, executeRenameColumn | 3071-3325, 3905-4086 |
| INDEX | executeCreateIndex, executeCreateIndexFromString, executeDropIndex, executeDropIndexFromString, executeAlterTableAddIndex, executeAlterTableDropIndex | 3940-3977, 3364-3403 |
| CONSTRAINT | executeAlterTableAddConstraint, executeAlterTableDropConstraint, executeAlterTableDropForeignKey, executeAlterTableDropPrimaryKey | 3423-3603 |
| VIEW | executeCreateView, executeCreateViewFromString, executeDropView, executeDropViewFromString | 3998-4107 |
| TRIGGER | executeCreateTrigger, executeDropTrigger, executeCreateTriggerFromString | 4145-4171 |
| PROCEDURE/FUNCTION | executeCreateProcedureFromString, executeCreateFunctionFromString, executeCreateProcedure, executeDropProcedure, executeCreateFunction, executeDropFunction | 4191-4261 |
| SEQUENCE | executeCreateSequenceFromString, executeDropSequenceFromString | 4284-4455 |
| 工具方法 | processSerialType, extractAddColumnPart, extractDropColumnName, extractDataTypeFromColumnDef | 2994-3001, 3710-3838 |

**依赖关系**：
- 依赖：ExpressionEngine
- 被依赖：SqlExecutor

**接口定义**：
```java
package ai.justdb.justdb.jdbc.executor;

import ai.justdb.justdb.jdbc.JustdbDataSource;
import java.sql.SQLException;

/**
 * DDL processor - handles CREATE/DROP/ALTER operations
 */
public interface DdlProcessor {

    /**
     * Process CREATE TABLE statement
     */
    int processCreateTable(
        com.alibaba.druid.sql.dialect.mysql.ast.statement.MySqlCreateTableStatement stmt,
        String originalSql
    ) throws SQLException;

    /**
     * Process DROP TABLE statement
     */
    int processDropTable(
        com.alibaba.druid.sql.ast.statement.SQLDropTableStatement stmt
    ) throws SQLException;

    /**
     * Process ALTER TABLE statement
     */
    int processAlterTable(
        com.alibaba.druid.sql.ast.statement.SQLAlterTableStatement stmt
    ) throws SQLException;

    /**
     * Process CREATE VIEW statement
     */
    int processCreateView(
        com.alibaba.druid.sql.ast.statement.SQLCreateViewStatement stmt
    ) throws SQLException;

    /**
     * Process CREATE INDEX statement
     */
    int processCreateIndex(
        com.alibaba.druid.sql.ast.statement.SQLCreateIndexStatement stmt
    ) throws SQLException;

    /**
     * Process CREATE SEQUENCE statement
     */
    int processCreateSequence(String sql) throws SQLException;

    /**
     * Process DROP SEQUENCE statement
     */
    int processDropSequence(String sql) throws SQLException;
}
```

#### 2.2.4 ExpressionEngine（表达式引擎）

**职责**：表达式求值和函数调用

**预计规模**：~1500 行，~100 个方法

**核心方法**：

| 分类 | 方法名 | 原行号范围 |
|------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| 表达式求值 | evaluateExpr, evaluateExprForRow, evaluateExprForInsert, evaluateExprForOnDuplicate, evaluateBinaryOpExpr, evaluateConditionExpr, evaluateFunction | 5253-6260 |
| 类型转换 | evaluateCast, evaluateCastExpr, evalCast, toInt, toBoolean | 6006-6104, 5647-5663 |
| CASE 表达式 | evaluateCaseExpr | 6102-6137 |
| 比较操作 | evaluateEquality, compareValues | 5624-5686, 6263-6286 |
| 字符串函数 | evalConcat, evalUpper, evalLower, evalSubstring, evalLength, evalTrim, evalReplace, evalLeft, evalRight | 5803-5904 |
| 数学函数 | evalAbs, evalCeil, evalFloor, evalRound, evalPower, evalSqrt, evalMod | 5908-5987 |
| 聚合函数 | computeAggregateStreaming, invokeAggregateFunctionLegacy, invokeStringAggregateFunction | 6967-7118 |
| 日期函数 | evaluateExtractExpr | 5666-5741 |
| 其他函数 | evalCoalesce, evalNullIf | 6060-6083 |
| 工具方法 | getColumnName, isColumnReference, substituteCorrelatedValues | 5219-5250, 5181-5216, 4985-5036 |

**依赖关系**：
- 依赖：FunctionRegistry（现有）
- 被依赖：所有其他 Processor

**接口定义**：
```java
package ai.justdb.justdb.jdbc.executor;

import ai.justdb.justdb.jdbc.JustdbDataSource;
import java.sql.SQLException;
import java.util.Map;

/**
 * Expression engine - handles expression evaluation and function calls
 */
public interface ExpressionEngine {

    /**
     * Evaluate expression without row context
     */
    Object evaluate(com.alibaba.druid.sql.ast.SQLExpr expr) throws SQLException;

    /**
     * Evaluate expression with row context
     */
    Object evaluate(
        com.alibaba.druid.sql.ast.SQLExpr expr,
        Map&lt;String, , Object> row
    ) throws SQLException;

    /**
     * Evaluate expression for INSERT statement
     */
    Object evaluateForInsert(com.alibaba.druid.sql.ast.SQLExpr expr) throws SQLException;

    /**
     * Evaluate binary operation expression
     */
    Object evaluateBinaryOp(
        com.alibaba.druid.sql.ast.expr.SQLBinaryOpExpr expr,
        Map&lt;String, , Object> row
    ) throws SQLException;

    /**
     * Evaluate condition expression (returns boolean)
     */
    boolean evaluateCondition(
        com.alibaba.druid.sql.ast.SQLExpr conditionExpr,
        Map&lt;String, , Object> row
    ) throws SQLException;

    /**
     * Compare two values
     * @return negative if v1 < v2, 0 if equal, positive if v1 > v2
     */
    int compare(Object v1, Object v2);

    /**
     * Convert value to boolean
     */
    boolean toBoolean(Object value);

    /**
     * Get column name from expression
     */
    String getColumnName(com.alibaba.druid.sql.ast.SQLExpr expr);

    /**
     * Check if expression is a column reference
     */
    boolean isColumnReference(com.alibaba.druid.sql.ast.SQLExpr expr);

    /**
     * Evaluate function call
     */
    Object evaluateFunction(
        com.alibaba.druid.sql.ast.expr.SQLMethodInvokeExpr functionExpr,
        Map&lt;String, , Object> row
    ) throws SQLException;
}
```

#### 2.2.5 ResultSetProcessor（结果集处理器）

**职责**：投影、聚合、窗口函数、排序、分页

**预计规模**：~800 行，~40 个方法

**核心方法**：

| 分类 | 方法名 | 原行号范围 |
|------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| 投影处理 | applyProjection, extractColumnNames, applyDistinct | 6350-6487, 4573-4849, 6289-6346 |
| 聚合处理 | applyAggregateProjection, computeAggregateStreaming, applyGroupBy | 6936-7029, 6490-6644 |
| 窗口函数 | applyWindowFunctionProjection, computeWindowFunction, evaluateLag, evaluateLead, evaluateFirstValue, evaluateLastValue, sortRows | 6647-6876, 6759-6923 |
| 排序/分页 | applyOrderBy, applyLimit, applyOrderByToList | 7199-7266, 2575-2607 |
| HAVING | evaluateHavingClause, evaluateHavingExpression | 7121-7196, 7159-7195 |
| 工具方法 | matchesLikePattern, buildTableAliasMap, addTableAlias, extractTableName | 4852-4982, 4473-4571, 4504-4523, 4526-4570 |

**依赖关系**：
- 依赖：ExpressionEngine
- 被依赖：QueryProcessor

**接口定义**：
```java
package ai.justdb.justdb.jdbc.executor;

import ai.justdb.justdb.jdbc.JustdbDataSource;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * ResultSet processor - handles projection, aggregation, sorting, pagination
 */
public interface ResultSetProcessor {

    /**
     * Apply projection to rows
     */
    List<Map&gt;<String, Object>> project(
        List<Map&gt;<String, Object>> rows,
        com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock queryBlock
    ) throws SQLException;

    /**
     * Apply aggregation to rows
     */
    List<Map&gt;<String, Object>> aggregate(
        List<Map&gt;<String, Object>> rows,
        com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock queryBlock
    ) throws SQLException;

    /**
     * Apply window functions to rows
     */
    List<Map&gt;<String, Object>> applyWindowFunctions(
        List<Map&gt;<String, Object>> rows,
        com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock queryBlock
    ) throws SQLException;

    /**
     * Apply ORDER BY and LIMIT to rows
     */
    List<Map&gt;<String, Object>> sortAndLimit(
        List<Map&gt;<String, Object>> rows,
        com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock queryBlock
    ) throws SQLException;

    /**
     * Apply DISTINCT to rows
     */
    List<Map&gt;<String, Object>> distinct(
        List<Map&gt;<String, Object>> rows,
        com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock queryBlock
    ) throws SQLException;

    /**
     * Build table alias map from query block
     */
    Map&lt;String, String&gt; buildTableAliasMap(
        com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock queryBlock
    );
}
```

#### 2.2.6 MetadataProcessor（元数据处理器）

**职责**：SHOW 命令、EXPLAIN、系统变量、事务

**预计规模**：~450 行，~25 个方法

**核心方法**：

| 分类 | 方法名 | 原行号范围 |
|------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| SHOW 命令 | executeShowStatement, executeShowDatabases, executeShowTables, executeShowTableStatus, executeShowColumns, executeShowIndex, executeShowCreateTable | 7420-7951 |
| EXPLAIN | executeExplain | 7269-7397 |
| 系统变量 | executeSystemVariableQuery, getSystemVariableValue, hasSystemVariableReference, containsSystemVariable | 7562-7700 |
| 事务 | executeBegin, executeCommit, executeRollback, executeSavepoint, executeRollbackToSavepoint, executeReleaseSavepoint | 7953-8003 |
| 工具方法 | stripSqlComments | 7466-7491 |

**依赖关系**：
- 依赖：JustdbDataSource
- 被依赖：SqlExecutor

**接口定义**：
```java
package ai.justdb.justdb.jdbc.executor;

import ai.justdb.justdb.jdbc.JustdbDataSource;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * Metadata processor - handles SHOW commands, EXPLAIN, system variables, transactions
 */
public interface MetadataProcessor {

    /**
     * Process SHOW statement
     */
    List<Map&gt;<String, Object>> processShow(String sql) throws SQLException;

    /**
     * Process EXPLAIN statement
     */
    List<Map&gt;<String, Object>> processExplain(String sql) throws SQLException;

    /**
     * Process system variable query
     */
    List<Map&gt;<String, Object>> processSystemVariableQuery(String sql) throws SQLException;

    /**
     * Process transaction command (BEGIN/COMMIT/ROLLBACK/SAVEPOINT)
     */
    int processTransaction(String command) throws SQLException;

    /**
     * Strip SQL comments from query
     */
    String stripComments(String sql);
}
```

---------------------------

## 三、目录结构

### 3.1 重构后的目录结构

```
justdb-core/src/main/java/ai.justdb/justdb/jdbc/
├── SqlExecutor.java                    [统一入口，~200 行]
└── executor/
    ├── QueryProcessor.java             [接口，~100 行]
    ├── QueryProcessorImpl.java         [实现，~2500 行]
    ├── MutationProcessor.java          [接口，~80 行]
    ├── MutationProcessorImpl.java      [实现，~1200 行]
    ├── DdlProcessor.java               [接口，~100 行]
    ├── DdlProcessorImpl.java           [实现，~1800 行]
    ├── ExpressionEngine.java           [接口，~120 行]
    ├── ExpressionEngineImpl.java       [实现，~1500 行]
    ├── ResultSetProcessor.java         [接口，~80 行]
    ├── ResultSetProcessorImpl.java     [实现，~800 行]
    ├── MetadataProcessor.java          [接口，~70 行]
    └── MetadataProcessorImpl.java      [实现，~450 行]
```

### 3.2 新 SqlExecutor 结构（重构后）

```java
package ai.justdb.justdb.jdbc;

import ai.justdb.justdb.jdbc.executor.*;
import ai.justdb.justdb.function.FunctionRegistry;

/**
 * SQL Executor - unified entry point for SQL execution
 * Refactored to delegate to specialized processors
 */
public class SqlExecutor {

    private final JustdbDataSource dataSource;
    private final FunctionRegistry functionRegistry;

    // Processors
    private final QueryProcessor queryProcessor;
    private final MutationProcessor mutationProcessor;
    private final DdlProcessor ddlProcessor;
    private final ExpressionEngine expressionEngine;
    private final ResultSetProcessor resultSetProcessor;
    private final MetadataProcessor metadataProcessor;

    public SqlExecutor(JustdbDataSource dataSource) {
        this.dataSource = dataSource;
        this.functionRegistry = new FunctionRegistry();
        initializeBuiltinFunctions();

        // Initialize processors (dependency injection)
        this.expressionEngine = new ExpressionEngineImpl(dataSource, functionRegistry, this);
        this.resultSetProcessor = new ResultSetProcessorImpl(dataSource, expressionEngine);
        this.queryProcessor = new QueryProcessorImpl(dataSource, expressionEngine, resultSetProcessor);
        this.mutationProcessor = new MutationProcessorImpl(dataSource, expressionEngine);
        this.ddlProcessor = new DdlProcessorImpl(dataSource, expressionEngine);
        this.metadataProcessor = new MetadataProcessorImpl(dataSource);
    }

    // ========== Public API (unchanged for backward compatibility) ==========

    public ResultSet executeSelect(String sql) throws SQLException {
        // Route to query processor
        return queryProcessor.process(sql);
    }

    public int executeUpdate(String sql) throws SQLException {
        // Parse and route to appropriate processor
        SQLStatement stmt = parseStatement(sql);
        if (stmt instanceof SQLInsertStatement) {
            return mutationProcessor.processInsert((SQLInsertStatement) stmt);
        } else if (stmt instanceof SQLUpdateStatement) {
            return mutationProcessor.processUpdate((SQLUpdateStatement) stmt);
        } else if (stmt instanceof SQLDeleteStatement) {
            return mutationProcessor.processDelete((SQLDeleteStatement) stmt);
        } else if (stmt instanceof SQLCreateTableStatement) {
            return ddlProcessor.processCreateTable((MySqlCreateTableStatement) stmt, sql);
        } else if (stmt instanceof SQLDropTableStatement) {
            return ddlProcessor.processDropTable((SQLDropTableStatement) stmt);
        } else if (stmt instanceof SQLAlterTableStatement) {
            return ddlProcessor.processAlterTable((SQLAlterTableStatement) stmt);
        }
        // ... more routing logic
    }

    // ... rest of public API

    // ========== Package-private access for processors ==========

    JustdbDataSource getDataSource() {
        return dataSource;
    }

    FunctionRegistry getFunctionRegistry() {
        return functionRegistry;
    }
}
```

---------------------------

## 四、实施计划

### 4.1 分阶段实施（共 7 个阶段，约 20-30 天）

```
┌────────────────────────────────────────────────────────────┐
│ 阶段 1：接口层设计（1-2 天）                                  │
├────────────────────────────────────────────────────────────┤
│ ✓ 定义 6 个 Processor 接口                                  │
│ ✓ 设计依赖注入框架                                          │
│ ✓ 创建包结构 ai.justdb.justdb.jdbc.executor                │
│ ✓ 编写接口文档                                              │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 阶段 2：ExpressionEngine（3-5 天）                           │
├────────────────────────────────────────────────────────────┤
│ ✓ 创建 ExpressionEngine 接口                                │
│ ✓ 创建 ExpressionEngineImpl 实现类                          │
│ ✓ 迁移表达式求值方法（~100 个）                              │
│ ✓ 迁移函数调用方法                                          │
│ ✓ 单元测试                                                  │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 阶段 3：ResultSetProcessor（2-3 天）                         │
├────────────────────────────────────────────────────────────┤
│ ✓ 创建 ResultSetProcessor 接口                              │
│ ✓ 创建 ResultSetProcessorImpl 实现类                        │
│ ✓ 迁移投影/聚合/排序方法（~40 个）                            │
│ ✓ 单元测试                                                  │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 阶段 4：MetadataProcessor（2-3 天）                         │
├────────────────────────────────────────────────────────────┤
│ ✓ 创建 MetadataProcessor 接口                               │
│ ✓ 创建 MetadataProcessorImpl 实现类                         │
│ ✓ 迁移 SHOW/EXPLAIN/事务方法（~25 个）                       │
│ ✓ 单元测试                                                  │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 阶段 5：MutationProcessor（3-4 天）                          │
├────────────────────────────────────────────────────────────┤
│ ✓ 创建 MutationProcessor 接口                               │
│ ✓ 创建 MutationProcessorImpl 实现类                         │
│ ✓ 迁移 INSERT/UPDATE/DELETE 方法（~35 个）                   │
│ ✓ 单元测试                                                  │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 阶段 6：QueryProcessor（5-7 天）                             │
├────────────────────────────────────────────────────────────┤
│ ✓ 创建 QueryProcessor 接口                                  │
│ ✓ 创建 QueryProcessorImpl 实现类                            │
│ ✓ 迁移 SELECT/JOIN/CTE 方法（~50 个）                        │
│ ✓ 单元测试                                                  │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 阶段 7：DdlProcessor（4-5 天）                               │
├────────────────────────────────────────────────────────────┤
│ ✓ 创建 DdlProcessor 接口                                    │
│ ✓ 创建 DdlProcessorImpl 实现类                              │
│ ✓ 迁移 CREATE/DROP/ALTER 方法（~80 个）                      │
│ ✓ 单元测试                                                  │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ 阶段 8：SqlExecutor 重构（2-3 天）                           │
├────────────────────────────────────────────────────────────┤
│ ✓ 重构 SqlExecutor 为统一入口                               │
│ ✓ 实现路由逻辑                                              │
│ ✓ 清理冗余代码                                              │
│ ✓ 集成测试                                                  │
└────────────────────────────────────────────────────────────┘
```

### 4.2 每日工作检查清单

**开始工作前**：
- [ ] 拉取最新代码
- [ ] 运行现有测试确保全部通过
- [ ] 创建功能分支

**迁移工作中**：
- [ ] 只迁移当前阶段的方法
- [ ] 保持原方法签名不变
- [ ] 添加单元测试
- [ ] 运行相关测试

**阶段完成后**：
- [ ] 全部测试通过
- [ ] 代码审查
- [ ] 提交代码
- [ ] 更新文档

---------------------------

## 五、技术方案

### 5.1 依赖注入

```java
// Constructor-based dependency injection
public class SqlExecutor {
    private final QueryProcessor queryProcessor;
    private final MutationProcessor mutationProcessor;
    // ...

    public SqlExecutor(JustdbDataSource dataSource) {
        // Build dependency graph
        this.expressionEngine = new ExpressionEngineImpl(dataSource, functionRegistry, this);
        this.resultSetProcessor = new ResultSetProcessorImpl(dataSource, expressionEngine);
        this.queryProcessor = new QueryProcessorImpl(dataSource, expressionEngine, resultSetProcessor);
        // ...
    }
}
```

### 5.2 向后兼容方案

**保持公共 API 不变**：

```java
// SqlExecutor 公共方法保持不变
public ResultSet executeSelect(String sql) throws SQLException {
    // 内部实现改为委托给 queryProcessor
    return queryProcessor.process(sql);
}

public int executeUpdate(String sql) throws SQLException {
    // 内部实现改为路由到对应 processor
    return routeAndUpdate(sql);
}
```

### 5.3 循环依赖处理

**问题**：SqlExecutor 需要 Processor，Processor 又需要 SqlExecutor

**方案**：使用接口 + 延迟初始化

```java
public interface SqlExecutorContext {
    JustdbDataSource getDataSource();
    FunctionRegistry getFunctionRegistry();
}

public class ExpressionEngineImpl implements ExpressionEngine {
    private final SqlExecutorContext context;

    public ExpressionEngineImpl(JustdbDataSource dataSource,
                                FunctionRegistry registry,
                                SqlExecutorContext context) {
        this.context = context;
    }
}

public class SqlExecutor implements SqlExecutorContext {
    // SqlExecutor 实现上下文接口，传递给 Processor
}
```

---------------------------

## 六、测试策略

### 6.1 测试层次

```
┌────────────────────────────────────────────────────────────┐
│ 集成测试（现有）                                            │
│ - SqlExecutorTest                                          │
│ - SqlCommandTest                                           │
│ - VirtualTableSqlExecutorIntegrationTest                   │
└────────────────────────────────────────────────────────────┘
                            ↑
┌────────────────────────────────────────────────────────────┐
│ Processor 单元测试（新增）                                   │
│ - ExpressionEngineTest                                     │
│ - ResultSetProcessorTest                                   │
│ - QueryProcessorTest                                       │
│ - MutationProcessorTest                                    │
│ - DdlProcessorTest                                         │
│ - MetadataProcessorTest                                    │
└────────────────────────────────────────────────────────────┘
```

### 6.2 测试原则

1. **迁移前测试**：确保现有测试全部通过
2. **并行开发**：在新类中实现，不立即删除原方法
3. **逐步替换**：一次迁移一个 Processor，每次迁移后运行测试
4. **回归测试**：每个阶段完成后运行完整测试套件

### 6.3 测试用例示例

```java
@Test
public void testExpressionEngineEvaluate() {
    // Setup
    JustdbDataSource dataSource = createTestDataSource();
    FunctionRegistry registry = new FunctionRegistry();
    SqlExecutorContext context = mock(SqlExecutorContext.class);
    ExpressionEngine engine = new ExpressionEngineImpl(dataSource, registry, context);

    // Execute
    SQLExpr expr = DruidParser.parse("1 + 2");
    Object result = engine.evaluate(expr);

    // Assert
    assertEquals(3L, result);
}
```

---------------------------

## 七、风险评估

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|----------------------------------------------------------------------------------|
| 循环依赖 | 中 | 高 | 使用接口解耦，延迟初始化 |
| 方法移动复杂 | 高 | 中 | 分阶段进行，每次只移动一个模块 |
| 测试覆盖不足 | 中 | 高 | 迁移前补充测试用例 |
| 性能回归 | 低 | 中 | 使用性能基准测试对比 |
| 时间估算不准 | 中 | 低 | 预留 20% 缓冲时间 |

### 7.2 回滚计划

**每个阶段独立提交**，如果出现问题：
1. 回滚到上一个稳定阶段
2. 分析问题原因
3. 修复后继续

**分支策略**：
```
main (stable)
  │
  ├─ refactor/sqlexector-phase1-interface
  ├─ refactor/sqlexector-phase2-expression
  ├─ refactor/sqlexector-phase3-resultset
  └─ ...
```

---------------------------

## 八、预期收益

### 8.1 量化指标

| 指标 | 改进前 | 改进后 | 改进幅度 |
|------------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------|----------------------------------------------------------------------------------|
| 单文件最大行数 | 8252 | ~2500 | -70% |
| 单一类职责数量 | 6+ | 1 | -80% |
| 方法可测试性 | 低 | 高 | +100% |
| 代码可维护性 | 低 | 高 | 显著提升 |

### 8.2 定性收益

1. **开发效率提升**
   - 新功能添加更容易
   - Bug 定位更快速
   - 代码审查更简单

2. **代码质量提升**
   - 单一职责原则
   - 更好的依赖管理
   - 更清晰的模块边界

3. **团队协作改善**
   - 减少合并冲突
   - 并行开发可能性增加
   - 知识传递更容易

---------------------------

## 九、后续优化

### 9.1 进一步优化方向

1. **FunctionRegistry 独立模块**
   - 当前作为 SqlExecutor 内部类
   - 可独立为 `ai.justdb.justdb.function` 包

2. **VirtualTable 支持分离**
   - 当前集成在 SqlExecutor 中
   - 可独立为 `ai.justdb.justdb.jdbc.virtual` 包

3. **SQL 解析器抽象**
   - 当前直接依赖 Druid Parser
   - 可抽象为 Parser 接口，支持多种实现

### 9.2 性能优化

1. **预编译语句缓存**
   - 当前每次都解析 SQL
   - 可添加 LRU 缓存

2. **执行计划缓存**
   - 简单查询的执行计划可缓存
   - 复杂查询可部分缓存

---------------------------

## 十、总结

### 10.1 重构原则

1. **小步快跑**：每次只重构一个小模块
2. **测试驱动**：测试优先，确保不破坏现有功能
3. **向后兼容**：保持公共 API 不变
4. **文档同步**：代码和文档同步更新

### 10.2 成功标准

- [ ] 所有现有测试通过
- [ ] 新增单元测试覆盖率 > 80%
- [ ] 单文件代码行数 < 3000
- [ ] 无循环依赖
- [ ] 性能无明显下降

### 10.3 下一步行动

1. 审查本计划
2. 确定实施时间窗口
3. 创建功能分支
4. 开始阶段 1：接口层设计

# SQL Function Implementation Plan

**Last Updated:** 2026-02-05
**Status:** Phase 1-4 Completed

## Overview
实现 MySQL、PostgreSQL、Oracle 的 SQL 函数支持。每个数据库优先实现 50 个最常用的函数。

## Progress Tracking

### Overall Progress
- [x] Phase 1: Foundation (MVP) - 基础架构 + 20 通用函数
- [x] Phase 2: MySQL 常用函数 (+50)
- [x] Phase 3: PostgreSQL 常用函数 (+50)
- [x] Phase 4: Oracle 常用函数 (+50)

---------------------------

## Phase 1: Foundation (MVP) - 20 Universal Functions

**Status:** Completed
**Target:** 20 个跨数据库通用函数

### String Functions (11)
| Function | Status | Implementation | Notes |
|----------------------------------------------------------------------------------|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| CONCAT | [x] | `StringFunctions.java` | 变长参数 |
| UPPER | [x] | `StringFunctions.java` | 别名: UCASE |
| LOWER | [x] | `StringFunctions.java` | 别名: LCASE |
| SUBSTRING | [x] | `StringFunctions.java` | 别名: SUBSTR |
| LENGTH | [x] | `StringFunctions.java` | 别名: CHAR_LENGTH |
| TRIM | [x] | `StringFunctions.java` | |
| REPLACE | [x] | `StringFunctions.java` | |
| LEFT | [x] | `StringFunctions.java` | |
| RIGHT | [x] | `StringFunctions.java` | |
| LTRIM | [x] | `StringFunctions.java` | |
| RTRIM | [x] | `StringFunctions.java` | |

### Math Functions (7)
| Function | Status | Implementation | Notes |
|----------------------------------------------------------------------------------|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| ABS | [x] | `MathFunctions.java` | |
| CEIL | [x] | `MathFunctions.java` | 别名: CEILING |
| FLOOR | [x] | `MathFunctions.java` | |
| ROUND | [x] | `MathFunctions.java` | 支持重载(1或2参数) |
| POWER | [x] | `MathFunctions.java` | 别名: POW |
| SQRT | [x] | `MathFunctions.java` | |
| MOD | [x] | `MathFunctions.java` | 别名: REMAINDER |

### Conversion Functions (3)
| Function | Status | Implementation | Notes |
|----------------------------------------------------------------------------------|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| CAST | [x] | `ConversionFunctions.java` | |
| COALESCE | [x] | `ConversionFunctions.java` | |
| NULLIF | [x] | `ConversionFunctions.java` | |

### Infrastructure Tasks
| Task | Status | File |
|------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------|
| FunctionSignature.java | [x] | `function/FunctionSignature.java` |
| FunctionInvoker.java | [x] | `function/FunctionInvoker.java` |
| FunctionContext.java | [x] | `function/FunctionContext.java` |
| FunctionRegistry.java | [x] | `function/FunctionRegistry.java` |
| AdapterBaseConfig.java (修改) | [x] | `plugin/AdapterBaseConfig.java` |
| FunctionConfig.java | [x] | `adapter/DatabaseAdapterConfig.java` |
| SqlExecutor.java (修改) | [x] | `jdbc/SqlExecutor.java:4441-4490` |
| default-plugins.xml (更新) | [ ] | `resources/default-plugins.xml` |
| FunctionRegistryTest.java | [x] | `function/FunctionRegistryTest.java` |
| StringFunctionsTest.java | [x] | `function/StringFunctionsTest.java` |
| MathFunctionsTest.java | [x] | `function/MathFunctionsTest.java` |
| ConversionFunctionsTest.java | [x] | `function/ConversionFunctionsTest.java` |

---------------------------

## Phase 2: MySQL Common Functions (+50)

**Status:** Completed
**Target:** 50 个 MySQL 常用函数

### String Functions (15)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| CONCAT_WS | High | 用分隔符连接 |
| FORMAT | Medium | 数字格式化 |
| INSERT | Low | 字符串插入 |
| INSTR | High | 查找子串位置 |
| LCASE | - | 别名 LOWER |
| LEFT | - | 已在 Phase 1 |
| LENGTH | - | 已在 Phase 1 |
| LOCATE | High | 别名 POSITION |
| LOWER | - | 已在 Phase 1 |
| LPAD | Medium | 左填充 |
| LTRIM | - | 已在 Phase 1 |
| MID | - | 别名 SUBSTRING |
| POSITION | High | |
| REPEAT | Medium | 重复字符串 |
| REPLACE | - | 已在 Phase 1 |
| REVERSE | Medium | 反转字符串 |
| RIGHT | - | 已在 Phase 1 |
| RPAD | Medium | 右填充 |
| RTRIM | - | 已在 Phase 1 |
| SPACE | Low | 返回空格 |
| STRCMP | Medium | 字符串比较 |
| SUBSTRING | - | 已在 Phase 1 |
| SUBSTRING_INDEX | High | 按分隔符截取 |
| TRIM | - | 已在 Phase 1 |
| UCASE | - | 别名 UPPER |
| UPPER | - | 已在 Phase 1 |

### Math Functions (10)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ABS | - | 已在 Phase 1 |
| ACOS | Low | |
| ASIN | Low | |
| ATAN | Low | |
| ATAN2 | Low | |
| CEIL | - | 已在 Phase 1 |
| CEILING | - | 已在 Phase 1 |
| COS | Low | |
| COT | Low | |
| DEGREES | Low | |
| DIV | Medium | 整数除法 |
| EXP | Low | |
| FLOOR | - | 已在 Phase 1 |
| LN | Low | 自然对数 |
| LOG | Medium | 对数 |
| LOG10 | Low | |
| LOG2 | Low | |
| MOD | - | 已在 Phase 1 |
| PI | Low | |
| POW | - | 已在 Phase 1 |
| POWER | - | 已在 Phase 1 |
| RADIANS | Low | |
| RAND | High | 随机数 |
| ROUND | - | 已在 Phase 1 |
| SIGN | Medium | 符号函数 |
| SIN | Low | |
| SQRT | - | 已在 Phase 1 |
| TAN | Low | |
| TRUNCATE | Medium | 截断 |

### Date Functions (15)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ADDDATE | High | |
| ADDTIME | Medium | |
| CURDATE | High | 当前日期 |
| CURTIME | High | 当前时间 |
| CURRENT_DATE | High | |
| CURRENT_TIME | High | |
| CURRENT_TIMESTAMP | High | |
| DATE | High | 提取日期 |
| DATEDIFF | High | 日期差 |
| DATE_ADD | High | |
| DATE_FORMAT | High | 格式化日期 |
| DATE_SUB | High | |
| DAY | High | |
| DAYNAME | Medium | |
| DAYOFMONTH | High | |
| DAYOFWEEK | Medium | |
| DAYOFYEAR | Medium | |
| EXTRACT | High | |
| FROM_DAYS | Low | |
| FROM_UNIXTIME | Medium | |
| HOUR | High | |
| LAST_DAY | Medium | |
| LOCALTIME | High | |
| LOCALTIMESTAMP | High | |
| MAKEDATE | Low | |
| MAKETIME | Low | |
| MICROSECOND | Medium | |
| MINUTE | High | |
| MONTH | High | |
| MONTHNAME | Medium | |
| NOW | High | 当前日期时间 |
| PERIOD_ADD | Low | |
| PERIOD_DIFF | Low | |
| QUARTER | Medium | |
| SECOND | High | |
| SEC_TO_TIME | Low | |
| STR_TO_DATE | High | 字符串转日期 |
| SUBDATE | High | |
| SUBTIME | Medium | |
| SYSDATE | High | |
| TIME | High | 提取时间 |
| TIMEDIFF | High | 时间差 |
| TIMESTAMP | Medium | |
| TIMESTAMPADD | Medium | |
| TIMESTAMPDIFF | Medium | |
| TIME_FORMAT | Medium | |
| TIME_TO_SEC | Medium | |
| TO_DAYS | Low | |
| UNIX_TIMESTAMP | Medium | |
| UTC_DATE | Medium | |
| UTC_TIME | Medium | |
| UTC_TIMESTAMP | Medium | |
| WEEK | Medium | |
| WEEKDAY | Medium | |
| WEEKOFYEAR | Medium | |
| YEAR | High | |
| YEARWEEK | Medium | |

### Conditional Functions (5)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| CASE | High | |
| COALESCE | - | 已在 Phase 1 |
| IF | High | MySQL 特有 |
| IFNULL | High | |
| NULLIF | - | 已在 Phase 1 |

### Aggregate Functions (5)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| AVG | High | |
| COUNT | High | |
| GROUP_CONCAT | High | MySQL 特有 |
| MAX | High | |
| MIN | High | |
| SUM | High | |

---------------------------

## Phase 3: PostgreSQL Common Functions (+50)

**Status:** Completed
**Target:** 50 个 PostgreSQL 常用函数

### String Functions (15)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ASCII | Medium | |
| BTRIM | Medium | |
| CHR | Medium | |
| CONCAT | - | 已在 Phase 1 |
| CONCAT_WS | High | |
| FORMAT | Medium | |
| INITCAP | Medium | 首字母大写 |
| LEFT | - | 已在 Phase 1 |
| LENGTH | - | 已在 Phase 1 |
| LOWER | - | 已在 Phase 1 |
| LPAD | Medium | |
| LTRIM | - | 已在 Phase 1 |
| POSITION | High | |
| REGEXP_MATCHES | High | 正则匹配 |
| REGEXP_REPLACE | High | 正则替换 |
| REGEXP_SPLIT_TO_ARRAY | High | 正则分割为数组 |
| REGEXP_SPLIT_TO_TABLE | Medium | 正则分割为表 |
| REPEAT | Medium | |
| REPLACE | - | 已在 Phase 1 |
| REVERSE | Medium | |
| RIGHT | - | 已在 Phase 1 |
| RPAD | Medium | |
| RTRIM | - | 已在 Phase 1 |
| SPLIT_PART | High | 分割字符串 |
| SUBSTRING | - | 已在 Phase 1 |
| SUBSTR | - | 已在 Phase 1 |
| TRANSLATE | Medium | |
| TRIM | - | 已在 Phase 1 |
| UPPER | - | 已在 Phase 1 |

### Math Functions (10)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ABS | - | 已在 Phase 1 |
| ACOS | Low | |
| ASIN | Low | |
| ATAN | Low | |
| CEIL | - | 已在 Phase 1 |
| CEILING | - | 已在 Phase 1 |
| COS | Low | |
| COT | Low | |
| DEGREES | Low | |
| DIV | Medium | |
| EXP | Low | |
| FLOOR | - | 已在 Phase 1 |
| LN | Low | |
| LOG | Medium | |
| MOD | - | 已在 Phase 1 |
| PI | Low | |
| POWER | - | 已在 Phase 1 |
| RADIANS | Low | |
| ROUND | - | 已在 Phase 1 |
| SIGN | Medium | |
| SIN | Low | |
| SQRT | - | 已在 Phase 1 |
| TAN | Low | |
| TRUNC | Medium | |

### Date Functions (15)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| AGE | Medium | |
| CLOCK_TIMESTAMP | Medium | |
| CURRENT_DATE | High | |
| CURRENT_TIME | High | |
| CURRENT_TIMESTAMP | High | |
| DATE_PART | High | |
| DATE_TRUNC | High | |
| EXTRACT | High | |
| ISFINITE | Low | |
| JUSTIFY_DAYS | Low | |
| JUSTIFY_HOURS | Low | |
| JUSTIFY_INTERVAL | Low | |
| LOCALTIME | High | |
| LOCALTIMESTAMP | High | |
| NOW | High | |
| STATEMENT_TIMESTAMP | Medium | |
| TIMEOFDAY | Medium | |
| TRANSACTION_TIMESTAMP | Medium | |
| TO_DATE | High | 字符串转日期 |
| TO_TIMESTAMP | High | |

### Array Functions (5)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ARRAY_AGG | High | |
| ARRAY_APPEND | High | |
| ARRAY_LENGTH | High | |
| ARRAY_PREPEND | High | |
| UNNEST | High | |

### Conditional/Aggregate Functions (5)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| COALESCE | - | 已在 Phase 1 |
| NULLIF | - | 已在 Phase 1 |
| COUNT | High | |
| SUM | High | |
| AVG | High | |

---------------------------

## Phase 4: Oracle Common Functions (+50)

**Status:** Completed
**Target:** 50 个 Oracle 常用函数

### String Functions (15)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ASCII | Medium | |
| CONCAT | - | 已在 Phase 1 |
| INITCAP | Medium | |
| INSTR | High | 查找位置 |
| LENGTH | - | 已在 Phase 1 |
| LOWER | - | 已在 Phase 1 |
| LPAD | Medium | |
| LTRIM | - | 已在 Phase 1 |
| REGEXP_COUNT | High | |
| REGEXP_INSTR | High | |
| REGEXP_REPLACE | High | |
| REGEXP_SUBSTR | High | |
| REPLACE | - | 已在 Phase 1 |
| RPAD | Medium | |
| RTRIM | - | 已在 Phase 1 |
| SUBSTR | - | 已在 Phase 1 |
| TRANSLATE | Medium | |
| TRIM | - | 已在 Phase 1 |
| UPPER | - | 已在 Phase 1 |

### Math Functions (10)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ABS | - | 已在 Phase 1 |
| ACOS | Low | |
| ASIN | Low | |
| ATAN | Low | |
| CEIL | - | 已在 Phase 1 |
| COS | Low | |
| EXP | Low | |
| FLOOR | - | 已在 Phase 1 |
| LN | Low | |
| LOG | Medium | |
| MOD | - | 已在 Phase 1 |
| POWER | - | 已在 Phase 1 |
| ROUND | - | 已在 Phase 1 |
| SIGN | Medium | |
| SIN | Low | |
| SQRT | - | 已在 Phase 1 |
| TAN | Low | |
| TRUNC | Medium | 截断 |

### Date Functions (15)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| ADD_MONTHS | High | |
| CURRENT_DATE | High | |
| CURRENT_TIMESTAMP | High | |
| DBTIMEZONE | Low | |
| EXTRACT | High | |
| LAST_DAY | High | |
| LOCALTIMESTAMP | High | |
| MONTHS_BETWEEN | High | |
| NEW_TIME | Low | |
| NEXT_DAY | High | |
| NUMTODSINTERVAL | Low | |
| NUMTOYMINTERVAL | Low | |
| ROUND | Medium | 日期四舍五入 |
| SESSIONTIMEZONE | Low | |
| SYS_EXTRACT_UTC | Medium | |
| SYSDATE | High | |
| SYSTIMESTAMP | High | |
| TO_DATE | High | |
| TO_TIMESTAMP | High | |
| TO_TIMESTAMP_TZ | Medium | |
| TRUNC | Medium | 日期截断 |
| TZ_OFFSET | Low | |

### Conditional/Conversion Functions (5)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| CAST | - | 已在 Phase 1 |
| COALESCE | High | |
| DECODE | High | Oracle 特有 |
| NVL | High | Oracle 特有 |
| NVL2 | High | Oracle 特有 |
| NULLIF | - | 已在 Phase 1 |
| TO_CHAR | High | |

### Analytic Functions (5)
| Function | Priority | Notes |
|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------|
| RANK | High | |
| DENSE_RANK | High | |
| ROW_NUMBER | High | |
| LAG | High | |
| LEAD | High | |

---------------------------

## Deferred Functions (延后处理)

### MySQL Deferred Functions
总计约 200+ 函数，记录在此延后实现

#### String (100+)
- BIN, BINARY, BIT_LENGTH, CHAR, CHARACTER_LENGTH, CHAR_LENGTH, COERCIBILITY, COMPRESS, ELT, ENCODE, EXPORT_SET, FIELD, FIND_IN_SET, HEX, LOAD_FILE, LOCATE, MAKE_SET, MATCH, AGAINST, OCT, OCTET_LENGTH, ORD, QUOTE, RPAD, RTRIM, SOUNDEX, SOUNDS LIKE, SPACE, STRCMP, SUBSTRING, UNCOMPRESS, UNCOMPRESSED_LENGTH, UNHEX, WEIGHT_STRING

#### Math (50+)
- ACOS, ASIN, ATAN, ATAN2, COS, COT, CRC32, DEGREES, EXP, LN, LOG, LOG10, LOG2, PI, POW, RADIANS, RAND, SIGN, SIN, TAN

#### Date (80+)
- CONVERT_TZ, CURDATE, CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP, CURTIME, DATE, DATE_ADD, DATE_FORMAT, DATE_SUB, DATEDIFF, DAY, DAYNAME, DAYOFMONTH, DAYOFWEEK, DAYOFYEAR, EXTRACT, FROM_DAYS, FROM_UNIXTIME, GET_FORMAT, HOUR, LAST_DAY, LOCALTIME, LOCALTIMESTAMP, MAKEDATE, MAKETIME, MICROSECOND, MINUTE, MONTH, MONTHNAME, NOW, PERIOD_ADD, PERIOD_DIFF, QUARTER, SECOND, SEC_TO_TIME, STR_TO_DATE, SUBDATE, SUBTIME, SYSDATE, TIME, TIMEDIFF, TIMESTAMP, TIMESTAMPADD, TIMESTAMPDIFF, TIME_FORMAT, TIME_TO_SEC, TO_DAYS, UNIX_TIMESTAMP, UTC_DATE, UTC_TIME, UTC_TIMESTAMP, WEEK, WEEKDAY, WEEKOFYEAR, YEAR, YEARWEEK

#### Advanced (50+)
- JSON 函数: JSON_ARRAY, JSON_OBJECT, JSON_QUOTE, JSON_CONTAINS, JSON_EXTRACT, JSON_ARRAY_APPEND, JSON_ARRAY_INSERT, JSON_INSERT, JSON_MERGE, JSON_REMOVE, JSON_REPLACE, JSON_SET, JSON_UNQUOTE, JSON_DEPTH, JSON_LENGTH, JSON_KEY, JSON_KEYS, JSON_SEARCH, JSON_VALID, JSON_PRETTY, JSON_TYPE
- 加密函数: AES_DECRYPT, AES_ENCRYPT, COMPRESS, MD5, RANDOM_BYTES, SHA1, SHA2, UNCOMPRESS

### PostgreSQL Deferred Functions
总计约 150+ 函数

#### String (50+)
- BIT_LENGTH, CHAR_LENGTH, CHARACTER_LENGTH, OCTET_LENGTH, OVERLAY, POSITION, TO_HEX, ENCODE, DECODE

#### Math (20+)
- CBRT, WIDTH_BUCKET

#### JSON (20+)
- JSONB_ARRAY_ELEMENTS, JSONB_ARRAY_ELEMENTS_TEXT, JSONB_ARRAY_LENGTH, JSONB_BUILD_ARRAY, JSONB_BUILD_OBJECT, JSONB_EACH, JSONB_EACH_TEXT, JSONB_EXTRACT_PATH, JSONB_INSERT, JSONB_OBJECT, JSONB_OBJECT_KEYS, JSONB_POPULATE_RECORD, JSONB_PRETTY, JSONB_SET, JSONB_TYPEOF, TO_JSONB, TO_JSON, JSON_ARRAY_LENGTH, JSON_BUILD_ARRAY, JSON_BUILD_OBJECT, JSON_OBJECT_KEYS, JSON_POPULATE_RECORD, JSON_TO_RECORD

#### Array (30+)
- ARRAY_AGG, ARRAY_CAT, ARRAY_DIMS, ARRAY_FILL, ARRAY_LOWER, ARRAY_POSITIONS, ARRAY_UPPER, CARDINALITY, STRING_TO_ARRAY, ARRAY_TO_STRING

#### Full Text Search (20+)
- TS_HEADLINE, TS_RANK, TS_RANK_CD, TSQUERY_PHRASE, TO_TSQUERY, TO_TSVECTOR

### Oracle Deferred Functions
总计约 200+ 函数

#### LOB Functions (20+)
- BFILENAME, EMPTY_BLOB, EMPTY_CLOB, DBMS_LOB.APPEND, DBMS_LOB.COPY, DBMS_LOB.ERASE, DBMS_LOB.GETLENGTH, DBMS_LOB.INSTR, DBMS_LOB.READ, DBMS_LOB.SUBSTR, DBMS_LOB.WRITE

#### XML Functions (20+)
- APPENDCHILDXML, DELETEXML, EXISTSNODE, EXTRACT, EXTRACTVALUE, INSERTCHILDXML, INSERTXMLAFTER, UPDATEXML

#### Analytic Functions (30+)
- CUME_DIST, FIRST_VALUE, LAST_VALUE, LAG, LEAD, LISTAGG, NTH_VALUE, NTILE, PERCENT_RANK, PERCENTILE_CONT, PERCENTILE_DISC, RATIO_TO_REPORT

#### Advanced (50+)
- CAST, CHARTOROWID, CONVERT, CORR, COVAR_POP, COVAR_SAMP, CUME_DIST, DECODE, DUMP, HEXTORAW, RAWTOHEX, ROWIDTOCHAR, ROW_NUMBER, SCN_TO_TIMESTAMP, TIMESTAMP_TO_SCN, TREAT, UID, USER, USERENV, VSIZE

---------------------------

## File Structure

```
justdb-core/src/main/java/org/verydb/justdb/function/
├── FunctionRegistry.java              # Core registry
├── FunctionSignature.java             # Function metadata
├── FunctionInvoker.java               # Invocation interface
├── FunctionContext.java               # Execution context
├── builtin/
│   ├── StringFunctions.java           # String functions
│   ├── MathFunctions.java             # Math functions
│   ├── DateFunctions.java             # Date functions
│   ├── AggregateFunctions.java        # Aggregate functions
│   ├── ConversionFunctions.java       # CAST, COALESCE, NULLIF
│   ├── ConditionalFunctions.java      # CASE, IF, DECODE, NVL
│   └── JsonFunctions.java             # JSON functions (Phase 3+)
└── dialect/
    ├── MySQLFunctionProvider.java     # MySQL-specific functions
    ├── PostgreSQLFunctionProvider.java # PostgreSQL-specific functions
    └── OracleFunctionProvider.java    # Oracle-specific functions
```

---------------------------

## Testing

### Test Files
```
justdb-core/src/test/java/org/verydb/justdb/function/
├── FunctionRegistryTest.java
├── StringFunctionsTest.java
├── MathFunctionsTest.java
├── DateFunctionsTest.java
├── MySQLFunctionTest.java
├── PostgreSQLFunctionTest.java
└── OracleFunctionTest.java
```

### Test Commands
```bash
# Unit tests
mvn test -Dtest=FunctionRegistryTest
mvn test -Dtest=StringFunctionsTest

# Integration tests
mvn test -Dtest=MySQLFunctionIntegrationTest
```

### Manual Testing
```sql
-- String functions
SELECT CONCAT('Hello', ' ', 'World');
SELECT UPPER('hello');
SELECT LOWER('HELLO');
SELECT SUBSTRING('Hello World', 1, 5);
SELECT LENGTH('Hello');
SELECT TRIM('  hello  ');
SELECT REPLACE('Hello World', 'World', 'There');
SELECT LEFT('Hello', 2);
SELECT RIGHT('Hello', 2);

-- Math functions
SELECT ABS(-10);
SELECT CEIL(3.14);
SELECT FLOOR(3.99);
SELECT ROUND(3.14159, 2);
SELECT POWER(2, 3);
SELECT SQRT(16);
SELECT MOD(10, 3);

-- Conversion functions
SELECT CAST('123' AS INTEGER);
SELECT COALESCE(NULL, 'default');
SELECT NULLIF(10, 10);
```

---------------------------

## Notes

### Function Resolution Order
1. Dialect-specific function (highest priority)
2. Universal function
3. Alias resolution

### Overloading Support
- Same function name, different parameter counts
- Example: `ROUND(3.14)` vs `ROUND(3.14, 2)`

### Dialect Detection
- Uses existing `DatabaseAdapterConfig.dialect` property
- Values: "mysql", "postgresql", "oracle"

### Implementation Guidelines
1. Keep functions simple and focused
2. Handle NULL values appropriately
3. Support type coercion where appropriate
4. Document dialect-specific behavior
5. Write comprehensive tests

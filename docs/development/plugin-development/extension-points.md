# db2schema 增强配置实现计划

## 一、需求概述

### 1.1 功能目标

增强 `db2schema` 命令，支持更强大的导入配置功能：

1. **扩展 includes 配置**：在现有 pattern 机制基础上，支持添加属性（author、remark、module、dataFilter）
2. **优先级匹配**：按匹配表名字符数最多的为准（精确匹配 > 通配符，使用截断法计算）
3. **多 Data 节点**：同优先级规则可配置多次，每次生成独立的 Data 节点
4. **命令行参数**：支持配置文件和命令行参数
5. **Schema 映射**：includes 信息进入 JustDB schema（Item/Table/Data 层级），下次 db2schema 可基于现有 schema 更新
6. **Diff/Migrate 支持**：dataFilter 变化时重新从数据库导入数据，保留 deleted=true 的行

### 1.2 参考配置格式

来自 `/home/wind/workspace/dl/carbon_expert_db/dbconfig.yaml`：

```yaml
- operate: schema_and_alldata    # 结构+全量数据
  operator: limeng               # 操作人
  select_sql: null               # 自定义SQL
  table: area
  comment: 区县表

- operate: schema_and_partdata   # 结构+部分数据
  operator: yuwenhang
  select_sql: select * from sys_role where (tenant_id is null and is_system = 1 and deleted = '0')
  table: sys_role
  comment: 角色信息表

- operate: only_schema           # 仅结构
  operator: yuwenhang
  select_sql: null
  table: sys_dept
  comment: 部门表
```

---------------------------

## 二、核心文件路径

### 2.1 需要新建的文件

| 文件路径 | 说明 |
|---------------------------------------------------------------------------------|------------------------------------------------------|
| `justdb-core/src/main/java/org/verydb/justdb/data/config/IncludeRule.java` | 单个 Include 规则定义 |
| `justdb-core/src/main/java/org/verydb/justdb/data/config/IncludeRuleMatcher.java` | 规则匹配器（优先级计算） |
| `justdb-core/src/main/java/org/verydb/justdb/data/config/IncludeRuleToSchemaMapper.java` | Schema 映射器 |
| `justdb-core/src/main/java/org/verydb/justdb/cli/mixins/Db2SchemaMixin.java` | db2schema 专用参数 Mixin |

### 2.2 需要修改的文件

| 文件路径 | 修改内容 |
|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| `justdb-core/src/main/java/org/verydb/justdb/schema/Item.java` | 添加 author、remark、module 字段 |
| `justdb-core/src/main/java/org/verydb/justdb/schema/Table.java` | 添加 sourcePattern 字段 |
| `justdb-core/src/main/java/org/verydb/justdb/schema/Data.java` | 添加 sourcePattern 字段，使用 remark 替换 description |
| `justdb-core/src/main/java/org/verydb/justdb/schema/CanonicalSchemaDiff.java` | 添加 TableDataFilterChange 类和 calculateTableDataFilterChanges 方法 |
| `justdb-core/src/main/java/org/verydb/justdb/migration/SchemaMigrationService.java` | 处理 Table dataFilter 变化时的数据同步 |
| `justdb-core/src/main/java/org/verydb/justdb/cli/JustdbConfiguration.java` | 添加 includeRules 配置支持 |
| `justdb-core/src/main/java/org/verydb/justdb/cli/commands/Db2SchemaCommand.java` | 集成 IncludeRule 加载和应用逻辑 |
| `justdb-core/src/main/java/org/verydb/justdb/generator/AbstractTemplateGenerator.java` | 添加 render/renderInline 方法支持自定义模板渲染 |
| `justdb-core/src/main/java/org/verydb/justdb/templates/TemplateExecutor.java` | 添加 compile 方法支持 TemplateSource |

---------------------------

## 三、详细实现步骤

### 阶段 1：Schema 类修改（1天）

#### 1.1 修改 Item.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/schema/Item.java`

添加字段（继承到 Table、Data 等所有子类）：

```java
/**
 * Table author/maintainer
 */
@XmlAttribute
@JsonProperty("author")
@JsonAlias({"owner", "operator", "maintainer"})
private String author;

/**
 * Table remark/description (main field)
 */
@XmlAttribute
@JsonProperty("remark")
@JsonAlias({"desc", "description", "comment"})
private String remark;

/**
 * Module identifier
 */
@XmlAttribute
@JsonProperty("module")
@JsonAlias({"moduleName", "category"})
private String module;
```

#### 1.2 修改 Table.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/schema/Table.java`

添加字段：

```java
/**
 * Source pattern from IncludeRule
 * Used to track which rule generated this table
 */
@XmlAttribute
@JsonProperty("sourcePattern")
private String sourcePattern;
```

#### 1.3 修改 Data.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/schema/Data.java`

添加字段：

```java
// 1. remark is inherited from Item (no need to add separate field)

// 2. Add sourcePattern
/**
 * Source pattern from IncludeRule
 * Used to track which rule generated this data node
 */
@XmlAttribute
@JsonProperty("sourcePattern")
private String sourcePattern;

// 3. Add temporary flag for temporary data (non-matching data)
/**
 * Whether this is temporary data (data not matching the rule's condition)
 * Temporary data is handled specially during diff/migrate
 */
@XmlAttribute
@JsonProperty("temporary")
private Boolean temporary = false;

// 4. module is inherited from Item (no need to add separate field)
```

---------------------------

### 阶段 2：模板渲染增强（0.5天）

#### 2.1 修改 AbstractTemplateGenerator.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/generator/AbstractTemplateGenerator.java`

添加带 TemplateSource 的 render 方法：

```java
/**
 * Render template from TemplateSource
 * Supports custom template content (not registered in template registry)
 *
 * @param templateSource Custom template source
 * @param model Data model
 * @return Rendered result
 */
public String render(TemplateSource templateSource, Object model) {
    try {
        GenericTemplate genericTemplate = new GenericTemplate(
            "__inline__",
            templateSource.content(Charset.defaultCharset())
        );
        TemplateSource source = executor.t(genericTemplate);

        Template template = executor.compile(source);
        Context context = createContent(model);
        return template.apply(context);
    } catch (IOException e) {
        throw new RuntimeException("Failed to render inline template", e);
    }
}

/**
 * Render template from string content
 * Convenience method for inline template rendering
 */
public String renderInline(String templateContent, Object model) {
    try {
        GenericTemplate genericTemplate = new GenericTemplate("__inline__", templateContent);
        TemplateSource source = executor.t(genericTemplate);

        Template template = executor.compile(source);
        Context context = createContent(model);
        return template.apply(context);
    } catch (IOException e) {
        throw new RuntimeException("Failed to render inline template: " + templateContent, e);
    }
}

/**
 * Render template from string content with context params
 */
public String renderInline(String templateContent, Object model, GeneralContextParams contextParams) {
    try {
        GenericTemplate genericTemplate = new GenericTemplate("__inline__", templateContent);
        TemplateSource source = executor.t(genericTemplate);

        Template template = executor.compile(source);
        Context context = createContentWithContextParams(model, contextParams);
        return template.apply(context);
    } catch (IOException e) {
        throw new RuntimeException("Failed to render inline template: " + templateContent, e);
    }
}
```

**说明**：
- `render(TemplateSource, Object)`: 使用自定义 TemplateSource 渲染
- `renderInline(String, Object)`: 便捷方法，直接使用字符串内容渲染
- 支持自定义模板内容，无需在模板注册表中注册
- 传入的 root template 由调用方提供（GenericTemplate）

#### 2.2 修改 TemplateExecutor.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/templates/TemplateExecutor.java`

添加 compile 方法支持 TemplateSource：

```java
/**
 * Compile template from TemplateSource
 */
public Template compile(TemplateSource source) throws IOException {
    return handlebars.compile(source);
}
```

---------------------------

### 阶段 3：核心数据结构（1天）

#### 3.1 创建 IncludeRule.java

**关键设计修正**：
- `dataFilter` 是单个 text 字段，自动检测类型（none/all/condition/sql/template）
- 优先级计算使用**截断法**（只计算匹配字符数，不计 pattern 本身长度）
- 正则表达式使用 Java 内置 Pattern/Matcher

**位置**：`justdb-core/src/main/java/org/verydb/justdb/data/config/IncludeRule.java`

```java
package org.verydb.justdb.data.config;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import javax.xml.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * Single Include rule definition
 * Supports pattern matching, attribute configuration, and data filtering
 */
@Data
@XmlRootElement(name = "IncludeRule")
public class IncludeRule {

    /**
     * Pattern matching string
     * Supports:
     * - Exact match: sys_user
     * - Wildcard: sys_* (* matches any character sequence)
     * - Regex: /sys_.*/ (wrapped by slashes)
     */
    @XmlAttribute
    @JsonProperty("pattern")
    @JsonAlias({"table", "tablePattern", "includePattern"})
    private String pattern;

    /**
     * Table author/maintainer (mapped to Item.author)
     */
    @XmlAttribute
    @JsonProperty("author")
    @JsonAlias({"owner", "operator", "maintainer"})
    private String author;

    /**
     * Table remark/description (mapped to Item.remark)
     */
    @XmlAttribute
    @JsonProperty("remark")
    @JsonAlias({"desc", "description", "comment"})
    private String remark;

    /**
     * Data filter configuration (single text field)
     * Auto-detects type based on content:
     * - ""/null: none (no data)
     * - "*": all (all data)
     * - Starts with "SELECT ": sql (full SQL)
     * - Contains "{{": template (handlebars template)
     * - Otherwise: condition (WHERE clause)
     */
    @XmlAttribute
    @JsonProperty("dataFilter")
    @JsonAlias({"dataExport", "export", "filter", "condition"})
    private String dataFilter;

    /**
     * Module identifier (mapped to Item.module)
     */
    @XmlAttribute
    @JsonProperty("module")
    @JsonAlias({"moduleName", "category"})
    private String module;

    /**
     * Priority (optional, defaults to auto-calculated by match degree)
     * Higher value = higher priority
     */
    @XmlAttribute
    @JsonProperty("priority")
    @JsonAlias({"order", "rank"})
    private Integer priority;

    /**
     * Whether this rule is enabled (default true)
     */
    @XmlAttribute
    @JsonProperty("enabled")
    private Boolean enabled = true;

    /**
     * Data filter type enum (auto-detected)
     */
    public enum DataFilterType {
        /** No data export */
        NONE,
        /** Export all data */
        ALL,
        /** WHERE clause condition (rendered as SELECT with template) */
        CONDITION
    }

    /**
     * Detect data filter type from content
     * - null/empty/"none" → NONE
     * - "*" → ALL
     * - other → CONDITION
     */
    public DataFilterType detectDataFilterType() {
        if (dataFilter == null) {
            return DataFilterType.NONE;
        }

        String trimmed = dataFilter.trim();
        if (trimmed.isEmpty() || "none".equalsIgnoreCase(trimmed)) {
            return DataFilterType.NONE;
        }
        if ("*".equals(trimmed) || "all".equalsIgnoreCase(trimmed)) {
            return DataFilterType.ALL;
        }
        return DataFilterType.CONDITION;
    }

    /**
     * Calculate match priority using truncation method
     * Only counts matched characters, not pattern length
     *
     * Method: Remove characters from tableName until no longer matches
     * Find the shortest string that still matches - that length is the match degree
     */
    public int calculateMatchPriority(String tableName) {
        if (priority != null) {
            return priority;
        }

        // Exact match: highest priority
        if (pattern.equals(tableName)) {
            return tableName.length();
        }

        // Regex pattern
        if (pattern.startsWith("/") && pattern.endsWith("/")) {
            return calculateRegexMatchDegree(tableName);
        }

        // Wildcard pattern
        if (pattern.contains("*") || pattern.contains("?")) {
            return calculateWildcardMatchDegree(tableName);
        }

        // No match
        return 0;
    }

    /**
     * Calculate regex match degree using Java Pattern
     */
    private int calculateRegexMatchDegree(String tableName) {
        try {
            String regex = pattern.substring(1, pattern.length() - 1);
            Pattern p = Pattern.compile(regex);

            if (!p.matcher(tableName).matches()) {
                return 0;
            }

            // Truncation method: find shortest substring that still matches
            int minMatchLength = tableName.length();

            // Try removing from end
            for (int len = tableName.length(); len >= 1; len--) {
                if (p.matcher(tableName.substring(0, len)).matches()) {
                    minMatchLength = Math.min(minMatchLength, len);
                    break;
                }
            }

            // Try removing from beginning
            for (int start = 1; start < tableName.length(); start++) {
                if (p.matcher(tableName.substring(start)).matches()) {
                    int matchLen = tableName.length() - start;
                    minMatchLength = Math.min(minMatchLength, matchLen);
                    break;
                }
            }

            // Try removing from middle (remove one char at a time)
            for (int i = 0; i < tableName.length(); i++) {
                String without = tableName.substring(0, i) + tableName.substring(i + 1);
                if (p.matcher(without).matches()) {
                    minMatchLength = Math.min(minMatchLength, without.length());
                }
            }

            return minMatchLength;
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Calculate wildcard match degree using truncation method
     */
    private int calculateWildcardMatchDegree(String tableName) {
        if (!matches(tableName)) {
            return 0;
        }

        int minMatchLength = tableName.length();

        // Try removing from end
        for (int len = tableName.length(); len >= 1; len--) {
            if (matches(tableName.substring(0, len))) {
                minMatchLength = Math.min(minMatchLength, len);
                break;
            }
        }

        // Try removing from beginning
        for (int start = 1; start < tableName.length(); start++) {
            if (matches(tableName.substring(start))) {
                int matchLen = tableName.length() - start;
                minMatchLength = Math.min(minMatchLength, matchLen);
                break;
            }
        }

        return minMatchLength;
    }

    /**
     * Test if table name matches this rule
     */
    public boolean matches(String tableName) {
        if (pattern == null || tableName == null) {
            return false;
        }

        // Exact match
        if (!pattern.contains("*") && !pattern.contains("?") &&
            !pattern.startsWith("/")) {
            return pattern.equals(tableName);
        }

        // Regex
        if (pattern.startsWith("/") && pattern.endsWith("/")) {
            String regex = pattern.substring(1, pattern.length() - 1);
            try {
                RegExp r = new RegExp(regex);
                Automaton a = r.toAutomaton();
                return a.run(tableName);
            } catch (Exception e) {
                return false;
            }
        }

        // Wildcard match
        return matchesWildcardPattern(tableName, pattern);
    }

    private boolean matchesWildcardPattern(String tableName, String pattern) {
        // Convert wildcard to regex
        StringBuilder regex = new StringBuilder();
        regex.append('^');
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i);
            switch (c) {
                case '*': regex.append(".*"); break;
                case '?': regex.append('.'); break;
                case '.': regex.append("\\."); break;
                default: regex.append(c); break;
            }
        }
        regex.append('$');
        return tableName.matches(regex.toString());
    }
}
```

#### 3.2 创建 IncludeRuleMatcher.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/data/config/IncludeRuleMatcher.java`

```java
package org.verydb.justdb.data.config;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Include rule matcher
 * Uses truncation method for priority calculation
 */
public class IncludeRuleMatcher {

    private final List&lt;IncludeRule&gt; rules;

    public IncludeRuleMatcher(List&lt;IncludeRule&gt; rules) {
        this.rules = rules != null ? rules : new ArrayList&lt;&gt;();
    }

    /**
     * Find all matching rules sorted by priority (highest first)
     */
    public List&lt;IncludeRule&gt; findAllMatches(String tableName) {
        return rules.stream()
            .filter(rule -> rule.isEnabled() && rule.matches(tableName))
            .sorted((a, b) -> {
                int priorityA = a.calculateMatchPriority(tableName);
                int priorityB = b.calculateMatchPriority(tableName);
                return Integer.compare(priorityB, priorityA); // Descending
            })
            .collect(Collectors.toList());
    }

    /**
     * Get highest priority matching rule
     */
    public Optional&lt;IncludeRule&gt; findBestMatch(String tableName) {
        return findAllMatches(tableName).stream().findFirst();
    }

    /**
     * Get rules with same highest priority
     * Deduplicates by dataFilter, keeps first occurrence
     * All same-priority rules with unique dataFilter are kept
     */
    public List&lt;IncludeRule&gt; findSamePriorityMatches(String tableName) {
        List&lt;IncludeRule&gt; matches = findAllMatches(tableName);
        if (matches.isEmpty()) {
            return matches;
        }

        int highestPriority = matches.get(0).calculateMatchPriority(tableName);

        // Filter by highest priority
        List&lt;IncludeRule&gt; samePriority = matches.stream()
            .filter(r -> r.calculateMatchPriority(tableName) == highestPriority)
            .collect(Collectors.toList());

        // Deduplicate by dataFilter, keep first occurrence
        Map&lt;String, IncludeRule&gt; uniqueRules = new LinkedHashMap&lt;&gt;();
        for (IncludeRule rule : samePriority) {
            String df = rule.getDataFilter();
            if (df == null) df = "";
            if (!uniqueRules.containsKey(df)) {
                uniqueRules.put(df, rule);
            }
        }

        return new ArrayList&lt;&gt;(uniqueRules.values());
    }
}
```

---------------------------

### 阶段 4：IncludeRuleToSchemaMapper（0.5天）

#### 4.1 创建 IncludeRuleToSchemaMapper.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/data/config/IncludeRuleToSchemaMapper.java`

```java
package org.verydb.justdb.data.config;

import org.verydb.justdb.schema.*;
import org.verydb.justdb.generator.DBGenerator;
import java.util.*;

/**
 * Map IncludeRule to JustDB Schema
 */
public class IncludeRuleToSchemaMapper {

    private final DBGenerator dbGenerator;
    private final String dialect;

    public IncludeRuleToSchemaMapper(DBGenerator dbGenerator, String dialect) {
        this.dbGenerator = dbGenerator;
        this.dialect = dialect;
    }

    /**
     * Apply rule attributes to Table
     * Takes first non-null value from rule
     */
    public void applyToTable(Table table, IncludeRule rule) {
        if (rule == null) return;

        // Map author (from Item)
        if (rule.getAuthor() != null) {
            table.setAuthor(rule.getAuthor());
        }

        // Map remark (from Item)
        if (rule.getRemark() != null) {
            table.setRemark(rule.getRemark());
        }

        // Map module (from Item)
        if (rule.getModule() != null) {
            table.setModule(rule.getModule());
        }

        // Map sourcePattern (Table specific)
        table.setSourcePattern(rule.getPattern());

        // Map dataFilter to dataExportStrategy
        IncludeRule.DataFilterType filterType = rule.detectDataFilterType();
        switch (filterType) {
            case NONE:
                table.setDataExportStrategy(Table.DataExportStrategy.NO_DATA);
                break;
            case ALL:
                table.setDataExportStrategy(Table.DataExportStrategy.ALL_DATA);
                break;
            case CONDITION:
                table.setDataExportStrategy(Table.DataExportStrategy.PARTIAL_DATA);
                table.setDataFilterCondition(rule.getDataFilter());
                break;
        }
    }

    /**
     * Create Data node from rule
     * Only for same-priority rules
     */
    public Data createDataNode(Table table, IncludeRule rule) {
        IncludeRule.DataFilterType filterType = rule.detectDataFilterType();
        if (filterType == IncludeRule.DataFilterType.NONE) {
            return null; // No data node for NONE type
        }

        Data data = new Data();
        data.setTable(table.getName());
        data.setTableRef(table);
        data.setSourcePattern(rule.getPattern());

        // Inherit author, remark, module from rule
        if (rule.getAuthor() != null) {
            data.setAuthor(rule.getAuthor());
        }
        if (rule.getRemark() != null) {
            data.setRemark(rule.getRemark());
        }
        if (rule.getModule() != null) {
            data.setModule(rule.getModule());
        }

        // Map condition based on type
        switch (filterType) {
            case ALL:
                // No condition needed
                break;
            case CONDITION:
                // Render template to replace {{table-name}} placeholder
                data.setCondition(renderTemplate(rule.getDataFilter(), table));
                break;
        }

        return data;
    }

    /**
     * Render dataFilter as SQL
     * - If dataFilter is complete SELECT statement, render directly
     * - Otherwise, wrap as: SELECT * FROM {{table-name}} WHERE {dataFilter}
     * Then replace {{table-name}} placeholder with actual table name
     */
    private String renderTemplate(String dataFilter, Table table) {
        try {
            String trimmed = dataFilter.trim();
            String template;

            // Check if already a complete SELECT statement
            if (trimmed.toUpperCase().startsWith("SELECT")) {
                template = trimmed;
            } else {
                // Wrap as: SELECT * FROM {{table-name}} WHERE {dataFilter}
                template = "SELECT * FROM {{table-name}} WHERE " + trimmed;
            }

            return dbGenerator.renderInline(template, table);
        } catch (Exception e) {
            throw new RuntimeException("Failed to render dataFilter: " + dataFilter, e);
        }
    }
}
```

---------------------------

### 阶段 5：数据导出增强（0.5天）

#### 5.1 Data 节点分类导出

**位置**：`justdb-core/src/main/java/org/verydb/justdb/data/export/IncludeRuleDataExtractor.java`

根据 dataFilter 类型生成不同的 Data 节点：

```java
package org.verydb.justdb.data.export;

import org.verydb.justdb.data.config.IncludeRule;
import org.verydb.justdb.schema.*;
import java.util.*;

/**
 * Data extractor based on IncludeRule
 * Generates different Data nodes based on dataFilter type
 */
public class IncludeRuleDataExtractor {

    /**
     * Extract data and generate Data nodes based on rule
     *
     * @param connection Database connection
     * @param table Table to extract data from
     * @param rule IncludeRule with dataFilter configuration
     * @return List of Data nodes (main data + temp data if applicable)
     */
    public List&lt;Data&gt; extractData(Connection connection, Table table, IncludeRule rule)
            throws SQLException {

        List&lt;Data&gt; dataNodes = new ArrayList&lt;&gt;();
        IncludeRule.DataFilterType filterType = rule.detectDataFilterType();

        switch (filterType) {
            case NONE:
                // No data export, but create Data node for schema reference
                // This data node will have empty rows
                dataNodes.add(createEmptyDataNode(table, rule));
                break;

            case ALL:
                // Export all data to main Data node
                dataNodes.add(extractAllData(connection, table, rule));
                break;

            case CONDITION:
                // Export matching data to main Data node
                // Export non-matching data to temporary Data node
                Data mainData = extractMatchingData(connection, table, rule);
                Data tempData = extractNonMatchingData(connection, table, rule);

                dataNodes.add(mainData);
                if (tempData != null && !tempData.getRows().isEmpty()) {
                    dataNodes.add(tempData);
                }
                break;
        }

        return dataNodes;
    }

    /**
     * Create empty Data node for NONE type
     */
    private Data createEmptyDataNode(Table table, IncludeRule rule) {
        Data data = new Data();
        data.setTable(table.getName());
        data.setTableRef(table);
        data.setSourcePattern(rule.getPattern());
        data.setRows(new ArrayList&lt;&gt;());
        // Set author, remark, module from rule
        if (rule.getAuthor() != null) data.setAuthor(rule.getAuthor());
        if (rule.getRemark() != null) data.setRemark(rule.getRemark());
        if (rule.getModule() != null) data.setModule(rule.getModule());
        return data;
    }

    /**
     * Extract all data
     */
    private Data extractAllData(Connection connection, Table table, IncludeRule rule)
            throws SQLException {
        String sql = buildSql(table, "*"); // SELECT all
        return executeQuery(connection, table, sql, rule);
    }

    /**
     * Extract matching data
     */
    private Data extractMatchingData(Connection connection, Table table, IncludeRule rule)
            throws SQLException {
        String sql = buildSql(table, rule.getDataFilter());
        return executeQuery(connection, table, sql, rule);
    }

    /**
     * Extract non-matching data to temporary data node
     */
    private Data extractNonMatchingData(Connection connection, Table table, IncludeRule rule)
            throws SQLException {
        String invertedFilter = invertCondition(rule.getDataFilter());
        String sql = buildSql(table, invertedFilter);
        Data tempData = executeQuery(connection, table, sql, rule);

        // Mark as temporary data
        if (tempData != null) {
            tempData.setTemporary(true);
            // Could add: tempData.setRemark("Temporary data not matching rule");
        }

        return tempData;
    }

    /**
     * Build SELECT SQL based on dataFilter
     */
    private String buildSql(Table table, String dataFilter) {
        // Use template rendering to replace {{table-name}}
        String template = "SELECT * FROM {{table-name}}";

        if (!"*".equals(dataFilter) && !"all".equalsIgnoreCase(dataFilter)) {
            template = template + " WHERE " + dataFilter;
        }

        // TODO: Render template to replace {{table-name}}
        // For now, simple replacement
        return template.replace("{{table-name}}", quote(table.getName()));
    }

    /**
     * Invert condition for extracting non-matching data
     * Example: "status=1" → "status!=1 OR status IS NULL"
     */
    private String invertCondition(String condition) {
        // Simple inversion logic (can be enhanced)
        return "NOT (" + condition + ")";
    }

    /**
     * Execute query and build Data node
     */
    private Data executeQuery(Connection connection, Table table, String sql, IncludeRule rule)
            throws SQLException {
        // Execute query and build rows
        List&lt;Row&gt; rows = new ArrayList&lt;&gt;();
        // TODO: Implement actual query execution

        Data data = new Data();
        data.setTable(table.getName());
        data.setTableRef(table);
        data.setSourcePattern(rule.getPattern());
        data.setRows(rows);

        // Set attributes from rule
        if (rule.getAuthor() != null) data.setAuthor(rule.getAuthor());
        if (rule.getRemark() != null) data.setRemark(rule.getRemark());
        if (rule.getModule() != null) data.setModule(rule.getModule());

        // Set condition
        data.setCondition(sql);

        return data;
    }

    private String quote(String name) {
        return "`" + name + "`";
    }
}
```

**说明**：
- NONE 类型：创建空的 Data 节点（rows 为空），保留 schema 信息
- ALL 类型：导出全部数据
- CONDITION 类型：
  - 满足条件的数据 → 主 Data 节点
  - 不满足条件的数据 → 临时 Data 节点（标记 `temporary=true`）

---------------------------

### 阶段 6：命令行集成（0.5天）

#### 5.1 创建 Db2SchemaMixin.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/cli/mixins/Db2SchemaMixin.java`

```java
package org.verydb.justdb.cli.mixins;

import picocli.CommandLine.Option;
import java.util.List;

/**
 * db2schema specific parameters Mixin
 */
public class Db2SchemaMixin extends TableFilterMixin {

    /**
     * Inline include rule with key=value format
     * Format: pattern&key1=value1&key2=value2
     * Keys: author, remark, module, dataFilter
     * Example: sys_*&author=admin&remark=系统表&dataFilter=deleted=0
     */
    @Option(names = {"-I", "--include"},
            description = "Include rule (pattern&key=value format)")
    private List&lt;String&gt; includeRules;

    /**
     * Data filter rule (simplified format)
     * Format: pattern=dataFilter
     * Example: sys_user=deleted=0, sys_role=is_system=1
     */
    @Option(names = {"-d", "--data-filter"},
            description = "Data filter rule (pattern=dataFilter)")
    private List&lt;String&gt; dataFilterRules;

    // Getters
    public List&lt;String&gt; getIncludeRules() { return includeRules; }
    public List&lt;String&gt; getDataFilterRules() { return dataFilterRules; }

    /**
     * Parse include rule string to IncludeRule object
     */
    public static IncludeRule parseIncludeRule(String ruleStr) {
        IncludeRule rule = new IncludeRule();

        String[] parts = ruleStr.split("&", 2);
        rule.setPattern(parts[0]);

        if (parts.length == 2) {
            String[] pairs = parts[1].split("&");
            for (String pair : pairs) {
                String[] kv = pair.split("=", 2);
                if (kv.length == 2) {
                    String key = kv[0].trim();
                    String value = kv[1].trim();

                    switch (key) {
                        case "author":
                        case "a":
                            rule.setAuthor(value);
                            break;
                        case "remark":
                        case "r":
                            rule.setRemark(value);
                            break;
                        case "module":
                        case "m":
                            rule.setModule(value);
                            break;
                        case "dataFilter":
                        case "df":
                            rule.setDataFilter(value);
                            break;
                    }
                }
            }
        }

        return rule;
    }
}
```

---------------------------

### 阶段 6：Diff/Migrate 集成（1天）

#### 6.1 修改 CanonicalSchemaDiff.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/schema/CanonicalSchemaDiff.java`

在 `DataChange` 内部类之后添加 `TableDataFilterChange` 类：

```java
/**
 * Track Table-level dataFilter changes
 * When dataFilter changes, data needs to be re-imported from DB
 */
public static class TableDataFilterChange {
    private final Table currentTable;
    private final Table targetTable;
    private final ChangeType changeType;

    public TableDataFilterChange(Table currentTable, Table targetTable, ChangeType changeType) {
        this.currentTable = currentTable;
        this.targetTable = targetTable;
        this.changeType = changeType;
    }

    public Table getCurrentTable() { return currentTable; }
    public Table getTargetTable() { return targetTable; }
    public ChangeType getChangeType() { return changeType; }
}

private List&lt;TableDataFilterChange&gt; tableDataFilterChanges = new ArrayList&lt;&gt;();

public List&lt;TableDataFilterChange&gt; getTableDataFilterChanges() {
    return tableDataFilterChanges;
}
```

在 `calculateAll()` 方法中添加调用：

```java
public void calculateAll() {
    calculateTableChanges();
    calculateColumnChanges();
    calculateIndexChanges();
    calculateConstraintChanges();
    calculateSequenceChanges();
    calculateDataChanges();
    calculateTableDataFilterChanges(); // NEW
}
```

添加 `calculateTableDataFilterChanges()` 方法：

```java
/**
 * Calculate Table-level dataFilter changes
 * Tracks changes to dataExportStrategy, dataFilterCondition
 */
private void calculateTableDataFilterChanges() {
    if (currentSchema.getTables() == null || targetSchema.getTables() == null) {
        return;
    }

    Map&lt;String, Table&gt; currentTables = mapTablesByName(currentSchema);
    Map&lt;String, Table&gt; targetTables = mapTablesByName(targetSchema);

    for (Table targetTable : targetSchema.getTables()) {
        String tableName = targetTable.getName();
        Table currentTable = currentTables.get(tableName);

        if (currentTable == null) {
            continue; // New table, handled by tableChanges
        }

        // Check dataExportStrategy change
        Table.DataExportStrategy currentStrategy = currentTable.getDataExportStrategy();
        Table.DataExportStrategy targetStrategy = targetTable.getDataExportStrategy();

        if (currentStrategy != targetStrategy) {
            tableDataFilterChanges.add(new TableDataFilterChange(
                currentTable, targetTable, ChangeType.MODIFIED
            ));
            continue;
        }

        // Check dataFilterCondition change
        String currentFilter = currentTable.getDataFilterCondition();
        String targetFilter = targetTable.getDataFilterCondition();

        if ((currentFilter == null && targetFilter != null) ||
            (currentFilter != null && !currentFilter.equals(targetFilter))) {
            tableDataFilterChanges.add(new TableDataFilterChange(
                currentTable, targetTable, ChangeType.MODIFIED
            ));
        }
    }
}
```

在 `generateDataChangeSql()` 方法之后添加 Table dataFilter 变化 SQL 生成：

```java
/**
 * Generate SQL for Table dataFilter changes
 * Strategy: Delete rows with deleted=false, then re-import from DB
 */
public List&lt;String&gt; generateTableDataFilterChangeSql(String dialect) {
    List&lt;String&gt; sqlStatements = new ArrayList&lt;&gt;();

    for (TableDataFilterChange change : tableDataFilterChanges) {
        Table table = change.getCurrentTable();
        String tableName = table.getName();

        // 1. Delete non-deleted rows
        String deleteSql = String.format(
            "DELETE FROM %s WHERE deleted IS NULL OR deleted = '0';",
            quoteIdentifier(tableName, dialect)
        );
        sqlStatements.add(deleteSql);

        // 2. Re-import based on new dataFilter
        String newFilter = change.getTargetTable().getDataFilterCondition();
        if (newFilter != null && !newFilter.isEmpty()) {
            String importSql = String.format(
                "-- Re-import data for %s with filter: %s",
                quoteIdentifier(tableName, dialect),
                newFilter
            );
            sqlStatements.add(importSql);
        } else {
            String importSql = String.format(
                "-- Re-import all data for %s",
                quoteIdentifier(tableName, dialect)
            );
            sqlStatements.add(importSql);
        }
    }

    return sqlStatements;
}

private String quoteIdentifier(String name, String dialect) {
    if ("mysql".equalsIgnoreCase(dialect)) {
        return "`" + name + "`";
    } else if ("postgresql".equalsIgnoreCase(dialect)) {
        return "\"" + name + "\"";
    } else if ("sqlserver".equalsIgnoreCase(dialect)) {
        return "[" + name + "]";
    }
    return name;
}
```

#### 6.2 修改 SchemaMigrationService.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/migration/SchemaMigrationService.java`

在 `generateMigrationSql()` 方法中添加 Table dataFilter 变化处理：

```java
// Process data changes (condition-based data migration)
if (!diff.getDataChanges().isEmpty()) {
    List&lt;String&gt; dataChangeSql = diff.generateDataChangeSql(dialect);
    sqlStatements.addAll(dataChangeSql);
}

// NEW: Process Table dataFilter changes
if (!diff.getTableDataFilterChanges().isEmpty()) {
    List&lt;String&gt; tableDataFilterSql = diff.generateTableDataFilterChangeSql(dialect);
    sqlStatements.addAll(tableDataFilterSql);
}
```

---------------------------

### 阶段 7：Db2SchemaCommand 集成（0.5天）

#### 7.1 修改 Db2SchemaCommand.java

**位置**：`justdb-core/src/main/java/org/verydb/justdb/cli/commands/Db2SchemaCommand.java`

在 `executeDb2Schema` 方法中集成 IncludeRule 逻辑：

```java
private void executeDb2Schema(JustdbConfiguration config) {
    // ... existing database connection code ...

    try {
        Connection connection = DriverManager.getConnection(/* ... */);
        ExtractConfig extractConfig = createExtractConfig(dbConfig.getType());

        // Extract Schema
        CompositeSchemaExtractor extractor = new CompositeSchemaExtractor();
        Justdb schema = extractor.extractSchema(connection, extractConfig);

        // ===== NEW: Load and apply Include rules =====
        List&lt;IncludeRule&gt; includeRules = loadIncludeRules(config, db2SchemaMixin);
        if (!includeRules.isEmpty()) {
            DBGenerator dbGenerator = new DBGenerator(
                getJustdbManager().getPluginManager(),
                dbConfig.getType()
            );
            IncludeRuleMatcher matcher = new IncludeRuleMatcher(includeRules);
            IncludeRuleToSchemaMapper mapper = new IncludeRuleToSchemaMapper(
                dbGenerator,
                dbConfig.getType()
            );

            List&lt;Data&gt; dataList = new ArrayList&lt;&gt;();

            // Apply rules to each table
            for (Table table : schema.getTables()) {
                // Get same-priority matching rules
                List&lt;IncludeRule&gt; samePriorityRules =
                    matcher.findSamePriorityMatches(table.getName());

                if (!samePriorityRules.isEmpty()) {
                    // Apply highest priority rule to Table
                    IncludeRule bestRule = samePriorityRules.get(0);
                    mapper.applyToTable(table, bestRule);

                    // Create Data nodes for each same-priority rule
                    for (IncludeRule rule : samePriorityRules) {
                        Data data = mapper.createDataNode(table, rule);
                        if (data != null) {
                            dataList.add(data);
                        }
                    }
                }
            }

            // Set data to schema
            if (!dataList.isEmpty()) {
                schema.setData(dataList);
            }
        }
        // ===== END NEW =====

        // Save Schema
        saveSchemaToFile(schema, config);

        connection.close();
    } catch (Exception e) {
        // ... error handling ...
    }
}

/**
 * Load Include rules from configuration and command line
 */
private List&lt;IncludeRule&gt; loadIncludeRules(JustdbConfiguration config,
                                            Db2SchemaMixin db2SchemaMixin) {
    List&lt;IncludeRule&gt; rules = new ArrayList&lt;&gt;();

    // Load from config file (-c parameter)
    if (config.getIncludeRules() != null) {
        for (Map&lt;String, Object&gt; ruleMap : config.getIncludeRules()) {
            IncludeRule rule = mapToIncludeRule(ruleMap);
            if (rule != null) {
                rules.add(rule);
            }
        }
    }

    // Load from command line -I parameter
    if (db2SchemaMixin.getIncludeRules() != null) {
        for (String ruleStr : db2SchemaMixin.getIncludeRules()) {
            IncludeRule rule = Db2SchemaMixin.parseIncludeRule(ruleStr);
            rules.add(rule);
        }
    }

    // Load from -d parameter (simplified data filter)
    if (db2SchemaMixin.getDataFilterRules() != null) {
        for (String dfRule : db2SchemaMixin.getDataFilterRules()) {
            String[] parts = dfRule.split("=", 2);
            if (parts.length == 2) {
                IncludeRule rule = new IncludeRule();
                rule.setPattern(parts[0]);
                rule.setDataFilter(parts[1]);
                rules.add(rule);
            }
        }
    }

    return rules;
}

private IncludeRule mapToIncludeRule(Map&lt;String, Object&gt; map) {
    try {
        com.fasterxml.jackson.databind.ObjectMapper mapper =
            new com.fasterxml.jackson.databind.ObjectMapper();
        return mapper.convertValue(map, IncludeRule.class);
    } catch (Exception e) {
        System.err.println("Failed to parse IncludeRule: " + e.getMessage());
        return null;
    }
}
```

---------------------------

## 四、配置文件和命令行示例

### 4.1 配置文件示例（YAML）

```yaml
# justdb-cli.yaml
databases:
  - name: production
    type: mysql
    jdbcUrl: jdbc:mysql://localhost:3306/carbon_expert_db
    username: root
    password: password

# db2schema include rules
includeRules:
  # Exact match + all data
  - pattern: area
    author: limeng
    remark: 区县表
    module: base-data
    dataFilter: "*"

  # Exact match + condition filter
  - pattern: sys_role
    author: yuwenhang
    remark: 角色信息表
    module: system-data
    dataFilter: "tenant_id is null and is_system = 1 and deleted = '0'"

  # Exact match + schema only
  - pattern: sys_dept
    author: yuwenhang
    remark: 部门表
    dataFilter: ""

  # Wildcard + condition
  - pattern: lca_*
    author: limeng
    remark: LCA 模块表
    module: lca-module
    dataFilter: "deleted = 0"

  # Exact match (overrides wildcard) + custom SQL with table-name placeholder
  - pattern: lca_impactfactor
    author: yuwenhang
    remark: 影响因子表（单独覆盖）
    module: lca-impact
    dataFilter: "SELECT * FROM {{table-name}} WHERE status=1 ORDER BY id DESC LIMIT 100"
```

### 4.2 命令行使用示例

```bash
# Use configuration file
justdb db2schema -C production -o schema.yaml

# Inline rule with -I (key=value format)
justdb db2schema -C production \
  -I "sys_*&author=admin&remark=系统表&dataFilter=deleted=0" \
  -o schema.yaml

# Simplified data filter with -d
justdb db2schema -C production \
  -d "sys_user=deleted=0" \
  -d "sys_role=is_system=1" \
  -o schema.yaml

# Mixed use (config file + inline)
justdb db2schema -C production \
  -c config.yaml \
  -I "lca_impactfactor&author=yw&remark=影响因子&dataFilter=SELECT * FROM {{table-name}} LIMIT 100" \
  -o schema.yaml
```

### 4.3 dataFilter 类型自动检测

| dataFilter 值 | 检测类型 | 渲染方式 |
|--------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| `null`、`""`、`"none"` | NONE | 不导出数据 |
| `"*"`、`"all"` | ALL | 导出全部数据 |
| `"deleted=0"` | CONDITION | 拼接成 `SELECT * FROM {{table-name}} WHERE deleted=0` |
| `"id IN (1,2,3)"` | CONDITION | 拼接成 `SELECT * FROM {{table-name}} WHERE id IN (1,2,3)` |

**说明**：
- CONDITION 类型统一拼接：`SELECT * FROM {{table-name}} WHERE {dataFilter}`
- 如 dataFilter 已是完整 SELECT 语句，直接渲染（不拼接）
- 所有类型统一通过 template 渲染处理 `{{table-name}}` 占位符

---------------------------

## 五、Diff/Migrate 处理 dataFilter 变化和临时数据

### 5.1 临时数据（Temporary Data）设计

**定义**：临时数据是指不满足 dataFilter 条件的数据，被标记为 `temporary=true` 的 Data 节点。

#### 5.1.1 数据分类导出

| dataFilter 类型 | 主 Data 节点 | 临时 Data 节点 |
|--------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| NONE | 空 rows（无数据） | 无 |
| ALL | 全部数据 | 无 |
| CONDITION | 满足条件的数据 | 不满足条件的数据（`temporary=true`） |

#### 5.1.2 临时数据在 schema 中的表示

```yaml
data:
  # 主 Data 节点：满足 deleted=0 的数据
  - table: sys_user
    sourcePattern: sys_*
    author: admin
    remark: 系统用户
    condition: SELECT * FROM `sys_user` WHERE deleted = 0
    rows: [...]  # 满足条件的数据

  # 临时 Data 节点：不满足 deleted=0 的数据
  - table: sys_user
    sourcePattern: sys_*
    author: admin
    remark: 系统用户（临时数据）
    temporary: true
    condition: SELECT * FROM `sys_user` WHERE NOT (deleted = 0)
    rows: [...]  # 不满足条件的数据
```

### 5.2 Diff 阶段处理临时数据

**原则**：Diff 计算**忽略**临时数据节点（`temporary=true` 的 Data 节点）。

#### 5.2.1 CanonicalSchemaDiff 修改

**位置**：`justdb-core/src/main/java/org/verydb/justdb/schema/CanonicalSchemaDiff.java`

在 `calculateDataChanges()` 方法中过滤临时数据：

```java
/**
 * Calculate data changes between current and target schema
 * Temporary data nodes (temporary=true) are excluded from diff calculation
 */
private void calculateDataChanges() {
    if (currentSchema.getData() == null || targetSchema.getData() == null) {
        return;
    }

    // Filter out temporary data nodes
    List&lt;Data&gt; currentData = currentSchema.getData().stream()
        .filter(d -> Boolean.FALSE.equals(d.isTemporary()))
        .collect(Collectors.toList());

    List&lt;Data&gt; targetData = targetSchema.getData().stream()
        .filter(d -> Boolean.FALSE.equals(d.isTemporary()))
        .collect(Collectors.toList());

    // Calculate changes only on non-temporary data
    // ... existing diff logic
}
```

**说明**：
- Diff 只比较主 Data 节点（`temporary=false` 或 `null`）
- 临时数据节点不参与 diff 计算
- 临时数据的存在不影响 schema 变化检测

### 5.3 Migrate 阶段处理临时数据

**原则**：Migrate 执行**保留**现有临时数据，不执行任何删除或插入操作。

#### 5.3.1 SchemaMigrationService 修改

**位置**：`justdb-core/src/main/java/org/verydb/justdb/migration/SchemaMigrationService.java`

在 `generateMigrationSql()` 方法中添加临时数据保护逻辑：

```java
/**
 * Generate migration SQL from schema diff
 * Temporary data is preserved during migration
 */
public List&lt;String&gt; generateMigrationSql(CanonicalSchemaDiff diff) {
    // ... existing table/column/index/constraint SQL generation ...

    // Process data changes (only non-temporary data)
    if (!diff.getDataChanges().isEmpty()) {
        List&lt;String&gt; dataChangeSql = diff.generateDataChangeSql(dialect);

        // Add comment about temporary data preservation
        dataChangeSql.add(0, "-- Temporary data nodes are preserved during migration");
        sqlStatements.addAll(dataChangeSql);
    }

    // ... existing Table dataFilter change handling ...
}
```

**临时数据迁移策略**：
1. **不生成删除 SQL**：临时数据节点不会被删除
2. **不生成插入 SQL**：临时数据不会被重新导入
3. **保留注释**：在生成的 SQL 中添加注释说明临时数据被保留

### 5.4 Table dataFilter 变化处理

当 Table 的 dataFilter 变化时：

**当前**: `dataFilter=deleted=0` → **目标**: `dataFilter=deleted=0 AND status=1`

处理策略：
1. 保留 `deleted=true` 的行（逻辑删除的行不变）
2. 删除 `deleted=false` 的行（旧数据全部清空）
3. 按新 dataFilter 从数据库重新导入数据
4. **临时数据不受影响**（由 Diff 阶段过滤，不参与 migrate）

### 5.5 生成的迁移 SQL

```sql
-- Step 1: Delete non-deleted rows
DELETE FROM `sys_user` WHERE deleted IS NULL OR deleted = '0';

-- Step 2: Re-import with new filter
-- Re-import data for sys_user with filter: deleted=0 AND status=1
-- Temporary data nodes are preserved during migration
```

### 5.6 dataFilter 混合变化场景

**场景**: `id IN (1,2,3)` → `id IN (2,3,4)`

- 2, 3: 从数据库重新导入（保持最新）
- 1: 被删除（不在新条件中）
- 4: 从数据库重新导入（新增）
- **临时数据：不受影响**

处理：同上，先清空非 deleted 行，再按新条件全量导入。临时数据节点由 Diff 阶段过滤，不参与 migrate 操作。

---------------------------

## 六、验证方法

### 6.1 验证优先级匹配（截断法）

```bash
# 配置: lca_* (通配符) + lca_impactfactor (精确)
# tableName=lca_impactfactor
# - 精确匹配优先级 = 15 (匹配整个字符串)
# - 通配符匹配优先级 = 3 (匹配 "lca_" 部分)
# 预期: lca_impactfactor 使用精确配置
```

### 6.2 验证多 Data 节点

```bash
# 同一表配置多次（同优先级）
justdb db2schema -C production \
  -I "sys_role&author=admin&remark=租户0&dataFilter=tenant_id='0'" \
  -I "sys_role&author=user&remark=租户1&dataFilter=tenant_id='1'" \
  -o schema.yaml

# 检查生成的 schema.yaml 中是否有两个 Data 节点
```

### 6.3 验证 Schema 持久化

```bash
# 第一次导出
justdb db2schema -C production -o schema1.yaml

# 基于 schema1.yaml 再次导出（不应丢失 sourcePattern 等信息）
justdb db2schema -C production -i schema1.yaml -o schema2.yaml

# 比较 schema1.yaml 和 schema2.yaml，sourcePattern/author/remark/module 应保留
```

### 6.4 验证 dataFilter 变化迁移

```bash
# 创建 schema1 和 schema2（dataFilter 不同）
# 执行 migrate: justdb migrate schema1.yaml schema2.yaml
# 检查生成的 SQL:
# 1. DELETE FROM table WHERE deleted IS NULL OR deleted = '0';
# 2. Re-import data comment
```

---------------------------

## 七、实施顺序

1. **Phase 1**：Schema 类修改（Item, Table, Data）
2. **Phase 2**：模板渲染增强（AbstractTemplateGenerator.render/renderInline）
3. **Phase 3**：核心数据结构（IncludeRule, IncludeRuleMatcher）
4. **Phase 4**：Schema 映射（IncludeRuleToSchemaMapper）
5. **Phase 5**：数据导出增强（IncludeRuleDataExtractor）
6. **Phase 6**：命令行集成（Db2SchemaMixin）
7. **Phase 7**：Db2SchemaCommand 集成
8. **Phase 8**：Diff/Migrate 集成（CanonicalSchemaDiff, SchemaMigrationService）
9. **Phase 9**：测试（单元测试 + H2 集成测试）

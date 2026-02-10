---
title: File Loading Mechanism
icon: file-alt
description: JustDB CLI Schema file discovery, loading, and reference mechanism
order: 5
---

# File Loading Mechanism

JustDB CLI provides a flexible Schema file loading mechanism, supporting multi-file loading, remote loading, and reference inclusion.

## Schema File Discovery

### File Type Support

JustDB automatically recognizes the following file types:

| Extension | Format | Description |
|-----------|--------|-------------|
| `.yaml`, `.yml` | YAML | Human-readable configuration format |
| `.json` | JSON | Machine-readable configuration format |
| `.xml` | XML | Traditional JustDB format |
| `.toml` | TOML | Concise configuration format |
| `.properties` | Properties | Java properties file format |
| `.sql` | SQL | SQL script |
| `.java` | Java | Java source code |
| `.class` | Class | Compiled Java class |

### Auto-Discovery Rules

When no file type is specified, JustDB searches in the following order:

1. **Current Directory** - `./justdb.*`
2. **Project Directory** - `<project>/justdb.*`
3. **Standard Location** - `src/main/resources/justdb.*`
4. **Classpath** - Load from JAR resources

```bash
# Auto-discover
justdb migrate              # Find justdb.yaml/xml/json

# Specify file
justdb migrate schema.yaml

# Specify multiple files
justdb migrate schema1.yaml schema2.yaml
```

## Include/Import Mechanism

### Include Element

Use include in XML Schema to include other files:

```xml
<!-- main.xml -->
<Justdb id="main" name="Main Schema">
    <!-- Include common column definitions -->
    <include file="common-columns.xml" />

    <!-- Include table definitions -->
    <include file="tables/users.xml" />
    <include file="tables/orders.xml" />

    <!-- Include remote file -->
    <include url="https://example.com/schemas/common.xml" />

    <Tables>
        <!-- Local table definitions -->
    </Tables>
</Justdb>
```

### Import Directive

Use directive to import files:

```xml
<!-- main.xml -->
<Justdb id="main" name="Main Schema">
    <!-- Import directive -->
    <import file="common-columns.xml" />
    <import file="tables/" />

    <Tables>
        <!-- Use imported columns -->
        <Table name="users">
            <Column referenceId="global_id" name="id" />
            <Column referenceId="global_created_at" name="created_at" />
        </Table>
    </Tables>
</Justdb>
```

### YAML Include

YAML format uses special syntax to include files:

```yaml
# main.yaml
tables:
  - !include tables/users.yaml
  - !include tables/orders.yaml

columns:
  - !include common-columns.yaml

data:
  - !include data/users-data.yaml
```

## Ref-ID Reference

### Global Column Definition

Define reusable columns:

```xml
<!-- common-columns.xml -->
<Justdb id="common">
    <Columns>
        <!-- Global ID column -->
        <Column id="global_id" name="id" type="BIGINT"
                primaryKey="true" autoIncrement="true" />

        <!-- Global timestamp column -->
        <Column id="global_created_at" name="created_at"
                type="TIMESTAMP" nullable="false"
                defaultValue="CURRENT_TIMESTAMP" />

        <Column id="global_updated_at" name="updated_at"
                type="TIMESTAMP" nullable="false"
                defaultValue="CURRENT_TIMESTAMP" />
    </Columns>
</Justdb>
```

### Reference Global Columns

Use `referenceId` to reference global columns:

```xml
<!-- users.xml -->
<Table name="users">
    <!-- Reference global ID column -->
    <Column referenceId="global_id" name="id" />

    <!-- Local columns -->
    <Column name="username" type="VARCHAR(50)" nullable="false" />
    <Column name="email" type="VARCHAR(100)" nullable="false" />

    <!-- Reference global timestamp columns -->
    <Column referenceId="global_created_at" name="created_at" />
    <Column referenceId="global_updated_at" name="updated_at" />
</Table>
```

### Global Table Inheritance

Use `extends` to inherit table definitions:

```xml
<!-- base-table.xml -->
<Table id="base_table" name="base">
    <Column referenceId="global_id" name="id" />
    <Column referenceId="global_created_at" name="created_at" />
</Table>

<!-- users.xml -->
<Table name="users" extends="base_table">
    <Column name="username" type="VARCHAR(50)" />
    <Column name="email" type="VARCHAR(100)" />
</Table>
```

## Multi-File Loading

### Directory Loading

Load entire directory of Schema files:

```bash
# Load all files in directory
justdb migrate ./schemas/

# Specify file types
justdb migrate ./schemas/ --type yaml
```

### Multiple File Specification

Specify multiple files:

```bash
# Multiple files
justdb migrate schema1.yaml schema2.yaml schema3.yaml

# Use wildcards
justdb migrate schemas/*.yaml

# Recursive loading
justdb migrate schemas/ --recursive
```

### File Merge Strategy

Merge rules when loading multiple files:

1. **Tables** - Accumulate all table definitions
2. **Columns** - Accumulate all column definitions
3. **Data** - Accumulate all data definitions
4. **Views** - Accumulate all view definitions
5. **ID Conflicts** - Later loaded files overwrite earlier ones

```xml
<!-- file1.xml -->
<Justdb id="app">
    <Columns>
        <Column id="col1" name="field1" type="INT" />
    </Columns>
    <Tables>
        <Table name="table1">
            <Column name="col1" type="VARCHAR(50)" />
        </Table>
    </Tables>
</Justdb>

<!-- file2.xml -->
<Justdb id="app">
    <Columns>
        <Column id="col2" name="field2" type="INT" />
    </Columns>
    <Tables>
        <Table name="table2">
            <Column name="col1" type="INT" />
        </Table>
    </Tables>
</Justdb>

<!-- Merged result -->
<Justdb id="app">
    <Columns>
        <Column id="col1" name="field1" type="INT" />
        <Column id="col2" name="field2" type="INT" />
    </Columns>
    <Tables>
        <Table name="table1">
            <Column name="col1" type="VARCHAR(50)" />
        </Table>
        <Table name="table2">
            <Column name="col1" type="INT" />
        </Table>
    </Tables>
</Justdb>
```

## Remote Loading

### HTTP/HTTPS Loading

Load Schema from URL:

```xml
<Justdb id="main">
    <!-- Remote Schema -->
    <include url="https://example.com/schemas/common.xml" />
    <include url="https://raw.githubusercontent.com/user/repo/main/schema.yaml" />

    <Tables>
        <!-- Local tables -->
    </Tables>
</Justdb>
```

### Git Repository Loading

Load from Git repository:

```bash
# Load from GitHub
justdb migrate "git://github.com/user/repo:schema.yaml"

# Specify branch
justdb migrate "git://github.com/user/repo:main:schema.yaml"

# Load from Gitee
justdb migrate "git://gitee.com/user/repo:schema.yaml"
```

### Classpath Loading

Load resources from classpath:

```xml
<Justdb id="main">
    <!-- Classpath resources -->
    <include resource="schemas/common.xml" />
    <include resource="classpath:/schemas/base-tables.xml" />
</Justdb>
```

## File Parsing Options

### Format Auto-Detection

JustDB automatically detects file format:

```bash
# Detect by extension
justdb migrate schema.yaml   # YAML format
justdb migrate schema.json   # JSON format
justdb migrate schema.xml    # XML format
```

### Explicit Format Specification

Use `--type` option to specify format:

```bash
# Specify format
justdb migrate schema.txt --type yaml

# Multiple formats
justdb migrate schema.yaml --type yaml --type json
```

### Encoding Handling

JustDB supports multiple character encodings:

```bash
# Specify encoding
justdb migrate schema.yaml --encoding UTF-8

# Auto-detect (default)
justdb migrate schema.yaml
```

## Path Resolution

### Absolute Paths

```bash
# Absolute paths
justdb migrate /path/to/schema.yaml
justdb migrate C:\schemas\schema.xml
```

### Relative Paths

Relative paths are relative to the working directory:

```bash
# Relative paths
justdb migrate ./schema.yaml
justdb migrate ../schemas/schema.xml
```

### Working Directory

Change working directory in interactive mode:

```bash
# Change working directory
justdb> cd /path/to/project

# View current directory
justdb> pwd

# Load files from current directory
justdb> load schema.yaml
```

## File Monitoring

Monitor Schema file changes:

```bash
# Monitor single file
justdb watch schema.yaml

# Monitor directory
justdb watch ./schemas/

# Execute command
justdb watch schema.yaml --command "justdb validate %f"
```

## Loading Error Handling

### Skip Error Files

Use `--continue-on-error` to continue:

```bash
# Skip error files
justdb migrate *.xml --continue-on-error
```

### Verbose Error Information

Use `--verbose` for detailed errors:

```bash
# Verbose mode
justdb migrate schema.yaml --verbose

# Debug mode
justdb migrate schema.yaml -vv
```

## Performance Optimization

### Caching Mechanism

JustDB caches loaded files:

```bash
# Clear cache
justdb migrate --clear-cache schema.yaml

# Disable cache
justdb migrate --no-cache schema.yaml
```

### Parallel Loading

Load multiple files in parallel:

```bash
# Parallel loading
justdb migrate *.xml --parallel

# Specify thread count
justdb migrate *.xml --parallel --threads 4
```

## Best Practices

1. **Use Modular Structure**
   ```
   schemas/
   ├── common/
   │   ├── columns.xml
   │   └── tables.xml
   ├── tables/
   │   ├── users.xml
   │   └── orders.xml
   └── data/
       └── users-data.xml
   ```

2. **Use Global Definitions**
   - Define global columns in `common/columns.xml`
   - Use `referenceId` to reference global columns

3. **Separate Concerns**
   - Put common definitions in `common/` directory
   - Put table definitions in `tables/` directory
   - Put data definitions in `data/` directory

4. **Use Version Control**
   - Include Schema files in version control
   - Use `.gitignore` to exclude sensitive data

5. **Document References**
   - Add comments to global definitions
   - Record reference relationships

## Related Documentation

- [Command Reference](./commands.md) - Loading command options
- [Configuration File](./configuration.md) - Configuration file details
- [Schema Definition Reference](../schema/README.md) - Schema structure details

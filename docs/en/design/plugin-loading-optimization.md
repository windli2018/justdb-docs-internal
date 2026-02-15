# Plugin Loading Optimization Implementation

## Overview

This document describes the implementation of plugin loading optimization for JustDB. The optimization introduces:

1. **Lazy loading for templates** - Templates are processed on first access (already implemented via `GeneralTemplateSource`)
2. **Configurable loading order** - `order` attribute for plugins and templates
3. **User-defined plugin priority** - User plugins can override built-in plugins

## Implementation Details

### 1. Order Attribute

#### JustdbPlugin
Added `order` attribute to `JustdbPlugin` class:

```java
@XmlAttribute
private Integer order = 100;
```

- **Default value**: 100
- **Lower values**: Higher priority (loaded first)
- **User plugins**: Should use values < 100 to override built-in plugins
- **Built-in plugins**: Default to 100

#### GenericTemplate
Added `order` attribute to `GenericTemplate` class:

```java
@XmlAttribute
@JacksonXmlProperty(isAttribute = true)
private Integer order = 100;
```

- **Default value**: 100
- **Lower values**: Higher priority (processed first within plugin)

### 2. Plugin Loading Order

Modified `PluginManager.loadDefaultPlugins()` to:

1. Collect all plugins (built-in and external)
2. Sort by `order` attribute (ascending - lower values first)
3. Register in sorted order

```java
private void sortPluginsByOrder(List<JustdbPlugin> plugins) {
    plugins.sort((p1, p2) -> {
        Integer order1 = p1.getOrder() != null ? p1.getOrder() : 100;
        Integer order2 = p2.getOrder() != null ? p2.getOrder() : 100;
        return Integer.compare(order1, order2);
    });
}
```

### 3. Template Sorting Within Plugin

Templates within a plugin are sorted by `order` attribute during registration:

```java
private void sortTemplatesByOrder(List<GenericTemplate> templates) {
    templates.sort((t1, t2) -> {
        Integer order1 = t1.getOrder() != null ? t1.getOrder() : 100;
        Integer order2 = t2.getOrder() != null ? t2.getOrder() : 100;
        return Integer.compare(order1, order2);
    });
}
```

### 4. Lazy Loading (Already Implemented)

Templates are already lazily processed via `GeneralTemplateSource`:

- Template content is processed on first access
- Processed templates are cached in `processedCache`
- No changes needed - this was already optimized

## Usage

### Defining a User Plugin with High Priority

```xml
<plugins>
  <plugin id="my-custom-plugin" name="My Custom Plugin" order="50">
    <templates>
      <template name="create-table" type="SQL" category="db" order="10">
        <content>CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{name}} (...)</content>
      </template>
    </templates>
  </plugin>
</plugins>
```

### Order Value Guidelines

- **1-49**: User-defined plugins with high priority (override built-in)
- **50-99**: User-defined plugins with medium priority
- **100**: Default priority (built-in plugins)
- **101+**: Low priority plugins

## Testing

Added comprehensive test class `PluginManagerOrderTest`:

1. `testPluginOrderAttribute()` - Tests plugin ordering by order value
2. `testTemplateOrderAttribute()` - Tests template ordering within plugin
3. `testUserDefinedPluginHigherPriority()` - Tests user plugins override built-in
4. `testPluginOrderWithDefaultValues()` - Tests default order value
5. `testTemplateOrderWithDefaultValues()` - Tests template default order
6. `testPluginLoadingWithJustdbManager()` - Tests through JustdbManager
7. `testTemplatePriorityWithinPlugin()` - Tests template priority

All tests pass:
- Java tests: 2003 tests, 0 failures, 11 skipped
- TypeScript tests: 79 tests, 0 failures

## Benefits

1. **User Override Capability**: Users can override built-in templates by specifying lower order values
2. **Backward Compatible**: Existing plugins without `order` attribute default to 100
3. **Flexible Priority System**: Fine-grained control over plugin and template loading
4. **Lazy Loading Preserved**: Templates are still processed on first access for performance

## Files Modified

1. `justdb-core/src/main/java/ai/justdb/justdb/plugin/JustdbPlugin.java`
   - Added `order` attribute with default value 100

2. `justdb-core/src/main/java/ai/justdb/justdb/templates/GenericTemplate.java`
   - Added `order` attribute with default value 100
   - Updated copy constructor to include `order`

3. `justdb-core/src/main/java/ai/justdb/justdb/plugin/PluginManager.java`
   - Modified `loadDefaultPlugins()` to collect, sort, and register plugins by order
   - Added `sortPluginsByOrder()` method
   - Added `sortTemplatesByOrder()` method
   - Split `loadBuiltInPlugins()` into public and private methods

4. `justdb-core/src/test/java/ai/justdb/justdb/plugin/PluginManagerOrderTest.java`
   - New test class for order functionality

## Future Enhancements

1. Add support for plugin dependencies (load one plugin before another)
2. Add validation to detect conflicting order values
3. Add CLI command to list plugins with their order values
4. Add documentation examples for common use cases

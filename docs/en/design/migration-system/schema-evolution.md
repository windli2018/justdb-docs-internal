---
icon: arrows-rotate
title: Schema Evolution
order: 3
category:
  - Design Documentation
  - Migration System
tag:
  - evolution
  - migration
---

# Schema Evolution

The Schema evolution mechanism is responsible for managing Schema changes, ensuring data safety and consistency.

## Evolution Strategies

### Safe Evolution

- **Type Conversion**: Support safe data type conversions
- **Data Preservation**: Preserve existing data during evolution
- **Incremental Updates**: Minimize impact on production environments

### Evolution Operations

- **Add Column**: Support with default values
- **Modify Column Type**: Support type conversion
- **Rename Table/Column**: Track via formerNames
- **Drop Object**: Support safe deletion (backup mechanism)

## Related Documentation

- [Schema Evolution](../schema-system/schema-evolution.md) - Schema system evolution

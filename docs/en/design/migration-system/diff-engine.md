---
icon: git-compare
title: Diff Engine
order: 2
category:
  - Design Documentation
  - Migration System
tag:
  - diff
  - migration
---

# Diff Engine

The diff engine is responsible for calculating differences between two Schema states and generating incremental migration scripts.

## Diff Calculation

### Change Types

- **ADDED**: New object
- **REMOVED**: Deleted object
- **MODIFIED**: Modified object
- **RENAMED**: Renamed object

### Diff Algorithm

1. **Object matching**: Match objects by name and referenceId
2. **Attribute comparison**: Compare object attribute differences
3. **Dependency analysis**: Analyze change dependencies
4. **Change ordering**: Order changes by dependency

## Related Documentation

- [Schema Evolution](../schema-system/schema-evolution.md) - Schema evolution mechanism

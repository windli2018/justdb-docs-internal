---
icon: table
title: Schema System Design
order: 1
---

# Schema System Design

Documentation for JustDB's schema definition, processing, and validation system.

## Overview

The schema system is responsible for:
- Loading schema definitions from various formats
- Validating schema structures and constraints
- Maintaining schema object hierarchy
- Tracking schema evolution

## Documents

### Core Concepts

| Document | Description |
|----------|-------------|
| [Overview](./overview.md) | Schema system overview and features |
| [Type Hierarchy](./type-hierarchy.md) | Type inheritance hierarchy |
| [Alias System](./alias-system.md) | Field naming and alias support |

### Schema Evolution

| Document | Description |
|----------|-------------|
| [Schema Evolution](./schema-evolution.md) | Schema change tracking mechanism |
| [Reference System](./reference-system.md) | Component reuse via referenceId |
| [Virtual Columns](./virtual-columns.md) | Virtual column design for data reference resolution |

### Extensibility

| Document | Description |
|----------|-------------|
| [Extension Points](./extension-points.md) | Dynamic extension mechanism |

### Schema Definition

| Document | Description |
|----------|-------------|
| [Definition](./definition.md) | Schema object definitions |

### Implementation

| Document | Description |
|----------|-------------|
| [Extension Points Implementation](./extension-points-impl.md) | Extension point implementation details |

## Key Components

### Schema Model
- Schema object hierarchy
- Base classes and inheritance
- Property management

### Schema Loading
- Format detection and parsing
- Reference resolution
- Import processing

### Schema Validation
- Structural validation
- Constraint validation
- Cross-reference validation

### Schema Evolution
- Change tracking
- Rename detection
- Migration planning

## Related Documentation

- [Design Documentation](../README.md) - Design documentation overview

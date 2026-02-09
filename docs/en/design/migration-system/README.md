---
icon: arrows-rotate
title: Migration System Design
order: 54
---

# Migration System Design

Documentation for JustDB's schema migration and diff calculation system.

## Overview

The migration system is responsible for:
- Calculating schema differences
- Classifying change types
- Generating migration SQL
- Executing safe migrations

## Key Components

### Diff Calculation
- Schema comparison algorithm
- Change detection
- Rename recognition

### Change Classification
- ADDED changes
- REMOVED changes
- MODIFIED changes
- RENAMED changes

### SQL Generation
- Template-based generation
- Database-specific dialects
- Idempotent SQL

### Safe Migration
- Transaction management
- Rollback support
- Validation checks

## Related Documentation

- [Design Documentation](../README.md) - Design documentation overview

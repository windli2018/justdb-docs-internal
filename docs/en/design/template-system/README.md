---
icon: code
title: Template System Design
order: 53
---

# Template System Design

Documentation for JustDB's SQL and code generation template system.

## Overview

The template system uses Handlebars to generate:
- DDL statements (CREATE, ALTER, DROP)
- DML statements (INSERT, UPDATE, DELETE)
- Custom SQL scripts
- Code templates

## Key Components

### Template Engine
- Handlebars integration
- Template inheritance
- Template precedence

### Lineage Templates
- Database lineage groups
- Shared syntax templates
- Dialect-specific overrides

### Template Helpers
- Built-in helpers
- Custom helper development
- Helper context

## Related Documentation

- [Design Documentation](../README.md) - Design documentation overview

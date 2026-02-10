---
icon: scroll
title: ADR-001 Alias System
order: 1
---

# ADR-001: Alias System for Schema Naming

## Status

**Accepted** - 2024-01-15

## Context

JustDB schemas can be defined in multiple formats (YAML, JSON, XML) and may be authored by different users with varying naming conventions. We need a system that:

1. Accepts multiple naming formats for backward compatibility
2. Maintains a single canonical output format
3. Allows schema evolution without breaking existing definitions

## Decision

Implement a **dual-field alias system** using Jackson `@JsonAlias` annotations:

### Canonical Naming Convention

- **Field names**: camelCase
- **Collections**: plural form
- **SQL terminology**: preferred (e.g., `beforeDrops` uses DROP not Remove, `beforeAlters` uses ALTER not Modify)

### Implementation

```java
@JsonProperty("referenceId")  // Canonical name
@JsonAlias({"refId", "ref-id", "ref_id"})  // Supported aliases
private String referenceId;

@JsonProperty("formerNames")  // Canonical
@JsonAlias({"oldNames", "oldName", "formerName", "previousNames"})
private List&lt;String&gt; formerNames;
```

### Benefits

1. **Backward Compatibility**: Old schemas continue to work
2. **Clear Migration Path**: Users can see canonical names
3. **Type Safety**: Compiler checks canonical field access
4. **Documentation**: Single source of truth for field names

## Examples

### Input (any alias format)

```json
{
  "ref-id": "global_id",  // Works
  "oldName": "user"        // Works
}
```

### Output (canonical only)

```json
{
  "referenceId": "global_id",
  "formerNames": ["user"]
}
```

## Consequences

### Positive

- Existing schemas don't break when we add new fields
- Users can choose their preferred naming style
- IDE auto-completion shows canonical names

### Negative

- Slightly more complex field definitions
- Need to maintain alias lists

### Neutral

- Output size: canonical names may be longer than some aliases

## Related Decisions

- [ADR-002: Template Engine](./adr-002-template-engine.html)
- [ADR-003: Lifecycle Hooks](./adr-003-lifecycle-hooks.html)

## References

- [Schema Structure](/reference/schema/)
- [Naming Conventions](/development/coding-standards.html)

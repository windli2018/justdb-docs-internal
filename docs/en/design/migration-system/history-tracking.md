---
icon: clock
title: History Tracking
order: 4
category:
  - Design Documentation
  - Migration System
tag:
  - history
  - tracking
---

# History Tracking

The history tracking mechanism records all Schema changes, providing complete audit trails.

## Tracking Information

### Change Records

- **Change Time**: Records when the change occurred
- **Change Content**: Records the specific change details
- **Change Reason**: Records the reason for change (optional)
- **Execution Result**: Records the execution result of the change

### Query History

```bash
# View migration history
justdb history list

# View specific migration
justdb history show <migration-id>
```

## Related Documentation

- [History Service](../history-service/overview.md) - History service overview

---
icon: clock-rotate-left
title: History Service Overview
order: 1
category:
  - Design Documentation
  - History Service
tag:
  - history
  - architecture
---

# History Service Overview

The history service is responsible for tracking and managing Schema change history, providing complete audit trails and rollback capabilities.

## Core Features

- **Change tracking**: Record all Schema changes
- **History query**: Query Schema state at any point in time
- **Rollback support**: Support rollback to historical versions
- **Audit log**: Complete operation audit records

## Related Documentation

- [Architecture Design](./architecture.md) - History service architecture design
- [Hash-based History](./hash-based-history.md) - Hash history implementation details

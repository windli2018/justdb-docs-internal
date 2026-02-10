---
title: Python ORM Integration
icon: code
description: Generate SQLAlchemy and Django models from JustDB schema
---

# Python ORM Integration Guide

JustDB supports generating Python ORM models for SQLAlchemy and Django from Schema definitions.

## Table of Contents

1. [Background](#background)
2. [Quick Start](#quick-start)
3. [Generate from Existing Database](#generate-from-existing-database)
4. [SQLAlchemy Usage](#sqlalchemy-usage)
5. [Django Usage](#django-usage)
6. [Common Scenarios](#common-scenarios)
7. [Best Practices](#best-practices)

---

## Background

### Python ORM Ecosystem

| Framework | Characteristics | Use Cases |
|-----------|----------------|-----------|
| **SQLAlchemy** | Mature, flexible, database-agnostic | Enterprise applications, complex queries |
| **Django ORM** | Batteries-included, Django-integrated | Django web applications, rapid development |

---

## Quick Start

### Install JustDB

```bash
wget https://github.com/justdb/justdb/releases/latest/download/justdb-cli.zip
unzip justdb-cli.zip
export PATH=$PATH:$(pwd)/justdb-cli/bin
```

### Install Python Dependencies

```bash
# SQLAlchemy
pip install sqlalchemy

# Django
pip install django
```

### Generate Models

```bash
# SQLAlchemy
justdb schema2orm \
  --input schema.xml \
  --type sqlalchemy \
  --output models.py

# Django
justdb schema2orm \
  --input schema.xml \
  --type django \
  --output myapp/models.py
```

---

## Generate from Existing Database

### Extract Schema from Database

```bash
justdb db2schema \
  --db-url "jdbc:postgresql://localhost:5432/mydb" \
  --username postgres \
  --password password \
  --output schema.xml
```

### Or Define Schema in Markdown

```markdown
# Users Table

| Column | Type | Primary Key | Comment |
|--------|------|-------------|---------|
| id | BIGINT | true | User ID |
| username | VARCHAR(50) | false | Username |
| email | VARCHAR(100) | false | Email |
| created_at | TIMESTAMP | false | Created At |
```

### Generate Models

```bash
justdb schema2orm --input schema.md --type sqlalchemy --output models.py
```

---

## SQLAlchemy Usage

### Generated Models Example

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")

class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(Integer, nullable=False)

    user = relationship("User", back_populates="orders")
```

### Basic Operations

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Create engine
engine = create_engine('postgresql://user:password@localhost/mydb')
Session = sessionmaker(bind=engine)
session = Session()

# Create
user = User(username='alice', email='alice@example.com')
session.add(user)
session.commit()

# Query
user = session.query(User).filter_by(username='alice').first()

# Update
user.email = 'newemail@example.com'
session.commit()

# Delete
session.delete(user)
session.commit()
```

---

## Django Usage

### Generated Models Example

```python
from django.db import models

class User(models.Model):
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    amount = models.IntegerField()

    class Meta:
        db_table = 'orders'
```

### Basic Operations

```python
# Create
user = User.objects.create(username='alice', email='alice@example.com')

# Query
user = User.objects.get(username='alice')
users = User.objects.filter(email__contains='example.com')

# Update
user.email = 'newemail@example.com'
user.save()

# Delete
user.delete()
```

---

## Common Scenarios

### Social Media Platform

```markdown
# Users Table
| Column | Type | Primary Key |
|--------|------|-------------|
| id | BIGINT | true |
| username | VARCHAR(50) | false |

# Posts Table
| Column | Type | Primary Key | Foreign Key |
|--------|------|-------------|-------------|
| id | BIGINT | true | - |
| author_id | BIGINT | false | users.id |
| content | TEXT | false | - |
```

```bash
# Generate Django models
justdb schema2orm --input social.md --type django --output myapp/models.py
```

---

## Best Practices

### 1. Use Migration Files

```bash
# Django
python manage.py makemigrations
python manage.py migrate

# SQLAlchemy with Alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 2. Connection Pooling

```python
# SQLAlchemy
engine = create_engine(
    'postgresql://user:pass@localhost/mydb',
    pool_size=10,
    max_overflow=20
)
```

### 3. Use Context Managers

```python
# Session management
with session_scope() as session:
    user = session.query(User).first()
    user.email = 'new@example.com'
    # Automatically commits on success, rolls back on error
```

## Reference Links

- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Django Documentation](https://docs.djangoproject.com/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

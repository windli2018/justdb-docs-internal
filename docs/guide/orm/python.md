# Python ORM 集成指南

JustDB 支持将 Schema 定义转换为 Python 的 SQLAlchemy 和 Django ORM 模型。

## 目录

1. [背景知识](#背景知识)
2. [快速开始](#快速开始)
3. [从现有数据库生成模型](#从现有数据库生成模型)
4. [SQLAlchemy 使用指南](#sqlalchemy-使用指南)
5. [Django ORM 使用指南](#django-orm-使用指南)
6. [常见场景](#常见场景)
7. [最佳实践](#最佳实践)

---

## 背景知识

### Python ORM 生态

Python 有两个主流的 ORM 框架：

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| **SQLAlchemy** | 功能强大、灵活、数据库无关 | 复杂业务逻辑、需要精细控制 |
| **Django ORM** | 简单易用、与 Django 深度集成 | Django 项目、快速开发 |

### SQLAlchemy 架构

```
SQLAlchemy
├── Core (核心层)
│   ├── Schema (表定义)
│   ├── SQL Expression Language (SQL 表达式)
│   └── Engine/Connection (连接管理)
└── ORM (对象关系映射)
    ├── Session (会话管理)
    ├── Query (查询接口)
    └── Relationship (关系映射)
```

### Django ORM 架构

```
Django ORM
├── Models (模型定义)
│   ├── Fields (字段类型)
│   ├── Meta (元数据配置)
│   └── Methods (模型方法)
├── QuerySet (查询集)
│   ├── Filtering (过滤)
│   ├── Aggregation (聚合)
│   └── Annotation (注解)
└── Migrations (迁移系统)
```

---

## 快速开始

### 安装 JustDB

```bash
# 下载 JustDB CLI
wget https://github.com/justdb/justdb/releases/latest/download/justdb-cli.zip

# 解压
unzip justdb-cli.zip

# 添加到 PATH
export PATH=$PATH:$(pwd)/justdb-cli/bin
```

### 安装 Python 依赖

```bash
# SQLAlchemy
pip install sqlalchemy psycopg2-binary  # PostgreSQL
pip install sqlalchemy pymysql          # MySQL

# Django
pip install django psycopg2-binary      # PostgreSQL
pip install django mysqlclient          # MySQL
```

### 基本工作流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  数据库     │────▶│   JustDB    │────▶│  Python代码  │
│  MySQL/PG   │     │  Schema2ORM │     │  .py 模型   │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 从现有数据库生成模型

### 方法一：使用 db2schema 命令

```bash
# 从数据库提取 schema
justdb db2schema \
  --db-url "jdbc:mysql://localhost:3306/mydb" \
  --username root \
  --password password \
  --output mydb.xml
```

### 方法二：使用 Markdown 定义 Schema

创建 `schema.md`:

```markdown
# 用户表 (users)

| Column Name | Type | Nullable | Primary Key | Default | Comment |
|-------------|------|----------|-------------|---------|---------|
| id | BIGINT | false | true | AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | false | false | NULL | 用户名 |
| email | VARCHAR(100) | true | false | NULL | 邮箱 |
| created_at | TIMESTAMP | false | false | CURRENT_TIMESTAMP | 创建时间 |

# 订单表 (orders)

| Column Name | Type | Nullable | Primary Key | Default | Comment |
|-------------|------|----------|-------------|---------|---------|
| id | BIGINT | false | true | AUTO_INCREMENT | 订单ID |
| user_id | BIGINT | false | false | NULL | 用户ID |
| amount | DECIMAL(10,2) | false | false | 0.00 | 订单金额 |
| status | VARCHAR(20) | false | false | 'pending' | 订单状态 |
```

### 方法三：直接使用 XML Schema

创建 `schema.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp">
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
    <Column name="email" type="VARCHAR(100)"/>
    <Column name="created_at" type="TIMESTAMP" nullable="false"/>
  </Table>

  <Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="user_id" type="BIGINT" nullable="false"/>
    <Column name="amount" type="DECIMAL(10,2)" nullable="false"/>
    <Column name="status" type="VARCHAR(20)" nullable="false"/>
  </Table>
</Justdb>
```

### 生成 Python 模型

```bash
# 生成 SQLAlchemy 模型
justdb schema2orm \
  --input schema.md \
  --type sqlalchemy \
  --output models/

# 生成 Django 模型
justdb schema2orm \
  --input schema.md \
  --type django \
  --output models/
```

生成的文件结构：

```
models/
├── __init__.py
├── user.py       # User 模型
├── order.py      # Order 模型
└── base.py       # Base 声明
```

---

## SQLAlchemy 使用指南

### 生成的模型示例

```python
# models/user.py
from sqlalchemy import Column, BigInteger, String, Timestamp
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False)
    email = Column(String(100))
    created_at = Column(Timestamp, nullable=False, default=datetime.now)

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"
```

### 基本操作

#### 创建连接

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 创建引擎
engine = create_engine('mysql+pymysql://user:password@localhost/mydb')

# 创建会话
Session = sessionmaker(bind=engine)
session = Session()
```

#### 增删改查

```python
# 创建
user = User(username='alice', email='alice@example.com')
session.add(user)
session.commit()

# 查询
user = session.query(User).filter_by(username='alice').first()
users = session.query(User).filter(User.email.like('%@example.com')).all()

# 更新
user.email = 'newemail@example.com'
session.commit()

# 删除
session.delete(user)
session.commit()
```

#### 关系映射

```python
from sqlalchemy import ForeignKey, relationship
from sqlalchemy.orm import backref

class Order(Base):
    __tablename__ = 'orders'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), nullable=False)
    amount = Column(Decimal(10, 2), nullable=False)
    status = Column(String(20), nullable=False)

    # 关系
    user = relationship("User", back_populates="orders")

# 在 User 类中添加
class User(Base):
    # ... 其他字段 ...
    orders = relationship("Order", back_populates="user")
```

#### 复杂查询

```python
from sqlalchemy import and_, or_, func

# 多条件查询
users = session.query(User).filter(
    and_(User.email.isnot(None), User.created_at > datetime(2024, 1, 1))
).all()

# 聚合查询
result = session.query(
    func.count(Order.id).label('total'),
    func.sum(Order.amount).label('total_amount')
).filter_by(user_id=1).first()

# JOIN 查询
results = session.query(User, Order).join(Order).filter(
    Order.status == 'completed'
).all()
```

---

## Django ORM 使用指南

### 生成的模型示例

```python
# models/user.py
from django.db import models

class User(models.Model):
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=50)
    email = models.CharField(max_length=100, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username
```

### 基本操作

#### 配置 Django

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'mydb',
        'USER': 'root',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

INSTALLED_APPS = [
    # ...
    'myapp.models',
]
```

#### 增删改查

```python
# 创建
user = User.objects.create(username='alice', email='alice@example.com')

# 查询
user = User.objects.get(username='alice')
users = User.objects.filter(email__contains='@example.com')

# 更新
user.email = 'newemail@example.com'
user.save()

# 或批量更新
User.objects.filter(username='alice').update(email='newemail@example.com')

# 删除
user.delete()
# 或批量删除
User.objects.filter(username='alice').delete()
```

#### 关系映射

```python
class Order(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='orders'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)

    class Meta:
        db_table = 'orders'
```

#### 复杂查询

```python
from django.db.models import Q, Count, Sum, F

# 多条件查询 (OR)
users = User.objects.filter(
    Q(email__isnull=False) & Q(created_at__gt='2024-01-01')
)

# 聚合查询
from django.db.models.aggregates import Count, Sum
result = Order.objects.filter(user_id=1).aggregate(
    total=Count('id'),
    total_amount=Sum('amount')
)

# JOIN 查询 (自动)
orders = Order.objects.select_related('user').filter(status='completed')

# 批量更新
Order.objects.filter(status='pending').update(status='processed')
```

---

## 常见场景

### 场景1：电商系统

```markdown
# 商品表 (products)

| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 商品ID |
| name | VARCHAR(100) | false | ✗ | 商品名称 |
| price | DECIMAL(10,2) | false | ✗ | 价格 |
| stock | INT | false | ✗ | 库存 |

# 订单表 (orders)

| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 订单ID |
| user_id | BIGINT | false | ✗ | ✓ | 用户ID |
| total | DECIMAL(10,2) | false | ✗ | ✗ | 总金额 |

# 订单明细表 (order_items)

| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 明细ID |
| order_id | BIGINT | false | ✗ | ✓ | 订单ID |
| product_id | BIGINT | false | ✗ | ✓ | 商品ID |
| quantity | INT | false | ✗ | ✗ | 数量 |
```

```bash
# 生成 SQLAlchemy 模型
justdb schema2orm --input ecommerce.md --type sqlalchemy --output models/
```

### 场景2：博客系统

```markdown
# 文章表 (posts)

| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 文章ID |
| title | VARCHAR(200) | false | ✗ | 标题 |
| content | TEXT | false | ✗ | 内容 |
| author_id | BIGINT | false | ✗ | 作者ID |
| created_at | TIMESTAMP | false | ✗ | 创建时间 |

# 标签表 (tags)

| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 标签ID |
| name | VARCHAR(50) | false | ✗ | 标签名称 |

# 文章标签关联表 (post_tags)

| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| post_id | BIGINT | false | ✓ | ✓ | 文章ID |
| tag_id | BIGINT | false | ✓ | ✓ | 标签ID |
```

```bash
# 生成 Django 模型
justdb schema2orm --input blog.md --type django --output blog/models/
```

### 场景3：权限系统

```markdown
# 用户表 (users)

| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 用户ID |
| username | VARCHAR(50) | false | ✗ | 用户名 |

# 角色表 (roles)

| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 角色ID |
| name | VARCHAR(50) | false | ✗ | 角色名 |

# 权限表 (permissions)

| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 权限ID |
| resource | VARCHAR(100) | false | ✗ | 资源 |
| action | VARCHAR(50) | false | ✗ | 操作 |

# 用户角色关联 (user_roles)

| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| user_id | BIGINT | false | ✓ | ✓ | 用户ID |
| role_id | BIGINT | false | ✓ | ✓ | 角色ID |

# 角色权限关联 (role_permissions)

| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| role_id | BIGINT | false | ✓ | ✓ | 角色ID |
| permission_id | BIGINT | false | ✓ | ✓ | 权限ID |
```

---

## 最佳实践

### 1. 命名约定

```python
# 表名：使用复数形式
class User(Base):  # 映射到 users 表
    __tablename__ = 'users'

# 列名：使用 snake_case
user_name = Column(String(50))  # 映射到 user_name 列

# 类名：使用 PascalCase
class OrderItem(Base):  # 类名
    pass
```

### 2. 索引优化

```xml
<!-- schema.xml 中定义索引 -->
<Table name="users">
    <Column name="email" type="VARCHAR(100)"/>
    <Index name="idx_email" type="UNIQUE">
        <Column>email</Column>
    </Index>
</Table>
```

### 3. 使用会话上下文管理器

```python
# SQLAlchemy
from contextlib import contextmanager

@contextmanager
def session_scope():
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()

# 使用
with session_scope() as session:
    user = User(username='alice')
    session.add(user)
```

### 4. Django 信号处理

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
```

### 5. 批量操作

```python
# SQLAlchemy 批量插入
session.bulk_insert_mappings(User, [
    {'username': f'user{i}', 'email': f'user{i}@example.com'}
    for i in range(1000)
])
session.commit()

# Django 批量创建
User.objects.bulk_create([
    User(username=f'user{i}', email=f'user{i}@example.com')
    for i in range(1000)
])
```

### 6. 查询优化

```python
# SQLAlchemy: 使用 joinedload
from sqlalchemy.orm import joinedload
users = session.query(User).options(joinedload(User.orders)).all()

# Django: 使用 select_related 和 prefetch_related
orders = Order.objects.select_related('user').all()  # FK
items = OrderItem.objects.prefetch_related('tags').all()  # M2M
```

---

## 进阶话题

### 数据库迁移

```bash
# Alembic (SQLAlchemy)
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Django
python manage.py makemigrations
python manage.py migrate
```

### 事务处理

```python
# SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError

try:
    with session.begin():
        user = User(username='alice')
        session.add(user)
        order = Order(user_id=user.id, amount=100)
        session.add(order)
except SQLAlchemyError as e:
    print(f"Transaction failed: {e}")

# Django
from django.db import transaction

@transaction.atomic
def create_order_with_user(username, amount):
    user = User.objects.create(username=username)
    Order.objects.create(user=user, amount=amount)
```

### 连接池配置

```python
# SQLAlchemy
engine = create_engine(
    'mysql+pymysql://user:pass@localhost/db',
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # 检查连接有效性
    echo=False
)
```

---

## 参考资源

- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)
- [Django ORM 文档](https://docs.djangoproject.com/en/stable/topics/db/models/)
- [Python PEP 249 - DB-API 2.0](https://www.python.org/dev/peps/pep-0249/)
- [Alembic 迁移工具](https://alembic.sqlalchemy.org/)

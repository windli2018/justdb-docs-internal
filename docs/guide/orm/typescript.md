# TypeScript ORM 集成指南

JustDB 支持将 Schema 定义转换为 TypeScript 的 Prisma 和 TypeORM 模型。

## 目录

1. [背景知识](#背景知识)
2. [快速开始](#快速开始)
3. [从现有数据库生成模型](#从现有数据库生成模型)
4. [Prisma 使用指南](#prisma-使用指南)
5. [TypeORM 使用指南](#typeorm-使用指南)
6. [常见场景](#常见场景)
7. [最佳实践](#最佳实践)

---

## 背景知识

### TypeScript ORM 生态

TypeScript 有两个主流的 ORM 框架：

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| **Prisma** | 类型安全、自动生成、开发体验极佳 | 全栈 TypeScript 项目 |
| **TypeORM** | 装饰器模式、类似 Hibernate | 传统后端项目、复杂查询 |

### Prisma 架构

```
Prisma
├── Schema (schema.prisma)
│   ├── Models (模型定义)
│   ├── Enums (枚举类型)
│   └── Relations (关系映射)
├── Client (@prisma/client)
│   ├── Typed Queries (类型安全查询)
│   ├── Migrations (迁移管理)
│   └── Seed (种子数据)
└── Engine (底层查询引擎)
```

### TypeORM 架构

```
TypeORM
├── Entities (实体定义)
│   ├── Decorators (@Entity, @Column)
│   ├── Relations (@OneToOne, @OneToMany)
│   └── Indices (@Index)
├── DataSource (数据源)
│   ├── Migrations (迁移)
│   ├── Subscribers (事件监听)
│   └── QueryRunner (查询执行)
└── Repository (仓储模式)
    ├── Active Record (活动记录)
    └── Data Mapper (数据映射)
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

### 安装 TypeScript 依赖

```bash
# Prisma
npm install prisma @prisma/client
npx prisma init

# TypeORM
npm install typeorm reflect-metadata
npm install pg        # PostgreSQL
npm install mysql     # MySQL
```

### 配置 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,    // TypeORM 需要
    "emitDecoratorMetadata": true,    // TypeORM 需要
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 从现有数据库生成模型

### 方法一：使用 db2schema 命令

```bash
# 从数据库提取 schema
justdb db2schema \
  --db-url "jdbc:postgresql://localhost:5432/mydb" \
  --username postgres \
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

### 生成 TypeScript 模型

```bash
# 生成 Prisma schema
justdb schema2orm \
  --input schema.md \
  --type prisma \
  --output prisma/schema.prisma

# 生成 TypeORM entities
justdb schema2orm \
  --input schema.md \
  --type typeorm \
  --output src/entities/
```

---

## Prisma 使用指南

### 生成的 Schema 示例

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         BigInt   @id @default(autoincrement())
  username   String   @db.VarChar(50)
  email      String?  @db.VarChar(100)
  createdAt  DateTime @default(now()) @map("created_at")
  orders     Order[]

  @@map("users")
}

model Order {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt   @map("user_id")
  amount    Decimal  @db.Decimal(10, 2)
  status    String   @db.VarChar(20) @default("pending")
  user      User     @relation(fields: [userId], references: [id])

  @@map("orders")
}
```

### 基本操作

#### 初始化 Prisma Client

```typescript
// src/client.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

export default prisma
```

#### 增删改查

```typescript
import prisma from './client'

// 创建
const user = await prisma.user.create({
  data: {
    username: 'alice',
    email: 'alice@example.com',
  },
})

// 查询
const user = await prisma.user.findUnique({
  where: { username: 'alice' },
})

const users = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' },
  },
})

// 更新
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    email: 'newemail@example.com',
  },
})

// 删除
await prisma.user.delete({
  where: { id: 1 },
})
```

#### 关系查询

```typescript
// 创建关联数据
const order = await prisma.order.create({
  data: {
    amount: 99.99,
    status: 'pending',
    user: {
      connect: { id: 1 },
    },
  },
})

// 包含关联查询
const orders = await prisma.order.findMany({
  include: {
    user: true,
  },
})

// 嵌套创建
const userWithOrders = await prisma.user.create({
  data: {
    username: 'bob',
    orders: {
      create: [
        { amount: 49.99, status: 'pending' },
        { amount: 99.99, status: 'completed' },
      ],
    },
  },
  include: {
    orders: true,
  },
})
```

#### 高级查询

```typescript
// 分页
const users = await prisma.user.findMany({
  skip: 0,
  take: 10,
  orderBy: { createdAt: 'desc' },
})

// 聚合
const stats = await prisma.order.aggregate({
  where: { userId: 1 },
  _count: { id: true },
  _sum: { amount: true },
  _avg: { amount: true },
})

// 分组
const grouped = await prisma.order.groupBy({
  by: ['status'],
  _count: { id: true },
  _sum: { amount: true },
})

// 事务
const [user, order] = await prisma.$transaction([
  prisma.user.create({ data: { username: 'charlie' } }),
  prisma.order.create({ data: { userId: 1, amount: 100 } }),
])
```

---

## TypeORM 使用指南

### 生成的实体示例

```typescript
// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column,CreateDateColumn,OneToMany } from 'typeorm'
import { Order } from './Order'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'varchar', length: 50 })
  username!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[]
}
```

### 基本操作

#### 初始化数据源

```typescript
// src/data-source.ts
import { DataSource } from 'typeorm'
import { User } from './entities/User'
import { Order } from './entities/Order'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'mydb',
  synchronize: false, // 生产环境设为 false
  logging: true,
  entities: [User, Order],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
})
```

#### 增删改查

```typescript
import { AppDataSource } from './data-source'
import { User } from './entities/User'

// 初始化
await AppDataSource.initialize()

const userRepository = AppDataSource.getRepository(User)

// 创建
const user = userRepository.create({
  username: 'alice',
  email: 'alice@example.com',
})
await userRepository.save(user)

// 查询
const user = await userRepository.findOne({
  where: { username: 'alice' },
})

const users = await userRepository.find({
  where: {
    email: Like('%@example.com'),
  },
})

// 更新
user.email = 'newemail@example.com'
await userRepository.save(user)

// 或使用 update
await userRepository.update({ id: 1 }, { email: 'newemail@example.com' })

// 删除
await userRepository.remove(user)
// 或使用 delete
await userRepository.delete({ id: 1 })
```

#### 关系映射

```typescript
// src/entities/Order.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './User'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ name: 'user_id' })
  userId!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number

  @Column({ type: 'varchar', length: 20 })
  status!: string

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user!: User
}
```

#### QueryBuilder 复杂查询

```typescript
// 使用 QueryBuilder
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.orders', 'order')
  .where('user.email IS NOT NULL')
  .andWhere('user.createdAt > :date', { date: new Date('2024-01-01') })
  .orderBy('user.createdAt', 'DESC')
  .getMany()

// 聚合查询
const { total, totalAmount } = await AppDataSource
  .getRepository(Order)
  .createQueryBuilder('order')
  .select('COUNT(order.id)', 'total')
  .addSelect('SUM(order.amount)', 'totalAmount')
  .where('order.userId = :userId', { userId: 1 })
  .getRawOne()

// 子查询
const activeUsers = await userRepository
  .createQueryBuilder('user')
  .where((qb) => {
    const subQuery = qb
      .subQuery()
      .select('order.userId')
      .from(Order, 'order')
      .where('order.status = :status', { status: 'active' })
      .getQuery()
    return 'user.id IN ' + subQuery
  })
  .getMany()
```

---

## 常见场景

### 场景1：社交媒体平台

```markdown
# 用户表 (users)
| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 用户ID |
| username | VARCHAR(50) | false | ✗ | 用户名 |
| bio | TEXT | true | ✗ | 个人简介 |

# 帖子表 (posts)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 帖子ID |
| author_id | BIGINT | false | ✗ | ✓ | 作者ID |
| content | TEXT | false | ✗ | ✗ | 内容 |

# 评论表 (comments)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 评论ID |
| post_id | BIGINT | false | ✗ | ✓ | 帖子ID |
| user_id | BIGINT | false | ✗ | ✓ | 用户ID |
| content | TEXT | false | ✗ | ✗ | 评论内容 |

# 点赞表 (likes)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| user_id | BIGINT | false | ✓ | ✓ | 用户ID |
| post_id | BIGINT | false | ✓ | ✓ | 帖子ID |
```

```bash
# 生成 Prisma schema
justdb schema2orm --input social.md --type prisma --output prisma/schema.prisma

# 生成后运行
npx prisma generate
npx prisma db push
```

### 场景2：任务管理应用

```markdown
# 项目表 (projects)
| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 项目ID |
| name | VARCHAR(100) | false | ✗ | 项目名 |
| status | VARCHAR(20) | false | ✗ | 状态 |

# 任务表 (tasks)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| id | BIGINT | false | ✓ | ✗ | 任务ID |
| project_id | BIGINT | false | ✗ | ✓ | 项目ID |
| title | VARCHAR(200) | false | ✗ | 标题 |
| priority | INT | false | ✗ | 优先级 |
| due_date | DATE | true | ✗ | 截止日期 |

# 标签表 (tags)
| Column | Type | Nullable | PK | Comment |
|--------|------|----------|-----|---------|
| id | BIGINT | false | ✓ | 标签ID |
| name | VARCHAR(50) | false | ✗ | 标签名 |

# 任务标签关联 (task_tags)
| Column | Type | Nullable | PK | FK | Comment |
|--------|------|----------|-----|-----|---------|
| task_id | BIGINT | false | ✓ | ✓ | 任务ID |
| tag_id | BIGINT | false | ✓ | ✓ | 标签ID |
```

```bash
# 生成 TypeORM entities
justdb schema2orm --input tasks.md --type typeorm --output src/entities/
```

---

## 最佳实践

### 1. Prisma 类型安全

```typescript
// 利用类型推断
const userById = (id: number) => {
  return prisma.user.findUnique({
    where: { id }, // 类型自动推断
  })
}

// 使用 Prisma.Generated 类型
type UserWithOrders = Prisma.UserGetPayload<{
  include: { orders: true }
}>

const getUserWithOrders: (id: number) => Promise<UserWithOrders> = (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: { orders: true },
  }) as Promise<UserWithOrders>
}
```

### 2. TypeORM 装饰器最佳实践

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity('users')
@Index(['email'], { unique: true }) // 复合索引
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index() // 单列索引
  username!: string

  @Column({ type: 'varchar', length: 100 })
  email!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
```

### 3. 连接池配置

```typescript
// Prisma
// schema.prisma 中配置连接池
// DATABASE_URL="mysql://user:pass@localhost:3306/db?connection_limit=10"

// TypeORM
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'mydb',
  extra: {
    connectionLimit: 10,
    maxIdle: 5,
  },
})
```

### 4. 错误处理

```typescript
// Prisma
import { Prisma } from '@prisma/client'

try {
  const user = await prisma.user.create({ data: { username: 'alice' } })
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      // 唯一约束冲突
      console.error('Username already exists')
    }
  }
}

// TypeORM
import { QueryFailedError } from 'typeorm'

try {
  await userRepository.save(user)
} catch (e) {
  if (e instanceof QueryFailedError) {
    // 处理数据库错误
    console.error('Database error:', e.message)
  }
}
```

### 5. 迁移管理

```bash
# Prisma
npx prisma migrate dev --name add_users_table
npx prisma migrate deploy
npx prisma migrate status
npx prisma migrate resolve --applied add_users_table

# TypeORM
npm run typeorm migration:generate -n CreateUserTable
npm run typeorm migration:run
npm run typeorm migration:revert
npm run typeorm migration:show
```

### 6. 使用事务

```typescript
// Prisma 交互式事务
const transferMoney = async (
  fromId: number,
  toId: number,
  amount: number
) => {
  return await prisma.$transaction(async (tx) => {
    // 扣除发送者余额
    const sender = await tx.user.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    })

    // 增加接收者余额
    const receiver = await tx.user.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    })

    return { sender, receiver }
  })
}

// TypeORM 事务
await AppDataSource.transaction(async (manager) => {
  const user = manager.create(User, { username: 'alice' })
  await manager.save(user)

  const order = manager.create(Order, { userId: user.id, amount: 100 })
  await manager.save(order)
})
```

---

## 参考资源

- [Prisma 文档](https://www.prisma.io/docs)
- [TypeORM 文档](https://typeorm.io/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)

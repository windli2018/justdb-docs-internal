---
title: TypeScript ORM Integration
icon: code
description: Generate Prisma and TypeORM models from JustDB schema
---

# TypeScript ORM Integration Guide

JustDB supports generating TypeScript ORM models for Prisma and TypeORM from Schema definitions.

## Table of Contents

1. [Background](#background)
2. [Quick Start](#quick-start)
3. [Generate from Existing Database](#generate-from-existing-database)
4. [Prisma Usage](#prisma-usage)
5. [TypeORM Usage](#typeorm-usage)
6. [Common Scenarios](#common-scenarios)
7. [Best Practices](#best-practices)

---

## Background

### TypeScript ORM Ecosystem

| Framework | Characteristics | Use Cases |
|-----------|----------------|-----------|
| **Prisma** | Type-safe, auto-generated, excellent DX | Full-stack TypeScript projects |
| **TypeORM** | Decorator pattern, similar to Hibernate | Traditional backends, complex queries |

---

## Quick Start

### Install JustDB

```bash
wget https://github.com/justdb/justdb/releases/latest/download/justdb-cli.zip
unzip justdb-cli.zip
export PATH=$PATH:$(pwd)/justdb-cli/bin
```

### Install TypeScript Dependencies

```bash
# Prisma
npm install prisma @prisma/client
npx prisma init

# TypeORM
npm install typeorm reflect-metadata
npm install pg        # PostgreSQL
npm install mysql     # MySQL
```

### Configure tsconfig.json

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
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  }
}
```

### Generate Models

```bash
# Prisma
justdb schema2orm \
  --input schema.xml \
  --type prisma \
  --output prisma/schema.prisma

# TypeORM
justdb schema2orm \
  --input schema.xml \
  --type typeorm \
  --output src/entities/
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
```

---

## Prisma Usage

### Generated Schema Example

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
  id        BigInt   @id @default(autoincrement())
  username  String   @db.VarChar(50)
  email     String?  @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")
  orders    Order[]

  @@map("users")
}

model Order {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt   @map("user_id")
  amount    Decimal  @db.Decimal(10, 2)
  user      User     @relation(fields: [userId], references: [id])

  @@map("orders")
}
```

### Basic Operations

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create
const user = await prisma.user.create({
  data: {
    username: 'alice',
    email: 'alice@example.com',
  },
})

// Query
const user = await prisma.user.findUnique({
  where: { username: 'alice' },
})

// Update
const user = await prisma.user.update({
  where: { id: 1 },
  data: { email: 'newemail@example.com' },
})

// Delete
await prisma.user.delete({
  where: { id: 1 },
})
```

---

## TypeORM Usage

### Generated Entities Example

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
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

### Basic Operations

```typescript
import { DataSource } from 'typeorm'
import { User } from './entities/User'

const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'mydb',
  entities: [User],
})

await AppDataSource.initialize()

const userRepository = AppDataSource.getRepository(User)

// Create
const user = userRepository.create({
  username: 'alice',
  email: 'alice@example.com',
})
await userRepository.save(user)

// Query
const user = await userRepository.findOne({
  where: { username: 'alice' },
})
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
```

```bash
# Generate Prisma schema
justdb schema2orm --input social.md --type prisma --output prisma/schema.prisma
```

---

## Best Practices

### 1. Prisma Type Safety

```typescript
type UserWithOrders = Prisma.UserGetPayload<{
  include: { orders: true }
}>

const getUserWithOrders: (id: number) => Promise<UserWithOrders> = (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: { orders: true },
  })
}
```

### 2. Error Handling

```typescript
import { Prisma } from '@prisma/client'

try {
  const user = await prisma.user.create({ data: { username: 'alice' } })
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      console.error('Username already exists')
    }
  }
}
```

### 3. Use Transactions

```typescript
const transferMoney = async (fromId: number, toId: number, amount: number) => {
  return await prisma.$transaction(async (tx) => {
    const sender = await tx.user.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    })

    const receiver = await tx.user.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    })

    return { sender, receiver }
  })
}
```

## Reference Links

- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

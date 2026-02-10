---
date: 2024-01-01
icon: download
title: Install JustDB
order: 2
category:
  - Quick Start
  - Installation
tag:
  - installation
  - configuration
  - environment
---

# Installation Guide

This document describes how to install and configure JustDB.

## Requirements

### Required Environment

| Environment | Version Requirement | Description |
|:---|:---|:---|
| **JDK** | 1.8+ | JDK 11 or higher recommended |
| **Maven** | 3.6+ | For building projects |

### Optional Environment

| Environment | Purpose |
|:---|:---|
| Git | Version control and code contribution |
| IDE | IntelliJ IDEA / Eclipse / VS Code |
| Database | MySQL / PostgreSQL / Oracle / H2, etc. (for testing) |

## Verify Environment

### Verify Java Installation

```bash
java -version
# java version "1.8.0_292"
# Java(TM) SE Runtime Environment (build 1.8.0_292-b08)
```

### Verify Maven Installation

```bash
mvn -v
# Apache Maven 3.6.3
# Java version: 1.8.0_292, vendor: Oracle Corporation
```

## Installation Methods

### Option 1: Maven Dependency (Recommended)

For Java projects integrating JustDB:

#### Core Module

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Spring Boot Starter

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### CLI Tool

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-cli</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### AI Integration

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-ai</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Excel Support

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-excel</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Option 2: Download Release

Download precompiled binaries from GitHub Releases page:

#### Linux / macOS

```bash
# Download
wget https://github.com/justdb/justdb/releases/download/v1.0.0/justdb-1.0.0-linux.tar.gz

# Extract
tar -xzf justdb-1.0.0-linux.tar.gz
cd justdb-1.0.0

# Configure environment variables
export PATH=$PATH:$PWD/bin

# Verify installation
justdb --version
```

#### Windows

```powershell
# Download and extract justdb-1.0.0-windows.zip

# Add bin directory to system PATH environment variable

# Verify installation
justdb --version
```

### Option 3: Build from Source

```bash
# Clone repository
git clone https://github.com/justdb/justdb.git
cd justdb

# Build all modules
mvn clean install

# Or skip tests for faster build
mvn clean install -DskipTests
```

Build artifacts are located in the `target/` directory of each module:

```
justdb-core/target/justdb-core-1.0.0.jar
justdb-cli/target/justdb-cli-1.0.0.jar
...
```

### Option 4: Using Docker

```bash
# Pull image
docker pull justdb/justdb:1.0.0

# Run container
docker run -v $(pwd)/schemas:/schemas justdb/justdb:1.0.0 migrate

# Using Docker Compose
version: '3'
services:
  justdb:
    image: justdb/justdb:1.0.0
    volumes:
      - ./schemas:/schemas
      - ./config:/config
    environment:
      - JUSTDB_DATABASE_URL=jdbc:mysql://db:3306/myapp
```

## Maven Repository Configuration

### Use Aliyun Mirror (Recommended for Chinese Users)

Configure in `~/.m2/settings.xml`:

```xml
<settings>
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>central</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
```

## IDE Configuration

### IntelliJ IDEA

1. **Import Project**
   - File → Open → Select `pom.xml`
   - Choose "Import as Maven Project"

2. **Configure JDK**
   - File → Project Structure → Project SDK
   - Select JDK 1.8+

3. **Enable Annotation Processing**
   - File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors
   - Enable "Enable annotation processing"

### Eclipse

1. **Import Project**
   - File → Import → Maven → Existing Maven Projects
   - Select project root directory

2. **Enable Annotation Processing**
   - Project Properties → Java Compiler → Annotation Processing
   - Enable "Enable project specific settings"

### VS Code

1. **Install Extensions**
   - Extension Pack for Java
   - Maven for Java

2. **Configure settings.json**
   ```json
   {
     "java.configuration.runtimes": [
       {
         "name": "JavaSE-1.8",
         "default": true
       }
     ]
   }
   ```

## Verify Installation

### Verify CLI Tool

```bash
justdb --version
# JustDB 1.0.0

justdb --help
# Display help information
```

### Verify Java API

Create test file `test.yaml`:

```yaml
id: test
namespace: com.test
Table:
  - id: test_table
    Column:
      - name: id
        type: INT
        primaryKey: true
```

Run test:

```bash
justdb migrate test.yaml --dry-run
```

## Configuration File

### CLI Configuration

JustDB CLI supports setting defaults through configuration file:

```yaml
# justdb-config.yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password

migrate:
  auto-diff: true
  safe-drop: false
  baseline-on-migrate: true

schema:
  locations:
    - ./justdb
    - ./db
  format: yaml
```

Using configuration file:

```bash
justdb migrate -c justdb-config.yaml
```

### Environment Variables

```bash
# Database configuration
export JUSTDB_DATABASE_URL="jdbc:mysql://localhost:3306/myapp"
export JUSTDB_DATABASE_USERNAME="root"
export JUSTDB_DATABASE_PASSWORD="password"

# Migration configuration
export JUSTDB_MIGRATION_AUTO_DIFF="true"
export JUSTDB_MIGRATION_SAFE_DROP="false"
```

## Database Drivers

JustDB will automatically download supported database drivers, or you can configure manually:

### MySQL

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.28</version>
</dependency>
```

### PostgreSQL

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.3.1</version>
</dependency>
```

### H2 (In-memory database, suitable for testing)

```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <version>2.1.210</version>
</dependency>
```

## Common Issues

### Dependency Download Failed

**Problem**: Maven cannot download dependencies

**Solution**:

1. Configure Aliyun mirror (see above)
2. Clean local repository cache:

```bash
rm -rf ~/.m2/repository/ai.justdb
mvn clean install
```

### Build Failure

**Problem**: Errors during compilation

**Solution**:

```bash
# Clean and rebuild
mvn clean compile

# Update dependencies
mvn clean install -U

# Build skipping tests
mvn clean install -DskipTests
```

### Java Version Incompatible

**Problem**: Build fails due to low Java version

**Solution**:

```bash
# Check Java version
java -version

# Set JAVA_HOME (Linux/macOS)
export JAVA_HOME=/path/to/jdk11

# Set JAVA_HOME (Windows)
set JAVA_HOME=C:\Program Files\Java\jdk-11
```

### CLI Command Not Found

**Problem**: Executing `justdb` command shows "not found"

**Solution**:

```bash
# Check PATH
echo $PATH  # Linux/macOS
echo %PATH% # Windows

# Confirm bin directory is in PATH
which justdb  # Linux/macOS
where justdb  # Windows

# If not in PATH, add to PATH
export PATH=$PATH:/path/to/justdb/bin
```

## Next Steps

After installation, continue learning:

<VPCard
  title="Quick Start"
  desc="Get started with JustDB in 5 minutes"
  link="/en/getting-started/quick-start.html"
/>

<VPCard
  title="First Schema"
  desc="Create your first Schema definition"
  link="/en/getting-started/first-schema.html"
/>

<VPCard
  title="Spring Boot Integration"
  desc="Use JustDB in Spring Boot"
  link="/en/getting-started/spring-boot-integration.html"
/>

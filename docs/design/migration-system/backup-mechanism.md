# Schema 备份机制设计文档

## 1. 概述

在 migrate 之前，将 schema 通过 provider 备份起来。备份路径体现 schema id 和当前文件 hash。provider 支持取历史的副本，按 id 和 hash。通过接口可以实现不同的 provider（如文件系统、数据库、S3等）。

**类似 AiProvider 的设计模式**：
- 通过 ServiceLoader 自动发现 provider
- 支持命令行和配置文件设置
- 配置优先级：命令行 > 环境变量 > 配置文件 > 内置默认值

## 2. 核心组件设计

### 2.1 SchemaBackupProvider 接口

**文件**: `ai.justdb/justdb/backup/SchemaBackupProvider.java`

```java
public interface SchemaBackupProvider {
    /**
     * Backup schema before migration
     *
     * @param schema     The schema to backup
     * @param schemaId   Schema identifier (from justdb.id)
     * @param fileHash   Hash of the schema file
     * @param config     Backup configuration
     * @return Backup result containing backup path and metadata
     */
    BackupResult backup(Justdb schema, String schemaId, String fileHash, BackupConfig config)
            throws BackupException;

    /**
     * Restore schema from backup
     *
     * @param schemaId   Schema identifier
     * @param fileHash   Hash of the schema file (null for latest)
     * @return Restored schema
     */
    Justdb restore(String schemaId, String fileHash) throws BackupException;

    /**
     * List all backups for a schema
     *
     * @param schemaId Schema identifier
     * @return List of backup metadata
     */
    List<BackupMetadata&gt;> listBackups(String schemaId) throws BackupException;

    /**
     * Get provider name
     */
    String getName();

    /**
     * Get provider type (filesystem, database, s3, etc.)
     */
    String getType();

    /**
     * Initialize the provider
     */
    void initialize();

    /**
     * Check if provider is available
     */
    boolean isAvailable();
}
```

### 2.2 BackupConfig 配置类

**文件**: `ai.justdb/justdb/cli/config/BackupConfig.java`

```java
@Data
public class BackupConfig extends UnknownValues {
    private String name;
    private String type;           // filesystem, database, s3, etc.
    private String location;       // Backup location (path, bucket, etc.)
    private Boolean enabled = true;
    private String format = "json"; // json, yaml, xml
    private Boolean compress = false;
    private Integer retentionDays = 30;  // Backup retention period
    private String description;
    // Encryption settings
    private String encryptionKey;  // Encryption key (from config or env var)
    private String encryptionAlgorithm = "AES/GCM/NoPadding";  // Encryption algorithm
    private Boolean encrypt = false;  // Enable encryption

    // Provider-specific options (via UnknownValues)
    // e.g., endpoint, region, credentials for S3
}
```

### 2.3 BackupResult 结果类

**文件**: `ai.justdb/justdb/backup/BackupResult.java`

```java
@Data
public class BackupResult {
    private String schemaId;
    private String fileHash;
    private String backupPath;
    private LocalDateTime backupTime;
    private Long sizeBytes;
    private String providerName;
}
```

### 2.4 BackupMetadata 元数据类

**文件**: `ai.justdb/justdb/backup/BackupMetadata.java`

```java
@Data
public class BackupMetadata {
    private String schemaId;
    private String fileHash;
    private String backupPath;
    private LocalDateTime backupTime;
    private Long sizeBytes;
    private String format;
    private Boolean encrypted;
}
```

### 2.5 BackupEncryptionService 加密服务

**文件**: `ai.justdb/justdb/backup/BackupEncryptionService.java`

```java
public interface BackupEncryptionService {
    /**
     * Encrypt backup content
     *
     * @param content   Original content (bytes)
     * @param encryptionKey  Encryption key
     * @return Encrypted content
     */
    byte[] encrypt(byte[] content, String encryptionKey) throws BackupException;

    /**
     * Decrypt backup content
     *
     * @param encryptedContent Encrypted content (bytes)
     * @param encryptionKey    Encryption key
     * @return Decrypted content
     */
    byte[] decrypt(byte[] encryptedContent, String encryptionKey) throws BackupException;

    /**
     * Get encryption algorithm
     */
    String getAlgorithm();

    /**
     * Check if encryption is enabled
     */
    boolean isEncryptionEnabled(String encryptionKey);
}
```

### 2.6 AesBackupEncryptionService 实现

**文件**: `ai.justdb/justdb/backup/crypto/AesBackupEncryptionService.java`

使用 AES/GCM/NoPadding 算法进行加密：
- 256位密钥（从用户提供的密钥派生）
- 12字节 IV（随机生成，存储在加密文件头部）
- 16字节认证标签（GCM模式自动生成）

**加密文件格式**:
```
[IV: 12 bytes][Encrypted Content][Auth Tag: 16 bytes]
```

### 2.7 BackupMetadata 元数据类（已更新）

### 2.8 FileSystemSchemaBackupProvider 实现

**文件**: `ai.justdb/justdb/backup/filesystem/FileSystemSchemaBackupProvider.java`

**备份路径结构**:
```
{location}/
├── {schemaId}/
│   ├── latest.json          -> Symbolic link or copy of latest (or .encrypted)
│   ├── {hash1}.json         -> Plain backup (or .encrypted if encryption enabled)
│   ├── {hash2}.json
│   └── metadata.json        -> Index of all backups
```

**加密备份文件命名**:
- 加密文件添加 `.encrypted` 后缀: `{hash}.json.encrypted`
- 加密的最新备份: `latest.json.encrypted`

### 2.9 SchemaBackupManager 管理器

**文件**: `ai.justdb/justdb/backup/SchemaBackupManager.java`

```java
public class SchemaBackupManager {
    private final List<BackupConfig&gt;> backupConfigs;
    private final List<SchemaBackupProvider&gt;> providers;

    /**
     * Backup schema using available providers
     */
    public BackupResult backup(Justdb schema, String fileHash);

    /**
     * Restore schema from backup
     */
    public Justdb restore(String schemaId, String fileHash);

    /**
     * Get first available provider
     */
    public SchemaBackupProvider getAvailableProvider();
}
```

## 3. 集成点设计

### 3.1 JustdbConfiguration 集成

**修改文件**: `ai.justdb/justdb/cli/JustdbConfiguration.java`

```java
// Add field
private List<BackupConfig&gt;> backupProviders = new ArrayList<>();

// Add to merge() method
if (other.backupProviders != null && !other.backupProviders.isEmpty()) {
    this.backupProviders = new ArrayList<>(other.backupProviders);
}

// Add method for parsing backup configs from command line
public void addBackupConfigsFromCommandLine(List&lt;String&gt; backupConfigs);
```

### 3.2 MigrateCommand 集成

**修改文件**: `ai.justdb/justdb/cli/commands/MigrateCommand.java`

在 `deploy()` 之前添加备份逻辑：

```java
// Before deployer.deploy()
if (backupEnabled) {
    SchemaBackupManager backupManager = createBackupManager();
    String schemaId = accumulatedJustdb.getId();
    if (schemaId == null) {
        schemaId = generateSchemaId(accumulatedJustdb);
    }

    String fileHash = calculateSchemaHash(accumulatedJustdb);

    BackupResult result = backupManager.backup(accumulatedJustdb, fileHash);
    System.out.println("Schema backed up to: " + result.getBackupPath());
}
```

**新增命令行选项**:
```java
@Option(names = {"--backup"}, description = "Enable schema backup before migration")
private boolean backupEnabled = false;

@Option(names = {"--backup-provider"}, description = "Backup provider name")
private String backupProvider;

@Option(names = {"--backup-location"}, description = "Backup location")
private String backupLocation;

@Option(names = {"--backup-encrypt"}, description = "Enable backup encryption")
private boolean backupEncrypt = false;

@Option(names = {"--backup-key"}, description = "Encryption key (or use JUSTDB_BACKUP_KEY env var)")
private String backupKey;
```

### 3.3 SchemaDeployer 集成 (可选)

**修改文件**: `ai.justdb/justdb/SchemaDeployer.java`

```java
private SchemaBackupManager backupManager;

public SchemaDeployer withBackupManager(SchemaBackupManager backupManager) {
    this.backupManager = backupManager;
    return this;
}

private void backupBeforeDeploy(Justdb schema) {
    if (backupManager != null) {
        // Backup logic
    }
}
```

## 4. ServiceLoader 配置

**文件**: `justdb-core/src/main/resources/META-INF/services/ai.justdb.justdb.backup.SchemaBackupProvider`

```
ai.justdb.justdb.backup.filesystem.FileSystemSchemaBackupProvider
```

## 5. 配置文件支持

### 5.1 justdb-cli.yaml 示例

```yaml
# Backup configuration
backupProviders:
  - name: default
    type: filesystem
    location: ~/.justdb/backups
    enabled: true
    format: json
    compress: false
    retentionDays: 30
    description: Default filesystem backup
    # Encryption settings
    encrypt: true
    encryptionKey: ${JUSTDB_BACKUP_KEY}  # From environment variable
    encryptionAlgorithm: AES/GCM/NoPadding

  - name: s3-backup
    type: s3
    location: justdb-backups
    enabled: false
    endpoint: https://s3.amazonaws.com
    region: us-east-1
    encrypt: true
    encryptionKey: ${JUSTDB_BACKUP_KEY}
```

## 6. 文件清单

### 6.1 新建文件

| 文件路径 | 说明 |
|----------|------|
| `justdb-core/src/main/java/ai.justdb/justdb/backup/SchemaBackupProvider.java` | Provider 接口 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/BackupResult.java` | 备份结果类 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/BackupMetadata.java` | 备份元数据类 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/BackupException.java` | 异常类 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/SchemaBackupManager.java` | 管理器 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/BackupEncryptionService.java` | 加密服务接口 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/crypto/AesBackupEncryptionService.java` | AES加密实现 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/crypto/EncryptionUtils.java` | 加密工具类 |
| `justdb-core/src/main/java/ai.justdb/justdb/backup/filesystem/FileSystemSchemaBackupProvider.java` | 文件系统实现 |
| `justdb-core/src/main/resources/META-INF/services/ai.justdb.justdb.backup.SchemaBackupProvider` | ServiceLoader 配置 |
| `justdb-core/src/main/java/ai.justdb/justdb/cli/config/BackupConfig.java` | 配置类 |

### 6.2 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `justdb-core/src/main/java/ai.justdb/justdb/cli/JustdbConfiguration.java` | 添加 backupProviders 字段和合并逻辑 |
| `justdb-core/src/main/java/ai.justdb/justdb/cli/commands/MigrateCommand.java` | 添加备份命令行选项和备份逻辑 |

## 7. 实现步骤

### Phase 1: 核心接口和类
1. 创建 `SchemaBackupProvider` 接口
2. 创建 `BackupConfig`、`BackupResult`、`BackupMetadata`、`BackupException` 类
3. 创建 `SchemaBackupManager` 管理器

### Phase 2: 加密服务实现
1. 创建 `BackupEncryptionService` 接口
2. 创建 `AesBackupEncryptionService` 实现类
3. 创建 `EncryptionUtils` 工具类
4. 实现密钥派生功能（PBKDF2）

### Phase 3: 文件系统 Provider 实现
1. 创建 `FileSystemSchemaBackupProvider`
2. 实现备份路径结构
3. 实现 metadata 索引
4. 集成加密服务（可选加密）

### Phase 4: 配置集成
1. 修改 `JustdbConfiguration` 添加 `backupProviders`
2. 添加命令行解析逻辑（包括加密选项）
3. 添加环境变量支持 (`JUSTDB_BACKUP_KEY`)

### Phase 5: MigrateCommand 集成
1. 添加命令行选项 (`--backup`, `--backup-provider`, `--backup-location`, `--backup-encrypt`, `--backup-key`)
2. 在 deploy 之前调用备份
3. 添加日志输出

### Phase 6: 测试
1. 单元测试：`AesBackupEncryptionServiceTest`
2. 单元测试：`FileSystemSchemaBackupProviderTest`
3. 集成测试：`MigrateCommandBackupTest`
4. 端到端测试：加密备份和恢复

## 8. 验证计划

### 8.1 单元测试
- 测试 hash 计算
- 测试加密/解密功能
- 测试备份文件创建（加密和非加密）
- 测试恢复功能
- 测试 metadata 索引

### 8.2 集成测试
- 测试 migrate 命令的备份集成
- 测试配置文件加载
- 测试命令行参数
- 测试环境变量 `JUSTDB_BACKUP_KEY`

### 8.3 端到端测试
```bash
# 设置加密密钥环境变量
export JUSTDB_BACKUP_KEY="my-secret-key-12345"

# 启用备份和加密的 migrate
justdb migrate up --backup --backup-encrypt schema.xml

# 验证加密备份文件创建
ls ~/.justdb/backups/{schemaId}/
# 输出: latest.json.encrypted, {hash}.json.encrypted, metadata.json

# 验证配置文件
cat justdb-cli.yaml

# 测试恢复（使用密钥解密）
justdb backup restore --schema-id {schemaId} --hash {hash} --backup-key $JUSTDB_BACKUP_KEY
```

## 9. 后续扩展

### 9.1 其他 Provider 实现
- `DatabaseSchemaBackupProvider` - 存储到数据库
- `S3SchemaBackupProvider` - 存储到 S3
- `AzureBlobSchemaBackupProvider` - 存储 Azure Blob

### 9.2 高级功能
- 备份压缩
- 增量备份
- 自动清理过期备份
- 更多加密算法支持（ChaCha20-Poly1305等）

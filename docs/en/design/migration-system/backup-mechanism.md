# Schema Backup Mechanism Design

## 1. Overview

Before migrating, backup the schema through a provider. Backup path reflects schema ID and current file hash. Provider supports retrieving historical copies by ID and hash. Through interfaces, different providers can be implemented (filesystem, database, S3, etc.).

**Similar to AiProvider Design Pattern**:
- Auto-discover providers via ServiceLoader
- Support command line and configuration file settings
- Configuration priority: command line > environment variables > config file > built-in defaults

## 2. Core Component Design

### 2.1 SchemaBackupProvider Interface

```java
public interface SchemaBackupProvider {
    /**
     * Backup schema before migration
     */
    BackupResult backup(Justdb schema, String schemaId, String fileHash, BackupConfig config)
            throws BackupException;

    /**
     * Restore schema from backup
     */
    Justdb restore(String schemaId, String fileHash) throws BackupException;

    /**
     * List all backups for a schema
     */
    List<BackupMetadata> listBackups(String schemaId) throws BackupException;

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

### 2.2 BackupConfig Configuration Class

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
    private String encryptionKey;
    private String encryptionAlgorithm = "AES/GCM/NoPadding";
    private Boolean encrypt = false;
}
```

### 2.3 BackupResult Result Class

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

## 3. Integration Point Design

### 3.1 MigrateCommand Integration

Add command line options:

```java
@Option(names = {"--backup"}, description = "Enable schema backup before migration")
private boolean backupEnabled = false;

@Option(names = {"--backup-provider"}, description = "Backup provider name")
private String backupProvider;

@Option(names = {"--backup-location"}, description = "Backup location")
private String backupLocation;

@Option(names = {"--backup-encrypt"}, description = "Enable backup encryption")
private boolean backupEncrypt = false;

@Option(names = {"--backup-key"}, description = "Encryption key")
private String backupKey;
```

## 4. Configuration File Support

### 4.1 justdb-cli.yaml Example

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
    encryptionKey: ${JUSTDB_BACKUP_KEY}
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

## 5. Backup Path Structure

```
{location}/
├── {schemaId}/
│   ├── latest.json          -> Symlink or copy of latest
│   ├── {hash1}.json         -> Plain backup
│   ├── {hash2}.json
│   └── metadata.json        -> Index of all backups
```

**Encrypted backup file naming**:
- Encrypted files add `.encrypted` suffix: `{hash}.json.encrypted`
- Encrypted latest backup: `latest.json.encrypted`

## 6. ServiceLoader Configuration

**File**: `justdb-core/src/main/resources/META-INF/services/ai.justdb.justdb.backup.SchemaBackupProvider`

```
ai.justdb.justdb.backup.filesystem.FileSystemSchemaBackupProvider
```

## 7. File List

### 7.1 New Files

| File Path | Description |
|-----------|-------------|
| `SchemaBackupProvider.java` | Provider interface |
| `BackupResult.java` | Backup result class |
| `BackupMetadata.java` | Backup metadata class |
| `BackupException.java` | Exception class |
| `SchemaBackupManager.java` | Manager |
| `BackupEncryptionService.java` | Encryption service interface |
| `AesBackupEncryptionService.java` | AES encryption implementation |
| `FileSystemSchemaBackupProvider.java` | Filesystem implementation |

### 7.2 Modified Files

| File Path | Modifications |
|-----------|---------------|
| `JustdbConfiguration.java` | Add backupProviders field |
| `MigrateCommand.java` | Add backup command line options and logic |

## 8. Verification Plan

### 8.1 Unit Tests
- Test hash calculation
- Test encryption/decryption functionality
- Test backup file creation (encrypted and plain)
- Test restore functionality
- Test metadata index

### 8.2 Integration Tests
- Test migrate command backup integration
- Test configuration file loading
- Test command line parameters
- Test environment variable `JUSTDB_BACKUP_KEY`

### 8.3 End-to-End Test

```bash
# Set encryption key environment variable
export JUSTDB_BACKUP_KEY="my-secret-key-12345"

# Migrate with backup and encryption enabled
justdb migrate up --backup --backup-encrypt schema.xml

# Verify encrypted backup file creation
ls ~/.justdb/backups/{schemaId}/
# Output: latest.json.encrypted, {hash}.json.encrypted, metadata.json

# Test restore (decrypt with key)
justdb backup restore --schema-id {schemaId} --hash {hash} --backup-key $JUSTDB_BACKUP_KEY
```

## 9. Future Extensions

### 9.1 Other Provider Implementations
- `DatabaseSchemaBackupProvider` - Store to database
- `S3SchemaBackupProvider` - Store to S3
- `AzureBlobSchemaBackupProvider` - Store to Azure Blob

### 9.2 Advanced Features
- Backup compression
- Incremental backup
- Auto cleanup of expired backups
- More encryption algorithms (ChaCha20-Poly1305, etc.)

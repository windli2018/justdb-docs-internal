---
title: Interactive Mode
icon: terminal
description: JustDB CLI interactive shell usage guide
order: 3
---

# Interactive Mode

JustDB interactive mode provides a powerful shell with command completion, history, and AI assistant integration.

## Starting Interactive Mode

```bash
# Basic start
justdb interactive

# Using aliases
justdb i
justdb int

# Specify default AI provider
justdb interactive --provider openai

# Specify default format
justdb interactive --format yaml

# Show version information
justdb --version
```

## Batch Mode

```bash
# Read commands from file
justdb interactive --batch commands.txt

# Specify working directory
justdb interactive --batch commands.txt --current-dir /path/to/project

# Exit strategy
justdb interactive --batch commands.txt --exit-on-error=false

# Echo commands
justdb interactive --batch commands.txt --echo
```

Batch options:
- `--batch, -b <file>` - Read commands from file and execute
- `--current-dir, -C <dir>` - Set working directory
- `--exit-on-error, -e` - Exit on first error (default: true)
- `--echo, -x` - Echo command before execution (default: false)

## Built-in Commands

### Schema Operations

```bash
# Load Schema
load schema.xml
load schema.yaml

# Save Schema
save schema.yaml
save --format json

# Show Schema
show schema
show tables
show columns FROM users
show indexes FROM orders
show constraints FROM products

# Validate Schema
validate
validate --verbose

# Format Schema
format
format --sort-keys
```

### Schema Editing

```bash
# Add table
ADD TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100)
);

# Add column
ADD COLUMN username TO users VARCHAR(50) NOT NULL;

# Drop table
DROP TABLE temp_users;

# Drop column
DROP COLUMN old_field FROM users;

# Modify column
MODIFY COLUMN username VARCHAR(100);
```

### SQL Operations

```bash
# Enter SQL mode
sql

# Execute SQL queries
SELECT * FROM users;
SHOW TABLES;
DESC users;

# Return to main mode
back
exit
```

### AI Assistant

```bash
# Send message to AI
ai create a user table
ai "add index to user table"

# Switch AI provider
provider openai
provider local

# View AI history
ai-history
ai-history show abc123

# Clear AI history
ai-history clear
```

### File Operations

```bash
# Change working directory
cd /path/to/project
cd ..

# List files
ls
ls -la

# View file contents
cat schema.yaml

# Edit file
edit schema.yaml

# Watch file
watch schema.yaml
```

### System Commands

```bash
# Show current status
status

# Show help
help
help <command>

# Clear screen
clear

# Exit
exit
quit
q
```

## Command Completion

Interactive mode supports intelligent command completion:

### Command Completion
```bash
# TAB completion for commands
lo<TAB>          # load
sh<TAB>          # show
ai<TAB>          # ai
```

### Filename Completion
```bash
# TAB completion for file paths
load sch<TAB>    # load schema.yaml
cd /path/to/p<TAB>  # cd /path/to/project/
```

### Table Name Completion
```bash
# TAB completion for table names
show columns FROM use<TAB>  # users
show ta<TAB>                # tables
```

## History

### View History
```bash
# Use up/down arrows to browse history
↑ / ↓

# Search history
Ctrl+R

# Show history commands
history
```

### History Expansion
```bash
# Execute previous command
!!

# Execute nth command
!n

# Search and execute
!?pattern?
```

## Keyboard Shortcuts

### Editing Shortcuts
| Shortcut | Function |
|----------|----------|
| `Ctrl+A` | Move to beginning of line |
| `Ctrl+E` | Move to end of line |
| `Ctrl+U` | Delete to beginning of line |
| `Ctrl+K` | Delete to end of line |
| `Ctrl+W` | Delete previous word |
| `Ctrl+L` | Clear screen |
| `Ctrl+C` | Interrupt current command |
| `Ctrl+D` | Exit |

### History Shortcuts
| Shortcut | Function |
|----------|----------|
| `↑` / `↓` | Browse history |
| `Ctrl+R` | Search history |
| `!!` | Previous command |

## Status Bar

Interactive mode displays status information at the bottom:

```
[justdb] [yaml] [local] [3 tables] [~/project/schema.yaml]
```

Status bar contains:
- **Mode** - Current mode (e.g., `[justdb]`, `[sql]`)
- **Format** - Current output format (e.g., `[yaml]`, `[json]`)
- **AI Provider** - Current AI provider (e.g., `[local]`, `[openai]`)
- **Schema Info** - Table count, etc.
- **Current File** - Loaded Schema file path

## Configuration Options

Interactive mode can be customized through configuration file:

```yaml
# ~/.justdb-cli.yaml
interactive:
  # Default AI provider
  provider: local

  # Default output format
  format: yaml

  # History size
  historySize: 1000

  # Enable syntax highlighting
  syntaxHighlight: true

  # Enable auto-completion
  autoCompletion: true

  # Prompt
  prompt: "justdb> "

  # Commands to execute on startup
  startupCommands:
    - "status"
    - "show schema"
```

## Pipes and Redirection

### Output Redirection
```bash
# Save to file
show schema > output.yaml

# Append to file
show tables >> list.txt
```

### Input Redirection
```bash
# Read from file
load < schema.yaml
```

### Pipes
```bash
# Pipe to other commands
show schema | grep "table"
```

## Environment Variables

Interactive mode supports the following environment variables:

```bash
# Set default AI provider
export JUSTDB_AI_PROVIDER=openai

# Set default format
export JUSTDB_FORMAT=yaml

# Set log level
export JUSTDB_LOG_LEVEL=debug

# Set configuration file
export JUSTDB_CONFIG=~/.justdb-cli.yaml
```

## Best Practices

1. **Use Aliases** - Create aliases for frequently used commands
2. **Leverage History** - Use history to quickly repeat commands
3. **Tab Completion** - Use Tab to reduce typing
4. **Batch Scripts** - Save repetitive operations as batch files
5. **Status Check** - Use `status` command to confirm current state

## Troubleshooting

### Unable to Start
```bash
# Check configuration file
justdb config validate

# View detailed logs
justdb -vv interactive
```

### AI Assistant Unresponsive
```bash
# Check AI provider
provider

# Switch to local model
provider local

# Check network connection
ping api.openai.com
```

### Schema Load Failed
```bash
# Validate Schema file
validate schema.yaml

# Check file path
ls -la schema.yaml

# View detailed error
load --verbose schema.yaml
```

## Related Documentation

- [Command Reference](./commands.md) - Complete command list
- [Configuration File](./configuration.md) - Configuration file details
- [AI Integration](../ai/README.md) - AI functionality

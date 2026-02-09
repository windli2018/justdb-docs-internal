#!/bin/bash

# Find duplicate frontmatter script
# Usage: ./find-duplicates.sh [path/to/docs]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="${1:-$SCRIPT_DIR/../docs}"

if [ ! -d "$DOCS_DIR" ]; then
    echo "Error: Directory not found: $DOCS_DIR"
    exit 1
fi

echo "🔍 Running duplicate frontmatter detection..."
echo "Documentation directory: $DOCS_DIR"
echo

# Try to use the simple version first (no dependencies)
if command -v node &> /dev/null; then
    echo "Using simple version (no dependencies required):"
    node "$SCRIPT_DIR/find-duplicate-frontmatter-simple.js" "$DOCS_DIR"
else
    echo "Error: Node.js not found. Please install Node.js to run this script."
    exit 1
fi
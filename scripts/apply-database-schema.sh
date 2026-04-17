#!/bin/bash
# =============================================================================
# Apply Database Schema to Supabase
# =============================================================================
# This script applies the complete database schema from
# specs/001-ledger-notebook-app/contracts/database-schema.sql to Supabase.
#
# Usage:
#   SUPABASE_PASSWORD=<password> ./scripts/apply-database-schema.sh
#
# Environment Variables:
#   SUPABASE_PASSWORD - The PostgreSQL password for the Supabase database
#   SUPABASE_URL      - (Optional) Supabase project URL
#                       Default: fqnnpjnblesdubpjsbof.supabase.co
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_HOST="${SUPABASE_URL:-fqnnpjnblesdubpjsbof.supabase.co}"
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
SCHEMA_FILE="specs/001-ledger-notebook-app/contracts/database-schema.sql"

# Check for required environment variable
if [ -z "$SUPABASE_PASSWORD" ]; then
    echo -e "${RED}Error: SUPABASE_PASSWORD environment variable is not set${NC}"
    echo "Usage: SUPABASE_PASSWORD=<password> $0"
    exit 1
fi

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Error: Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

# Construct connection string
PGPASSWORD="$SUPABASE_PASSWORD"
export PGPASSWORD

echo -e "${YELLOW}Applying database schema to Supabase...${NC}"
echo "Host: $SUPABASE_HOST"
echo "Database: $SUPABASE_DB"
echo "Schema File: $SCHEMA_FILE"
echo ""

# Apply the schema
if psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -f "$SCHEMA_FILE"; then
    echo ""
    echo -e "${GREEN}✓ Database schema applied successfully!${NC}"
    echo ""
    echo "The following tables have been created:"
    echo "  - notebooks (with RLS policies)"
    echo "  - pages (with RLS policies, indexes, triggers)"
    echo "  - tasks (with RLS policies, indexes, triggers)"
    echo "  - reminders (with RLS policies, indexes)"
    echo "  - labels (with RLS policies)"
    echo "  - page_labels (with RLS policies)"
    echo "  - photos (with RLS policies)"
    echo "  - drawings (with RLS policies, triggers)"
    echo ""
    echo "Functions created:"
    echo "  - extract_tiptap_text()"
    echo "  - set_updated_at()"
    echo "  - create_notebook_for_user()"
    echo "  - search_pages()"
    echo "  - get_due_reminders()"
    echo ""
    echo "Triggers created:"
    echo "  - on_auth_user_created (auto-create notebook on signup)"
    echo "  - pages_set_updated_at, pages_search_vector_trigger"
    echo "  - tasks_set_updated_at"
    echo "  - drawings_set_updated_at"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Failed to apply database schema${NC}"
    echo "Please check the error messages above for details."
    exit 1
fi

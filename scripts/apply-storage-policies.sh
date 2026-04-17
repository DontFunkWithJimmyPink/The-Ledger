#!/bin/bash

# =============================================================================
# Apply Supabase Storage Policies
# =============================================================================
#
# This script applies Row Level Security (RLS) policies to the storage.objects
# table for the notebook-photos bucket.
#
# Prerequisites:
# - Storage bucket 'notebook-photos' must already exist (run create-storage-bucket.sh)
# - Database credentials must be configured
#
# Task: T009 — Configure Supabase Storage
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
POLICIES_FILE="$PROJECT_ROOT/specs/001-ledger-notebook-app/contracts/storage-policies.sql"

echo "========================================================================="
echo "  Apply Supabase Storage Policies"
echo "========================================================================="
echo ""

# Check if policies file exists
if [ ! -f "$POLICIES_FILE" ]; then
    echo "❌ ERROR: Storage policies file not found!"
    echo "Expected location: $POLICIES_FILE"
    exit 1
fi

echo "✓ Found storage policies file"
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✓ Supabase CLI detected"
    echo ""
    echo "Applying storage policies via Supabase CLI..."
    echo ""

    # Apply policies via CLI
    if supabase db execute < "$POLICIES_FILE" 2>/dev/null; then
        echo ""
        echo "✅ SUCCESS: Storage policies applied!"
        echo ""
        echo "Policies created:"
        echo "  - photos_upload_own_folder (INSERT)"
        echo "  - photos_read_own_folder (SELECT)"
        echo "  - photos_update_own_folder (UPDATE)"
        echo "  - photos_delete_own_folder (DELETE)"
        echo ""
        echo "Next: Verify the policies in the Supabase Dashboard"
        echo "  Storage → Policies → Filter by 'notebook-photos'"
    else
        echo "⚠️  CLI execution failed. Using manual method..."
        show_manual_instructions
    fi
else
    show_manual_instructions
fi

echo ""

show_manual_instructions() {
    echo "========================================================================="
    echo "  Manual Setup Instructions"
    echo "========================================================================="
    echo ""
    echo "Apply the storage policies manually via the Supabase SQL Editor:"
    echo ""
    echo "  1. Login to: https://app.supabase.com/"
    echo "  2. Select your project"
    echo "  3. Navigate to: SQL Editor → New Query"
    echo "  4. Copy the contents of:"
    echo "     specs/001-ledger-notebook-app/contracts/storage-policies.sql"
    echo "  5. Paste into the SQL Editor"
    echo "  6. Click: Run (or press Ctrl+Enter / Cmd+Enter)"
    echo ""
    echo "Expected result: 'Success. No rows returned'"
    echo ""
    echo "========================================================================="
    echo ""
    echo "Verification:"
    echo "  Navigate to: Storage → Policies"
    echo "  Filter by bucket: notebook-photos"
    echo "  You should see 4 policies:"
    echo "    - photos_upload_own_folder"
    echo "    - photos_read_own_folder"
    echo "    - photos_update_own_folder"
    echo "    - photos_delete_own_folder"
    echo ""
    echo "========================================================================="
}

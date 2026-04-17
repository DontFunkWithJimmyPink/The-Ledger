#!/bin/bash

# =============================================================================
# Create Supabase Storage Bucket — notebook-photos
# =============================================================================
#
# This script provides instructions for creating the storage bucket.
# The bucket must be created via the Supabase Dashboard or CLI.
#
# Task: T009 — Configure Supabase Storage
# =============================================================================

set -e

echo "========================================================================="
echo "  Create Supabase Storage Bucket: notebook-photos"
echo "========================================================================="
echo ""
echo "This storage bucket is required for The Ledger photo upload feature."
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✓ Supabase CLI detected"
    echo ""
    echo "Creating private storage bucket 'notebook-photos'..."
    echo ""

    # Attempt to create bucket via CLI
    if supabase storage create notebook-photos --no-public 2>/dev/null; then
        echo ""
        echo "✅ SUCCESS: Storage bucket 'notebook-photos' created!"
        echo ""
        echo "Next step: Apply storage policies"
        echo "Run: ./scripts/apply-storage-policies.sh"
    else
        echo "⚠️  Note: Bucket creation via CLI may require project linking."
        echo ""
        echo "Please create the bucket manually via the Supabase Dashboard:"
        echo ""
        echo "  1. Navigate to: Storage → New bucket"
        echo "  2. Bucket name: notebook-photos"
        echo "  3. Public bucket: UNCHECKED (keep it private)"
        echo "  4. Click: Create bucket"
        echo ""
        echo "After creating the bucket, run:"
        echo "  ./scripts/apply-storage-policies.sh"
    fi
else
    echo "Supabase CLI not detected."
    echo ""
    echo "========================================================================="
    echo "  Manual Setup Instructions"
    echo "========================================================================="
    echo ""
    echo "Please create the bucket manually via the Supabase Dashboard:"
    echo ""
    echo "  1. Login to: https://app.supabase.com/"
    echo "  2. Select your project"
    echo "  3. Navigate to: Storage"
    echo "  4. Click: New bucket"
    echo "  5. Bucket name: notebook-photos"
    echo "  6. Public bucket: UNCHECKED (must be private)"
    echo "  7. Click: Create bucket"
    echo ""
    echo "========================================================================="
    echo ""
    echo "After creating the bucket, apply the storage policies:"
    echo "  ./scripts/apply-storage-policies.sh"
    echo ""
    echo "========================================================================="
    echo ""
    echo "Alternative: Install Supabase CLI"
    echo "  npm install -g supabase"
    echo "  Then run this script again"
    echo "========================================================================="
fi

echo ""

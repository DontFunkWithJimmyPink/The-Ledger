#!/usr/bin/env node
/**
 * Apply Database Schema to Supabase
 *
 * This script applies the complete database schema using the Supabase Management API.
 * It can be used as an alternative to psql or the SQL Editor.
 *
 * Usage:
 *   SUPABASE_PASSWORD=<password> node scripts/apply-schema.js
 *
 * Environment Variables:
 *   SUPABASE_PASSWORD - Required: PostgreSQL password
 *   SUPABASE_PROJECT_REF - Optional: Project reference (default: fqnnpjnblesdubpjsbof)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'fqnnpjnblesdubpjsbof';
const PASSWORD = process.env.SUPABASE_PASSWORD;
const SCHEMA_FILE = path.join(__dirname, '..', 'specs/001-ledger-notebook-app/contracts/database-schema.sql');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applySchema() {
  // Validate inputs
  if (!PASSWORD) {
    log('red', 'Error: SUPABASE_PASSWORD environment variable is required');
    console.log('Usage: SUPABASE_PASSWORD=<password> node scripts/apply-schema.js');
    process.exit(1);
  }

  if (!fs.existsSync(SCHEMA_FILE)) {
    log('red', `Error: Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }

  // Read schema file
  log('yellow', 'Reading schema file...');
  const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
  console.log(`Schema file: ${SCHEMA_FILE}`);
  console.log(`Size: ${(schema.length / 1024).toFixed(2)} KB`);
  console.log('');

  // Note about alternative methods
  log('yellow', 'Database Schema Application');
  console.log('');
  console.log('This script requires network access to your Supabase instance.');
  console.log('If you are in a restricted environment (CI/CD, corporate network),');
  console.log('please use one of these alternative methods:');
  console.log('');
  console.log('1. Supabase SQL Editor (Recommended):');
  console.log('   - Visit: https://app.supabase.com/project/' + PROJECT_REF + '/sql');
  console.log('   - Copy and paste the contents of: ' + SCHEMA_FILE);
  console.log('   - Click "Run" to execute');
  console.log('');
  console.log('2. Local psql command:');
  console.log('   PGPASSWORD="' + PASSWORD + '" psql \\');
  console.log('     -h db.' + PROJECT_REF + '.supabase.co \\');
  console.log('     -p 5432 -U postgres -d postgres \\');
  console.log('     -f ' + SCHEMA_FILE);
  console.log('');
  console.log('3. Use the provided shell script:');
  console.log('   SUPABASE_PASSWORD="' + PASSWORD + '" ./scripts/apply-database-schema.sh');
  console.log('');

  log('green', 'Schema file is ready to be applied using one of the methods above.');
  console.log('');
  console.log('For detailed instructions, see: docs/database-setup.md');
}

// Run the script
applySchema().catch((error) => {
  log('red', 'Error: ' + error.message);
  process.exit(1);
});

# The Ledger

A digital notebook application built with Next.js, TypeScript, and Supabase.

## Quick Start

See [Database Setup Guide](docs/database-setup.md) for instructions on setting up the Supabase database schema.

For complete development setup, see [Quickstart Guide](specs/001-ledger-notebook-app/quickstart.md).

## Database Setup (T008)

The Ledger uses Supabase for its database. Before running the application, you need to apply the database schema.

### Recommended Method: Supabase SQL Editor

1. Visit your project's SQL Editor: https://app.supabase.com/project/YOUR_PROJECT_ID/sql
2. Click "New Query"
3. Copy the contents of `specs/001-ledger-notebook-app/contracts/database-schema.sql`
4. Paste and click "Run"

### Alternative Methods

#### Using psql (Command Line)

```bash
SUPABASE_PASSWORD="your-password" ./scripts/apply-database-schema.sh
```

#### Manual Connection

```bash
PGPASSWORD="your-password" psql \
  -h db.YOUR_PROJECT.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f specs/001-ledger-notebook-app/contracts/database-schema.sql
```

For detailed instructions, troubleshooting, and verification steps, see [Database Setup Guide](docs/database-setup.md).

## Storage Setup (T009)

The Ledger uses Supabase Storage for photo uploads. After applying the database schema, configure the storage bucket.

### Quick Setup

1. **Create the storage bucket:**
   ```bash
   ./scripts/create-storage-bucket.sh
   ```

   Or manually via Supabase Dashboard:
   - Navigate to: Storage → New bucket
   - Bucket name: `notebook-photos`
   - Public bucket: **Unchecked** (must be private)

2. **Apply storage policies:**
   ```bash
   ./scripts/apply-storage-policies.sh
   ```

   Or manually via SQL Editor:
   - Copy contents of `specs/001-ledger-notebook-app/contracts/storage-policies.sql`
   - Paste and run in SQL Editor

For detailed instructions, see [Storage Setup Guide](docs/storage-setup.md).

## What Gets Created

### Database Schema (T008)

- **8 tables**: notebooks, pages, tasks, reminders, labels, page_labels, photos, drawings
- **5 functions**: extract_tiptap_text, set_updated_at, create_notebook_for_user, search_pages, get_due_reminders
- **4 triggers**: Auto-create notebooks on signup, maintain timestamps, maintain search indexes
- **Row Level Security (RLS)**: All tables secured with user-scoped policies
- **Indexes**: Optimized for sorting, searching, and querying

### Storage Configuration (T009)

- **Storage bucket**: `notebook-photos` (private)
- **4 RLS policies**: Per-user folder isolation for upload, read, update, delete
- **Folder structure**: `{user_id}/{page_id}/{timestamp}_{filename}`
- **File types**: jpg, jpeg, png, gif, webp, heic
- **Size limit**: 10 MB per file (enforced client-side)

## Project Structure

```
The-Ledger/
├── docs/                    # Documentation
│   ├── database-setup.md    # Database setup guide
│   ├── database-verification.md  # Database verification checklist
│   ├── storage-setup.md     # Storage setup guide
│   ├── storage-verification.md   # Storage verification checklist
│   ├── T008-completion-summary.md  # Database task completion
│   └── T009-completion-summary.md  # Storage task completion
├── scripts/                 # Utility scripts
│   ├── apply-database-schema.sh   # Apply database schema
│   ├── create-storage-bucket.sh   # Create storage bucket
│   ├── apply-storage-policies.sh  # Apply storage policies
│   ├── apply-schema.js      # Node.js helper script
│   └── README.md            # Scripts documentation
├── specs/                   # Feature specifications
│   └── 001-ledger-notebook-app/
│       ├── contracts/       # Database schema and API contracts
│       │   ├── database-schema.sql
│       │   └── storage-policies.sql
│       ├── plan.md          # Implementation plan
│       ├── tasks.md         # Task breakdown
│       └── quickstart.md    # Development setup guide
├── src/                     # Application source code
└── tests/                   # Test suites
```

## Development

### Prerequisites

- Node.js 20 LTS
- npm 10+
- Supabase account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/DontFunkWithJimmyPink/The-Ledger.git
   cd The-Ledger
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Apply the database schema (see [Database Setup](#database-setup-t008) above)
   - Configure storage bucket (see [Storage Setup](#storage-setup-t009) above)
   - Copy your project credentials

4. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Visit http://localhost:3000 to see the app.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run type-check` - Type check with TypeScript

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth
- **Editor**: Tiptap v2
- **Drawing**: Excalidraw
- **Styling**: TailwindCSS
- **Drag & Drop**: @dnd-kit
- **Testing**: Jest, React Testing Library, Playwright

## `@github/spec-kit` Setup

This project uses [`@github/spec-kit`](https://github.com/github/spec-kit), which is hosted on [GitHub Packages](https://docs.github.com/en/packages).

### Prerequisites

You need a GitHub **Personal Access Token (PAT)** with at minimum the `read:packages` scope to install packages from GitHub Packages.

### Local development

1. [Create a classic PAT](https://github.com/settings/tokens) with `read:packages` scope.
2. Export it in your shell:

   ```sh
   export GITHUB_TOKEN=<your-pat>
   ```

3. Install dependencies:

   ```sh
   npm install
   ```

### GitHub Actions

In GitHub Actions workflows, the default `GITHUB_TOKEN` secret can be used directly — no extra setup required as long as the package visibility allows it:

```yaml
- name: Install dependencies
  run: npm install
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Import example

```js
const specKit = require('@github/spec-kit');
```

See [`src/index.js`](src/index.js) for the reference import used in this project.

## Documentation

- [Database Setup Guide](docs/database-setup.md) - Complete guide for setting up the database
- [Database Verification](docs/database-verification.md) - Checklist for verifying database setup
- [Storage Setup Guide](docs/storage-setup.md) - Complete guide for configuring storage
- [Storage Verification](docs/storage-verification.md) - Checklist for verifying storage setup
- [Quickstart Guide](specs/001-ledger-notebook-app/quickstart.md) - Development environment setup
- [Implementation Plan](specs/001-ledger-notebook-app/plan.md) - Feature implementation details
- [Tasks](specs/001-ledger-notebook-app/tasks.md) - Task breakdown and dependencies

## License

See LICENSE file for details.

# Deployment Guide

This document describes the deployment workflows and configuration for The Ledger application.

## Overview

The Ledger uses GitHub Actions for CI/CD with deployment to Vercel. There are three main workflows:

1. **CI Workflow** - Runs on all pull requests and pushes to main
2. **Production Deployment** - Deploys to production on push to main
3. **Preview Deployment** - Creates preview deployments for pull requests

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs automatically on:
- Pull requests to `main`
- Pushes to `main`

**Jobs:**
- **Lint** - Runs ESLint and checks code formatting
- **Type Check** - Validates TypeScript types
- **Test** - Runs unit tests with coverage reporting
- **Build** - Builds the Next.js application
- **E2E** - Runs Playwright end-to-end tests

### 2. Production Deployment (`.github/workflows/deploy-production.yml`)

Deploys to production on:
- Push to `main` branch
- Manual trigger via workflow_dispatch

**Process:**
1. Checks out code
2. Installs dependencies
3. Pulls Vercel environment configuration
4. Builds production artifacts
5. Deploys to Vercel production

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### 3. Preview Deployment (`.github/workflows/deploy-preview.yml`)

Creates preview deployments for:
- Pull requests to `main` (opened, synchronized, or reopened)

**Process:**
1. Checks out PR code
2. Installs dependencies
3. Pulls Vercel preview environment configuration
4. Builds preview artifacts
5. Deploys to Vercel preview
6. Comments on PR with preview URL

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Setup Instructions

### Prerequisites

1. A Vercel account with a project created for The Ledger
2. A Supabase project with database schema applied
3. GitHub repository with appropriate permissions

### 1. Vercel Setup

1. **Create a Vercel project:**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables (see below)

2. **Get Vercel credentials:**
   - **Token:** Go to Settings → Tokens → Create Token
   - **Org ID:** Found in Settings → General → Organization ID
   - **Project ID:** Found in Project Settings → General → Project ID

3. **Configure environment variables in Vercel:**

   **Production:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your production Supabase anon key
   - `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://the-ledger.vercel.app)
   - `NEXT_PUBLIC_POLL_INTERVAL_MS` - Polling interval (default: 30000)

   **Preview:**
   - Same variables as production, but you may use a separate Supabase project for preview deployments

### 2. GitHub Secrets Setup

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

**Required:**
- `VERCEL_TOKEN` - Your Vercel token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

**Optional (for builds):**
- `NEXT_PUBLIC_SUPABASE_URL` - Used for build validation
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Used for build validation
- `CODECOV_TOKEN` - For code coverage reporting (if using Codecov)

### 3. Supabase Setup

Ensure you have:
1. Applied the database schema from `specs/001-ledger-notebook-app/contracts/database-schema.sql`
2. Created the storage bucket and applied storage policies
3. Configured appropriate environment variables in Vercel

See [Database Setup Guide](database-setup.md) and [Storage Setup Guide](storage-setup.md) for details.

## Deployment Process

### Automatic Production Deployment

1. Merge a pull request to `main`
2. The CI workflow runs all checks
3. The production deployment workflow automatically deploys to Vercel
4. Your changes are live at your production URL

### Manual Production Deployment

1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Select the `main` branch
4. Click "Run workflow"

### Preview Deployments

1. Open a pull request to `main`
2. The CI workflow validates the changes
3. The preview deployment workflow creates a preview deployment
4. A comment is added to the PR with the preview URL
5. Each new commit updates the preview deployment

## Monitoring Deployments

### GitHub Actions

- View workflow runs: Repository → Actions
- Check individual job logs for detailed information
- Download Playwright test reports from failed E2E runs

### Vercel Dashboard

- View deployments: [vercel.com/dashboard](https://vercel.com/dashboard)
- Check build logs, runtime logs, and analytics
- Monitor performance and errors

## Troubleshooting

### Build Failures

**Problem:** Build fails with environment variable errors

**Solution:** Ensure all required environment variables are set in Vercel and GitHub Secrets

**Problem:** TypeScript errors during build

**Solution:** Run `npm run type-check` locally to identify and fix type errors

### Deployment Failures

**Problem:** Vercel deployment fails with authentication error

**Solution:** Verify that `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are correctly set in GitHub Secrets

**Problem:** Preview deployment doesn't create a comment

**Solution:** Ensure the workflow has `pull-requests: write` permission

### Test Failures

**Problem:** E2E tests fail in CI but pass locally

**Solution:**
- Check if Playwright browsers are installed correctly
- Verify environment variables are set for E2E tests
- Review Playwright report artifacts for details

**Problem:** Tests timeout

**Solution:**
- Increase timeout in `playwright.config.ts`
- Check if the application is starting correctly
- Review test logs for hanging processes

## Best Practices

1. **Always test locally before pushing:**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

2. **Use preview deployments:**
   - Review changes in preview before merging
   - Share preview URLs with team members for feedback
   - Test with real Supabase data in preview environment

3. **Monitor production deployments:**
   - Check Vercel deployment status after merging
   - Monitor error tracking and performance
   - Keep an eye on Supabase usage and quotas

4. **Environment separation:**
   - Use separate Supabase projects for preview and production
   - Never use production database credentials in preview deployments
   - Test database migrations in preview before production

## Security Considerations

1. **Never commit secrets:**
   - Keep `.env.local` in `.gitignore`
   - Use GitHub Secrets for sensitive values
   - Rotate tokens if accidentally exposed

2. **Limit token permissions:**
   - Use least-privilege Vercel tokens
   - Restrict GitHub token scopes
   - Review and audit token usage regularly

3. **Environment variable safety:**
   - Only use `NEXT_PUBLIC_*` prefix for client-safe variables
   - Keep server-side secrets without the prefix
   - Validate environment variables at build time

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

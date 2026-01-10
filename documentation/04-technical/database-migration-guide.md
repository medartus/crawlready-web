# Database Migration Guide

## Overview

CrawlReady uses Drizzle ORM for database schema management. This guide explains how to handle database migrations in different environments.

## Environment Variable: `AUTO_MIGRATE`

Controls whether migrations run automatically when the app starts.

- `AUTO_MIGRATE=true` (default): Migrations run automatically on app startup
- `AUTO_MIGRATE=false`: Migrations are skipped (use manual migration commands instead)

## Development Workflows

### Option 1: Local Development (PGlite)

**Setup:**
```bash
# No DATABASE_URL needed - uses in-memory PGlite
AUTO_MIGRATE=true  # default, can be omitted
```

**Workflow:**
1. Modify `src/models/Schema.ts`
2. Generate migration: `npm run db:generate`
3. Restart Next.js dev server - migrations run automatically
4. No manual migration step needed ✓

**Pros:** Simple, automatic, no external database needed
**Cons:** Data is not persisted between restarts

---

### Option 2: Local Development (Supabase)

**Setup:**
```bash
DATABASE_URL="postgresql://..."
AUTO_MIGRATE=false  # Important!
```

**Workflow:**
1. Modify `src/models/Schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npx supabase db push`
4. Restart Next.js dev server

**Why `AUTO_MIGRATE=false`?**
- Supabase CLI manages migrations via `supabase db push`
- Prevents duplicate migration attempts
- Avoids "already exists" errors

---

## Production Deployment

### Recommended Setup

```bash
DATABASE_URL="postgresql://..."
AUTO_MIGRATE=false
```

### Deployment Steps

**Option A: Supabase CLI (Recommended)**

```bash
# 1. Apply migrations to production database
npx supabase db push --db-url "postgresql://..."

# 2. Deploy application
fly deploy
```

**Option B: Manual Migration**

```bash
# 1. Connect to production database
psql "postgresql://..."

# 2. Run migration SQL files manually
\i migrations/0001_migration.sql

# 3. Deploy application
fly deploy
```

---

## Schema Change Workflow

### 1. Modify Schema

Edit `src/models/Schema.ts`:

```typescript
export const myTable = pgTable('my_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  newColumn: text('new_column'), // Add new field
});
```

### 2. Generate Migration

```bash
npm run db:generate
```

This creates a new file in `migrations/`:
- `migrations/0005_new_migration.sql`
- `migrations/meta/0005_snapshot.json`

### 3. Review Migration

```bash
cat migrations/0005_new_migration.sql
```

Verify the SQL looks correct before applying.

### 4. Apply Migration

**If using Supabase:**
```bash
npx supabase db push
```

**If using local PGlite:**
- Just restart Next.js (migrations run automatically)

**If using external Postgres with AUTO_MIGRATE=true:**
- Restart Next.js (migrations run automatically)

**If using external Postgres with AUTO_MIGRATE=false:**
```bash
# Option 1: Drizzle Kit
npx drizzle-kit push:pg

# Option 2: Manual SQL execution
psql $DATABASE_URL < migrations/0005_new_migration.sql
```

---

## Troubleshooting

### Error: "type 'X' already exists"

**Cause:** Migration already applied, but app is trying to run it again.

**Solution:**
```bash
# Set in .env.local
AUTO_MIGRATE=false
```

Then use `supabase db push` to manage migrations.

---

### Error: Migration files not found

**Cause:** Missing migrations folder or incorrect path.

**Solution:**
```bash
# Ensure migrations exist
ls -la migrations/

# Regenerate if needed
npm run db:generate
```

---

### Multiple environments out of sync

**Situation:** Dev database has newer schema than production.

**Solution:**
```bash
# 1. Get all pending migrations
ls migrations/*.sql

# 2. Apply to production in order
npx supabase db push --db-url "postgresql://production..."

# 3. Verify schema matches
npx drizzle-kit introspect:pg --out=./temp-schema
diff temp-schema src/models/Schema.ts
```

---

## Best Practices

### ✅ DO

- Always review generated migrations before applying
- Use `AUTO_MIGRATE=false` with Supabase
- Apply migrations to production before deploying code
- Keep migration files in version control
- Test migrations on staging before production
- Use transactions for complex migrations

### ❌ DON'T

- Don't edit migration files manually (regenerate instead)
- Don't delete old migration files (breaks history)
- Don't run migrations in multiple places (choose one method)
- Don't deploy code changes before database migrations
- Don't use `AUTO_MIGRATE=true` in production with shared databases

---

## Migration Commands Reference

### Generate Migration
```bash
npm run db:generate
# or
npx drizzle-kit generate:pg
```

### Apply with Supabase
```bash
npx supabase db push
```

### Apply with Drizzle Kit
```bash
npx drizzle-kit push:pg
```

### View Database Schema
```bash
npx drizzle-kit introspect:pg
```

### Reset Database (Dev Only)
```bash
# Supabase
npx supabase db reset

# Drop all tables manually
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## Environment Variable Summary

| Environment | `DATABASE_URL` | `AUTO_MIGRATE` | Migration Method |
|-------------|----------------|----------------|------------------|
| Local (PGlite) | not set | `true` | Automatic on restart |
| Local (Supabase) | set | `false` | `supabase db push` |
| Production | set | `false` | `supabase db push` before deploy |

---

## Quick Start

### New Developer Setup

```bash
# 1. Clone repo
git clone <repo>
cd crawlready-web

# 2. Copy environment template
cp .env.example .env.local

# 3. Choose your database:

# Option A: Use PGlite (simplest)
# Leave DATABASE_URL empty in .env.local
# AUTO_MIGRATE defaults to true

# Option B: Use Supabase
# Set DATABASE_URL in .env.local
# Add: AUTO_MIGRATE=false

# 4. Install and run
npm install
npm run dev
```

---

## Related Files

- `src/libs/DB.ts` - Database connection and migration logic
- `src/models/Schema.ts` - Database schema definition
- `migrations/` - Generated migration files
- `drizzle.config.ts` - Drizzle Kit configuration

---

## Need Help?

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl-schemas.html)


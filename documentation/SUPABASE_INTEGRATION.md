# Supabase + Clerk Integration Guide

This guide walks you through integrating Supabase with Clerk for CrawlReady, enabling Row-Level Security (RLS) policies based on Clerk user IDs.

## Overview

The integration allows:
- **Unified Authentication**: Users authenticate via Clerk, tokens work with Supabase
- **Row-Level Security**: Supabase RLS policies use Clerk user IDs
- **Seamless Data Access**: API routes can query Supabase with user context
- **Storage Integration**: User-scoped file storage for rendered pages

## Prerequisites

- Clerk account with an active application
- Supabase account with a project
- Environment variables configured

## Step 1: Configure Clerk Integration in Supabase

### 1.1 Enable Clerk as Auth Provider

1. Go to your Supabase Dashboard → **Authentication** → **Providers**
2. Scroll to **Other Providers** and click **Add Provider**
3. Select **Clerk**
4. You'll need these values from Clerk:
   - **Clerk JWKS URL**: `https://<your-clerk-domain>/.well-known/jwks.json`
   - Find your Clerk domain in Clerk Dashboard → **API Keys**

### 1.2 Configure JWT Template in Clerk

1. Go to Clerk Dashboard → **JWT Templates**
2. Click **New template** → **Supabase**
3. Name it `supabase`
4. Configure the template:
   ```json
   {
     "aud": "authenticated",
     "exp": "{{user.expiresAt}}",
     "sub": "{{user.id}}",
     "email": "{{user.primaryEmailAddress.emailAddress}}",
     "app_metadata": {
       "provider": "clerk"
     },
     "user_metadata": {
       "full_name": "{{user.fullName}}"
     }
   }
   ```
5. Save the template

## Step 2: Set Environment Variables

Add to `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Clerk (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Get these from:
- Supabase URL & Anon Key: Supabase Dashboard → **Settings** → **API**
- Clerk Keys: Clerk Dashboard → **API Keys**

## Step 3: Create Supabase RLS Policies

### 3.1 Enable RLS on Tables

```sql
-- Enable RLS on rendered_pages table
ALTER TABLE rendered_pages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
```

### 3.2 Create Policies for User Access

```sql
-- Policy: Users can view their own rendered pages
CREATE POLICY "Users can view own rendered pages"
ON rendered_pages
FOR SELECT
TO authenticated
USING (
  user_id = (auth.jwt() ->> 'sub')::text
);

-- Policy: Users can delete their own rendered pages
CREATE POLICY "Users can delete own rendered pages"
ON rendered_pages
FOR DELETE
TO authenticated
USING (
  user_id = (auth.jwt() ->> 'sub')::text
);

-- Policy: Users can view their own API keys
CREATE POLICY "Users can view own API keys"
ON api_keys
FOR SELECT
TO authenticated
USING (
  user_id = (auth.jwt() ->> 'sub')::text
);

-- Policy: Users can insert their own API keys
CREATE POLICY "Users can insert own API keys"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')::text
);
```

### 3.3 Create Admin Policies

```sql
-- Policy: Admins can view all data
CREATE POLICY "Admins can view all rendered pages"
ON rendered_pages
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);

-- Policy: Admins can manage all API keys
CREATE POLICY "Admins can manage all API keys"
ON api_keys
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);
```

## Step 4: Configure Supabase Storage

### 4.1 Create Storage Bucket

```sql
-- Create bucket for rendered pages
INSERT INTO storage.buckets (id, name, public)
VALUES ('rendered-pages', 'rendered-pages', false);
```

### 4.2 Create Storage Policies

```sql
-- Policy: Users can read their own rendered pages
CREATE POLICY "Users can read own rendered pages"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'rendered-pages'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);

-- Policy: System can write rendered pages
CREATE POLICY "System can write rendered pages"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rendered-pages'
);

-- Policy: Users can delete own rendered pages
CREATE POLICY "Users can delete own rendered pages"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'rendered-pages'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);
```

## Step 5: Use Supabase Client in Code

### Server Components / API Routes

```typescript
import { createServerSupabaseClient } from '@/libs/supabase-client';

// In your API route or server component
export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Query with automatic RLS
  const { data, error } = await supabase
    .from('rendered_pages')
    .select('*')
    .order('created_at', { ascending: false });

  return Response.json({ pages: data });
}
```

### Upload to Storage

```typescript
import { createServerSupabaseClient } from '@/libs/supabase-client';
import { auth } from '@clerk/nextjs/server';

async function uploadRenderedPage(url: string, html: string) {
  const supabase = await createServerSupabaseClient();
  const { userId } = await auth();

  // Upload to user-scoped path
  const filePath = `${userId}/${hashUrl(url)}.html`;

  const { data, error } = await supabase.storage
    .from('rendered-pages')
    .upload(filePath, html, {
      contentType: 'text/html',
      upsert: true,
    });

  return data;
}
```

### Download from Storage

```typescript
async function getRenderedPage(url: string) {
  const supabase = await createServerSupabaseClient();
  const { userId } = await auth();

  const filePath = `${userId}/${hashUrl(url)}.html`;

  const { data, error } = await supabase.storage
    .from('rendered-pages')
    .download(filePath);

  if (data) {
    return await data.text();
  }

  return null;
}
```

## Step 6: Testing the Integration

### 6.1 Test Authentication

```bash
# Make a request with Clerk session
curl -X GET https://your-app.com/api/user/pages \
  -H "Cookie: __session=<clerk-session-token>"
```

### 6.2 Test RLS Policies

```sql
-- As a user, try to access another user's data
-- This should return empty result
SELECT * FROM rendered_pages WHERE user_id != auth.uid();
```

### 6.3 Verify JWT Claims

```sql
-- Check what's in the JWT
SELECT auth.jwt();
```

## Troubleshooting

### Issue: "JWT verification failed"

**Solution**: Ensure JWKS URL in Supabase matches your Clerk domain exactly.

### Issue: "Row-level security policy violation"

**Solution**: Check that:
1. RLS is enabled on the table
2. Policies are correctly configured
3. User is authenticated (has valid Clerk session)
4. JWT contains the `sub` claim with user ID

### Issue: "No rows returned"

**Solution**: Verify:
1. Data exists in the table
2. `user_id` column matches Clerk user ID
3. RLS policies allow access

### Issue: "Storage upload fails"

**Solution**: Check:
1. Storage bucket exists
2. Storage policies are configured
3. File path follows the pattern `{userId}/{filename}`

## Security Best Practices

1. **Always use RLS**: Never disable RLS on production tables
2. **Test policies**: Verify policies work as expected before deploying
3. **Audit logs**: Enable Supabase audit logs for security monitoring
4. **Token expiry**: Clerk tokens expire after 1 hour by default
5. **Service role**: Only use service role key in secure server environments

## Migration from API Key to Supabase

If you're migrating from API-key-only storage:

1. **Dual mode**: Support both Redis cache and Supabase storage
2. **Backfill**: Migrate existing cached pages to Supabase
3. **Gradual rollout**: Test with small percentage of traffic first
4. **Fallback**: Keep Redis as hot cache, Supabase as cold storage

## Additional Resources

- [Clerk + Supabase Official Guide](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)

## Next Steps

1. ✅ Configure Clerk integration in Supabase
2. ✅ Set environment variables
3. ✅ Create RLS policies
4. ✅ Configure storage bucket and policies
5. ✅ Test authentication and data access
6. 🔄 Integrate into render worker (when ready)
7. 🔄 Backfill existing cached pages (optional)

---

**Status**: Supabase client helper created. Configuration steps documented above.
**Note**: Actual integration with render worker and storage upload/download to be implemented when cold storage feature is activated.


# PostHog Analytics Setup

This document explains the PostHog analytics integration in your application.

## Installation

Run the following command to install PostHog dependencies:

```bash
pnpm add posthog-js posthog-node
```

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**How to get your PostHog API key:**
1. Sign up or log in to [PostHog](https://app.posthog.com)
2. Create a new project or select an existing one
3. Go to Project Settings → Project API Key
4. Copy the API key and paste it into your `.env.local` file

**Note:** If you're using PostHog Cloud US region, use `https://us.i.posthog.com` as the host. For EU region, use `https://eu.i.posthog.com`.

### 2. Reverse Proxy Setup

The reverse proxy has been configured in `next.config.mjs` to route PostHog requests through your domain at `/ingest/*`. This helps:
- Avoid ad-blockers
- Improve tracking reliability
- Keep first-party data collection

The proxy routes:
- `/ingest/static/*` → PostHog static assets
- `/ingest/*` → PostHog API endpoints
- `/ingest/decide` → PostHog feature flags

## Implementation Details

### Files Created/Modified

1. **`src/libs/posthog/PostHogProvider.tsx`** - Client-side PostHog provider
2. **`src/libs/posthog/PostHogPageView.tsx`** - Automatic pageview tracking
3. **`src/libs/posthog/PostHogIdentify.tsx`** - Automatic user identification for Clerk auth
4. **`src/libs/posthog/server.ts`** - Server-side PostHog utilities for API routes
5. **`src/libs/posthog/index.ts`** - Exports for easy imports
6. **`src/libs/api-client.ts`** - Standard API wrapper with automatic distinct ID headers
7. **`src/app/[locale]/layout.tsx`** - Integrated PostHog provider with Suspense
8. **`src/app/[locale]/(auth)/layout.tsx`** - Added user identification for sign in/up
9. **`src/components/CrawlerCheckerForm.tsx`** - Uses API wrapper for tracking
10. **`src/app/[locale]/(unauth)/schema-checker/page.tsx`** - Uses API wrapper for tracking
11. **`src/app/api/check-crawler/route.ts`** - Reads distinct ID from header, tracks tool usage
12. **`src/app/api/check-schema/route.ts`** - Reads distinct ID from header, tracks tool usage
13. **`next.config.mjs`** - Added reverse proxy rewrites
14. **`src/templates/CTA.tsx`** - Added waitlist registration tracking and email identification

### User Identification

PostHog automatically identifies users in the following scenarios:

1. **Sign In/Sign Up**: When users authenticate via Clerk, they are automatically identified with:
   - User ID (from Clerk)
   - Email address
   - Full name
   - First and last name
   - Username
   - Account creation date

2. **Waitlist Registration**: When users submit the CTA form, they are identified by:
   - Email address (as unique identifier)
   - Website URL
   - Source: 'waitlist'

This allows you to track user journeys from waitlist → sign up → usage in PostHog.

### Tracking Events

Currently tracking:

#### Client-Side Events
- **Pageviews**: Automatic tracking on all pages
- **Waitlist Registration**: Captured when users submit the CTA form

Event name: `waitlist_registration`
Properties:
- `email`: User's email
- `website`: User's website URL
- `spots_left`: Number of spots remaining
- `timestamp`: ISO timestamp of registration

#### Server-Side Events (Tool Usage)
- **Crawler Checker Tool**: Tracked when users analyze their website for AI crawler compatibility
- **Schema Checker Tool**: Tracked when users analyze their website's schema markup

**Important**: These events use the PostHog distinct ID from the client to ensure consistent user tracking across client and server.

Event name: `tool_usage_crawler_checker`
Properties:
- `url`: Website URL being checked
- `score`: Overall compatibility score (0-100)
- `total_issues`: Number of issues detected
- `total_recommendations`: Number of recommendations provided
- `timestamp`: ISO timestamp

Event name: `tool_usage_schema_checker`
Properties:
- `url`: Website URL being checked
- `overall_score`: Schema quality score (0-100)
- `schema_count`: Number of schema markups found
- `issues_count`: Number of issues detected
- `recommendations_count`: Number of recommendations provided
- `timestamp`: ISO timestamp

### How Client-Server Tracking Works

To maintain consistent user identity across client and server, we use a standard API wrapper that automatically includes the PostHog distinct ID in request headers.

**Flow**:
1. **Client uses API wrapper**: All API calls go through `api.post()` which automatically adds `X-PostHog-Distinct-Id` header
2. **Server reads header**: API routes extract the distinct ID from the header
3. **Fallback to IP**: If no distinct ID header is provided, falls back to IP address
4. **User journey tracking**: This allows PostHog to connect:
   - Anonymous tool usage → Waitlist registration → Sign up → Authenticated usage

**Implementation**:
```tsx
// Client-side (using API wrapper)
import { api } from '@/libs/api-client';

// Distinct ID automatically included in X-PostHog-Distinct-Id header
const response = await api.post('/api/check-crawler', { url });

// Server-side (API route)
const distinctId = request.headers.get('x-posthog-distinct-id');
const trackingId = distinctId || request.headers.get('x-forwarded-for') || 'anonymous';
await trackServerEvent(trackingId, 'tool_usage_crawler_checker', { url, score });
```

**API Wrapper** (`src/libs/api-client.ts`):
The `api` utility provides convenience methods that automatically handle:
- PostHog distinct ID in headers
- JSON content-type headers
- Request body serialization

```tsx
// Available methods
api.get(url, options)
api.post(url, body, options)
api.put(url, body, options)
api.patch(url, body, options)
api.delete(url, options)
```

## Usage

### Track Custom Events (Client-Side)

To track custom events in your client components:

```tsx
'use client';

import { usePostHog } from 'posthog-js/react';

export function MyComponent() {
  const posthog = usePostHog();

  const handleAction = () => {
    posthog?.capture('custom_event_name', {
      property1: 'value1',
      property2: 'value2',
    });
  };

  return <button onClick={handleAction}>Track Event</button>;
}
```

### Track Custom Events (Server-Side)

To track events in API routes or server components:

```tsx
import { trackServerEvent } from '@/libs/posthog/server';

export async function POST(request: Request) {
  // Your API logic here
  
  // Track the event
  const distinctId = request.headers.get('x-forwarded-for') || 'anonymous';
  await trackServerEvent(distinctId, 'custom_server_event', {
    property1: 'value1',
    property2: 'value2',
  });
  
  return Response.json({ success: true });
}
```

**Note**: Server-side tracking uses the user's IP address (from `x-forwarded-for` header) as the distinct ID by default. You can use any unique identifier like user ID, session ID, etc.

### Identify Users Manually

User identification is handled automatically for Clerk authentication and waitlist registrations. However, you can manually identify users in other scenarios:

```tsx
posthog?.identify(
  'user_id', // Unique user ID
  {
    email: 'user@example.com',
    name: 'User Name',
    // Add any custom properties
  }
);
```

**Note**: The `PostHogIdentify` component automatically handles identification for:
- Sign in/sign up (via Clerk)
- Sign out (automatically resets)
- Waitlist registration (via email)

### Reset User Identity

User identity is automatically reset when users sign out via Clerk. To manually reset:

```tsx
posthog?.reset();
```

## Testing

After installation and configuration:

1. Start your development server: `pnpm dev`
2. Open your browser and navigate to your app
3. Open PostHog dashboard → Activity → Live Events
4. You should see pageview events appearing in real-time
5. Test the waitlist form to see the `waitlist_registration` event

## Privacy Considerations

- PostHog is configured with `person_profiles: 'identified_only'` to only create user profiles for identified users
- All data is sent through your own domain via the reverse proxy
- No third-party cookies are used

## Troubleshooting

### Events not appearing in PostHog

1. Check that environment variables are set correctly
2. Verify the PostHog API key is valid
3. Check browser console for errors
4. Ensure ad-blockers are disabled during testing
5. Verify the reverse proxy is working by checking network requests to `/ingest/*`

### TypeScript errors

Make sure to install the dependencies:
```bash
pnpm add posthog-js posthog-node
```

### useSearchParams() Suspense boundary error

If you see an error like "useSearchParams() should be wrapped in a suspense boundary", this is because `PostHogPageView` uses `useSearchParams()` which requires a Suspense boundary in Next.js App Router.

**Solution**: The `PostHogPageView` component is already wrapped in a Suspense boundary in the root layout:

```tsx
<Suspense fallback={null}>
  <PostHogPageView />
</Suspense>
```

This ensures proper streaming and static rendering support while tracking pageviews with query parameters.

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog Next.js Guide](https://posthog.com/docs/libraries/next-js)
- [PostHog Reverse Proxy Guide](https://posthog.com/docs/advanced/proxy)

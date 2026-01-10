# Dashboard: API Keys Management - Functional Specification

## Overview

The API Keys Management page enables users to generate, view, and manage their CrawlReady API keys. This is a self-service interface allowing users to create keys for external integrations and monitor their usage.

## User Stories

### US-1: Generate New API Key
**As a** logged-in user  
**I want to** generate a new API key  
**So that** I can integrate CrawlReady into my application

**Acceptance Criteria:**
- User can click "Generate New Key" button
- User selects tier (Free, Pro, Enterprise) - defaults to their account tier
- User optionally provides a name/description for the key
- System generates unique key with format `sk_live_` or `sk_test_`
- Key is displayed once with copy-to-clipboard functionality
- User sees confirmation message: "API key generated successfully. Save it now - you won't see it again!"
- Key appears immediately in the API keys list (showing only prefix)

### US-2: View API Keys List
**As a** logged-in user  
**I want to** see all my API keys  
**So that** I can manage my integrations

**Acceptance Criteria:**
- Table displays all user's API keys with columns:
  - Key Prefix (e.g., `sk_live_abc123...`)
  - Name/Description
  - Tier (Free/Pro/Enterprise)
  - Created Date
  - Last Used Date
  - Status (Active/Revoked)
  - Rate Limit
  - Actions (Revoke, View Usage)
- Keys are sorted by creation date (newest first)
- Empty state shown if user has no keys: "No API keys yet. Generate your first key to get started."

### US-3: Copy API Key to Clipboard
**As a** user who just generated a key  
**I want to** quickly copy the key  
**So that** I can paste it into my application

**Acceptance Criteria:**
- "Copy" button appears next to the generated key
- Clicking copy button copies full key to clipboard
- Button shows checkmark icon and "Copied!" text for 2 seconds
- Works across all modern browsers
- Falls back to text selection if Clipboard API unavailable

### US-4: Revoke API Key
**As a** logged-in user  
**I want to** revoke an API key  
**So that** I can disable access for compromised or unused keys

**Acceptance Criteria:**
- "Revoke" button appears in Actions column for active keys
- Clicking revoke shows confirmation dialog:
  - Title: "Revoke API Key?"
  - Message: "This will immediately disable all requests using this key. This action cannot be undone."
  - Buttons: "Cancel" | "Revoke Key"
- Upon confirmation:
  - Key status changes to "Revoked" in database
  - Key row updates to show "Revoked" badge
  - Revoke button is replaced with "Revoked" label
  - Success toast: "API key revoked successfully"
- Revoked keys remain in the list (for audit purposes) but cannot be used

### US-5: View Key Usage Statistics
**As a** logged-in user  
**I want to** see usage statistics for each key  
**So that** I can monitor which integrations are active

**Acceptance Criteria:**
- "View Usage" button in Actions column
- Clicking opens modal/inline panel showing:
  - Total requests (last 24h, 7d, 30d)
  - Requests remaining today (based on rate limit)
  - Cache hit rate percentage
  - Most rendered URLs (top 5)
  - Request status breakdown (completed, failed, queued)
- Stats update when modal is opened (not cached)

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  API Keys Management                            [Generate New Key]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Manage your API keys for CrawlReady integrations               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Key Prefix      │ Tier  │ Created    │ Last Used │ Actions │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ sk_live_abc...  │ Pro   │ 2 days ago │ 5 min ago │ [👁][🗑]│ │
│  │ sk_test_xyz...  │ Free  │ 1 week ago │ Never     │ [👁][🗑]│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoint Contracts

### POST /api/user/keys

**Request:**
```typescript
{
  name?: string;        // Optional key description
  tier: 'free' | 'pro' | 'enterprise';
}
```

**Response (Success - 201):**
```typescript
{
  key: string;          // Full API key (shown only once)
  keyPrefix: string;    // First 16 chars for display
  id: string;           // UUID
  tier: string;
  createdAt: string;
  rateLimitDaily: number;
  message: "API key generated successfully. Save it now - you won't see it again!"
}
```

**Response (Error - 400):**
```typescript
{
  error: "Validation failed";
  details: Array<{ field: string; message: string }>;
}
```

**Response (Error - 429):**
```typescript
{
  error: "Rate limit exceeded";
  message: "Maximum 10 keys per user. Revoke unused keys to create new ones.";
}
```

### GET /api/user/keys

**Request:** None (authenticated via Clerk session)

**Response (Success - 200):**
```typescript
{
  keys: Array<{
    id: string;
    keyPrefix: string;        // e.g., "sk_live_abc123..."
    name?: string;
    tier: 'free' | 'pro' | 'enterprise';
    createdAt: string;
    lastUsedAt?: string;
    isActive: boolean;
    rateLimitDaily: number;
    usageToday: number;       // Requests made today
  }>;
  total: number;
}
```

### DELETE /api/user/keys/:keyId

**Request:** None (key ID in URL)

**Response (Success - 200):**
```typescript
{
  message: "API key revoked successfully";
  keyId: string;
}
```

**Response (Error - 404):**
```typescript
{
  error: "Not found";
  message: "API key not found or does not belong to you";
}
```

### GET /api/user/keys/:keyId/usage

**Request:** Query params: `?range=24h|7d|30d` (default: 24h)

**Response (Success - 200):**
```typescript
{
  keyId: string;
  range: string;
  stats: {
    totalRequests: number;
    requestsRemaining: number;
    cacheHitRate: number;        // 0-100
    requestsByStatus: {
      completed: number;
      failed: number;
      queued: number;
    };
    topUrls: Array<{
      url: string;
      count: number;
    }>;
  };
}
```

## Validation Rules

### Key Generation
- **Name:** Optional, max 100 characters, alphanumeric + spaces/hyphens only
- **Tier:** Must be one of: free, pro, enterprise
- **Rate Limit:** Cannot exceed user's account tier limits
- **Maximum Keys:** Users limited to 10 active keys total

### Key Revocation
- **Ownership:** Can only revoke own keys
- **Idempotency:** Revoking already-revoked key returns success
- **Audit Trail:** Revocation logged with timestamp and user ID

## Error States

### No Keys Available
**Display:**
```
┌─────────────────────────────────────────┐
│             🔑                          │
│                                         │
│      No API keys yet                    │
│                                         │
│  Generate your first key to integrate   │
│     CrawlReady with your app           │
│                                         │
│      [Generate New Key]                 │
└─────────────────────────────────────────┘
```

### Key Generation Limit Reached
**Toast Message:** "Maximum 10 keys reached. Revoke unused keys to create new ones."

### Network Error Loading Keys
**Display:**
```
┌─────────────────────────────────────────┐
│             ⚠️                          │
│                                         │
│   Failed to load API keys               │
│                                         │
│      [Try Again]                        │
└─────────────────────────────────────────┘
```

### Key Generation Failed
**Toast Message:** "Failed to generate API key. Please try again."

## Success Flows

### Flow 1: Generate First API Key
1. User lands on empty API Keys page
2. Clicks "Generate New Key" button
3. Modal opens with form:
   - Name field (optional)
   - Tier selector (defaulted to user's tier)
4. User fills name: "Production App"
5. Clicks "Generate"
6. Loading spinner shows (max 500ms)
7. Success modal displays full key with copy button
8. User clicks "Copy" → "Copied!" confirmation
9. User clicks "Close" on modal
10. Table now shows new key with prefix `sk_live_abc...`
11. Success toast appears: "API key generated successfully"

### Flow 2: Revoke Compromised Key
1. User identifies compromised key in table
2. Clicks trash icon in Actions column
3. Confirmation dialog appears
4. User clicks "Revoke Key"
5. Row updates immediately to show "Revoked" status
6. Revoked badge appears in red
7. Actions column shows "Revoked" text (no buttons)
8. Success toast: "API key revoked successfully"

### Flow 3: Monitor Key Usage
1. User clicks "View Usage" (eye icon) for a key
2. Modal opens showing loading skeleton
3. Stats load and display (< 1 second)
4. User sees:
   - 1,234 requests in last 24h
   - 766 requests remaining today
   - 87% cache hit rate
   - Top 5 URLs rendered
5. User clicks "Close" to return to list

## Accessibility Requirements

- All buttons have accessible labels (aria-label)
- Copy button announces "Copied" to screen readers
- Confirmation dialogs are keyboard navigable
- Focus management: modal opening traps focus, closing returns focus
- Table sortable via keyboard (Space/Enter keys)
- Color contrast meets WCAG AA (4.5:1 minimum)
- Error messages announced to screen readers
- Loading states announced (aria-live regions)

## Localization

Support English (en) and French (fr) locales:

- Button labels: "Generate New Key" / "Générer une nouvelle clé"
- Status labels: "Active" / "Actif", "Revoked" / "Révoqué"
- Tier labels: "Free" / "Gratuit", "Pro" / "Pro", "Enterprise" / "Entreprise"
- Date formatting: US format for en, EU format for fr
- Number formatting: Comma separators appropriate to locale

## Dependencies

- Clerk authentication (session required)
- `/api/user/keys` API endpoints
- Clipboard API (with fallback)
- Toast notification system
- Modal/Dialog component library
- Table component with sorting

## Future Enhancements (Out of Scope for MVP)

- Bulk key revocation
- Key expiration dates
- Key rotation (auto-generate replacement)
- Key usage alerts (email when limit reached)
- Export usage data as CSV
- API key naming/tagging system
- Key permissions/scopes (restrict what key can access)


# Dashboard: Rendered Pages Browser - Non-Functional Requirements

## Performance

### Page Load Time
- **Target:** < 2 seconds from navigation to interactive
- **Includes:** Initial table load with 50 items
- **Optimization:** Server-side pagination, client-side sorting

### Table Rendering
- **Target:** < 100ms to render 50 rows
- **Virtual Scrolling:** If > 100 items per page
- **Smooth Scrolling:** 60fps scroll performance

### HTML Preview Loading
- **Target:** < 1 second to load and display HTML
- **Maximum Size:** Support HTML up to 5MB
- **Streaming:** Use streaming for large HTML files
- **Timeout:** Show error if load takes > 10 seconds

### Search Performance
- **Debounce:** 300ms after last keystroke
- **Client-Side:** Search within loaded page (50 items)
- **Server-Side:** If searching across all pages
- **Response Time:** < 500ms for server search

### Pagination
- **Pre-fetch:** Pre-load next page on hover over "Next" button
- **Cache:** Cache last 3 pages client-side
- **Instant:** Page navigation feels instant (< 100ms)

## Security

### HTML Sandbox
- **Iframe Sandbox:** 
  - `sandbox="allow-same-origin"` only
  - NO `allow-scripts` (prevent JS execution)
  - NO `allow-forms` (prevent form submission)
  - NO `allow-popups` (prevent popups)
- **CSP:** Content Security Policy prevents external resource loading
- **XSS Protection:** HTML sanitized before storage (done at render time)

### Data Access Control
- **User Scoping:** Users can only see their own pages
- **API Key Scoping:** When filtered by key, verify key ownership
- **Row-Level Security:** Database policies enforce user isolation

### URL Sanitization
- **Query Params:** Remove sensitive params (tokens, keys) from display
- **Private URLs:** Warn if displaying internal/private URLs
- **No Logging:** Don't log full URLs with sensitive data

### Invalidation Security
- **Ownership Check:** Verify user owns page before invalidation
- **Rate Limiting:** Max 100 invalidations per hour
- **Audit Log:** Log all invalidations with user ID and timestamp

## Usability

### Visual Feedback
- **Loading States:** Skeleton screens while loading
- **Hover Effects:** Clear hover states on all interactive elements
- **Action Confirmation:** Confirmation dialog for destructive actions
- **Success/Error:** Toast notifications for all actions

### Cache Location Indicators
- **Color Coding:** Red (hot), Yellow (cold), Gray (none)
- **Icons:** Visual icons in addition to color
- **Tooltips:** Explain what each location means
- **Not Color-Dependent:** Use patterns/text as well

### Table UX
- **Sortable Columns:** Click header to sort
- **Resizable Columns:** Drag column borders to resize (desktop)
- **Sticky Header:** Header stays visible when scrolling
- **Row Selection:** Checkbox for bulk operations

### Empty States
- **First-Time User:** Explain how to render pages
- **No Search Results:** Suggest clearing filters
- **API Key Filter:** Show which key is being filtered

### Error Messages
- **User-Friendly:** No technical jargon
- **Actionable:** Suggest next steps
- **Contact:** Provide support link for persistent issues

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- **Table:** Arrow keys navigate cells
- **Sorting:** Space/Enter to sort columns
- **Pagination:** Tab to pagination controls
- **Modal:** Focus trapped, ESC to close

### Screen Reader Support
- **Table:** Proper `<th>` headers with scope
- **Status:** Cache location announced meaningfully
- **Actions:** Button labels clearly describe action
- **Modal:** Announced when opened
- **Loading:** aria-live regions for dynamic updates

### Focus Management
- **Visible:** 2px focus ring with high contrast
- **Logical Order:** Tab order follows visual flow
- **Modal:** Focus moves to modal on open, returns on close
- **Skip Links:** Skip to table content

### Color Contrast
- **Text:** 4.5:1 minimum for normal text
- **Interactive:** 3:1 for focus indicators
- **Status Badges:** Not relying solely on color

## Reliability

### Error Handling
- **Network Failures:** Show error with retry button
- **Partial Data:** Show what loaded successfully
- **Timeout:** Clear timeout message
- **Recovery:** Suggest manual refresh if errors persist

### Data Integrity
- **Consistency:** Table always reflects database state
- **Real-Time Updates:** Optional polling for new pages
- **Conflict Resolution:** If page deleted, show graceful error

### Browser Compatibility
- **Modern Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Fallbacks:** Table works without JS (server-rendered)
- **Progressive Enhancement:** Core features work in all browsers

## Scalability

### Large Datasets
- **Pagination:** Server-side, 50 items per page
- **Total Items:** Support users with millions of pages
- **Database Indexing:** Index on userId, renderedAt, url
- **Query Optimization:** Limit, offset, where clauses optimized

### HTML Storage
- **Large Files:** Support HTML up to 5MB
- **Storage:** Supabase Storage for HTML files
- **Compression:** Gzip HTML before storage
- **Cleanup:** Delete from storage when invalidated (optional retention)

### Search Performance
- **Full-Text Search:** PostgreSQL full-text search on URLs
- **Index:** GIN index on URL column
- **Response Time:** < 500ms for text search

## Maintainability

### Code Organization
- **Components:** Separate components for table, filters, preview
- **Hooks:** Custom hooks for data fetching, filtering, pagination
- **Types:** Strongly typed with TypeScript
- **Tests:** Unit tests for filtering/sorting logic

### API Design
- **RESTful:** Standard HTTP methods and status codes
- **Versioned:** API version in URL if needed
- **Consistent:** Same patterns as other endpoints

### Database Schema
- **Normalized:** Avoid data duplication
- **Foreign Keys:** Proper relationships (pages → jobs → keys → users)
- **Indexes:** Optimized for common queries

## Monitoring & Observability

### Performance Metrics
- **Page Load Time:** Track P50, P95, P99
- **API Response Time:** Track per endpoint
- **HTML Load Time:** Track preview modal load time
- **Search Latency:** Track search performance

### Error Tracking
- **Client Errors:** Log to Sentry with context
- **API Errors:** Track error rates by endpoint
- **Failed Previews:** Track % of preview failures

### Usage Analytics
- **Popular Features:** Track most-used filters
- **Preview Usage:** How many users preview HTML
- **Invalidation Rate:** Track invalidations per user
- **Search Patterns:** Anonymous search term analytics

## Mobile Experience

### Responsive Design
- **Mobile:** < 640px - Card layout instead of table
- **Tablet:** 640-1024px - Scrollable table
- **Desktop:** > 1024px - Full table with all columns

### Mobile Table
- **Card Layout:** Each page as a card
- **Swipe Actions:** Swipe to reveal actions (preview, invalidate)
- **Pull to Refresh:** Refresh page list
- **Infinite Scroll:** Load more as user scrolls (instead of pagination)

### Mobile Performance
- **Bundle Size:** < 100KB for page JS
- **Images:** No images (icons as SVG inline)
- **Lazy Load:** Lazy load preview modal code

### Touch Targets
- **Minimum Size:** 44x44px for all buttons
- **Spacing:** 8px between touch targets
- **Feedback:** Visual feedback on tap

## Data Privacy & Compliance

### GDPR
- **Right to Access:** Users can view all their rendered pages
- **Right to Erasure:** Users can bulk-delete pages
- **Data Minimization:** Only store necessary HTML metadata
- **Retention:** HTML deleted after 90 days (configurable)

### Data Anonymization
- **URLs:** Option to hash URLs for privacy
- **Content:** HTML stored encrypted at rest (Supabase)
- **Logs:** No HTML content in application logs

### Audit Trail
- **Tracking:** Log all view/invalidate actions
- **Retention:** Audit logs kept for 1 year
- **Export:** Users can export their audit log

## Testing Requirements

### Unit Tests
- **Filtering:** Test all filter combinations
- **Sorting:** Test sorting by all columns
- **Pagination:** Test page navigation logic
- **Search:** Test debouncing and query building

### Integration Tests
- **API:** Test all `/api/user/pages` endpoints
- **Pagination:** Test with 0, 1, 50, 1000+ items
- **Filtering:** Test combining multiple filters
- **Invalidation:** Test successful and failed invalidations

### E2E Tests
- **Critical Flows:**
  - Load page → See list
  - Search → Results update
  - Preview → Modal opens → HTML displays
  - Invalidate → Confirm → Success toast
  - Filter by key → Correct results
- **Browsers:** Chrome, Firefox, Safari
- **Devices:** Mobile, tablet, desktop

### Performance Tests
- **Load Testing:** 100 concurrent users
- **Large Dataset:** Test with 10,000 pages
- **HTML Size:** Test preview with 1KB to 5MB HTML

## Internationalization

### Date/Time
- **Relative:** "2 minutes ago" / "il y a 2 minutes"
- **Absolute:** "Jan 15, 2025" / "15 janv. 2025"
- **Timezone:** User's local timezone

### File Sizes
- **Formatting:** "125 KB" / "125 Ko"
- **Localization:** Appropriate units per locale

### Text Content
- **Translatable:** All UI text
- **Plurals:** Handle singular/plural correctly
- **RTL Support:** Layout adapts for RTL languages (future)

## Performance Budget

### JavaScript
- **Page Code:** < 50KB gzipped
- **Dependencies:** < 100KB gzipped total
- **Syntax Highlighter:** Lazy loaded (40KB)

### API Response
- **Page List:** < 50KB JSON
- **HTML Content:** Up to 5MB (streamed)
- **Compression:** Gzip enabled

### Rendering
- **First Paint:** < 1 second
- **Interaction Ready:** < 2 seconds
- **Table Render:** < 100ms

## Success Metrics

### User Engagement
- **Target:** 40% of users visit pages browser weekly
- **Measurement:** Track page views

### Feature Adoption
- **Preview:** 60% of users preview at least one page
- **Invalidation:** 30% of users invalidate at least once
- **Search:** 50% of users use search feature

### Performance
- **Target:** P95 load time < 2 seconds
- **Measurement:** RUM + synthetic monitoring

### Reliability
- **Target:** < 1% error rate on page load
- **Measurement:** Track failed API requests

## Constraints

### HTML Size Limit
- **Maximum:** 5MB per rendered page
- **Warning:** Show warning if HTML > 3MB
- **Rejection:** Reject renders > 5MB

### Storage Limits
- **Free Tier:** 100 pages max
- **Pro Tier:** 10,000 pages max
- **Enterprise:** Unlimited

### Retention Policy
- **Default:** Keep pages for 90 days
- **User Control:** Users can delete anytime
- **Automatic:** Purge after retention period

## Browser Support

### Required Features
- **Iframe Sandbox:** All modern browsers
- **Clipboard API:** Chrome 63+, Firefox 53+, Safari 13.1+
- **CSS Grid:** All modern browsers
- **Fetch API:** All modern browsers

### Graceful Degradation
- **No Clipboard API:** Fallback to text selection
- **No JS:** Basic table with server-side pagination
- **Old Browsers:** Show upgrade message


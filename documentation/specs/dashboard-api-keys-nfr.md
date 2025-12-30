# Dashboard: API Keys Management - Non-Functional Requirements

## Performance

### Page Load Time
- **Target:** < 2 seconds from navigation to interactive
- **Measurement:** Lighthouse Performance Score > 90
- **Optimization:**
  - Server-side render initial table
  - Client-side hydration for interactions
  - Lazy load usage statistics modal

### API Key Generation
- **Target:** < 500ms from click to key display
- **Includes:** API call + database write + hash computation
- **UX:** Show loading spinner if > 200ms

### Key List Rendering
- **Target:** < 100ms to render list of 50 keys
- **Optimization:** Virtual scrolling if user has > 100 keys
- **Pagination:** Server-side, 50 keys per page

### Usage Statistics Loading
- **Target:** < 1 second to load and display stats
- **Caching:** No caching - always show real-time data
- **Timeout:** Show error if API takes > 5 seconds

## Security

### Key Display Security
- **One-Time Display:** Full API key shown only once after generation
- **No Logging:** Plain keys never logged to console or analytics
- **Memory Clearing:** Key cleared from component state after modal closes
- **HTTPS Only:** All key transmission over HTTPS

### Clipboard Security
- **Secure Copy:** Use Clipboard API (requires HTTPS and user gesture)
- **No Persistence:** Key not stored in clipboard history (if browser supports)
- **Fallback:** Text selection fallback for older browsers
- **Validation:** Verify key format before allowing copy

### API Key Storage
- **Hashing:** SHA-256 hash stored in database
- **Salt:** No salt (keys are already high-entropy)
- **Timing Attack Prevention:** Use `crypto.timingSafeEqual()` for verification
- **Key Prefix:** Store first 16 characters for display/audit

### Rate Limiting
- **Key Generation:** Max 10 keys per user account
- **API Calls:** Max 100 requests/minute to prevent abuse
- **Revocation:** No rate limit (emergency operation)

### Access Control
- **Authentication:** Clerk session required (enforced by middleware)
- **Authorization:** Users can only access their own keys
- **Admin Override:** Admins can view all keys (prefix only, not full key)

## Usability

### Clear Labeling
- All buttons have descriptive labels
- Icons accompanied by text labels
- Tooltips on hover for additional context
- Status badges clearly indicate Active vs Revoked

### Confirmation Dialogs
- **Revoke Key:** Requires confirmation (destructive action)
- **Cancel:** Easy to cancel out of dialogs
- **Clarity:** Dialog messages explain consequences

### Toast Notifications
- **Success:** Green toast for successful operations (4s duration)
- **Error:** Red toast for failures (6s duration, dismissible)
- **Position:** Top-right corner (non-intrusive)
- **Stackable:** Multiple toasts stack vertically

### Loading States
- **Inline Spinners:** Show on buttons during actions
- **Skeleton Screens:** Show structure while loading list
- **Progress Indicators:** Clear feedback during long operations

### Empty States
- **Helpful:** Empty state explains next steps
- **Actionable:** Includes "Generate New Key" button
- **Visual:** Icon and friendly message

### Error Messages
- **User-Friendly:** No technical jargon
- **Actionable:** Suggest how to resolve
- **Specific:** Explain what went wrong
- **Contact:** Provide support link for unresolved issues

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- **Tab Order:** Logical tab order through all interactive elements
- **Enter/Space:** Activates buttons and links
- **Escape:** Closes modals and dialogs
- **Arrow Keys:** Navigate table rows (optional enhancement)

### Screen Reader Support
- **Labels:** All form inputs have associated labels
- **ARIA Attributes:** 
  - `aria-label` on icon-only buttons
  - `aria-live` regions for dynamic content
  - `aria-describedby` for error messages
- **Focus Management:** Focus trapped in modals, returns to trigger on close
- **Announcements:** Success/error toasts announced to screen readers

### Color Contrast
- **Text:** Minimum 4.5:1 contrast ratio for normal text
- **Large Text:** Minimum 3:1 contrast ratio for text ≥ 18pt
- **Interactive Elements:** 3:1 contrast for focus indicators
- **Status Badges:** Not reliant on color alone (include icons/text)

### Focus Indicators
- **Visible:** Clear outline on focused elements
- **Color:** High contrast focus ring
- **Width:** Minimum 2px outline

### Text Sizing
- **Resizable:** Interface remains usable at 200% zoom
- **No Truncation:** Critical info not cut off when zoomed
- **Responsive:** Layout adapts to larger text sizes

## Reliability

### Error Handling
- **Network Failures:** Graceful degradation with retry option
- **API Errors:** User-friendly error messages
- **Partial Failures:** Show what worked, indicate what failed
- **Recovery:** Provide clear path to resolve errors

### Data Integrity
- **Idempotency:** Revoke operations are idempotent
- **Validation:** Client-side and server-side validation
- **Consistency:** Key status always reflects database state
- **Audit Trail:** All key operations logged with timestamp

### Browser Compatibility
- **Modern Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Fallbacks:** Clipboard API fallback for older browsers
- **Progressive Enhancement:** Core functionality works without JS

### Uptime
- **Target:** 99.9% uptime for API endpoints
- **Degradation:** If Redis down, show cached data with warning
- **Monitoring:** Alert on API response time > 2 seconds

## Scalability

### Large Key Lists
- **Pagination:** 50 keys per page
- **Virtual Scrolling:** If user has > 100 keys
- **Search:** Client-side filtering for loaded keys
- **Sorting:** Client-side sorting on loaded page

### High Traffic
- **Caching:** No aggressive caching (show real-time status)
- **Rate Limiting:** Prevent abuse (100 req/min per user)
- **Database Indexing:** Index on `userId` and `keyPrefix`

### Data Volume
- **Key Storage:** UUID + hash = ~100 bytes per key
- **Historical Data:** Keep revoked keys indefinitely (audit)
- **Usage Stats:** Aggregate daily, purge raw logs after 90 days

## Maintainability

### Code Quality
- **TypeScript:** Strict mode, no `any` types
- **Linting:** ESLint with Antfu config
- **Testing:** Unit tests for API endpoints, E2E for critical flows
- **Documentation:** Inline comments for complex logic

### Component Reusability
- **Shared Components:** Use design system components
- **Props Interface:** Well-typed prop interfaces
- **Storybook:** Document component usage

### API Versioning
- **Backward Compatibility:** Maintain v1 API contracts
- **Deprecation:** 6-month notice for breaking changes
- **Documentation:** Keep API docs updated

## Monitoring & Analytics

### Performance Monitoring
- **Metrics:** Track page load time, API response time
- **Alerts:** Alert if P95 > 3 seconds
- **Tools:** Sentry for error tracking

### User Analytics
- **Events:** Track key generation, revocation, usage views
- **Privacy:** No PII in analytics (use hashed user IDs)
- **Funnel:** Monitor generation success rate

### Error Tracking
- **Client Errors:** Log to Sentry with context
- **API Errors:** Track error rates by endpoint
- **User Feedback:** Collect feedback on errors

## Mobile Experience

### Responsive Design
- **Breakpoints:** Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px)
- **Table:** Horizontal scroll on mobile or card layout
- **Modals:** Full-screen on mobile, centered on desktop
- **Touch Targets:** Minimum 44x44px tap targets

### Performance on Mobile
- **Page Load:** < 3 seconds on 3G connection
- **Bundle Size:** JS bundle < 100KB gzipped
- **Images:** Responsive images with srcset

### Mobile-Specific Features
- **Copy Button:** Native share sheet on mobile (if supported)
- **Haptic Feedback:** Vibration on copy success (if supported)
- **Pull to Refresh:** Refresh key list

## Internationalization (i18n)

### Supported Locales
- **MVP:** English (en), French (fr)
- **Future:** Spanish (es), German (de)

### Translatable Content
- **UI Text:** All button labels, headings, messages
- **Error Messages:** User-facing errors
- **Validation:** Field validation messages
- **Date/Time:** Locale-appropriate formatting

### Number Formatting
- **Separators:** Locale-appropriate (comma vs period)
- **Currency:** If pricing shown, use user's currency
- **Large Numbers:** Abbreviate (1.2K, 1.5M)

## Compliance

### GDPR
- **Data Minimization:** Only collect necessary data
- **Right to Erasure:** Revoked keys can be deleted on request
- **Data Export:** User can export their key list
- **Consent:** Clear consent for analytics

### SOC 2
- **Audit Logs:** All key operations logged
- **Access Control:** Keys scoped to user accounts
- **Encryption:** Keys hashed before storage

### Security Standards
- **OWASP Top 10:** Protection against common vulnerabilities
- **Secrets Management:** Keys never exposed in logs/errors
- **Rate Limiting:** Prevent brute force attacks

## Testing Requirements

### Unit Tests
- **Coverage:** > 80% for API endpoints
- **Scenarios:** Test success, validation errors, edge cases
- **Mocking:** Mock database and external services

### Integration Tests
- **API:** Test full request/response cycle
- **Database:** Test with real database (test instance)
- **Auth:** Test with Clerk test keys

### E2E Tests
- **Critical Flows:** 
  - Generate key → Copy → See in list
  - Revoke key → Confirm → See updated status
  - View usage → Modal opens → Data loads
- **Browser:** Chrome, Firefox, Safari
- **Mobile:** iOS Safari, Android Chrome

### Performance Tests
- **Load Testing:** 100 concurrent users generating keys
- **Stress Testing:** 1000 keys in list, measure render time
- **API Response:** P95 < 500ms under load

## Documentation

### User Documentation
- **Getting Started:** Step-by-step guide to generate first key
- **Integration Guides:** Code examples for common frameworks
- **Troubleshooting:** FAQ for common issues
- **Video Tutorial:** Screen recording of key generation

### Developer Documentation
- **API Reference:** Complete API endpoint documentation
- **Architecture:** Diagrams of auth flow and data model
- **Deployment:** How to deploy and configure
- **Runbooks:** Common operational procedures

## Success Metrics

### User Adoption
- **Target:** 80% of active users generate at least 1 key
- **Measurement:** Track key generation events

### User Satisfaction
- **Target:** < 5% error rate on key generation
- **Measurement:** Track failed vs successful generations

### Performance
- **Target:** P95 page load time < 2 seconds
- **Measurement:** Real User Monitoring (RUM)

### Security
- **Target:** Zero key exposure incidents
- **Measurement:** Security audit logs

## Constraints

### Technical Constraints
- **Next.js 14:** Must work within App Router constraints
- **Clerk:** Limited to Clerk's auth capabilities
- **PostgreSQL:** Database schema limitations

### Business Constraints
- **Free Tier:** Limited to 100 requests/day per key
- **Key Limit:** Max 10 keys per user account
- **MVP Scope:** No key expiration or rotation in v1

### Time Constraints
- **MVP Deadline:** Complete within sprint
- **Performance Budget:** Page load < 2s non-negotiable
- **Accessibility:** WCAG AA required for launch


# Dashboard: Usage Statistics - Non-Functional Requirements

## Performance

### Page Load Time
- **Target:** < 2 seconds from navigation to interactive
- **Includes:** Data fetch + chart rendering
- **Optimization:** Server-side data aggregation, client-side rendering

### Chart Rendering
- **Target:** < 1 second to render all charts
- **Data Points:** Up to 720 points (30 days hourly data)
- **Smooth Animations:** 300ms transition animations
- **Debounced Interactions:** 150ms debounce on hover/interactions

### Data Refresh
- **Auto-Refresh:** Every 30 seconds when page active
- **Manual Refresh:** Button triggers immediate reload
- **Stale Data Indicator:** Show "Updated 5 minutes ago" if stale

### Export Performance
- **Target:** < 2 seconds to generate and download CSV
- **Maximum Rows:** Up to 10,000 rows
- **Streaming:** Use streaming for large datasets

## Security

### Data Access Control
- **User Scoping:** Users can only see their own usage data
- **API Key Scoping:** When filtered by key, verify key ownership
- **No PII Exposure:** URLs sanitized (remove query params with tokens/keys)

### Rate Limiting
- **API Calls:** Max 60 requests/minute to usage endpoint
- **Export:** Max 10 exports per hour per user
- **Charts:** Client-side rendering (no server load)

### Data Sanitization
- **URL Display:** Sanitize URLs to remove sensitive query params
- **Error Messages:** Don't expose internal error details
- **Logs:** No sensitive data in client-side logs

## Usability

### Visual Hierarchy
- **Most Important:** Total requests (largest font)
- **Secondary:** Cache hit rate, failures
- **Tertiary:** Detailed breakdowns and charts

### Color Coding
- **Green:** Good performance (high cache hits, low errors)
- **Yellow:** Warning (approaching limits)
- **Red:** Critical (exceeded limits, high errors)
- **Blue:** Neutral info (charts, general stats)

### Responsive Charts
- **Desktop:** Full-width charts with detailed tooltips
- **Tablet:** Stacked charts, scrollable tables
- **Mobile:** Card-based layout, simplified charts

### Helpful Tooltips
- **Terminology:** Explain "hot cache" vs "cold cache"
- **Metrics:** Explain how cache hit rate is calculated
- **Actions:** Suggest what to do if error rate is high

### Empty States
- **No Data:** Explain how to generate usage (make API calls)
- **No Failures:** Congratulate on 0% error rate
- **No Keys:** Prompt to create API key first

## Accessibility (WCAG 2.1 AA)

### Chart Accessibility
- **Alt Text:** Descriptive alt text for chart images
- **Data Tables:** Toggle to view charts as data tables
- **Screen Reader:** Announce key metrics on page load
- **Keyboard:** Navigate chart data points with arrow keys

### Color Blind Friendly
- **Palette:** Use patterns in addition to colors
- **Contrast:** Minimum 3:1 contrast for chart elements
- **Legends:** Text labels in addition to color coding

### Focus Management
- **Visible Focus:** Clear focus indicators on all interactive elements
- **Logical Order:** Tab order follows visual flow
- **Skip Links:** Skip to chart content

### Text Alternatives
- **Charts:** Provide data table alternative
- **Icons:** All icons have aria-labels
- **Status Indicators:** Text in addition to color

## Reliability

### Data Accuracy
- **Target:** 99.9% accuracy in reported metrics
- **Verification:** Cross-check with database aggregates
- **Consistency:** Same query returns same results (within refresh window)

### Error Handling
- **Partial Data:** Show what's available if some data fails to load
- **Timeout:** Show error after 10 seconds
- **Retry Logic:** Auto-retry failed requests (max 3 attempts)

### Cache Strategy
- **Client Cache:** Cache data for 30 seconds
- **SWR Pattern:** Show cached data, revalidate in background
- **Invalidation:** Invalidate on manual refresh

### Fallback Behavior
- **Chart Library Failure:** Show data table instead
- **Export Failure:** Offer alternative export formats
- **API Unavailable:** Show last cached data with warning

## Scalability

### Data Volume
- **Daily Records:** Handle users with millions of requests
- **Aggregation:** Pre-aggregate daily stats (don't query raw logs)
- **Pagination:** Paginate top URLs if > 1000 unique URLs

### Query Performance
- **Database:** Index on userId, timestamp, apiKeyId
- **Caching:** Redis cache for frequently accessed stats
- **Aggregation:** Background jobs compute daily aggregates

### Chart Performance
- **Data Points:** Limit to 720 points max (30 days hourly)
- **Downsampling:** Aggregate to daily for 30d view
- **Lazy Loading:** Load charts as user scrolls

## Maintainability

### Data Source
- **Single Source of Truth:** PostgreSQL for all usage data
- **Aggregation Tables:** Pre-computed daily/hourly aggregates
- **Query Optimization:** Use materialized views for complex queries

### Chart Library
- **Library:** Recharts (React-based, well-maintained)
- **Version:** Pin to specific version to avoid breaking changes
- **Customization:** Use library's composition model

### Code Organization
- **Components:** Separate component per chart type
- **Hooks:** Custom hooks for data fetching (`useUsageStats`)
- **Utils:** Helper functions for calculations in `/libs`

## Monitoring & Observability

### Performance Monitoring
- **Metrics:** Track page load time, chart render time
- **Alerts:** Alert if P95 > 3 seconds
- **RUM:** Real user monitoring for actual performance

### Error Tracking
- **Client Errors:** Log chart rendering failures to Sentry
- **API Errors:** Track failed data fetches
- **User Impact:** Track percentage of users affected

### Usage Analytics
- **Popular Features:** Track which time ranges used most
- **Export Usage:** Track export format preferences
- **Engagement:** Track time spent on page

## Mobile Experience

### Responsive Design
- **Mobile First:** Design for mobile, enhance for desktop
- **Touch Targets:** Minimum 44x44px
- **Simplified Charts:** Fewer data points on mobile

### Performance on Mobile
- **Bundle Size:** Chart library adds ~50KB gzipped
- **Data Transfer:** Minimize JSON payload size
- **Rendering:** Hardware-accelerated CSS transforms

### Mobile-Specific Features
- **Pull to Refresh:** Refresh data on pull-down gesture
- **Swipe Charts:** Swipe between time ranges
- **Tap to Toggle:** Tap chart legend to show/hide series

## Data Privacy & Compliance

### GDPR
- **Data Minimization:** Only store necessary metrics
- **Retention:** Aggregate data after 90 days, purge raw logs
- **Export:** Users can export their usage data
- **Deletion:** Usage data deleted when user account deleted

### Data Anonymization
- **URLs:** Hash URLs in aggregates (preserve privacy)
- **IP Addresses:** Don't store IPs in usage logs
- **User IDs:** Pseudonymized in analytics

## Testing Requirements

### Unit Tests
- **Data Calculations:** Test cache hit rate, error rate calculations
- **Data Formatting:** Test number/date formatting for locales
- **Helpers:** Test all utility functions

### Integration Tests
- **API:** Test `/api/user/usage` with various time ranges
- **Export:** Test CSV and JSON export generation
- **Filtering:** Test filtering by API key

### E2E Tests
- **Critical Flows:**
  - Load page → See stats for 24h
  - Change time range → Stats update
  - Export data → File downloads
  - Click chart → Navigate to details
- **Cross-Browser:** Chrome, Firefox, Safari

### Visual Regression Tests
- **Charts:** Screenshot charts, detect visual changes
- **Responsive:** Test mobile/tablet/desktop layouts
- **Dark Mode:** Test chart colors in dark mode

## Internationalization

### Number Formatting
- **Locale-Aware:** Use `Intl.NumberFormat`
- **Abbreviations:** 1.2K (en), 1,2k (fr)
- **Decimals:** Appropriate precision for locale

### Date/Time Formatting
- **Locale-Aware:** Use `Intl.DateTimeFormat`
- **Relative Times:** "2 hours ago" translated
- **Chart Axes:** Date format matches user locale

### Currency (Future)
- **If Pricing Shown:** Display in user's currency
- **Conversion:** Real-time exchange rates

## Browser Compatibility

### Modern Browsers
- **Chrome:** 90+
- **Firefox:** 88+
- **Safari:** 14+
- **Edge:** 90+

### Fallbacks
- **No Canvas:** Fallback to data tables
- **No JavaScript:** Show static message to enable JS
- **Old Browsers:** Polyfill for Intl APIs

## Performance Budget

### JavaScript Bundle
- **Chart Library:** ~50KB gzipped
- **Page Code:** < 30KB gzipped
- **Total:** < 100KB for page + charts

### API Response
- **Payload Size:** < 50KB JSON
- **Compression:** Gzip enabled
- **Response Time:** < 500ms P95

### Rendering
- **First Paint:** < 1 second
- **Interaction Ready:** < 2 seconds
- **Chart Animation:** 60fps

## Success Metrics

### User Engagement
- **Target:** 60% of users view usage stats weekly
- **Measurement:** Track page views

### Data Accuracy
- **Target:** < 0.1% discrepancy vs raw logs
- **Measurement:** Automated daily validation

### Performance
- **Target:** P95 load time < 2 seconds
- **Measurement:** RUM + synthetic monitoring

### User Satisfaction
- **Target:** < 2% error rate on page load
- **Measurement:** Track failed data fetches

## Constraints

### Data Retention
- **Raw Logs:** 90 days
- **Aggregated Data:** Indefinite
- **User Exports:** Generated on-demand (not stored)

### Rate Limits
- **API Calls:** 60/minute per user
- **Export:** 10/hour per user
- **Refresh:** 1/second per user

### Resource Limits
- **Memory:** Chart rendering < 100MB heap
- **CPU:** Rendering doesn't block main thread
- **Network:** < 100KB total transfer per page view


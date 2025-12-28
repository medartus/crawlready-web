# CrawlReady: Non-Functional Requirements (NFR)

**Version**: 1.0  
**Date**: December 28, 2024  
**Status**: Draft - Pending Approval  
**Dependencies**: Business Requirements Specification v1.0

---

## 1. Overview

### 1.1 Purpose

This document specifies the non-functional requirements for the CrawlReady pre-rendering proxy service, including:
- Performance requirements (latency, throughput, scalability)
- Security requirements (SSRF protection, authentication, data protection)
- Reliability requirements (uptime, error handling, failover)
- Maintainability requirements (code quality, logging, deployment)
- Operational requirements (monitoring, alerting, incident response)

### 1.2 Priority Levels

- **P0 (Critical)**: Must be implemented for MVP launch. Failure blocks release.
- **P1 (High)**: Should be implemented for MVP. Can be deferred if timeline at risk.
- **P2 (Medium)**: Nice to have for MVP. Target for Phase 2.
- **P3 (Low)**: Future enhancement. Not planned for first year.

---

## 2. Performance Requirements

### 2.1 Response Time (P0 - Critical)

**Cache Hit from Hot Cache** (Redis):
- **p50**: ≤30ms (from API request to HTML response start)
- **p95**: ≤100ms
- **p99**: ≤200ms
- **Max**: 500ms (fail if exceeded, check Redis health)

**Measurement**: End-to-end from API gateway to first byte sent to client.

**Test Method**: Artillery load test with 100 concurrent users, 1000 requests each, all cache hits.

---

**Cache Hit from Cold Storage** (Supabase):
- **p50**: ≤150ms
- **p95**: ≤300ms
- **p99**: ≤500ms
- **Max**: 1000ms

**Measurement**: Includes Supabase Storage download time + Redis promotion (async).

**Test Method**: Clear Redis cache, make requests to URLs in Supabase Storage.

---

**Cache Miss** (202 Response Only):
- **p50**: ≤50ms (queue job + return 202)
- **p95**: ≤150ms
- **p99**: ≤300ms

**Note**: Does NOT include render time (that's async).

---

**Fresh Render** (Async Job Completion):
- **p50**: ≤3s (from job start to completion)
- **p95**: ≤5s
- **p99**: ≤10s
- **Timeout**: 30s default, 60s extended (customer configurable)

**Measurement**: Time from worker picking up job to HTML stored in cache.

**Test Method**: Render 100 diverse URLs (e-commerce, news, SPA, static) and measure completion times.

---

**Job Status Check**:
- **p50**: ≤20ms
- **p95**: ≤50ms
- **p99**: ≤100ms

**Measurement**: PostgreSQL query time for job status.

---

**Cache Invalidation**:
- **p50**: ≤100ms (delete from Redis + queue Supabase delete)
- **p95**: ≤300ms
- **p99**: ≤500ms

**Note**: Supabase deletion is async (don't block response).

---

### 2.2 Throughput (P0 - Critical)

**MVP Scale** (First 3 months):
- **Sustained**: 1,000 renders/day (0.7 renders/minute average)
- **Peak**: 10 concurrent render jobs
- **Burst**: 50 requests/minute for cache hits
- **Infrastructure**: Single Fly.io worker (1 CPU, 512MB RAM)

**Post-MVP Scale** (Months 3-12):
- **Sustained**: 50,000 renders/day (35 renders/minute average)
- **Peak**: 100 concurrent render jobs
- **Burst**: 1,000 requests/minute for cache hits
- **Infrastructure**: 3 Fly.io workers + auto-scaling (up to 10)

**Enterprise Scale** (Year 2+):
- **Sustained**: 1M renders/day (700 renders/minute)
- **Peak**: 1,000 concurrent render jobs
- **Burst**: 10,000 requests/minute for cache hits
- **Infrastructure**: Multi-region deployment, AWS spot instances

---

### 2.3 Scalability (P1 - High)

**Horizontal Scaling**:
- **Workers**: Linear scaling up to 10 workers (no bottlenecks)
- **API**: Vercel Edge Functions scale automatically (no limit for MVP)
- **Database**: PostgreSQL on Supabase (scales to 100GB for MVP)
- **Queue**: Redis/BullMQ handles 10k jobs/hour per instance

**Vertical Scaling Limits** (MVP):
- **Worker**: 1 CPU, 512MB RAM → can scale to 2 CPU, 1GB if needed
- **Redis**: 1GB cache → can scale to 10GB (increase hot cache capacity)
- **Database**: 8GB RAM → can scale to 32GB (unlikely needed for MVP)

**Scaling Triggers**:
- **Add Worker**: When queue depth >20 jobs for >5 minutes
- **Increase Worker CPU**: When CPU >80% for >10 minutes
- **Increase Redis**: When eviction rate >10% (pages evicted before re-access)

---

### 2.4 Capacity Planning (P1 - High)

**Storage Growth** (per month):
- **Renders/month**: 30,000 (MVP), 1.5M (post-MVP)
- **New pages**: 20,000 (MVP), 1M (post-MVP)
- **Storage growth**: 10GB/month (MVP), 500GB/month (post-MVP)
- **Cost growth**: $0.21/month (MVP), $10.50/month (post-MVP)

**Database Growth**:
- **Rows/month**: 50,000 render_jobs (MVP), 2M (post-MVP)
- **Retention**: 30 days for completed jobs, 7 days for failed jobs
- **Partition strategy**: Partition render_jobs by month (post-MVP)

**Queue Capacity**:
- **Max queue depth**: 1000 jobs (MVP), 10k jobs (post-MVP)
- **Alert threshold**: 500 jobs (MVP), 5k jobs (post-MVP)
- **Overflow handling**: Return 503 if queue exceeds max

---

## 3. Security Requirements

### 3.1 SSRF Protection (P0 - Critical)

**Threat Model**: Attacker submits internal URL to access:
- Cloud metadata endpoints (169.254.169.254, metadata.google.internal)
- Internal services (localhost, 10.x.x.x, 192.168.x.x)
- Other customers' internal networks (172.16-31.x.x)

**Mitigation Layers**:

#### Layer 1: URL Validation (Edge API)
```typescript
const BLOCKED_HOSTNAMES = [
  // Loopback
  'localhost', '127.0.0.1', '::1', '0.0.0.0',
  
  // Private IPv4 (RFC 1918)
  '10.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
  '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
  '172.30.', '172.31.', '192.168.',
  
  // Link-local (RFC 3927)
  '169.254.',
  
  // Cloud metadata
  'metadata.google.internal',
  'metadata.google.com',
  'metadata',
  'instance-data', // AWS
  
  // Private TLDs
  '.local', '.internal', '.private',
];

function validateUrlSecurity(url: string): void {
  const parsed = new URL(url);
  
  // Check protocol
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new SSRFError('Only HTTP(S) protocols allowed');
  }
  
  // Check hostname
  const hostname = parsed.hostname.toLowerCase();
  for (const blocked of BLOCKED_HOSTNAMES) {
    if (hostname.includes(blocked)) {
      throw new SSRFError(`Hostname blocked: ${hostname}`);
    }
  }
  
  // Check for IP address format (reject private IPs)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    if (
      parts[0] === 10 || // 10.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
      parts[0] === 127 || // 127.0.0.0/8
      (parts[0] === 169 && parts[1] === 254) // 169.254.0.0/16
    ) {
      throw new SSRFError('Private IP address blocked');
    }
  }
}
```

#### Layer 2: DNS Resolution Check (Worker)
```typescript
import dns from 'dns/promises';

async function verifyPublicIP(hostname: string): Promise<void> {
  try {
    const addresses = await dns.resolve4(hostname);
    
    for (const ip of addresses) {
      const parts = ip.split('.').map(Number);
      
      // Check if any resolved IP is private
      if (
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        parts[0] === 127 ||
        (parts[0] === 169 && parts[1] === 254)
      ) {
        throw new SSRFError(`Hostname resolves to private IP: ${ip}`);
      }
    }
  } catch (error) {
    if (error instanceof SSRFError) throw error;
    // DNS resolution failed, let it through (might be temporary DNS issue)
    logger.warn('DNS resolution failed', { hostname, error });
  }
}
```

#### Layer 3: Network Isolation (Infrastructure)
- Render workers deployed in isolated VPC (no access to internal services)
- Workers cannot access Fly.io internal network
- Workers cannot access other customer workers
- Egress filtering: Only ports 80/443 allowed

**Testing**:
- Automated tests for all blocked hostnames
- Penetration testing before launch
- Bug bounty program (Phase 2)

---

### 3.2 Authentication (P0 - Critical)

**API Key Requirements**:
- **Format**: `sk_{test|live}_{32_base64url_chars}` (e.g., `sk_live_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6`)
- **Entropy**: 192 bits (cryptographically secure)
- **Storage**: SHA-256 hash only (never plaintext in database)
- **Transmission**: HTTPS only, Bearer token in Authorization header

**Generation**:
```typescript
import crypto from 'crypto';

function generateApiKey(tier: 'free' | 'pro' | 'enterprise'): ApiKey {
  const random = crypto.randomBytes(24); // 192 bits
  const prefix = tier === 'free' ? 'test' : 'live';
  const key = `sk_${prefix}_${random.toString('base64url')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const displayPrefix = key.slice(0, 15) + '...''; // "sk_live_abc123..."
  
  return { key, hash, displayPrefix };
}
```

**Verification** (timing-safe):
```typescript
function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const computedHash = crypto.createHash('sha256').update(providedKey).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}
```

**Key Rotation**:
- Customers can generate multiple keys (max 5 per account)
- Old keys can be revoked instantly
- No automatic expiration (manual revocation only for MVP)

---

### 3.3 Rate Limiting (P0 - Critical)

**Algorithm**: Sliding window counter (Redis-based)

**Limits by Tier**:
- **Free**: 100 renders/day
- **Pro**: 10,000 renders/day
- **Enterprise**: Custom (100k+ renders/day)

**Implementation**:
```typescript
async function checkRateLimit(apiKeyId: string, dailyLimit: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - (24 * 60 * 60 * 1000); // 24 hours
  const key = `ratelimit:${apiKeyId}`;
  
  // Sorted set: score = timestamp, value = unique request ID
  await redis.zadd(key, now, `${now}:${Math.random()}`);
  await redis.zremrangebyscore(key, 0, windowStart);
  const count = await redis.zcard(key);
  await redis.expire(key, 25 * 60 * 60); // 25 hours
  
  const allowed = count <= dailyLimit;
  const resetAt = new Date(windowStart + (24 * 60 * 60 * 1000));
  
  if (!allowed) {
    logger.warn('Rate limit exceeded', { apiKeyId, count, limit: dailyLimit });
  }
  
  return {
    allowed,
    limit: dailyLimit,
    used: count,
    remaining: Math.max(0, dailyLimit - count),
    resetAt
  };
}
```

**Response** (429):
```json
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "used": 100,
  "remaining": 0,
  "resetAt": "2024-12-29T00:00:00Z",
  "upgradeUrl": "https://crawlready.com/pricing"
}
```

**Headers**:
- `X-RateLimit-Limit`: Daily limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until reset

---

### 3.4 Data Protection (P1 - High)

**Encryption at Rest**:
- **Database**: Supabase PostgreSQL encrypted by default (AES-256)
- **Storage**: Supabase Storage encrypted by default (AES-256)
- **Redis**: Upstash Redis encrypted at rest (AES-256)

**Encryption in Transit**:
- **API**: TLS 1.3 only (disable TLS 1.2 and lower)
- **Database**: SSL connections enforced
- **Storage**: HTTPS only for uploads/downloads

**Data Retention**:
- **Rendered HTML**: Permanent (until customer deletes)
- **Render jobs**: 30 days (completed), 7 days (failed)
- **Cache access logs**: 90 days
- **Usage metrics**: 2 years (aggregated daily)

**Data Deletion**:
- **Customer request**: Delete all data within 7 days
- **GDPR compliance**: Provide data export (JSON format)
- **Account closure**: Automatic deletion after 30 days

**PII Handling**:
- **API keys**: Hashed (SHA-256), not reversible
- **Customer emails**: Encrypted at rest (Supabase default)
- **URLs**: May contain PII (e.g., ?user=john) - customer responsible
- **Logs**: Never log full URLs (log normalized URL only)

---

### 3.5 DDoS Protection (P1 - High)

**Layer 1: Cloudflare WAF**
- Deploy Cloudflare in front of API (api.crawlready.com)
- Enable rate limiting rules:
  - 100 requests/minute per IP
  - 1000 requests/hour per IP
- Block known malicious IPs (Cloudflare threat intelligence)
- Challenge suspicious traffic (CAPTCHA)

**Layer 2: Application Rate Limiting**
- Per API key: 100-10k renders/day (tier-based)
- Per IP: 1000 requests/hour (anonymous requests)
- Global: 10k renders/hour (circuit breaker)

**Layer 3: Queue Overflow Protection**
- Max queue depth: 1000 jobs (MVP)
- If exceeded: Return 503 Service Unavailable
- Monitor queue depth, alert if >500 jobs

**Layer 4: Worker Protection**
- Auto-scaling: Scale up to 10 workers
- If all workers busy >5 minutes: Alert ops team
- Circuit breaker: Stop accepting jobs if error rate >20%

---

## 4. Reliability Requirements

### 4.1 Uptime (P0 - Critical)

**MVP Target**: 99% uptime (SLO, not SLA)
- **Acceptable downtime**: 7.2 hours/month
- **Measurement**: Uptime Robot (1-minute checks)
- **Scope**: API availability (200/202 responses)

**Post-MVP Target**: 99.5% uptime
- **Acceptable downtime**: 3.6 hours/month

**Enterprise Target**: 99.9% uptime (SLA)
- **Acceptable downtime**: 43 minutes/month
- **Financial penalties**: 10% credit per 0.1% below SLA

**Exclusions** (not counted as downtime):
- Scheduled maintenance (announced 7 days prior)
- Customer site errors (4xx/5xx from origin)
- Force majeure (cloud provider outages)

---

### 4.2 Error Handling (P0 - Critical)

**Render Success Rate**: >95%
- **Measurement**: Successful renders / total render attempts
- **Exclude**: Customer site errors (404, 500, timeout at origin)
- **Include**: Worker crashes, timeout in Puppeteer, storage failures

**Error Categories**:

| Error Type | Retry? | Customer Action |
|------------|--------|-----------------|
| Render timeout (30s) | Yes (once, 60s timeout) | Increase timeout or optimize site |
| Network error (DNS, connection) | Yes (3x, exponential backoff) | Check URL is publicly accessible |
| 4xx from origin | No | Fix origin site error |
| 5xx from origin | Yes (2x) | Fix origin site error |
| Worker crash | Yes (3x, new worker) | Contact support if persists |
| Storage write failure | Yes (2x) | Contact support |

**Graceful Degradation**:
- If Redis down: Skip hot cache, read from Supabase only
- If Supabase Storage down: Queue renders, retry when back online
- If all workers down: Return 503, queue jobs for later processing

---

### 4.3 Monitoring & Alerting (P0 - Critical)

**Metrics to Track**:

| Metric | Tool | Alert Threshold | Action |
|--------|------|-----------------|--------|
| API uptime | Uptime Robot | <99% in 1 hour | Page on-call engineer |
| Response time (p95) | Axiom | >200ms for 5 min | Investigate Redis/Supabase |
| Error rate | Sentry | >5% for 5 min | Check worker health |
| Queue depth | Redis | >500 jobs | Scale up workers |
| Cache hit rate | PostgreSQL | <40% for 1 day | Investigate cache eviction |
| Worker CPU | Fly.io | >80% for 10 min | Scale up worker resources |
| Storage usage | Supabase | >80% of quota | Upgrade plan or alert customer |

**Dashboards**:
- **Real-time**: Vercel Analytics (API requests, latency)
- **Errors**: Sentry (exceptions, error rates)
- **Logs**: Axiom (structured logs, search/filter)
- **Infrastructure**: Fly.io dashboard (worker health, CPU, memory)

**On-Call**:
- **MVP**: Best-effort response (no formal on-call)
- **Post-MVP**: 1 engineer on-call 24/7 (rotating weekly)
- **Response time**: <30 minutes for critical alerts

---

### 4.4 Backup & Recovery (P1 - High)

**Database Backups**:
- **Frequency**: Daily automatic (Supabase default)
- **Retention**: 7 days (MVP), 30 days (post-MVP)
- **Testing**: Restore test quarterly

**Storage Backups**:
- **Rendered HTML**: Not backed up (can re-render if lost)
- **Rationale**: Storage is permanent, re-rendering is idempotent
- **Exception**: Enterprise customers can opt-in to S3 cross-region replication

**Recovery Time Objectives**:
- **RTO (Recovery Time Objective)**: 4 hours (MVP), 1 hour (post-MVP)
- **RPO (Recovery Point Objective)**: 24 hours (MVP), 1 hour (post-MVP)

**Disaster Recovery Plan**:
1. If Vercel down: Deploy to backup provider (Railway) - 2 hours
2. If Supabase down: Restore from backup to new instance - 4 hours
3. If Fly.io down: Deploy workers to AWS EC2 - 4 hours

---

## 5. Maintainability Requirements

### 5.1 Code Quality (P1 - High)

**Language**: TypeScript (strict mode)

**Linting**: ESLint + Prettier
```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/strict-boolean-expressions": "error"
  }
}
```

**Testing**:
- **Unit tests**: 80%+ coverage (critical paths only for MVP)
- **Integration tests**: API endpoints, cache logic, queue processing
- **E2E tests**: Full render flow (API → queue → worker → cache)
- **Framework**: Vitest (unit), Playwright (E2E)

**Test Pyramid** (MVP):
- 50 unit tests (fast, isolated)
- 20 integration tests (database, Redis, Supabase)
- 10 E2E tests (full flow)

---

### 5.2 Logging (P0 - Critical)

**Tool**: Axiom (structured JSON logs)

**Log Levels**:
- **ERROR**: Exceptions, failed renders, storage errors
- **WARN**: Rate limits exceeded, slow responses (>500ms), high queue depth
- **INFO**: Render completed, cache hit/miss, API requests
- **DEBUG**: Detailed execution (disabled in production)

**Structured Format**:
```typescript
logger.info('Render completed', {
  jobId: 'abc123',
  normalizedUrl: 'https://example.com/page',
  renderTime: 2340,
  htmlSize: 245678,
  cacheKey: 'render:v1:...',
  workerId: 'fly-sjc-001',
  timestamp: new Date().toISOString(),
});
```

**Never Log**:
- Full API keys (log prefix only: "sk_live_abc...")
- Full HTML content (log size only)
- Customer PII (emails, names, addresses)
- Sensitive query params (passwords, tokens)

**Log Retention**: 30 days (MVP), 90 days (post-MVP)

---

### 5.3 Deployment (P0 - Critical)

**CI/CD Pipeline**:
1. Push to `main` branch
2. Run linter + tests (GitHub Actions)
3. If pass: Deploy to Vercel (automatic)
4. Run smoke tests (10 API requests)
5. If fail: Auto-rollback to previous version

**Environments**:
- **Production**: `api.crawlready.com` (Vercel)
- **Staging**: Not needed for MVP (deploy to production directly)
- **Development**: Local (Docker Compose for dependencies)

**Deployment Frequency**:
- **MVP**: Daily deploys (after testing)
- **Post-MVP**: Multiple deploys per day (CI/CD fully automated)

**Rollback**:
- **Vercel**: Instant rollback to previous deployment (1 click)
- **Fly.io**: `fly deploy --image <previous_image>` (2 minutes)
- **Database**: Manual restore from backup (do not auto-rollback)

**Zero-Downtime**:
- **API**: Vercel handles automatically (gradual rollout)
- **Workers**: Deploy new workers, drain old workers, then terminate

---

### 5.4 Documentation (P1 - High)

**API Documentation**:
- OpenAPI 3.0 spec (generate from TypeScript types)
- Hosted at `docs.crawlready.com`
- Interactive (Swagger UI or similar)
- Code examples (cURL, JavaScript, Python)

**Integration Guide**:
- `documentation/specs/integration-guide.md`
- Step-by-step instructions (Next.js, Express, Rails)
- Bot detection patterns
- Troubleshooting section

**Internal Documentation**:
- Architecture decision records (ADRs)
- Runbooks for common incidents
- Onboarding guide for new engineers

**Code Comments**:
- JSDoc for all public functions
- Inline comments for complex logic
- No comments for obvious code

---

## 6. Operational Requirements

### 6.1 Cost Monitoring (P1 - High)

**Budget** (MVP):
- **Target**: $120/month
- **Alert**: $150/month (25% overage)
- **Hard limit**: $200/month (emergency shutdown)

**Cost Breakdown**:
| Service | Monthly Cost | Alert Threshold |
|---------|--------------|-----------------|
| Vercel | $20 | $30 |
| Upstash Redis | $20 | $40 |
| Fly.io Workers | $40 | $80 |
| Supabase | $25 | $50 |
| Cloudflare | $15 | $25 |
| **Total** | **$120** | **$150** |

**Cost Per Customer** (target):
- Revenue: $49/month (Pro tier)
- Infrastructure cost: $12/customer
- Gross margin: 75%

---

### 6.2 Incident Response (P1 - High)

**Severity Levels**:

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| P0 (Critical) | Service down for all customers | 15 minutes | API returning 500 |
| P1 (High) | Degraded performance affecting >50% customers | 30 minutes | p95 latency >1s |
| P2 (Medium) | Feature broken, workaround available | 2 hours | Cache invalidation failing |
| P3 (Low) | Minor bug, low customer impact | Next business day | UI typo in admin |

**Incident Process**:
1. **Detection**: Alert triggers (monitoring) or customer report
2. **Triage**: Determine severity (5 minutes)
3. **Response**: Engineer investigates (within response time SLA)
4. **Mitigation**: Apply temporary fix (e.g., rollback, scale up)
5. **Resolution**: Apply permanent fix
6. **Postmortem**: Write incident report (P0/P1 only)

**Communication** (P0/P1):
- Status page update (status.crawlready.com - Phase 2)
- Email to affected customers
- Twitter announcement (if widespread)

---

### 6.3 Capacity Management (P2 - Medium)

**Monitoring**:
- Track monthly usage growth (renders, storage, customers)
- Forecast 3 months ahead (linear extrapolation)
- Alert if growth >50% above forecast

**Scaling Plan**:
- Review capacity every month
- Provision new resources 2 weeks before needed
- Test scaling in staging (Phase 2)

**Cost Optimization**:
- Review cloud bills monthly
- Identify waste (unused resources, over-provisioned)
- Negotiate volume discounts at scale (Phase 2)

---

## 7. Compliance Requirements

### 7.1 GDPR (P2 - Medium, Required for EU customers)

**Data Subject Rights**:
- Right to access: Export customer data (JSON format)
- Right to deletion: Delete all data within 30 days
- Right to portability: Provide rendered HTML as ZIP archive

**Legal Basis**: Legitimate interest (service provision)

**Data Processing Agreement** (DPA): Use Supabase's DPA (sub-processor)

**Implementation** (Phase 2):
- Add GDPR consent checkbox to signup
- Implement data export API
- Add "Delete My Data" button to admin

---

### 7.2 SOC 2 (P3 - Low, Required for enterprise sales)

**Not planned for MVP**. Target: Year 2.

**Requirements**:
- Security controls documentation
- Third-party audit (6-12 months, $50-100k)
- Continuous monitoring and evidence collection

---

## 8. Success Criteria Summary

**Critical (Must Pass for MVP Launch)**:
- [ ] Cache hit latency p95 <100ms (hot), <300ms (cold)
- [ ] Fresh render completion p95 <5s
- [ ] SSRF protection: Pass penetration test (all attack vectors blocked)
- [ ] API uptime >99% in beta period (4 weeks)
- [ ] Error rate <5% (excluding customer site errors)
- [ ] Rate limiting: Enforced correctly, no bypass possible

**High Priority (Should Pass, Acceptable to Defer)**:
- [ ] Render success rate >95%
- [ ] Load test: 100 concurrent users, no errors
- [ ] Monitoring: Alerts working, dashboards populated
- [ ] Documentation: API docs complete, integration guide tested

**Medium Priority (Nice to Have)**:
- [ ] Test coverage >80%
- [ ] Cost <$150/month in first 3 months
- [ ] Incident response <30 minutes (P1 incidents)

---

## 9. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-28 | 1.0 | System | Initial draft |

---

## 10. References

- Business Requirements: `documentation/specs/business-requirements.md`
- Functional Specification: `documentation/specs/functional-spec.md`
- Database Schema: `documentation/specs/database-schema.md` (to be written)
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Cloud Security Alliance: https://cloudsecurityalliance.org/

---

**Document Status**: DRAFT - Pending stakeholder review


# CrawlReady Sales Playbook

**Last Updated:** January 2026
**Document Owner:** Sales/Growth Team
**Review Cycle:** Quarterly

---

## Sales Philosophy

### Product-Led, Sales-Assisted

CrawlReady is a PLG product. Most customers self-serve. Sales adds value for:
- Enterprise accounts (>$500/mo)
- Complex use cases
- High-touch prospects who request it

### When to Engage

**DO Engage:**
- Prospect requests demo/call
- Enterprise inquiry (>100K renders)
- High-intent signals (multiple pricing page visits)
- Complex technical questions

**DON'T Engage:**
- Every trial signup (let product do the work)
- Low-intent browsers
- Outside ICP (non-JavaScript sites)

---

## Ideal Customer Profile (ICP)

### Primary ICP

| Attribute | Criteria |
|-----------|----------|
| Company Type | SaaS, E-commerce, Content Publisher |
| Tech Stack | React, Vue, Angular, Next.js, Nuxt |
| Team Size | 5-100 employees |
| Revenue | $500K-$50M ARR |
| Decision Maker | CTO, VP Engineering, VP Marketing |
| Pain | Invisible to AI search |
| Budget | $49-$999/mo |

### Qualification Questions

1. "Do you use a JavaScript framework for your website?" (Must be yes)
2. "Are you concerned about visibility in AI search like ChatGPT?" (Should be yes)
3. "Do you have authority to approve a $49-500/mo tool purchase?" (Should be yes)
4. "What's your timeline for addressing AI search visibility?" (Ideally <30 days)

### Disqualification Criteria

**Not a fit if:**
- Static HTML website (no JavaScript)
- Already using SSR properly
- No budget authority
- Timeline >6 months
- Company <5 people (usually self-serve)

---

## Sales Process

### Overview

```
Discovery → Demo → Technical Validation → Proposal → Close
   (1 call)   (1 call)      (async)        (email)   (async)
```

**Total Timeline:** 2-4 weeks for mid-market, 4-8 weeks for enterprise

### Stage 1: Discovery (30 minutes)

**Goals:**
- Understand their current situation
- Identify pain points
- Qualify opportunity
- Schedule demo if qualified

**Discovery Questions:**

**Situation:**
- "Tell me about your website/product."
- "What JavaScript framework do you use?"
- "How many pages does your site have?"

**Problem:**
- "Have you noticed any issues with AI search visibility?"
- "Do you appear in ChatGPT answers for relevant queries?"
- "How are competitors performing in AI search?"

**Impact:**
- "What's the business impact of being invisible to AI search?"
- "What percentage of your traffic comes from organic search?"
- "How important is AI search to your growth strategy?"

**Timeline:**
- "What's driving the urgency to address this?"
- "Who else is involved in this decision?"
- "What would success look like for you?"

**Red Flags:**
- Can't articulate the problem
- No budget authority
- "Just exploring" with no timeline
- Website isn't JavaScript-heavy

### Stage 2: Demo (45 minutes)

**Structure:**

**Opening (5 min):**
- Confirm agenda
- Verify attendees and roles
- Set expectations

**Discovery Recap (5 min):**
- Summarize what you learned
- Confirm understanding
- Address any changes

**Demo (25 min):**
1. **Problem Visualization (5 min)**
   - Show their site returning blank to AI crawlers
   - Use AI Crawler Checker tool
   - Make the problem real

2. **Solution Walkthrough (15 min)**
   - Quick integration demo
   - Show rendered content
   - Dashboard tour
   - Analytics overview

3. **Unique Features (5 min)**
   - Citation tracking (if Growth+ tier)
   - AI crawler analytics
   - Competitive advantages

**Q&A (10 min):**
- Technical questions
- Pricing questions
- Implementation questions

**Next Steps (5 min):**
- Summarize value
- Propose trial/pilot
- Schedule follow-up

**Demo Best Practices:**
- Use THEIR website if possible
- Show real data, not fake demos
- Let them ask questions
- Don't oversell—be honest about limitations

### Stage 3: Technical Validation

**For Simple Cases (Self-Serve):**
- Point to documentation
- Offer to answer questions via email
- Let them try free tier

**For Complex Cases (Sales-Assisted):**
- Pair with engineering for technical call
- Create proof-of-concept
- Address specific integration concerns

**Common Technical Concerns:**

| Concern | Response |
|---------|----------|
| "How does it work with our CDN?" | "Works alongside—we handle crawler requests only" |
| "What about our authentication?" | "Crawlers see public pages; authenticated pages excluded" |
| "Performance impact?" | "Zero for users—only crawlers hit our service" |
| "Data security?" | "We cache rendered HTML, not your data. Encrypted in transit/rest." |

### Stage 4: Proposal

**For Self-Serve (<$200/mo):**
- Point to pricing page
- Answer any questions
- Let them upgrade themselves

**For Sales-Assisted ($200-$1K/mo):**
- Send pricing summary email
- Include: tier, price, what's included
- Highlight ROI/value

**For Enterprise (>$1K/mo):**
- Custom proposal document
- Include: pricing, SLA, support terms
- Multiple stakeholder alignment

**Proposal Email Template:**

```
Subject: CrawlReady Proposal for [Company]

Hi [Name],

Thanks for the great conversation. Here's my recommended plan:

**Recommended Plan: Growth ($149/mo)**
- 100,000 renders/month
- AI citation tracking
- Schema injection
- Priority support
- 3 domains included

**Why Growth:** Based on your [X pages] and [Y traffic],
this gives you room to grow while accessing citation tracking.

**Next Steps:**
1. Start free trial (link)
2. Schedule implementation call
3. Go live in <1 week

Questions? Reply here or book time: [calendar link]

Best,
[Name]
```

### Stage 5: Close

**Self-Serve:**
- Follow up if they haven't upgraded after 7 days
- Offer help with setup
- Answer any blocking questions

**Sales-Assisted:**
- Handle final objections
- Confirm decision maker buy-in
- Process payment

**Enterprise:**
- Navigate procurement
- Handle security reviews
- Coordinate legal/contracts

---

## Objection Handling

### Price Objections

**"It's too expensive"**
> "Let me understand—what's your benchmark? Compared to DIY ($100K+) or the cost of being invisible to 800M ChatGPT users, $49/mo is quite affordable. What would make this a no-brainer for you?"

**"We need to get budget approval"**
> "Totally understand. Who needs to approve? Can I provide any materials to help make the case? Many CTOs approve this on a credit card given the ROI."

### Technical Objections

**"We'll build it ourselves"**
> "You absolutely could. The question is: should your engineers spend 6 months on rendering infrastructure, or 6 months on your product? We've already solved this problem—let us handle it for $49/mo."

**"We're planning to migrate to SSR"**
> "SSR is great for performance—but it doesn't solve AI crawler optimization. AI crawlers still need specific handling. Plus, SSR migrations take 6+ months. You could be visible in AI search next week with CrawlReady."

### Timing Objections

**"Not a priority right now"**
> "I get it—lots of priorities. Quick question: are your competitors appearing in ChatGPT answers? Because they're building that advantage every day you wait. What would need to change for this to become a priority?"

**"We need to evaluate other options"**
> "Absolutely. Who else are you looking at? Happy to share how we compare. Most customers tell me the AI-specific features—citation tracking, LLM schemas—are what make us different."

### Competitive Objections

**"Prerender.io is more established"**
> "They're established in SEO—but AI search is new, and we're the specialists. They don't have citation tracking. They don't have LLM-optimized schemas. We're 46% cheaper on overages. What matters most to you?"

**"We're already using [competitor]"**
> "How's that working for your AI search visibility? Do you know which AI crawlers are visiting? Can you track ChatGPT citations? Those are the gaps we fill."

---

## Demo Script Framework

### Opening
> "Thanks for taking the time today. I'm excited to show you how CrawlReady can help [Company] appear in AI search answers. Before I dive in, can you tell me what you most want to see today?"

### Problem Visualization
> "Let me show you something interesting. I'm going to run your website through our AI Crawler Checker. This simulates what GPTBot—ChatGPT's crawler—sees when it visits your site... [run tool]... See this? It's seeing [blank/partial content]. That's what ChatGPT knows about you right now."

### Solution Demo
> "Now let me show you the same page after CrawlReady renders it... [show rendered version]... This is what ChatGPT will see. All your content, properly structured, ready to be cited in AI answers."

### Dashboard
> "Here's your dashboard. You'll see exactly which AI crawlers are visiting—GPTBot, ClaudeBot, PerplexityBot—how many renders you're using, and your cache performance. Everything you need to monitor your AI visibility."

### Closing
> "Based on what you've told me, I'd recommend [tier]. That gives you [key benefits]. What questions do you have?"

---

## Success Metrics

### Sales Efficiency
| Metric | Target |
|--------|--------|
| Discovery→Demo | 50% |
| Demo→Trial | 70% |
| Trial→Paid | 30% |
| Average Sales Cycle | 14 days (SMB), 45 days (Enterprise) |

### Revenue Metrics
| Metric | Target |
|--------|--------|
| ACV (Self-Serve) | $600-1,200 |
| ACV (Sales-Assisted) | $2,400-6,000 |
| ACV (Enterprise) | $12,000+ |

### Activity Metrics
| Metric | Target |
|--------|--------|
| Discovery Calls/Week | 10 |
| Demos/Week | 5 |
| Proposals/Week | 3 |
| Closes/Week | 2 |

---

## CRM & Tools

### Required Tools
- **CRM:** HubSpot Free (upgrade later)
- **Calendar:** Calendly
- **Video:** Zoom/Google Meet
- **Proposals:** Google Docs/Notion

### Data to Track
- Lead source
- Company size
- Tech stack
- Pain points
- Decision timeline
- Competition
- Outcome and reason

---

## Sales Resources

### Collateral
- [ ] One-pager (PDF)
- [ ] Pricing summary
- [ ] ROI calculator
- [ ] Case studies (when available)
- [ ] Security documentation
- [ ] Technical FAQ

### Demo Environment
- [ ] Demo account with sample data
- [ ] AI Crawler Checker tool
- [ ] Competitor comparison data
- [ ] Performance benchmarks

---

*Sales is about helping customers succeed. If CrawlReady isn't right for them, tell them. Build trust for the long term.*

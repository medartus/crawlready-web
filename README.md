# CrawlReady

**Get Cited in ChatGPT Answers—Without Rebuilding Your Site**

CrawlReady makes JavaScript websites visible to AI search engines like ChatGPT, Perplexity, and Claude. Most modern websites use React, Vue, or Angular, but AI crawlers can't render JavaScript—your content is invisible to 800M+ ChatGPT users.

---

## The Problem

| AI Crawler | Renders JavaScript? |
|------------|:-------------------:|
| GPTBot (OpenAI) | No |
| ClaudeBot (Anthropic) | No |
| PerplexityBot | No |
| AppleBot-Extended | No |
| Googlebot | Yes |

**98.9% of websites use JavaScript frameworks. Only 31% of AI crawlers can render it.**

Your React/Vue/Angular site returns a blank page to ChatGPT. Your competitors with static sites are getting cited—you're not.

---

## The Solution

CrawlReady automatically:
- Detects 15+ AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- Renders your JavaScript in <200ms
- Caches responses for 70%+ cache hit rate
- Tracks when AI platforms cite your content

**Setup in 5 minutes. No code changes. No rebuild required.**

---

## Key Features

| Feature | Description |
|---------|-------------|
| AI Crawler Detection | Automatic detection of 15+ AI crawlers |
| Fast Rendering | <200ms p95 render speed |
| Citation Tracking | See when ChatGPT mentions you |
| LLM-Optimized Schemas | Auto-inject structured data for AI |
| Real-time Analytics | Monitor AI crawler activity |
| Multi-Platform | ChatGPT, Perplexity, Claude, Gemini |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/crawlready-web.git
cd crawlready-web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Setup

See [documentation/05-reference/ENVIRONMENT_VARIABLES.md](./documentation/05-reference/ENVIRONMENT_VARIABLES.md) for detailed configuration.

### Onboarding

New users are guided through a 4-step wizard:

1. **Add website URL** - Enter your site's domain
2. **See AI visibility problems** - View side-by-side comparison of user view vs crawler view
3. **Copy integration code** - Get framework-specific code snippets (Next.js, React, etc.)
4. **Verify integration** - Confirm CrawlReady is working on your site

See [Onboarding Strategy](./documentation/01-product/onboarding-strategy.md) for details on the user activation flow.

---

## Project Structure

```
crawlready-web/
├── apps/
│   ├── web/                    # Next.js web application
│   └── render-worker/          # Puppeteer rendering service
├── packages/                   # Shared packages
├── documentation/              # Project documentation
│   ├── 00-strategy/            # Business strategy
│   ├── 01-product/             # Product strategy
│   ├── 02-go-to-market/        # Marketing & sales
│   ├── 03-brand/               # Brand guidelines
│   ├── 04-technical/           # Technical docs & specs
│   └── 05-reference/           # Setup & deployment guides
├── migrations/                 # Database migrations
└── tests/                      # Test suites
```

---

## Documentation

| Section | Description | Link |
|---------|-------------|------|
| Strategy | Vision, market analysis, personas | [00-strategy/](./documentation/00-strategy/) |
| Product | Roadmap, MVP definition | [01-product/](./documentation/01-product/) |
| Go-to-Market | Positioning, playbooks | [02-go-to-market/](./documentation/02-go-to-market/) |
| Brand | Brand guidelines | [03-brand/](./documentation/03-brand/) |
| Technical | Architecture, specs | [04-technical/](./documentation/04-technical/) |
| Reference | Setup guides, deployment | [05-reference/](./documentation/05-reference/) |

**Start here:** [documentation/README.md](./documentation/README.md)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, Shadcn UI |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Clerk |
| Rendering | Puppeteer |
| Queue | BullMQ |
| Analytics | PostHog |
| Monitoring | Sentry |
| Deployment | Vercel (web), Render (worker) |

---

## Development

### Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests

# Code Quality
npm run lint             # Run ESLint
npm run format           # Run Prettier
npm run typecheck        # Run TypeScript check
```

### Testing

```bash
# Unit tests with Vitest
npm run test

# E2E tests with Playwright
npx playwright install   # First time only
npm run test:e2e
```

---

## Deployment

See [documentation/05-reference/DEPLOYMENT.md](./documentation/05-reference/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Web App (Vercel)**
   - Connect repository to Vercel
   - Set environment variables
   - Deploy

2. **Render Worker (Render)**
   - Create Docker service
   - Configure environment
   - Deploy

---

## Key Metrics

| Metric | Target |
|--------|--------|
| Render Speed (p95) | <200ms |
| Uptime | 99.9% |
| Cache Hit Rate | >70% |
| Time to Value | <5 minutes |

---

## Market Opportunity

- **$750B** AI search market by 2028
- **800M** weekly ChatGPT users
- **31%** AI crawlers that render JavaScript
- **98.9%** websites using JavaScript frameworks

---

## Pricing

| Plan | Price | Renders/Month |
|------|-------|---------------|
| Free | $0 | 1,000 |
| Starter | $49 | 25,000 |
| Growth | $149 | 100,000 |
| Scale | $399 | 500,000 |
| Enterprise | Custom | Unlimited |

---

## Contributing

We welcome contributions! Please see our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

## Support

- **Documentation:** [documentation/](./documentation/)
- **Issues:** [GitHub Issues](https://github.com/your-org/crawlready-web/issues)
- **Email:** support@crawlready.com

---

**Built for the AI search era.**

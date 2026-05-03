'use client';

import { Github, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const LandingFooter = () => {
  const pathname = usePathname();
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    if (pathname !== '/' && !pathname.match(/^\/[a-z]{2}\/?$/)) {
      router.push(`/#${sectionId}`);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const linkClass = 'text-sm text-cr-fg-secondary transition-colors hover:text-cr-primary';

  return (
    <footer className="border-t border-cr-border bg-cr-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-bold text-cr-fg">
              CrawlReady
            </Link>
            <p className="mt-4 text-sm text-cr-fg-secondary">
              See what AI actually sees on your site.
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href="https://twitter.com/medartus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cr-fg-muted transition-colors hover:text-cr-primary"
                aria-label="Follow @medartus on Twitter"
              >
                <Twitter className="size-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/marcetiennedartus/?locale=en_US"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cr-fg-muted transition-colors hover:text-cr-primary"
                aria-label="Connect on LinkedIn"
              >
                <Linkedin className="size-5" />
              </a>
              <a
                href="https://github.com/medartus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cr-fg-muted transition-colors hover:text-cr-primary"
                aria-label="CrawlReady on GitHub"
              >
                <Github className="size-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cr-fg">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className={linkClass}>
                  Features
                </button>
              </li>
              <li>
                <Link href="/docs" className={linkClass}>Documentation</Link>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('faq')} className={linkClass}>
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cr-fg">
              Free Tools
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/crawler-checker" className={linkClass}>AI Crawler Checker</Link>
              </li>
              <li>
                <Link href="/schema-checker" className={linkClass}>Schema Markup Analyzer</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cr-fg">
              Company
            </h3>
            <ul className="space-y-3">
              <li><Link href="/about" className={linkClass}>About</Link></li>
              <li><Link href="/blog" className={linkClass}>Blog</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cr-fg">
              Legal
            </h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={linkClass}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-cr-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-cr-fg-secondary">
              ©
              {' '}
              {new Date().getFullYear()}
              {' '}
              CrawlReady. All rights reserved.
            </p>
            <p className="text-sm text-cr-fg-muted">
              Built by
              {' '}
              <a
                href="https://twitter.com/medartus"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-cr-primary hover:text-cr-primary-hover"
              >
                @medartus
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

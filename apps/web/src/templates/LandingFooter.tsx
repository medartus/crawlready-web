'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const LandingFooter = () => {
  const pathname = usePathname();
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    // If not on home page, navigate to home first
    if (pathname !== '/' && !pathname.match(/^\/[a-z]{2}\/?$/)) {
      router.push(`/#${sectionId}`);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                CrawlReady
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Make your JavaScript site visible to AI search engines. Get cited in ChatGPT answers.
            </p>
            {/* <div className="mt-6 flex gap-4">
              <a
                href="https://twitter.com/crawlready"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                aria-label="Twitter"
              >
                <Twitter className="size-5" />
              </a>
              <a
                href="https://linkedin.com/company/crawlready"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-5" />
              </a>
              <a
                href="https://github.com/crawlready"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                aria-label="GitHub"
              >
                <Github className="size-5" />
              </a>
            </div> */}
          </div>

          {/* Product Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Features
                </button>
              </li>
              {/* <li>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Pricing
                </button>
              </li> */}
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('demo')}
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Demo
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('faq')}
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Tools Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Free Tools
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/crawler-checker"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  AI Crawler Checker
                </Link>
              </li>
              <li>
                <Link
                  href="/schema-checker"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Schema Markup Analyzer
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          {/* <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Legal Column */}
          {/* <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div> */}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ©
              {' '}
              {new Date().getFullYear()}
              {' '}
              CrawlReady. All rights reserved.
            </p>
            <div className="flex gap-6">
              {/* <Link
                href="/sitemap"
                className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
              >
                Sitemap
              </Link> */}
              {/* <Link
                href="/status"
                className="text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
              >
                Status
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

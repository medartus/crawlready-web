'use client';

import { Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';

export const LandingNavbar = () => {
  const t = useTranslations('LandingNavbar');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    if (pathname !== '/' && !pathname.match(/^\/[a-z]{2}\/?$/)) {
      router.push(`/#${sectionId}`);
      setMobileMenuOpen(false);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const navLinks: Array<{ label: string; href: string; isExternal?: boolean }> = [
    { label: t('features'), href: '#features' },
    { label: t('faq'), href: '#faq' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-cr-border bg-cr-bg/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-cr-fg">
            CrawlReady
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(link => (
              link.isExternal
                ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm font-medium text-cr-fg-secondary transition-colors hover:text-cr-primary"
                    >
                      {link.label}
                    </Link>
                  )
                : (
                    <button
                      type="button"
                      key={link.href}
                      onClick={() => scrollToSection(link.href.substring(1))}
                      className="text-sm font-medium text-cr-fg-secondary transition-colors hover:text-cr-primary"
                    >
                      {link.label}
                    </button>
                  )
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/crawler-checker"
              className={`${buttonVariants({ variant: 'outline', size: 'sm' })} flex items-center gap-2 border-cr-border text-cr-fg-secondary hover:bg-cr-primary-soft hover:text-cr-primary`}
            >
              <Search className="size-4" />
              Crawler Checker
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('early-access')}
              className={`${buttonVariants({ size: 'sm' })} bg-cr-primary text-cr-primary-fg hover:bg-cr-primary-hover`}
            >
              {t('get_early_access')}
            </button>
          </div>

          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-cr-fg-secondary hover:bg-cr-surface hover:text-cr-fg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen
                ? <X className="size-6" />
                : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-cr-border bg-cr-bg md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map(link => (
              link.isExternal
                ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-cr-fg-secondary hover:bg-cr-surface hover:text-cr-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                : (
                    <button
                      type="button"
                      key={link.href}
                      onClick={() => scrollToSection(link.href.substring(1))}
                      className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-cr-fg-secondary hover:bg-cr-surface hover:text-cr-primary"
                    >
                      {link.label}
                    </button>
                  )
            ))}
            <div className="space-y-2 border-t border-cr-border pt-4">
              <Link
                href="/crawler-checker"
                className={`${buttonVariants({ variant: 'outline', size: 'sm' })} flex w-full items-center justify-center gap-2 border-cr-border text-cr-fg-secondary hover:bg-cr-primary-soft hover:text-cr-primary`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="size-4" />
                Crawler Checker
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('early-access')}
                className={`${buttonVariants({ size: 'sm' })} w-full bg-cr-primary text-cr-primary-fg hover:bg-cr-primary-hover`}
              >
                {t('get_early_access')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';

export const LandingNavbar = () => {
  const t = useTranslations('LandingNavbar');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: t('demo'), href: '#demo' },
    { label: t('features'), href: '#features' },
    // { label: t('pricing'), href: '#pricing' },
    { label: t('faq'), href: '#faq' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                CrawlReady
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href.substring(1))}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            {/* <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
            >
              Sign In
            </Link> */}
            <button
              onClick={() => scrollToSection('early-access')}
              className={`${buttonVariants({ size: 'sm' })} bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl`}
            >
              {t('get_early_access')}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href.substring(1))}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
              {/* <Link
                href="/sign-in"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
              >
                Sign In
              </Link> */}
              <button
                onClick={() => scrollToSection('early-access')}
                className={`${buttonVariants({ size: 'sm' })} mt-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600`}
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

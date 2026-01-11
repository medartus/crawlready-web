'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import type { DocsNavigation } from '@/libs/mdx/docs';

type DocsSidebarProps = {
  navigation: DocsNavigation;
};

export function DocsSidebar({ navigation }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Start with all sections expanded
    return new Set(navigation.sections.map(s => s.title));
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const isActive = (slug: string) => {
    // Handle locale prefix in pathname
    const pathParts = pathname.split('/').filter(Boolean);
    const currentSlug = pathParts.slice(2).join('/'); // Skip locale and 'docs'
    return currentSlug === slug;
  };

  return (
    <nav className="w-64 shrink-0" aria-label="Documentation navigation">
      <div className="sticky top-24 space-y-1">
        {/* Docs Home Link */}
        <Link
          href="/docs"
          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname.endsWith('/docs')
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Documentation Home
        </Link>

        {/* Sections */}
        {navigation.sections.map(section => (
          <div key={section.title} className="pt-4">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
            >
              {section.title}
              {expandedSections.has(section.title)
                ? <ChevronDown className="size-4 text-gray-500" />
                : <ChevronRight className="size-4 text-gray-500" />}
            </button>

            {expandedSections.has(section.title) && (
              <ul className="ml-2 mt-1 space-y-1 border-l border-gray-200 pl-2 dark:border-gray-700">
                {section.docs.map(doc => (
                  <li key={doc.slug}>
                    <Link
                      href={`/docs/${doc.slug}`}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive(doc.slug)
                          ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

type DocsNavigationLinksProps = {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export function DocsNavigationLinks({ prev, next }: DocsNavigationLinksProps) {
  return (
    <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-8 dark:border-gray-700">
      {prev
        ? (
            <Link
              href={`/docs/${prev.slug}`}
              className="group flex flex-col"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">Previous</span>
              <span className="text-lg font-medium text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300">
                ←
                {' '}
                {prev.title}
              </span>
            </Link>
          )
        : <div />}

      {next
        ? (
            <Link
              href={`/docs/${next.slug}`}
              className="group flex flex-col text-right"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">Next</span>
              <span className="text-lg font-medium text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300">
                {next.title}
                {' '}
                →
              </span>
            </Link>
          )
        : <div />}
    </div>
  );
}

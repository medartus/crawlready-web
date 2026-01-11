import Link from 'next/link';
import type { MDXRemoteProps } from 'next-mdx-remote/rsc';
import type { ComponentPropsWithoutRef } from 'react';

// Custom MDX components for rendering
export const mdxComponents: MDXRemoteProps['components'] = {
  // Override default link to use Next.js Link for internal navigation
  a: ({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) => {
    if (href?.startsWith('/') || href?.startsWith('#')) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
  // Enhanced code blocks with better styling
  pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ children, ...props }: ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800" {...props}>
      {children}
    </code>
  ),
  // Enhanced table styling
  table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
    <th
      className="border-b border-gray-200 px-4 py-2 text-left font-semibold text-gray-900 dark:border-gray-700 dark:text-white"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
    <td
      className="border-b border-gray-100 px-4 py-2 text-gray-600 dark:border-gray-800 dark:text-gray-400"
      {...props}
    >
      {children}
    </td>
  ),
};

// Export types for use in other files
export type { MDXRemoteProps };

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - CrawlReady',
  description: 'CrawlReady admin dashboard for API key management and usage statistics',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

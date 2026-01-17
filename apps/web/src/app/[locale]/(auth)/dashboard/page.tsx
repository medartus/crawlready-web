import { redirect } from 'next/navigation';

// Redirect to the new Overview page
export default function DashboardIndexPage() {
  redirect('/dashboard/overview');
}

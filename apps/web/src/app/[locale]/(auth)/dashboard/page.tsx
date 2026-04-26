import { redirect } from 'next/navigation';

// Redirect to the Sites page
export default function DashboardIndexPage() {
  redirect('/dashboard/sites');
}

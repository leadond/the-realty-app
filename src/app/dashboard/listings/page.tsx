import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import ListingsClient from './ListingsClient';

export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="listing-generator" featureLabel="Listing Generator">
      <ListingsClient />
    </UpgradeGate>
  );
}

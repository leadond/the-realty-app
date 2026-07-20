import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import OpenHousesClient from './OpenHousesClient';

export const dynamic = 'force-dynamic';

export default async function OpenHousesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="open-houses" featureLabel="Open Houses">
      <OpenHousesClient />
    </UpgradeGate>
  );
}

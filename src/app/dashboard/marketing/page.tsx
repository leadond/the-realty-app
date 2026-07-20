import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import MarketingClient from './MarketingClient';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="marketing" featureLabel="Marketing">
      <MarketingClient />
    </UpgradeGate>
  );
}

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import MarketResearchClient from './MarketResearchClient';

export const dynamic = 'force-dynamic';

export default async function MarketResearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="market-research" featureLabel="Market Research">
      <MarketResearchClient />
    </UpgradeGate>
  );
}

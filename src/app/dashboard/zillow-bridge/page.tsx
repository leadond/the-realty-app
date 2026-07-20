import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import ZillowBridgeClient from './ZillowBridgeClient';

export const dynamic = 'force-dynamic';

export default async function ZillowBridgePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="zillow-bridge" featureLabel="Zillow / Bridge">
      <ZillowBridgeClient />
    </UpgradeGate>
  );
}

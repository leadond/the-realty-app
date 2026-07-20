import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import BrokerClient from './BrokerClient';

export const dynamic = 'force-dynamic';

export default async function BrokerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="broker-dashboard" featureLabel="Broker Dashboard">
      <BrokerClient />
    </UpgradeGate>
  );
}

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import IntegrationsClient from './IntegrationsClient';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="connected-apps" featureLabel="Connected Apps">
      <IntegrationsClient />
    </UpgradeGate>
  );
}

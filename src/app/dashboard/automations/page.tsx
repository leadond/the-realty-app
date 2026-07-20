import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import AutomationsClient from './AutomationsClient';

export const dynamic = 'force-dynamic';

export default async function AutomationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="automations" featureLabel="Automations">
      <AutomationsClient />
    </UpgradeGate>
  );
}

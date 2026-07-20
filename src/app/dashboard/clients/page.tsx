import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import ClientsClient from './ClientsClient';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="client-updates" featureLabel="Client Updates">
      <ClientsClient />
    </UpgradeGate>
  );
}

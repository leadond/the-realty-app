import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import ContractsClient from './ContractsClient';

export const dynamic = 'force-dynamic';

export default async function ContractsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="contracts" featureLabel="Contracts">
      <ContractsClient />
    </UpgradeGate>
  );
}

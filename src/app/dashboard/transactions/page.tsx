import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import TransactionsClient from './TransactionsClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="transactions" featureLabel="Transactions">
      <TransactionsClient />
    </UpgradeGate>
  );
}

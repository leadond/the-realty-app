import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import MatchmakerClient from './MatchmakerClient';

export const dynamic = 'force-dynamic';

export default async function MatchmakerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="property-matchmaker" featureLabel="Property Matchmaker">
      <MatchmakerClient />
    </UpgradeGate>
  );
}

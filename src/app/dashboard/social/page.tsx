import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import SocialClient from './SocialClient';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="social-scheduler" featureLabel="Social Scheduler">
      <SocialClient />
    </UpgradeGate>
  );
}

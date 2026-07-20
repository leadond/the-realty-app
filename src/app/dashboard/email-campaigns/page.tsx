import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import EmailCampaignsClient from './EmailCampaignsClient';

export const dynamic = 'force-dynamic';

export default async function EmailCampaignsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="email-campaigns" featureLabel="Email Campaigns">
      <EmailCampaignsClient />
    </UpgradeGate>
  );
}

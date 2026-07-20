import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import ShowingAssistantClient from './ShowingAssistantClient';

export const dynamic = 'force-dynamic';

export default async function ShowingAssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="showing-assistant" featureLabel="Showing Assistant">
      <ShowingAssistantClient />
    </UpgradeGate>
  );
}

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="reviews" featureLabel="Reviews">
      <ReviewsClient />
    </UpgradeGate>
  );
}

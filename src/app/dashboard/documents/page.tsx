import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/current-user';
import UpgradeGate from '@/components/UpgradeGate';
import DocumentsClient from './DocumentsClient';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeGate userTier={user.planTier} feature="documents" featureLabel="Documents">
      <DocumentsClient />
    </UpgradeGate>
  );
}

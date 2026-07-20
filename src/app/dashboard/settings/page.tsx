import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';

import { getCurrentUser } from '@/lib/current-user';
import { hasAccess } from '@/lib/entitlements';
import PushOptIn from '@/components/PushOptIn';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="space-y-8 p-6 max-w-3xl">
      <SettingsClient />

      {hasAccess(user.planTier, 'push-notifications') && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-2">
            <Bell size={18} /> Push Notifications
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Get browser notifications for new leads, showing requests, and other time-sensitive activity on this
            device.
          </p>
          <PushOptIn />
        </div>
      )}
    </div>
  );
}

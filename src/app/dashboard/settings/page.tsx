'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Settings, CreditCard, ShieldAlert, Check, Loader2 } from 'lucide-react';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', features: ['Single agent', '20K AI tokens/mo', 'Core CRM & tools'] },
  { id: 'pro', name: 'Pro', price: '$99/mo', features: ['Single agent', '500K AI tokens/mo', 'Email & social scheduling', 'Automations'] },
  { id: 'professional', name: 'Professional', price: '$299/mo', features: ['Up to 15 agents', '5M AI tokens/mo (shared)', 'Broker dashboard', 'Team lead sharing'] },
];

export default function SettingsPage() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingError, setBillingError] = useState('');

  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleUpgrade = async (plan: string) => {
    setCheckoutLoading(plan);
    setBillingError('');
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setCheckoutLoading(null);
    if (data.ok && data.url) {
      window.location.href = data.url;
    } else {
      setBillingError(data.error || 'Failed to start checkout');
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setBillingError('');
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    setPortalLoading(false);
    if (data.ok && data.url) {
      window.location.href = data.url;
    } else {
      setBillingError(data.error || 'Failed to open billing portal');
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('This permanently deletes your account and all your data. Are you sure?')) return;
    setDeleting(true);
    setDeleteError('');
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: deleteEmail }),
    });
    const data = await res.json();
    if (data.ok) {
      signOut({ callbackUrl: '/login' });
    } else {
      setDeleteError(data.error || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="text-gray-600" /> Settings</h1>
        <p className="text-gray-500 mt-1">Billing and account management</p>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><CreditCard size={18} /> Billing</h2>

        {billingError && <p className="text-red-500 text-sm mb-4">{billingError}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1">{plan.price}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                {plan.features.map(f => <li key={f} className="flex items-center gap-1.5"><Check size={13} className="text-green-500 shrink-0" /> {f}</li>)}
              </ul>
              {plan.id !== 'free' && (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={checkoutLoading === plan.id}
                  className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm inline-flex items-center justify-center gap-2"
                >
                  {checkoutLoading === plan.id ? <Loader2 size={14} className="animate-spin" /> : null}
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleManageBilling} disabled={portalLoading} className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
          {portalLoading ? 'Opening...' : 'Manage existing subscription →'}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Requires a STRIPE_SECRET_KEY (and STRIPE_PRICE_PRO / STRIPE_PRICE_PROFESSIONAL) environment variable to be configured.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-red-200 p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-2 text-red-700"><ShieldAlert size={18} /> Delete Account</h2>
        <p className="text-sm text-gray-500 mb-4">
          This permanently deletes your account and all associated data — leads, listings, showings, contracts, and everything else. This cannot be undone.
        </p>
        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Type your email to confirm</label>
            <input type="email" required value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}
          <button type="submit" disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
            {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

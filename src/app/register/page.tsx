'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Building2, User, KeyRound } from 'lucide-react';

type AccountType = 'agent' | 'broker' | 'invite';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get('invite') || '';

  const [accountType, setAccountType] = useState<AccountType>(inviteFromUrl ? 'invite' : 'agent');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    brokerageName: '',
    inviteToken: inviteFromUrl,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inviteFromUrl) {
      setAccountType('invite');
      setForm(prev => ({ ...prev, inviteToken: inviteFromUrl }));
    }
  }, [inviteFromUrl]);

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, accountType }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Account created — please sign in.');
        router.push('/login');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold text-center mb-2 text-blue-600">Create your account</h1>
      <p className="text-sm text-gray-500 text-center mb-6">The Realty App — your all-in-one real estate workspace</p>

      {inviteFromUrl && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          You&apos;ve been invited to join a brokerage team. Complete registration below to accept.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          type="button"
          onClick={() => setAccountType('agent')}
          className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium ${accountType === 'agent' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'text-gray-600'}`}
        >
          <User size={18} /> Solo Agent
        </button>
        <button
          type="button"
          onClick={() => setAccountType('broker')}
          className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium ${accountType === 'broker' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'text-gray-600'}`}
        >
          <Building2 size={18} /> Start a Team
        </button>
        <button
          type="button"
          onClick={() => setAccountType('invite')}
          className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium ${accountType === 'invite' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'text-gray-600'}`}
        >
          <KeyRound size={18} /> Have an Invite
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" required minLength={8} value={form.password} onChange={e => set('password', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
        </div>

        {accountType === 'broker' && (
          <div>
            <label className="block text-sm font-medium mb-1">Brokerage Name</label>
            <input type="text" required value={form.brokerageName} onChange={e => set('brokerageName', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Acme Realty Group" />
          </div>
        )}

        {accountType === 'invite' && (
          <div>
            <label className="block text-sm font-medium mb-1">Invite Code</label>
            <input type="text" required value={form.inviteToken} onChange={e => set('inviteToken', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Paste the code your broker sent you" />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4 text-center">
        Already have an account? <Link href="/login" className="text-blue-600 font-medium">Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

'use client';
import { use, useEffect, useState } from 'react';
import { FileSignature, CheckCircle2, AlertCircle } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';

type ContractView = {
  id: string;
  title: string;
  content: string;
  buyerName: string;
  buyerEmail: string;
  status: string;
  expiresAt: string | null;
  signatures: { role: string; signedAt: string | null }[];
};

export default function PublicSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<ContractView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/public/contracts/${id}/sign`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setContract(data.contract);
        else setError(data.error || 'Contract not found');
      })
      .catch(() => setError('Failed to load contract'))
      .finally(() => setLoading(false));
  }, [id]);

  const alreadySigned = contract?.signatures.some(s => s.role === 'buyer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      setError('Please draw your signature before submitting');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await fetch(`/api/public/contracts/${id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, signatureData: signature }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || 'Failed to submit signature');
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading document...</div>;

  if (error && !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  if (success || alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
          <h1 className="text-xl font-semibold mb-2">Signature Submitted</h1>
          <p className="text-gray-500 text-sm">Thank you — your signature has been recorded for &quot;{contract.title}&quot;. A copy will be provided by your agent.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b bg-indigo-50">
          <h1 className="text-xl font-semibold flex items-center gap-2"><FileSignature className="text-indigo-600" /> {contract.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Please review and sign below</p>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 font-mono border-b bg-gray-50">
          {contract.content}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Confirm your email ({contract.buyerEmail})</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Signature</label>
            <SignaturePad onChange={setSignature} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Sign & Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

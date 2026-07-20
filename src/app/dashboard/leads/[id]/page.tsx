'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Clock, Edit2, Check, X, AlertTriangle, Calendar, MapPin } from 'lucide-react';
import CallButton from '@/components/CallButton';
import CopyLinkButton from '@/components/CopyLinkButton';
import { RiskAlert } from '@/components/RiskAlert';

const PORTAL_TIERS = ['PROFESSIONAL', 'ENTERPRISE'];

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  priority: string;
  source: string;
  location?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  timeline?: string | null;
  notes?: string | null;
  riskLevel?: string | null;
  riskScore?: number | null;
  riskWarnings?: string | null;
};

type CallLog = {
  id: string;
  phoneNumber: string;
  calledAt: string;
  notes?: string | null;
  durationMin?: number | null;
};

type Showing = {
  id: string;
  scheduledAt: string;
  status: string;
  leadId?: string | null;
  property?: { address: string; city: string; state: string };
};

function money(value?: number | null) {
  return value ? `$${value.toLocaleString()}` : 'Open';
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planTier, setPlanTier] = useState<string>('');
  const [origin, setOrigin] = useState('');

  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editDuration, setEditDuration] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [leadRes, callsRes, showingsRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/leads/${id}/calls`),
        fetch('/api/showings'),
      ]);
      const leadData = await leadRes.json();
      const callsData = await callsRes.json();
      const showingsData = await showingsRes.json();

      if (leadData.ok) {
        setLead(leadData.lead);
        if (leadData.planTier) setPlanTier(leadData.planTier);
      } else setError(leadData.error || 'Lead not found');

      if (callsData.ok) setCalls(callsData.calls);
      if (showingsData.ok) setShowings(showingsData.showings.filter((s: Showing) => s.leadId === id));
    } catch (e) {
      console.error(e);
      setError('Failed to load contact');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const startEditCall = (call: CallLog) => {
    setEditingCallId(call.id);
    setEditNotes(call.notes || '');
    setEditDuration(call.durationMin ? String(call.durationMin) : '');
  };

  const saveCallEdit = async (callId: string) => {
    await fetch(`/api/leads/${id}/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editNotes, durationMin: editDuration ? Number(editDuration) : null }),
    });
    setEditingCallId(null);
    load();
  };

  if (loading) return <div className="p-6">Loading contact...</div>;

  if (error || !lead) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error || 'Contact not found'}</p>
        <Link href="/dashboard/crm" className="text-blue-600 hover:underline text-sm mt-2 inline-block">← Back to CRM</Link>
      </div>
    );
  }

  const risk = lead.riskLevel && lead.riskLevel !== 'GREEN' ? {
    riskLevel: lead.riskLevel as 'YELLOW' | 'RED',
    riskScore: lead.riskScore || 0,
    warnings: lead.riskWarnings ? lead.riskWarnings.split('; ') : [],
    contactedByOrgs: 0,
    contactedByAgents: 0,
  } : null;

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <Link href="/dashboard/crm" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to CRM
      </Link>

      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lead.firstName} {lead.lastName}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              {lead.phone && (
                <CallButton leadId={id} phoneNumber={lead.phone} contactName={`${lead.firstName} ${lead.lastName}`} onLogged={load} />
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-800">
                  <Mail size={14} /> {lead.email}
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">{lead.status.replace('_', ' ')}</span>
            <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">{lead.priority}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t text-sm">
          <div><p className="text-gray-400">Budget</p><p className="font-medium">{money(lead.budgetMin)} – {money(lead.budgetMax)}</p></div>
          <div><p className="text-gray-400">Location</p><p className="font-medium">{lead.location || 'Open'}</p></div>
          <div><p className="text-gray-400">Timeline</p><p className="font-medium">{lead.timeline || 'Not set'}</p></div>
          <div><p className="text-gray-400">Source</p><p className="font-medium">{lead.source.replace('_', ' ')}</p></div>
        </div>

        {lead.notes && (
          <div className="mt-4 pt-4 border-t text-sm">
            <p className="text-gray-400 mb-1">Notes</p>
            <p className="text-gray-700">{lead.notes}</p>
          </div>
        )}

        {PORTAL_TIERS.includes(planTier) && origin && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
            <div className="text-sm">
              <p className="text-gray-400">Client portal</p>
              <p className="text-gray-600">Share a private read-only summary with this client.</p>
            </div>
            <div className="ml-auto">
              <CopyLinkButton value={`${origin}/portal/${id}`} />
            </div>
          </div>
        )}
      </div>

      {risk && <RiskAlert risk={risk} />}

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <Phone size={16} className="text-gray-500" />
          <h2 className="font-semibold">Call History</h2>
          <span className="text-xs text-gray-400 ml-auto">{calls.length} call{calls.length !== 1 ? 's' : ''} logged</span>
        </div>
        {calls.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No calls logged yet. Tap the phone number above to call and log automatically.</p>
        ) : (
          <div className="divide-y">
            {calls.map(call => (
              <div key={call.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-gray-400" />
                    <span className="font-medium">{new Date(call.calledAt).toLocaleString()}</span>
                    <span className="text-gray-400">· {call.phoneNumber}</span>
                    {call.durationMin && <span className="text-gray-400">· {call.durationMin} min</span>}
                  </div>
                  {editingCallId !== call.id && (
                    <button onClick={() => startEditCall(call)} className="text-gray-400 hover:text-gray-600">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                {editingCallId === call.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="What did you discuss?"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      rows={2}
                    />
                    <input
                      type="number"
                      value={editDuration}
                      onChange={e => setEditDuration(e.target.value)}
                      placeholder="Duration (minutes)"
                      className="w-32 px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveCallEdit(call.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingCallId(null)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-200 rounded-lg hover:bg-gray-300">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : call.notes ? (
                  <p className="mt-1 text-sm text-gray-600">{call.notes}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400 italic">No notes added</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showings.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <h2 className="font-semibold">Showings</h2>
          </div>
          <div className="divide-y">
            {showings.map(s => (
              <div key={s.id} className="p-4 text-sm flex items-center justify-between">
                <div>
                  <p className="font-medium">{new Date(s.scheduledAt).toLocaleString()}</p>
                  {s.property && <p className="text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={12} /> {s.property.address}, {s.property.city}</p>}
                </div>
                <span className="text-xs text-gray-400">{s.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

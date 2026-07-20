'use client';
import { useEffect, useState } from 'react';
import { Workflow, Plus, X, Trash2, CheckSquare, Bell } from 'lucide-react';

type Rule = {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: string;
  triggerConfig: string;
  actionType: string;
  actionConfig: string;
  _count?: { executions: number };
};

type Reminder = {
  id: string;
  subject: string;
  scheduledFor: string;
  content: string | null;
};

const TRIGGER_LABELS: Record<string, string> = {
  lead_status_changed: 'Lead status becomes...',
  no_response_days: 'No response for N days',
  showing_scheduled: 'Showing gets scheduled',
  open_house_visitor: 'Open house visitor needs follow-up',
};

const ACTION_LABELS: Record<string, string> = {
  send_email: 'Send an email',
  create_reminder: 'Create a task reminder',
};

const emptyForm = {
  name: '', triggerType: 'lead_status_changed', triggerStatus: 'CONTACTED', triggerDays: '5',
  actionType: 'create_reminder', actionSubject: '', actionBody: '',
};

export default function AutomationsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rulesRes, remindersRes] = await Promise.all([
        fetch('/api/automation/rules'),
        fetch('/api/automation/reminders'),
      ]);
      const rulesData = await rulesRes.json();
      const remindersData = await remindersRes.json();
      if (rulesData.ok) setRules(rulesData.rules);
      if (remindersData.ok) setReminders(remindersData.reminders);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const triggerConfig = form.triggerType === 'no_response_days'
      ? { status: form.triggerStatus, days: Number(form.triggerDays) }
      : form.triggerType === 'lead_status_changed'
        ? { status: form.triggerStatus }
        : {};

    const actionConfig = form.actionType === 'send_email'
      ? { subject: form.actionSubject, body: form.actionBody }
      : { subject: form.actionSubject, note: form.actionBody };

    await fetch('/api/automation/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, triggerType: form.triggerType, triggerConfig, actionType: form.actionType, actionConfig }),
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    load();
  };

  const toggleActive = async (rule: Rule) => {
    await fetch(`/api/automation/rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation rule?')) return;
    await fetch(`/api/automation/rules/${id}`, { method: 'DELETE' });
    load();
  };

  const completeReminder = async (id: string) => {
    await fetch(`/api/automation/reminders/${id}`, { method: 'PATCH' });
    load();
  };

  if (loading) return <div className="p-6">Loading automations...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Workflow className="text-teal-600" /> Automations</h1>
          <p className="text-gray-500 mt-1">Never miss a follow-up — rules run automatically once a day</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <Plus size={16} /> New Rule
        </button>
      </div>

      {reminders.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-amber-50 flex items-center gap-2">
            <Bell size={16} className="text-amber-600" />
            <h2 className="font-semibold text-amber-800">{reminders.length} follow-up{reminders.length !== 1 ? 's' : ''} due</h2>
          </div>
          <div className="divide-y">
            {reminders.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{r.subject}</p>
                  {r.content && <p className="text-gray-500 text-xs mt-0.5">{r.content}</p>}
                </div>
                <button onClick={() => completeReminder(r.id)} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  <CheckSquare size={12} /> Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">New Automation Rule</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Rule Name</label><input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Follow up with new contacts" /></div>

              <div>
                <label className="block text-sm font-medium mb-1">Trigger</label>
                <select value={form.triggerType} onChange={e => setForm({ ...form, triggerType: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {(form.triggerType === 'lead_status_changed' || form.triggerType === 'no_response_days') && (
                <div>
                  <label className="block text-sm font-medium mb-1">When lead status is</label>
                  <select value={form.triggerStatus} onChange={e => setForm({ ...form, triggerStatus: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option>NEW</option><option>CONTACTED</option><option>QUALIFIED</option><option>ACTIVE</option><option>NEGOTIATING</option>
                  </select>
                </div>
              )}
              {form.triggerType === 'no_response_days' && (
                <div><label className="block text-sm font-medium mb-1">And it's been at least (days)</label><input type="number" value={form.triggerDays} onChange={e => setForm({ ...form, triggerDays: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Action</label>
                <select value={form.actionType} onChange={e => setForm({ ...form, actionType: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div><label className="block text-sm font-medium mb-1">{form.actionType === 'send_email' ? 'Email Subject' : 'Reminder Title'}</label><input required type="text" value={form.actionSubject} onChange={e => setForm({ ...form, actionSubject: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">{form.actionType === 'send_email' ? 'Email Body' : 'Note'}</label><textarea value={form.actionBody} onChange={e => setForm({ ...form, actionBody: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={4} placeholder={form.actionType === 'send_email' ? 'Hi {{first_name}}, ...' : ''} /></div>

              <button type="submit" disabled={saving} className="w-full py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create Rule'}</button>
            </form>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No automation rules yet. Create one to stop follow-ups from slipping through the cracks.</div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white p-4 rounded-lg shadow border flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {rule.name}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{rule.isActive ? 'Active' : 'Paused'}</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">{TRIGGER_LABELS[rule.triggerType]} → {ACTION_LABELS[rule.actionType]}</p>
                <p className="text-xs text-gray-400 mt-1">{rule._count?.executions ?? 0} time(s) triggered</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => toggleActive(rule)} className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">{rule.isActive ? 'Pause' : 'Activate'}</button>
                <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">Rules are evaluated automatically once a day. Email actions require a RESEND_API_KEY to actually send.</p>
    </div>
  );
}

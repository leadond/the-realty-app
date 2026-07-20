'use client';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, X, Sparkles, Loader2, Copy, Check, Trash2, ExternalLink, CheckCircle } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

type Post = {
  id: string;
  platform: string;
  caption: string;
  status: string;
  scheduledFor: string | null;
  createdAt: string;
};

type Property = { id: string; address: string; city: string; state: string; price: number };

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-600', url: 'https://www.facebook.com' },
  { id: 'instagram', name: 'Instagram', color: 'bg-pink-600', url: 'https://www.instagram.com' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-gray-900', url: 'https://www.tiktok.com/upload' },
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-sky-700', url: 'https://www.linkedin.com/feed' },
];

export default function SocialSchedulerPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: 'facebook', propertyId: '', caption: '', scheduledFor: '' });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [postsRes, propsRes] = await Promise.all([
        fetch('/api/social/posts'),
        fetch('/api/properties'),
      ]);
      const postsData = await postsRes.json();
      const propsData = await propsRes.json();
      if (postsData.ok) setPosts(postsData.posts);
      if (propsData.ok) setProperties(propsData.properties);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateCaption = async () => {
    setGenerating(true);
    const property = properties.find(p => p.id === form.propertyId);
    const prompt = property
      ? `Write a ${form.platform} caption for this listing: ${property.address}, ${property.city}, ${property.state}, $${property.price.toLocaleString()}. Include relevant hashtags and a call to action. Keep it appropriate for ${form.platform}'s style.`
      : `Write an engaging ${form.platform} caption for a real estate agent's post about their services. Include relevant hashtags.`;
    try {
      const result = await callAIChat([
        { role: 'system', content: 'You are a real estate social media copywriter.' },
        { role: 'user', content: prompt },
      ]);
      setForm(prev => ({ ...prev, caption: result }));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to generate caption');
    }
    setGenerating(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ platform: 'facebook', propertyId: '', caption: '', scheduledFor: '' });
    load();
  };

  const markPosted = async (id: string) => {
    await fetch(`/api/social/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'POSTED' }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
    load();
  };

  const handleCopy = (post: Post) => {
    navigator.clipboard.writeText(post.caption);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const grouped = useMemo(() => {
    const scheduled = posts.filter(p => p.status === 'SCHEDULED' || p.status === 'DRAFT');
    const posted = posts.filter(p => p.status === 'POSTED');
    return { scheduled, posted };
  }, [posts]);

  if (loading) return <div className="p-6">Loading social scheduler...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="text-pink-500" /> Social Media Scheduler</h1>
          <p className="text-gray-500 mt-1">Plan posts, generate captions with AI, and publish across platforms</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
          <Plus size={16} /> New Post
        </button>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        Direct auto-publishing to Facebook/Instagram/TikTok/LinkedIn requires connecting those accounts under <strong>Connected Apps</strong>. Until then, generate your caption here, copy it, and post manually — click &quot;Open Platform&quot; to jump straight there.
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">New Social Post</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.id} type="button" onClick={() => setForm({ ...form, platform: p.id })} className={`p-2 rounded-lg border text-xs font-medium ${form.platform === p.id ? 'border-pink-500 bg-pink-50' : ''}`}>{p.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property (optional)</label>
                <select value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">— General post —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.address}, {p.city}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Caption</label>
                  <button type="button" onClick={generateCaption} disabled={generating} className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 disabled:opacity-50">
                    {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Generate
                  </button>
                </div>
                <textarea required value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={5} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Schedule for (optional)</label>
                <input type="datetime-local" value={form.scheduledFor} onChange={e => setForm({ ...form, scheduledFor: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Post'}</button>
            </form>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Scheduled &amp; Drafts</h2>
        {grouped.scheduled.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No scheduled posts yet.</p>
        ) : (
          <div className="space-y-3">
            {grouped.scheduled.map(post => {
              const platform = PLATFORMS.find(p => p.id === post.platform);
              return (
                <div key={post.id} className="bg-white p-4 rounded-lg shadow border flex flex-col sm:flex-row sm:items-start gap-3">
                  <span className={`shrink-0 px-2 py-1 text-xs font-semibold text-white rounded ${platform?.color || 'bg-gray-500'}`}>{platform?.name || post.platform}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.caption}</p>
                    {post.scheduledFor && <p className="text-xs text-gray-400 mt-1">Scheduled: {new Date(post.scheduledFor).toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleCopy(post)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Copy caption">
                      {copiedId === post.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                    <a href={platform?.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Open platform">
                      <ExternalLink size={16} />
                    </a>
                    <button onClick={() => markPosted(post.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark as posted"><CheckCircle size={16} /></button>
                    <button onClick={() => handleDelete(post.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {grouped.posted.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Posted</h2>
          <div className="space-y-2">
            {grouped.posted.map(post => {
              const platform = PLATFORMS.find(p => p.id === post.platform);
              return (
                <div key={post.id} className="bg-gray-50 p-3 rounded-lg border flex items-center gap-3 text-sm text-gray-500">
                  <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded ${platform?.color || 'bg-gray-500'}`}>{platform?.name}</span>
                  <span className="truncate flex-1">{post.caption}</span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

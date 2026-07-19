'use client';
import { useState } from 'react';
import { Copy, Check, Sparkles, Mail, Send, Edit2, Loader2 } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

const TEMPLATES = [
  {
    id: 'new-listing',
    name: 'New Listing Announcement',
    subject: '🏡 Just Listed: Beautiful Home in {{neighborhood}}!',
    body: `Hi {{client_name}},

I'm excited to share a new listing that might be perfect for you!

📍 {{address}}
💰 {{price}}
🛏️ {{bedrooms}} Bed | 🚿 {{bathrooms}} Bath | 📐 {{sqft}} sqft

Key Features:
{{features}}

This home is in the desirable {{neighborhood}} area with great schools and amenities.

Would you like to schedule a showing? I'm available this week!

Best regards,
{{agent_name}}
{{agent_phone}}`,
  },
  {
    id: 'open-house',
    name: 'Open House Invitation',
    subject: '🏠 Open House This Weekend - You\'re Invited!',
    body: `Hi {{client_name}},

You're invited to our open house!

📍 {{address}}
📅 {{date}} | ⏰ {{time}}

{{property_details}}

No appointment needed — just stop by! I'll be there to answer any questions and show you around.

Hope to see you there!

{{agent_name}}
{{agent_phone}}`,
  },
  {
    id: 'follow-up',
    name: 'Post-Showing Follow-Up',
    subject: 'Following Up on Your Recent Showing',
    body: `Hi {{client_name}},

Thank you for taking the time to view {{address}} yesterday! I wanted to follow up and see what you thought.

Did the home meet your expectations? I'd love to hear your thoughts — both positive and constructive feedback helps me find even better matches for you.

If you're interested, I can:
• Get more details about the neighborhood
• Schedule another showing
• Adjust your search criteria
• Provide a comparative market analysis

Just let me know how I can help!

Best,
{{agent_name}}
{{agent_phone}}`,
  },
  {
    id: 'market-update',
    name: 'Market Update',
    subject: '📊 Your Monthly Market Update for {{area}}',
    body: `Hi {{client_name}},

Here's your monthly market update for {{area}}:

📈 Median Home Price: {{median_price}} ({{price_change}} vs last month)
🏠 Active Listings: {{active_listings}}
⏱️ Average Days on Market: {{dom}}
💰 Price per Sq Ft: {{price_per_sqft}}

Market Insights:
{{insights}}

Whether you're thinking about buying or selling, now is a great time to discuss your strategy. Let me know if you'd like a personalized market analysis!

Best regards,
{{agent_name}}
{{agent_phone}}`,
  },
  {
    id: 'holiday',
    name: 'Holiday Greeting',
    subject: '🎄 Happy Holidays from Your Realtor!',
    body: `Hi {{client_name}},

As the holiday season approaches, I wanted to take a moment to thank you for trusting me with your real estate needs.

Whether you're hosting family, traveling, or enjoying some well-deserved rest, I wish you and your loved ones a wonderful holiday season!

If you have any real estate questions during the holidays — even about year-end tax implications or planning for the new year — don't hesitate to reach out. I'm here to help.

Happy Holidays! 🎉

{{agent_name}}
{{agent_phone}}`,
  },
];

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [customizedText, setCustomizedText] = useState('');
  const [clientName, setClientName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCustomize = async () => {
    if (!selectedTemplate || !clientName) return;
    setLoading(true);
    const prompt = `Customize this email template for a specific client named "${clientName}". Replace all {{placeholders}} with realistic values. Agent name is "${agentName || 'Your Agent'}". Make it warm, professional, and personalized.

Template:
Subject: ${selectedTemplate.subject}
Body:
${selectedTemplate.body}`;
    try {
      const result = await callAIChat([
        { role: 'system', content: 'You are a real estate communication specialist. Write warm, professional emails.' },
        { role: 'user', content: prompt },
      ]);
      setCustomizedText(result);
    } catch (e) {
      setCustomizedText('Failed to customize template.');
    }
    setLoading(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="text-blue-500" /> Email & Text Templates</h1>
        <p className="text-gray-500 mt-1">Pre-built templates with AI personalization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedTemplate(t); setCustomizedText(''); }}
            className={`text-left p-4 rounded-lg border ${selectedTemplate?.id === t.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'} bg-white shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Send size={18} className="text-blue-500" />
              <h3 className="font-semibold">{t.name}</h3>
            </div>
            <p className="text-sm text-gray-500 truncate">{t.subject}</p>
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <div className="bg-white p-6 rounded-lg shadow border space-y-4">
          <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client Name</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Agent Name</label>
              <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Your name" />
            </div>
          </div>

          <button onClick={handleCustomize} disabled={loading || !clientName} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Customizing...' : 'AI Customize'}
          </button>

          <div className="relative">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono max-h-96 overflow-auto">
              {customizedText || selectedTemplate.body}
            </pre>
            <button
              onClick={() => handleCopy(customizedText || selectedTemplate.body, 'template')}
              className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow hover:bg-gray-100"
            >
              {copied === 'template' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

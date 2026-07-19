'use client';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileCheck, Download, FileText, Loader2, Sparkles } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

type DocType = 'buyer-agreement' | 'listing-agreement' | 'signin-sheet' | 'flyer';

const DOC_TYPES: { id: DocType; name: string; description: string }[] = [
  { id: 'buyer-agreement', name: 'Buyer Representation Agreement', description: 'Standard buyer-agent agreement summary' },
  { id: 'listing-agreement', name: 'Listing Agreement', description: 'Seller listing agreement summary' },
  { id: 'signin-sheet', name: 'Open House Sign-In Sheet', description: 'Printable visitor registration sheet' },
  { id: 'flyer', name: 'Property Flyer', description: 'One-page listing flyer with AI copy' },
];

export default function DocumentsPage() {
  const [docType, setDocType] = useState<DocType>('buyer-agreement');
  const [form, setForm] = useState({
    agentName: '',
    agentPhone: '',
    agentEmail: '',
    brokerage: '',
    clientName: '',
    propertyAddress: '',
    price: '',
    commission: '3',
    termMonths: '6',
    features: '',
  });
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [flyerCopy, setFlyerCopy] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const generateFlyerCopy = async () => {
    if (!form.propertyAddress) return;
    setGeneratingCopy(true);
    try {
      const result = await callAIChat([
        { role: 'system', content: 'You write punchy real estate flyer copy. Return 3 short paragraphs, no headers.' },
        { role: 'user', content: `Write flyer copy for ${form.propertyAddress}${form.price ? `, listed at $${Number(form.price).toLocaleString()}` : ''}. Features: ${form.features || 'a wonderful home'}. Keep it under 120 words, warm and compelling.` },
      ]);
      setFlyerCopy(result);
    } catch (e) {
      setFlyerCopy(e instanceof Error ? e.message : 'Failed to generate copy.');
    }
    setGeneratingCopy(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const margin = 20;
    let y = 25;

    const heading = (text: string) => {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, y);
      y += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    };
    const line = (text: string, gap = 7) => {
      const wrapped = doc.splitTextToSize(text, 170);
      doc.text(wrapped, margin, y);
      y += gap * wrapped.length;
    };
    const spacer = (h = 5) => { y += h; };

    if (docType === 'buyer-agreement' || docType === 'listing-agreement') {
      const isBuyer = docType === 'buyer-agreement';
      heading(isBuyer ? 'Buyer Representation Agreement' : 'Exclusive Listing Agreement');
      line(`Date: ${today}`);
      spacer();
      line(`This agreement is entered into between ${form.agentName || '[Agent Name]'} ("Agent") of ${form.brokerage || '[Brokerage]'} and ${form.clientName || '[Client Name]'} ("Client").`);
      spacer();
      if (isBuyer) {
        line(`1. The Client engages the Agent to assist in the search for and purchase of real property.`);
        line(`2. The Agent agrees to represent the Client's interests with diligence and good faith.`);
      } else {
        line(`1. The Client (Seller) engages the Agent to market and sell the property located at ${form.propertyAddress || '[Property Address]'}.`);
        line(`2. Listing price: ${form.price ? `$${Number(form.price).toLocaleString()}` : '[Price]'}.`);
      }
      line(`3. Term: This agreement is effective for ${form.termMonths} months from the date above.`);
      line(`4. Compensation: Agent commission is ${form.commission}% of the transaction price, payable at closing.`);
      spacer(12);
      line('_______________________________', 6);
      line(`${form.clientName || 'Client'} (Client)`);
      spacer(10);
      line('_______________________________', 6);
      line(`${form.agentName || 'Agent'} (Agent) — ${form.agentPhone || ''} ${form.agentEmail || ''}`);
    }

    if (docType === 'signin-sheet') {
      heading('Open House Sign-In Sheet');
      line(`Property: ${form.propertyAddress || '[Property Address]'}`);
      line(`Date: ${today}`);
      line(`Host: ${form.agentName || '[Agent]'} — ${form.agentPhone || ''}`);
      spacer(6);
      const cols = ['Name', 'Email', 'Phone', 'Agent?'];
      const colX = [margin, margin + 55, margin + 105, margin + 150];
      doc.setFont('helvetica', 'bold');
      cols.forEach((c, i) => doc.text(c, colX[i], y));
      doc.setFont('helvetica', 'normal');
      y += 4;
      doc.line(margin, y, margin + 170, y);
      y += 8;
      for (let r = 0; r < 18; r++) {
        doc.line(margin, y, margin + 170, y);
        y += 10;
        if (y > 275) break;
      }
    }

    if (docType === 'flyer') {
      doc.setFillColor(23, 69, 59);
      doc.rect(0, 0, 210, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(form.brokerage || 'For Sale', margin, 12);
      doc.setTextColor(0, 0, 0);
      y = 32;
      doc.setFontSize(20);
      doc.text(form.propertyAddress || '[Property Address]', margin, y);
      y += 10;
      if (form.price) {
        doc.setFontSize(16);
        doc.setTextColor(23, 69, 59);
        doc.text(`$${Number(form.price).toLocaleString()}`, margin, y);
        doc.setTextColor(0, 0, 0);
        y += 10;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      spacer();
      if (flyerCopy) line(flyerCopy, 6);
      else line(form.features || 'Add features and generate AI flyer copy for a polished description.', 6);
      spacer(10);
      doc.setFont('helvetica', 'bold');
      line(`Contact ${form.agentName || '[Agent]'}`);
      doc.setFont('helvetica', 'normal');
      line(`${form.agentPhone || ''}  ${form.agentEmail || ''}`);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by The Realty App — this is a template, not legal advice. Have agreements reviewed by your broker/attorney.', margin, 288);

    doc.save(`${docType}-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileCheck className="text-indigo-500" /> Document Generator</h1>
        <p className="text-gray-500 mt-1">Generate and download professional PDF documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {DOC_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setDocType(t.id)}
            className={`text-left p-4 rounded-lg border ${docType === t.id ? 'border-indigo-500 bg-indigo-50' : 'hover:border-gray-400'} bg-white`}
          >
            <FileText size={20} className={docType === t.id ? 'text-indigo-600 mb-2' : 'text-gray-500 mb-2'} />
            <h3 className="font-semibold text-sm">{t.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow border space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Agent Name</label>
            <input type="text" value={form.agentName} onChange={e => set('agentName', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Jane Realtor" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brokerage</label>
            <input type="text" value={form.brokerage} onChange={e => set('brokerage', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Acme Realty" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agent Phone</label>
            <input type="text" value={form.agentPhone} onChange={e => set('agentPhone', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="512-555-0100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agent Email</label>
            <input type="email" value={form.agentEmail} onChange={e => set('agentEmail', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="jane@acme.com" />
          </div>

          {(docType === 'buyer-agreement' || docType === 'listing-agreement') && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Client Name</label>
                <input type="text" value={form.clientName} onChange={e => set('clientName', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Commission (%)</label>
                <input type="number" step="0.1" value={form.commission} onChange={e => set('commission', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Term (months)</label>
                <input type="number" value={form.termMonths} onChange={e => set('termMonths', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </>
          )}

          {(docType === 'listing-agreement' || docType === 'signin-sheet' || docType === 'flyer') && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Property Address</label>
              <input type="text" value={form.propertyAddress} onChange={e => set('propertyAddress', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="123 Main St, Austin, TX" />
            </div>
          )}

          {(docType === 'listing-agreement' || docType === 'flyer') && (
            <div>
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="450000" />
            </div>
          )}

          {docType === 'flyer' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Features</label>
              <textarea value={form.features} onChange={e => set('features', e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="3 bed / 2 bath, updated kitchen, pool..." />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {docType === 'flyer' && (
            <button onClick={generateFlyerCopy} disabled={generatingCopy || !form.propertyAddress} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {generatingCopy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              AI Flyer Copy
            </button>
          )}
          <button onClick={generatePDF} className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Download size={18} /> Generate PDF
          </button>
        </div>

        {docType === 'flyer' && flyerCopy && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{flyerCopy}</div>
        )}
      </div>

      <p className="text-xs text-gray-400">Documents are templates for convenience, not legal advice. Have agreements reviewed by your broker or attorney.</p>
    </div>
  );
}

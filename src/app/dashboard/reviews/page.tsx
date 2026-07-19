'use client';
import { useState } from 'react';
import { Star, Send, Sparkles, Copy, Check, Loader2, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

type Review = {
  id: string;
  author: string;
  rating: number;
  platform: string;
  date: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  aiResponse?: string;
};

const MOCK_REVIEWS: Review[] = [
  {
    id: '1', author: 'Sarah M.', rating: 5, platform: 'Google', date: '2024-01-15',
    content: 'Absolutely amazing experience! Found our dream home in just two weeks. Professional, responsive, and truly cared about our needs.',
    sentiment: 'positive',
  },
  {
    id: '2', author: 'James T.', rating: 4, platform: 'Zillow', date: '2024-01-10',
    content: 'Great knowledge of the local market. Helped us navigate a competitive bidding process. Would recommend!',
    sentiment: 'positive',
  },
  {
    id: '3', author: 'Lisa K.', rating: 3, platform: 'Facebook', date: '2024-01-05',
    content: 'Decent service overall. Communication could have been better during the inspection phase.',
    sentiment: 'neutral',
  },
  {
    id: '4', author: 'Mike R.', rating: 2, platform: 'Google', date: '2023-12-28',
    content: 'Had some issues with scheduling showings. The process took longer than expected.',
    sentiment: 'negative',
  },
  {
    id: '5', author: 'Amy W.', rating: 5, platform: 'Zillow', date: '2023-12-20',
    content: 'Exceeded all expectations! Made selling our home stress-free and got us above asking price.',
    sentiment: 'positive',
  },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [requestText, setRequestText] = useState('');
  const [generatingRequest, setGeneratingRequest] = useState(false);

  const generateResponse = async (review: Review) => {
    setLoading(review.id);
    const prompt = `Write a professional, warm response to this ${review.rating}-star review from "${review.author}" on ${review.platform}:

"${review.content}"

The response should:
- Thank them for the feedback
- Address specific points mentioned
- Be genuine and personal (not generic)
- For negative reviews: acknowledge concerns and offer to discuss further
- Keep it under 100 words`;

    try {
      const result = await callAIChat([
        { role: 'system', content: 'You are a real estate agent responding to client reviews professionally.' },
        { role: 'user', content: prompt },
      ]);
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, aiResponse: result } : r));
    } catch (e) {
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, aiResponse: `Failed: ${e instanceof Error ? e.message : 'Unknown'}` } : r));
    }
    setLoading(null);
  };

  const generateRequest = async () => {
    setGeneratingRequest(true);
    try {
      const result = await callAIChat([
        { role: 'system', content: 'You write personalized review request messages for real estate agents.' },
        { role: 'user', content: 'Write a warm, professional message asking a recent client to leave a review. Make it personal, not pushy. Include where they can leave the review (Google, Zillow). Keep it under 150 words.' },
      ]);
      setRequestText(result);
    } catch (e) {
      setRequestText('Failed to generate request.');
    }
    setGeneratingRequest(false);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="text-yellow-500" /> Review Manager</h1>
        <p className="text-gray-500 mt-1">Manage and respond to client reviews with AI assistance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Average Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold">{avgRating}</span>
            <div className="flex"><Star size={20} className="text-yellow-400 fill-yellow-400" /><Star size={20} className="text-yellow-400 fill-yellow-400" /><Star size={20} className="text-yellow-400 fill-yellow-400" /><Star size={20} className="text-yellow-400 fill-yellow-400" /><Star size={20} className="text-gray-300" /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-3xl font-bold mt-1">{reviews.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Positive Reviews</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{positiveCount}</p>
        </div>
      </div>

      {/* Request Review */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Send size={18} /> Request a Review</h2>
        <button onClick={generateRequest} disabled={generatingRequest} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50">
          {generatingRequest ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Generate Request Message
        </button>
        {requestText && (
          <div className="mt-4 relative">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-sans">{requestText}</pre>
            <button onClick={() => handleCopy(requestText, 'request')} className="absolute top-2 right-2 p-2 bg-white rounded shadow hover:bg-gray-100">
              {copied === 'request' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Reviews</h2>
        {reviews.map(review => (
          <div key={review.id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {review.author[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{review.author}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}</div>
                    <span className="text-xs text-gray-500">{review.platform} • {new Date(review.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${review.sentiment === 'positive' ? 'bg-green-100 text-green-800' : review.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                {review.sentiment}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-4">{review.content}</p>

            <button
              onClick={() => generateResponse(review)}
              disabled={loading === review.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === review.id ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              {review.aiResponse ? 'Regenerate Response' : 'Generate AI Response'}
            </button>

            {review.aiResponse && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 relative">
                <p className="text-sm text-gray-700">{review.aiResponse}</p>
                <button onClick={() => handleCopy(review.aiResponse!, `resp-${review.id}`)} className="absolute top-2 right-2 p-1.5 bg-white rounded shadow hover:bg-gray-100">
                  {copied === `resp-${review.id}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

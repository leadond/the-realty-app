'use client';
import { useState } from 'react';
import { Phone } from 'lucide-react';

type CallButtonProps = {
  leadId: string;
  phoneNumber: string;
  contactName?: string;
  className?: string;
  onLogged?: () => void;
};

/**
 * Tap-to-call: confirms intent, opens the phone's native dialer via a tel:
 * link, and logs the call attempt to the lead's record. The browser has no
 * way to know whether a tel: handoff actually resulted in a connected call
 * (that leaves the page entirely), so this logs "call initiated" with a
 * timestamp — the agent can add notes/duration afterward from the lead's
 * call history.
 */
export default function CallButton({ leadId, phoneNumber, contactName, className, onLogged }: CallButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [logging, setLogging] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setLogging(true);
    try {
      await fetch(`/api/leads/${leadId}/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      onLogged?.();
    } catch (e) {
      console.error('Failed to log call', e);
    }
    setLogging(false);
    setConfirming(false);
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className || 'inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline'}
      >
        <Phone size={14} />
        {phoneNumber}
      </button>

      {confirming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirming(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-600 shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <h3 className="font-semibold">Call {contactName || 'this contact'}?</h3>
                <p className="text-sm text-gray-500">{phoneNumber}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">Your phone will be used to dial. This call will be logged to the contact&apos;s record.</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={logging}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Phone size={16} /> {logging ? 'Connecting...' : 'Call'}
              </button>
              <button onClick={() => setConfirming(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

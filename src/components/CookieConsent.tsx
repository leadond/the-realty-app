"use client";

import { useEffect, useState } from "react";
import { Cookie, Settings2, X } from "lucide-react";

type ConsentChoice = "accepted" | "essential";

const CONSENT_KEY = "realty-cookie-consent";

export default function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY) as ConsentChoice | null;
    if (saved === "accepted" || saved === "essential") {
      setChoice(saved);
      return;
    }
    setIsOpen(true);
  }, []);

  const saveChoice = (nextChoice: ConsentChoice) => {
    window.localStorage.setItem(CONSENT_KEY, nextChoice);
    setChoice(nextChoice);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-4xl rounded-md border border-[#d8d1c2] bg-[#fcfbf7]/95 p-4 text-[#17201b] shadow-[0_24px_80px_rgba(15,20,17,0.24)] backdrop-blur md:bottom-5 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-[#111917] text-[#d5a360]">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5d24]">Cookie Notice</p>
              <h2 className="mt-1 text-lg font-semibold">Your privacy controls</h2>
              <p className="mt-2 text-sm leading-6 text-[#465158]">
                The Realty App uses essential cookies and local browser storage for login, security, and saved preferences.
                We do not load advertising or analytics cookies unless you allow optional cookies. You can change this choice anytime.
              </p>
              <a href="/privacy" className="mt-2 inline-block text-sm font-semibold text-[#17453b] underline">
                Privacy and cookie details
              </a>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
              <button
                type="button"
                onClick={() => saveChoice("accepted")}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white hover:bg-[#10342c]"
              >
                Accept optional
              </button>
              <button
                type="button"
                onClick={() => saveChoice("essential")}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#c9b98f] bg-white px-4 text-sm font-semibold text-[#17201b] hover:bg-[#f3eee4]"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-[#58665e] hover:bg-[#ebe5d8]"
                aria-label="Close cookie notice"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && choice && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-3 left-3 z-[90] inline-flex h-9 items-center gap-2 rounded-md border border-[#d8d1c2] bg-[#fcfbf7]/90 px-3 text-xs font-semibold text-[#34433b] shadow-sm backdrop-blur hover:bg-white"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
          Cookie settings
        </button>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, MessageSquareText } from "lucide-react";

import RealtyLogo from "@/components/RealtyLogo";

const messages = [
  "Opening your workspace",
  "Syncing your leads",
  "Loading client updates",
  "Preparing your dashboard",
  "Ready",
];

const MIN_SPLASH_MS = 6200;

export default function AppSplash() {
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timeout = window.setTimeout(() => setDismissed(true), 550);
      return () => window.clearTimeout(timeout);
    }

    const startedAt = Date.now();
    let progressValue = 0;
    let timeoutId = 0;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = 100 - progressValue;
      const progressCap = elapsed < MIN_SPLASH_MS ? 92 : 100;
      progressValue = Math.min(progressCap, progressValue + remaining * 0.045 + Math.random() * 1.8);
      setProgress(progressValue);

      if (progressValue >= 99) {
        setProgress(100);
        timeoutId = window.setTimeout(() => setDismissed(true), 1100);
        return;
      }

      timeoutId = window.setTimeout(tick, 260 + Math.random() * 220);
    };

    timeoutId = window.setTimeout(tick, 650);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (dismissed) return null;

  const messageIndex = Math.min(Math.floor((progress / 100) * messages.length), messages.length - 1);

  return (
    <div className="realty-splash" aria-label="The Realty App loading screen" role="status">
      <div className="realty-splash__scene" aria-hidden="true">
        <img
          src="/brand/houston-penthouse-splash.png"
          alt=""
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className="realty-splash__light" aria-hidden="true" />
      <div className="realty-splash__reflection" aria-hidden="true" />
      <div className="realty-splash__curtain" aria-hidden="true" />
      <div className="realty-splash__vignette" aria-hidden="true" />
      <div className="realty-splash__grain" aria-hidden="true" />

      <div className="realty-splash__content">
        <header className="realty-splash__hero">
          <div className="realty-splash__panel">
            <div className="realty-splash__accent" aria-hidden="true" />
            <RealtyLogo size="lg" className="mb-7" />
            <h1 className="realty-splash__title">The Realty App</h1>
            <div className="realty-splash__promise" aria-label="Product promise">
              <p><CheckCircle2 size={17} aria-hidden="true" /> Never lose a lead</p>
              <p><CalendarClock size={17} aria-hidden="true" /> Never miss a deadline</p>
              <p><MessageSquareText size={17} aria-hidden="true" /> Never let a client feel ignored</p>
            </div>
            <p className="realty-splash__tagline">Move every deal forward</p>
          </div>
        </header>

        <footer className="realty-splash__footer">
          <div className="realty-splash__loading">
            <div className="realty-splash__loading-label">
              <span>{messages[messageIndex]}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="realty-splash__track" aria-hidden="true">
              <div className="realty-splash__fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

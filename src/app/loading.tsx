"use client";

import AppSplash, { SPLASH_SEEN_KEY } from "@/components/AppSplash";
import FastLoader from "@/components/FastLoader";

function hasSeenSplashThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Global Next.js route-transition fallback — shown on every navigation
 * while the target page is loading. Renders the full cinematic AppSplash
 * (hero image, ~6.2s minimum) once per browser session, then the fast
 * spinner for every navigation after that. "Session" here means
 * sessionStorage: it resets when the tab/window closes, same as a fresh
 * sign-in would expect to see the full splash again.
 */
export default function Loading() {
  return hasSeenSplashThisSession() ? <FastLoader /> : <AppSplash />;
}

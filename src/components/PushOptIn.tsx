"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

type Status = "idle" | "working" | "enabled" | "unsupported" | "denied" | "error";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export default function PushOptIn() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      typeof window !== "undefined" &&
      "PushManager" in window;
    if (!supported) {
      setStatus("unsupported");
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (subscription) setStatus("enabled");
      })
      .catch(() => {});
  }, []);

  const enable = async () => {
    setStatus("working");
    setMessage("");

    try {
      if (!VAPID_PUBLIC_KEY) {
        setStatus("error");
        setMessage("Push notifications are not configured on the server yet.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("Notifications are blocked. Enable them in your browser settings to opt in.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const ready = await navigator.serviceWorker.ready.catch(() => registration);

      const subscription = await ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus("error");
        setMessage(data?.error || "Could not register this device for notifications.");
        return;
      }

      setStatus("enabled");
    } catch {
      setStatus("error");
      setMessage("Something went wrong enabling notifications. Please try again.");
    }
  };

  const disable = async () => {
    setStatus("working");
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Could not turn off notifications. Please try again.");
    }
  };

  if (status === "unsupported") {
    return (
      <p className="flex items-center gap-2 text-sm text-[#58665e]">
        <BellOff size={16} aria-hidden="true" />
        This browser does not support push notifications.
      </p>
    );
  }

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        {status === "enabled" ? (
          <button
            type="button"
            onClick={disable}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#b8ad99] bg-white px-4 text-sm font-semibold text-[#17201b]"
          >
            <BellOff size={16} aria-hidden="true" />
            Turn off notifications
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={status === "working"}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {status === "working" ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Bell size={16} aria-hidden="true" />
            )}
            Enable push notifications
          </button>
        )}
        {status === "enabled" && (
          <span className="text-sm font-medium text-[#17453b]">This device is subscribed.</span>
        )}
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}

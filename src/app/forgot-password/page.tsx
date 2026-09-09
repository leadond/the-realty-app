"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "If an account exists, reset instructions will be available.");
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch {
      setMessage("Unable to start password reset. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-600">Reset your password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Enter your account email to get a reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {message && <p className="text-sm text-gray-600">{message}</p>}

          {resetUrl && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-medium">Local development reset link</p>
              <Link href={resetUrl} className="mt-1 block break-all underline">
                {resetUrl}
              </Link>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Creating link..." : "Send reset link"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Remembered it? <Link href="/login" className="text-blue-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

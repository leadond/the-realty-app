"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Unable to reset password");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Unable to reset password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold text-center mb-2 text-blue-600">Choose a new password</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Your new password must be at least 8 characters.</p>

      {!token ? (
        <div className="space-y-4">
          <p className="text-sm text-red-600">This reset link is missing its token.</p>
          <Link href="/forgot-password" className="block text-center text-blue-600 font-medium">Request a new link</Link>
        </div>
      ) : success ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">Your password has been updated.</p>
          <Link href="/login" className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

'use client';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-[#34433b] hover:bg-[#ebe5d8]"
    >
      <LogOut className="h-5 w-5" aria-hidden="true" />
      <span>Sign Out</span>
    </button>
  );
}

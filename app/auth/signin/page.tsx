'use client';

import { signIn } from 'next-auth/react';
import { Loader2, Sparkles } from 'lucide-react';
import { GithubIcon } from '@/app/components/icons';
import { useState } from 'react';
import Link from 'next/link';

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn('github', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="text-blue-400" size={32} />
          <span className="text-3xl font-bold text-white">DebuD</span>
        </Link>

        <p className="text-slate-400 text-center mb-2">AI Design Buddy</p>

        <div className="space-y-6 mt-8">
          <p className="text-slate-300 text-center text-sm">
            Sign in with GitHub to get started
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <GithubIcon size={20} />
                Sign in with GitHub
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-8">
          We request access to your repositories for analysis.
          <br />
          No code is stored on our servers.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-slate-400 hover:text-slate-300 text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

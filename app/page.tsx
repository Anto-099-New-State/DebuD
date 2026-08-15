'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sparkles, DollarSign, Zap } from 'lucide-react';
import { GithubIcon } from '@/app/components/icons';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-20">
          <div className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-blue-400" size={32} />
            DebuD
          </div>
          <div>
            {session ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            AI Design Buddy
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Upload your React repo. Choose a design style. Get professional UI
            improvements powered by Gemini AI.
          </p>

          {!session && (
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition"
            >
              <GithubIcon size={24} />
              Sign in with GitHub
            </Link>
          )}

          {session && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition"
            >
              <Zap size={24} />
              Go to Dashboard
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <GithubIcon className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              GitHub Connected
            </h3>
            <p className="text-slate-400">
              Sign in with GitHub. Select any of your repositories to analyze.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Powered</h3>
            <p className="text-slate-400">
              Gemini analyzes your components and suggests Tailwind improvements.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="text-green-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              $19 Per Project
            </h3>
            <p className="text-slate-400">
              Get patches and apply them to your repository instantly.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center text-slate-500 text-sm">
          <p>Built for the hackathon with Next.js, Gemini AI, and Stripe</p>
        </div>
      </div>
    </div>
  );
}

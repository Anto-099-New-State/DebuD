'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, ArrowRight, Sparkles } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={48} />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-slate-400 mb-8">
            Thank you for your purchase. Your patches are ready.
          </p>

          {owner && repo && (
            <div className="bg-slate-900 rounded-lg p-4 mb-8">
              <p className="text-sm text-slate-400">Repository</p>
              <p className="text-white font-medium">
                {owner}/{repo}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition">
              <Download size={20} />
              Download Patches
            </button>

            <Link
              href="/dashboard"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <ArrowRight size={20} />
              Back to Dashboard
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Sparkles size={16} />
              <span className="text-sm">Powered by DebuD AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

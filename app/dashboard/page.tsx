'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Star, ArrowRight, LogOut, Sparkles } from 'lucide-react';
import { GithubIcon } from '@/app/components/icons';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  updated_at: string | null;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchRepos();
    }
  }, [status, router]);

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/github/repos');
      if (!res.ok) throw new Error('Failed to fetch repos');
      const data = await res.json();
      setRepos(data);
      setError(null);
    } catch (err) {
      setError('Failed to load repositories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
          <p className="text-slate-300">Loading repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-700 text-red-300 p-6 rounded-lg">
            <p>{error}</p>
            <button
              onClick={fetchRepos}
              className="mt-4 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="text-blue-400" size={28} />
              <span className="text-2xl font-bold text-white">DebuD</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {session?.user?.name || 'Developer'}
            </h1>
            <p className="text-slate-400">Select a repository to analyze</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>

        {/* Repos Grid */}
        {repos.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
            <GithubIcon size={48} className="mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">No repositories found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {repos.map(repo => (
              <Link
                key={repo.id}
                href={`/dashboard/analyze?repo=${repo.name}&owner=${repo.full_name.split('/')[0]}`}
              >
                <div className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl p-6 transition cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GithubIcon size={18} className="text-slate-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {repo.name}
                        </h3>
                        {repo.language && (
                          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">
                        {repo.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star size={12} />
                          {repo.stars}
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-600 group-hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                      Analyze
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  FileCode,
  CheckCircle,
  AlertCircle,
  Palette,
  Code2,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { CodeComparison } from '@/app/components/CodeComparison';

interface ComponentAnalysis {
  name: string;
  path: string;
  issues: string[];
  suggestions: string[];
  tailwindSuggestions: {
    old: string;
    new: string;
    reason: string;
  }[];
  originalCode: string;
  suggestedCode: string;
}

type DesignStyle = 'modern' | 'minimal' | 'premium';

function AnalyzeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo');
  const owner = searchParams.get('owner');

  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ComponentAnalysis[]>([]);
  const [designStyle, setDesignStyle] = useState<DesignStyle>('modern');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && repo && owner) {
      fetchFiles();
    }
  }, [status, repo, owner, router]);

  const fetchFiles = async () => {
    try {
      const res = await fetch(
        `/api/github/contents?owner=${owner}&repo=${repo}`
      );
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to load repository files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openInEditor = (result: ComponentAnalysis, index: number) => {
    // Store component data in sessionStorage
    const key = `${Date.now()}_${index}`;
    sessionStorage.setItem(
      `debud_component_${key}`,
      JSON.stringify({
        name: result.name,
        path: result.path,
        originalCode: result.originalCode,
        suggestedCode: result.suggestedCode,
      })
    );
    // Navigate to editor
    router.push(`/dashboard/editor?key=${key}`);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          files: files.slice(0, 10),
          designStyle,
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
          <p className="text-slate-300">Loading repository...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ArrowLeft size={18} />
            Back to repositories
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-white">
                {owner}/{repo}
              </h1>
              <p className="text-slate-400">
                {files.length} component files found
              </p>
            </div>
          </div>
        </div>

        {/* Design Style Picker */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="text-purple-400" size={20} />
            <h2 className="text-lg font-semibold text-white">
              Choose Design Style
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {(['modern', 'minimal', 'premium'] as DesignStyle[]).map(style => (
              <button
                key={style}
                onClick={() => setDesignStyle(style)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  designStyle === style
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <h3 className="font-semibold text-white capitalize mb-1">
                  {style}
                </h3>
                <p className="text-sm text-slate-400">
                  {style === 'modern' && 'Clean lines, good contrast, subtle shadows'}
                  {style === 'minimal' && 'Maximum simplicity, white space focus'}
                  {style === 'premium' && 'Elegant, sophisticated, refined feel'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Files List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCode className="text-green-400" size={20} />
              <h2 className="text-lg font-semibold text-white">
                Component Files
              </h2>
            </div>
            <span className="text-sm text-slate-400">
              First 10 files will be analyzed
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {files.slice(0, 10).map((file, index) => (
              <div
                key={file}
                className="text-sm text-slate-300 py-1 px-2 rounded hover:bg-slate-700/50"
              >
                {index + 1}. {file}
              </div>
            ))}
            {files.length > 10 && (
              <p className="text-slate-500 text-sm mt-2">
                +{files.length - 10} more files
              </p>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing || files.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition mb-8"
        >
          {analyzing ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Analyzing with Gemini AI...
            </>
          ) : (
            <>
              <Sparkles size={24} />
              Analyze Components
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-lg mb-8 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-green-400" size={24} />
              Analysis Results
            </h2>

            {results.map((result, index) => (
              <div
                key={index}
                className="space-y-4"
              >
                {/* Component Header Card */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Code2 className="text-blue-400" size={20} />
                      <h3 className="text-lg font-semibold text-white">
                        {result.name}
                      </h3>
                    </div>
                    {result.originalCode && result.suggestedCode && (
                      <button
                        onClick={() => openInEditor(result, index)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        <Pencil size={16} />
                        Open in Live Editor
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-4 font-mono">{result.path}</p>

                  {result.issues.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-red-400 mb-2">
                        Issues Found:
                      </h4>
                      <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                        {result.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.tailwindSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">
                        Summary of Changes ({result.tailwindSuggestions.length}):
                      </h4>
                      <div className="space-y-2">
                        {result.tailwindSuggestions.slice(0, 3).map((suggestion, i) => (
                          <div
                            key={i}
                            className="bg-slate-900 rounded-lg p-3 text-sm"
                          >
                            <div className="flex gap-4 mb-1">
                              <div className="flex-1">
                                <span className="text-red-400 text-xs">OLD:</span>
                                <code className="block text-slate-300 mt-1 text-xs">
                                  {suggestion.old}
                                </code>
                              </div>
                              <div className="flex-1">
                                <span className="text-green-400 text-xs">NEW:</span>
                                <code className="block text-slate-300 mt-1 text-xs">
                                  {suggestion.new}
                                </code>
                              </div>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">
                              {suggestion.reason}
                            </p>
                          </div>
                        ))}
                        {result.tailwindSuggestions.length > 3 && (
                          <p className="text-slate-500 text-xs">
                            +{result.tailwindSuggestions.length - 3} more changes shown in comparison below
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual Code Comparison */}
                {result.originalCode && result.suggestedCode && (
                  <CodeComparison
                    originalCode={result.originalCode}
                    suggestedCode={result.suggestedCode}
                    fileName={result.path}
                  />
                )}
              </div>
            ))}

            {/* Payment CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                Get Your Patches
              </h3>
              <p className="text-blue-100 mb-6">
                Download all patches and apply them to your repository
              </p>
              <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-50 transition">
                Pay $19 & Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}

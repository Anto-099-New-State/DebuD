'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { LiveEditor } from '@/app/components/LiveEditor';

interface ComponentData {
  name: string;
  path: string;
  originalCode: string;
  suggestedCode: string;
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [componentData, setComponentData] = useState<ComponentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get component data from sessionStorage
    const dataKey = searchParams.get('key');
    if (dataKey) {
      try {
        const stored = sessionStorage.getItem(`debud_component_${dataKey}`);
        if (stored) {
          setComponentData(JSON.parse(stored));
        } else {
          setError('Component data not found. Please go back and try again.');
        }
      } catch (err) {
        setError('Failed to load component data.');
      }
    } else {
      setError('No component specified.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <p className="text-slate-300 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!componentData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-2"
        >
          <ArrowLeft size={18} />
          Back to Analysis
        </button>
        <h1 className="text-xl font-bold text-white">
          Live Editor: {componentData.name}
        </h1>
        <p className="text-sm text-slate-400 font-mono">{componentData.path}</p>
      </div>

      {/* Live Editor */}
      <LiveEditor
        originalCode={componentData.originalCode}
        suggestedCode={componentData.suggestedCode}
        componentName={componentData.name}
      />

      {/* Tips */}
      <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Tips:</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Toggle between Original and Suggested code to compare changes</li>
          <li>• Edit the code directly in the editor to see live preview updates</li>
          <li>• Use the responsive preview buttons to test different screen sizes</li>
          <li>• Copy the final code when you're happy with the changes</li>
        </ul>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}

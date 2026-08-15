'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Editor from '@monaco-editor/react';
import dynamic from 'next/dynamic';
import {
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  Code,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Zap,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

// Dynamically import SandpackPreview to avoid SSR issues
const SandpackPreview = dynamic(
  () => import('./SandpackPreview').then(mod => ({ default: mod.SandpackPreview })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-800">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Loading live preview...</p>
        </div>
      </div>
    ),
  }
);

interface LiveEditorProps {
  originalCode: string;
  suggestedCode: string;
  componentName: string;
  onClose?: () => void;
}

export function LiveEditor({
  originalCode,
  suggestedCode,
  componentName,
  onClose,
}: LiveEditorProps) {
  const [activeCode, setActiveCode] = useState<'original' | 'suggested'>('suggested');
  const [code, setCode] = useState(suggestedCode);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [previewMode, setPreviewMode] = useState<'static' | 'live'>('live');
  const [previewSize, setPreviewSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewWidths = {
    mobile: '375px',
    tablet: '768px',
    desktop: '100%',
  };

  useEffect(() => {
    setCode(activeCode === 'original' ? originalCode : suggestedCode);
  }, [activeCode, originalCode, suggestedCode]);

  // Check if component has external dependencies
  const hasExternalDeps = (code: string): boolean => {
    const patterns = [
      'framer-motion', 'motion', '@radix-ui', '@headlessui',
      '@chakra-ui', '@mui', 'lucide-react', 'react-icons',
      '@heroicons', 'recharts', 'react-hook-form', 'zod',
    ];
    return patterns.some(p => code.includes(p));
  };

  // Generate static preview HTML for simple components
  const generatePreviewHtml = (componentCode: string) => {
    // Extract JSX from the component
    let jsx = '';

    const simpleReturnMatch = componentCode.match(/return\s*\(\s*(<(?:div|section|main|article|header|footer|nav|aside|form|ul|ol|li|span|p|h[1-6]|button|a|img)[^>]*>[\s\S]*?<\/(?:div|section|main|article|header|footer|nav|aside|form|ul|ol|li|span|p|h[1-6]|button|a)>)\s*\)/);
    if (simpleReturnMatch) {
      jsx = simpleReturnMatch[1].trim();
    }

    if (!jsx) {
      const anyReturnMatch = componentCode.match(/return\s*\(\s*(<[a-zA-Z][^{]*?>)/);
      if (anyReturnMatch) {
        const tagName = anyReturnMatch[1].match(/<([a-zA-Z]+)/)?.[1];
        if (tagName) {
          const fullJsxMatch = componentCode.match(new RegExp(`return\\s*\\(\\s*(<${tagName}[^>]*>[\\s\\S]*?<\\/${tagName}>)\\s*\\)`));
          if (fullJsxMatch) {
            jsx = fullJsxMatch[1].trim();
          }
        }
      }
    }

    if (!jsx || jsx.includes('{(') || jsx.includes('=> {')) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 p-8">
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-800 mb-2">Switch to Live Mode</h3>
    <p class="text-gray-500 text-sm">Click the ⚡ button to enable live preview with full React support.</p>
  </div>
</body>
</html>`;
    }

    let previewJsx = jsx
      .replace(/className=/g, 'class=')
      .replace(/\s+onClick=\{[^}]*\}/g, '')
      .replace(/\s+onChange=\{[^}]*\}/g, '')
      .replace(/\s+onSubmit=\{[^}]*\}/g, '')
      .replace(/\s+ref=\{[^}]*\}/g, '')
      .replace(/\s+style=\{\{[^}]*\}\}/g, '')
      .replace(/\s+key=\{[^}]*\}/g, '')
      .replace(/\{[^{}]*\?[^{}]*:[^{}]*\}/g, '')
      .replace(/\{[^{}]*&&[^{}]*\}/g, '')
      .replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '[$1]')
      .replace(/\{[^{}]*\}/g, '');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; background: #f8fafc; }
    .preview-wrapper { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
  </style>
</head>
<body>
  <div class="preview-wrapper">${previewJsx}</div>
</body>
</html>`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(activeCode === 'original' ? originalCode : suggestedCode);
    setPreviewKey(k => k + 1);
  };

  const refreshPreview = () => {
    setPreviewKey(k => k + 1);
  };

  const previewHtml = generatePreviewHtml(code);
  const previewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;

  return (
    <div
      className={`bg-slate-900 rounded-xl border border-slate-700 overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white">{componentName}</h3>

          {/* Code Toggle */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setActiveCode('original')}
              className={`px-3 py-1 text-xs rounded-md transition ${
                activeCode === 'original'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveCode('suggested')}
              className={`px-3 py-1 text-xs rounded-md transition ${
                activeCode === 'suggested'
                  ? 'bg-green-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suggested
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Mode Toggle */}
          {viewMode !== 'editor' && (
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('static')}
                className={`p-1.5 rounded transition flex items-center gap-1 ${
                  previewMode === 'static' ? 'bg-orange-600 text-white' : 'text-slate-400'
                }`}
                title="Static Preview (fast)"
              >
                <ImageIcon size={14} />
              </button>
              <button
                onClick={() => setPreviewMode('live')}
                className={`p-1.5 rounded transition flex items-center gap-1 ${
                  previewMode === 'live' ? 'bg-green-600 text-white' : 'text-slate-400'
                }`}
                title="Live Preview (with npm packages)"
              >
                <Zap size={14} />
              </button>
            </div>
          )}

          {/* View Mode */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('editor')}
              className={`p-1.5 rounded transition ${
                viewMode === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
              title="Editor only"
            >
              <Code size={16} />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition ${
                viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
              title="Split view"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded transition ${
                viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
              title="Preview only"
            >
              <Eye size={16} />
            </button>
          </div>

          {/* Preview Size (only for static mode) */}
          {viewMode !== 'editor' && previewMode === 'static' && (
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setPreviewSize('mobile')}
                className={`p-1.5 rounded transition ${
                  previewSize === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
                title="Mobile (375px)"
              >
                <Smartphone size={16} />
              </button>
              <button
                onClick={() => setPreviewSize('tablet')}
                className={`p-1.5 rounded transition ${
                  previewSize === 'tablet' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
                title="Tablet (768px)"
              >
                <Tablet size={16} />
              </button>
              <button
                onClick={() => setPreviewSize('desktop')}
                className={`p-1.5 rounded transition ${
                  previewSize === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
                title="Desktop (100%)"
              >
                <Monitor size={16} />
              </button>
            </div>
          )}

          {/* Actions */}
          {viewMode !== 'editor' && previewMode === 'static' && (
            <button
              onClick={refreshPreview}
              className="p-2 text-slate-400 hover:text-white transition"
              title="Refresh preview"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-white transition"
            title="Reset code"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-slate-400 hover:text-white transition"
            title="Copy code"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-400 hover:text-white transition"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex ${viewMode === 'split' ? 'divide-x divide-slate-700' : ''}`}
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '500px' }}
      >
        {/* Code Editor */}
        {viewMode !== 'preview' && (
          <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
            <Editor
              height="100%"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 16 },
                automaticLayout: true,
              }}
            />
          </div>
        )}

        {/* Preview */}
        {viewMode !== 'editor' && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden`}>
            {previewMode === 'live' ? (
              // Sandpack Live Preview
              <div className="h-full" key={previewKey}>
                <SandpackPreview code={code} showEditor={false} />
              </div>
            ) : (
              // Static Preview
              <div className="h-full bg-slate-100 overflow-auto flex justify-center p-4">
                <div
                  style={{ width: previewWidths[previewSize], maxWidth: '100%' }}
                  className="h-full transition-all duration-300"
                >
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
                    <div className="bg-slate-200 px-3 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <span className="text-xs text-slate-500 ml-2">Static Preview</span>
                    </div>
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      src={previewSrc}
                      className="w-full h-full border-0"
                      style={{ minHeight: '400px' }}
                      title="Component Preview"
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>TypeScript React</span>
          <span>{code.split('\n').length} lines</span>
          {previewMode === 'live' && viewMode !== 'editor' && (
            <span className="flex items-center gap-1 text-green-400">
              <Zap size={12} />
              Live Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeCode === 'suggested' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{activeCode === 'suggested' ? 'Viewing suggested changes' : 'Viewing original code'}</span>
        </div>
      </div>
    </div>
  );
}

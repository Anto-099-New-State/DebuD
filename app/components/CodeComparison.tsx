'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface CodeComparisonProps {
  originalCode: string;
  suggestedCode: string;
  fileName: string;
}

export function CodeComparison({
  originalCode,
  suggestedCode,
  fileName,
}: CodeComparisonProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedSuggested, setCopiedSuggested] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const copyToClipboard = async (text: string, type: 'original' | 'suggested') => {
    await navigator.clipboard.writeText(text);
    if (type === 'original') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedSuggested(true);
      setTimeout(() => setCopiedSuggested(false), 2000);
    }
  };

  const highlightDifferences = (original: string, suggested: string) => {
    const originalLines = original.split('\n');
    const suggestedLines = suggested.split('\n');

    return { originalLines, suggestedLines };
  };

  const { originalLines, suggestedLines } = highlightDifferences(
    originalCode,
    suggestedCode
  );

  const getLineClass = (originalLine: string, suggestedLine: string) => {
    if (originalLine !== suggestedLine) {
      return {
        original: 'bg-red-900/30 border-l-2 border-red-500',
        suggested: 'bg-green-900/30 border-l-2 border-green-500',
      };
    }
    return { original: '', suggested: '' };
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-700/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown size={18} className="text-slate-400" />
          ) : (
            <ChevronRight size={18} className="text-slate-400" />
          )}
          <span className="font-mono text-sm text-slate-300">{fileName}</span>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-600 text-slate-300'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === 'unified'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-600 text-slate-300'
            }`}
          >
            Unified
          </button>
        </div>
      </div>

      {/* Code View */}
      {expanded && (
        <div className="overflow-x-auto">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-2 divide-x divide-slate-600">
              {/* Original Code */}
              <div className="relative">
                <div className="flex items-center justify-between px-3 py-2 bg-red-900/20 border-b border-slate-600">
                  <span className="text-xs font-medium text-red-400">
                    Original
                  </span>
                  <button
                    onClick={() => copyToClipboard(originalCode, 'original')}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    {copiedOriginal ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <pre className="text-xs leading-relaxed overflow-x-auto">
                  <code>
                    {originalLines.map((line, i) => {
                      const classes = getLineClass(
                        line,
                        suggestedLines[i] || ''
                      );
                      return (
                        <div
                          key={i}
                          className={`px-3 py-0.5 ${classes.original}`}
                        >
                          <span className="text-slate-500 select-none mr-3 inline-block w-8 text-right">
                            {i + 1}
                          </span>
                          <span className="text-slate-300">{line || ' '}</span>
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>

              {/* Suggested Code */}
              <div className="relative">
                <div className="flex items-center justify-between px-3 py-2 bg-green-900/20 border-b border-slate-600">
                  <span className="text-xs font-medium text-green-400">
                    Suggested
                  </span>
                  <button
                    onClick={() => copyToClipboard(suggestedCode, 'suggested')}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    {copiedSuggested ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <pre className="text-xs leading-relaxed overflow-x-auto">
                  <code>
                    {suggestedLines.map((line, i) => {
                      const classes = getLineClass(
                        originalLines[i] || '',
                        line
                      );
                      return (
                        <div
                          key={i}
                          className={`px-3 py-0.5 ${classes.suggested}`}
                        >
                          <span className="text-slate-500 select-none mr-3 inline-block w-8 text-right">
                            {i + 1}
                          </span>
                          <span className="text-slate-300">{line || ' '}</span>
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>
            </div>
          ) : (
            /* Unified View */
            <div className="relative">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-700/50 border-b border-slate-600">
                <span className="text-xs font-medium text-slate-400">
                  Unified Diff
                </span>
                <button
                  onClick={() => copyToClipboard(suggestedCode, 'suggested')}
                  className="text-slate-400 hover:text-slate-300"
                >
                  {copiedSuggested ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
              <pre className="text-xs leading-relaxed overflow-x-auto">
                <code>
                  {originalLines.map((originalLine, i) => {
                    const suggestedLine = suggestedLines[i] || '';
                    const isDifferent = originalLine !== suggestedLine;

                    if (isDifferent) {
                      return (
                        <div key={i}>
                          <div className="px-3 py-0.5 bg-red-900/30 border-l-2 border-red-500">
                            <span className="text-red-400 select-none mr-2">
                              -
                            </span>
                            <span className="text-slate-500 select-none mr-3 inline-block w-8 text-right">
                              {i + 1}
                            </span>
                            <span className="text-red-300">
                              {originalLine || ' '}
                            </span>
                          </div>
                          <div className="px-3 py-0.5 bg-green-900/30 border-l-2 border-green-500">
                            <span className="text-green-400 select-none mr-2">
                              +
                            </span>
                            <span className="text-slate-500 select-none mr-3 inline-block w-8 text-right">
                              {i + 1}
                            </span>
                            <span className="text-green-300">
                              {suggestedLine || ' '}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={i} className="px-3 py-0.5">
                        <span className="text-slate-600 select-none mr-2">
                          {' '}
                        </span>
                        <span className="text-slate-500 select-none mr-3 inline-block w-8 text-right">
                          {i + 1}
                        </span>
                        <span className="text-slate-400">{originalLine || ' '}</span>
                      </div>
                    );
                  })}
                </code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

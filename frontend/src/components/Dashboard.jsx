import { useState } from 'react';
import { apiUrl } from '../config/api';

export default function Dashboard({ addedSteps, onRunTest, results, isRunning }) {
  const [expandedScreenshot, setExpandedScreenshot] = useState(null);

  const hasSteps = addedSteps && addedSteps.length > 0;
  const configuredCount = hasSteps
    ? addedSteps.filter(s => Object.keys(s.config).length > 0).length
    : 0;

  function handleDownloadTrace() {
    if (!results?.traceId) return;
    const url = apiUrl(`/api/traces/${results.traceId}`);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${results.traceId}.zip`;
    a.click();
  }

  function handleOpenTraceViewer() {
    window.open('https://trace.playwright.dev', '_blank');
  }

  return (
    <div className="border-t border-slate-700 bg-slate-800 px-6 py-4 shrink-0 max-h-[50vh] overflow-y-auto">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Test Runner</h3>
            <p className="text-xs text-slate-400">
              {isRunning
                ? "Running test..."
                : !hasSteps
                ? "No steps defined"
                : `${addedSteps.length} steps · ${configuredCount} configured`}
            </p>
          </div>

          {hasSteps && !isRunning && (
            <div className="flex gap-1.5 ml-4">
              {addedSteps.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    Object.keys(step.config).length > 0 ? "bg-emerald-400" : "bg-slate-600"
                  }`}
                  title={step.text}
                />
              ))}
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Executing...</span>
            </div>
          )}
        </div>

        <button
          onClick={onRunTest}
          disabled={!hasSteps || isRunning}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
            hasSteps && !isRunning
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isRunning ? 'Running...' : 'Run Test'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Test Results</h4>

            {results.traceId && (
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadTrace}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                  </svg>
                  Download Trace
                </button>
                <button
                  onClick={handleOpenTraceViewer}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Trace Viewer
                </button>
              </div>
            )}
          </div>

          {results.error && !results.results?.length ? (
            <div className="bg-red-950/30 border border-red-900 rounded-md p-3">
              <p className="text-sm text-red-400 font-medium mb-1">Error</p>
              <p className="text-xs text-red-300">{results.error}</p>
            </div>
          ) : (
            <>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-slate-400">
                  Status:{' '}
                  <span className={results.success ? "text-emerald-400" : "text-red-400"}>
                    {results.success ? 'Passed' : 'Failed'}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Executed: {results.executedSteps} / {results.totalSteps} steps
                </p>
              </div>

              {results.results && results.results.length > 0 && (
                <div className="space-y-2">
                  {results.results.map((result, i) => (
                    <div
                      key={i}
                      className={`rounded-md border p-3 ${
                        result.status === 'passed'
                          ? 'border-slate-700 bg-slate-800/50'
                          : 'border-red-900/50 bg-red-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          result.status === 'passed' ? 'bg-emerald-400' : 'bg-red-400'
                        }`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-300 font-medium">
                              Step {result.step}: {result.type}
                            </span>
                            <span className="text-xs text-slate-500">{result.duration}ms</span>
                          </div>
                          {result.error && (
                            <p className="text-xs text-red-400 mt-1">{result.error}</p>
                          )}
                        </div>
                      </div>

                      {result.screenshot && (
                        <div className="mt-2 ml-5">
                          <button
                            onClick={() => setExpandedScreenshot(result.screenshot)}
                            className="group relative block rounded overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors"
                          >
                            <img
                              src={`data:image/png;base64,${result.screenshot}`}
                              alt={`Screenshot after step ${result.step}`}
                              className="w-48 h-auto"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Lightbox modal */}
      {expandedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedScreenshot(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpandedScreenshot(null)}
              className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-full shadow-lg transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={`data:image/png;base64,${expandedScreenshot}`}
              alt="Expanded screenshot"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl border border-slate-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

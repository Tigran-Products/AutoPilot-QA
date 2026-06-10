import { useState } from 'react';
import { apiUrl } from '../config/api';
import { isStepConfigured } from '../StepConfigs';

export default function Dashboard({ addedSteps, onRunTest, results, isRunning, onAnalyzeTest, onApplyFixes }) {
  const [expandedScreenshot, setExpandedScreenshot] = useState(null);
  const [aiAnalysis,      setAiAnalysis]      = useState(null);
  const [isAnalyzing,     setIsAnalyzing]     = useState(false);
  const [isApplying,      setIsApplying]      = useState(false);
  const [analyzeError,    setAnalyzeError]    = useState(null);

  const hasSteps = addedSteps && addedSteps.length > 0;
  const configuredCount = hasSteps
    ? addedSteps.filter(s => isStepConfigured(s.text, s.config)).length
    : 0;

  const hasFailed = results?.results?.some(r => r.status === 'failed');

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

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setAnalyzeError(null);
    try {
      const analysis = await onAnalyzeTest(
        addedSteps.map(s => ({ text: s.text, config: s.config })),
        results.results
      );
      setAiAnalysis(analysis);
    } catch (err) {
      setAnalyzeError(err.message || 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleApply() {
    if (!aiAnalysis?.suggestions?.length) return;
    setIsApplying(true);
    try {
      await onApplyFixes(
        addedSteps.map(s => ({ text: s.text, config: s.config })),
        aiAnalysis.suggestions
      );
      setAiAnalysis(null);
    } catch (err) {
      setAnalyzeError(err.message || 'Apply fixes failed');
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="border-t border-slate-700 bg-slate-800 px-6 py-4 shrink-0 max-h-[60vh] overflow-y-auto">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Test Runner</h3>
            <p className="text-xs text-slate-400">
              {isRunning
                ? 'Running test...'
                : !hasSteps
                ? 'No steps defined'
                : `${addedSteps.length} steps · ${configuredCount} configured`}
            </p>
          </div>

          {hasSteps && !isRunning && (
            <div className="flex gap-1.5 ml-4">
              {addedSteps.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    isStepConfigured(step.text, step.config) ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                  title={step.text}
                />
              ))}
            </div>
          )}

          {isRunning && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Executing on server...</span>
              </div>
              <span className="text-xs text-slate-500 ml-6">First run after idle may take 30–60s (Render waking up).</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* AI Analyze button — only shown when test has failed steps */}
          {hasFailed && !isRunning && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isApplying}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isAnalyzing
                  ? 'bg-violet-800 text-violet-300 cursor-wait'
                  : 'bg-violet-700 hover:bg-violet-600 text-white shadow-sm'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analyze with AI
                </>
              )}
            </button>
          )}

          <button
            onClick={onRunTest}
            disabled={!hasSteps || isRunning}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
              hasSteps && !isRunning
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isRunning ? 'Running...' : 'Run Test'}
          </button>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {analyzeError && (
        <div className="mt-4 bg-red-950/30 border border-red-900 rounded-md p-3">
          <p className="text-xs text-red-400">{analyzeError}</p>
        </div>
      )}

      {aiAnalysis && (
        <div className="mt-4 bg-violet-950/30 border border-violet-800/60 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-semibold text-violet-200">AI Analysis — LLaMA 3.3 70B</span>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Issues */}
          {aiAnalysis.issues.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Issues Found</p>
              <ul className="space-y-1">
                {aiAnalysis.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {aiAnalysis.suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Suggested Fixes ({aiAnalysis.suggestions.length})
              </p>
              <div className="space-y-2">
                {aiAnalysis.suggestions.map((s, i) => (
                  <div key={i} className="bg-slate-800/60 rounded-md p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-200">
                        Step {s.stepIndex + 1}
                      </span>
                      <span className="text-xs text-violet-400 font-mono bg-violet-950/50 px-1.5 py-0.5 rounded">
                        {s.field}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs mb-1.5">
                      <span className="text-red-400 font-mono line-through shrink-0 max-w-[45%] truncate" title={s.currentValue}>
                        {s.currentValue}
                      </span>
                      <svg className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="text-emerald-400 font-mono shrink-0 max-w-[45%] truncate" title={s.suggestedValue}>
                        {s.suggestedValue}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 italic">{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.suggestions.length === 0 && (
            <p className="text-xs text-slate-400 mb-4">No automatic fixes available. Review the issues above manually.</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {aiAnalysis.suggestions.length > 0 && (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isApplying
                    ? 'bg-emerald-800 text-emerald-300 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {isApplying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                    Applying & Re-running…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Fixes & Re-run
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setAiAnalysis(null)}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
                  <span className={results.success ? 'text-emerald-400' : 'text-red-400'}>
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
                              src={`data:image/jpeg;base64,${result.screenshot}`}
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
              src={`data:image/jpeg;base64,${expandedScreenshot}`}
              alt="Expanded screenshot"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl border border-slate-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

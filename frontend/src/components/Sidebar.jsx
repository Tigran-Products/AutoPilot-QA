import { useState } from 'react';

const steps = [
  { id: 1, text: "Navigate to URL" },
  { id: 2, text: "Click Element" },
  { id: 3, text: "Fill Form" },
  { id: 4, text: "Assert Text" },
  { id: 5, text: "Select Option" },
  { id: 6, text: "Wait for Element" },
  { id: 7, text: "Hover Element" },
  { id: 8, text: "Take Screenshot" },
  { id: 9, text: "Press Key" },
  { id: 10, text: "Upload File" },
  { id: 11, text: "Switch to Frame" },
  { id: 12, text: "Open New Tab" },
  { id: 13, text: "Close Tab" },
  { id: 14, text: "Go Back" },
  { id: 15, text: "Go Forward" },
  { id: 16, text: "Refresh Page" },
  { id: 17, text: "Scroll to Element" },
  { id: 18, text: "Check Checkbox" },
  { id: 19, text: "Uncheck Checkbox" },
  { id: 20, text: "Clear Input" }
];

export default function Sidebar({ handleAddStep, savedTests, onLoadTest, onDeleteSavedTest }) {
  const [tab, setTab] = useState("available");

  return (
    <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-lg font-semibold text-white tracking-tight">AutoTest</h1>
        <p className="text-xs text-slate-400 mt-0.5">Low-Code Test Builder</p>
      </div>

      <div className="flex text-sm border-b border-slate-700">
        <button
          onClick={() => setTab("available")}
          className={`flex-1 py-2.5 font-medium transition-colors ${
            tab === "available"
              ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-800"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Steps
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`flex-1 py-2.5 font-medium transition-colors relative ${
            tab === "saved"
              ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-800"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Saved
          {savedTests.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
              {savedTests.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {tab === "available" && steps.map((step) => (
          <button
            key={step.id}
            onClick={() => handleAddStep(step)}
            className="w-full text-left px-3 py-2.5 rounded-md text-sm text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors group flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="truncate">{step.text}</span>
            <span className="ml-auto text-xs text-slate-500 opacity-0 group-hover:opacity-100">+</span>
          </button>
        ))}

        {tab === "saved" && (
          savedTests.length > 0 ? (
            <div className="space-y-2">
              {savedTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{test.name}</span>
                    <span className="text-xs text-slate-500">{test.steps.length} steps</span>
                  </div>

                  <div className="mb-3 space-y-1">
                    {test.steps.slice(0, 3).map((step, i) => (
                      <p key={i} className="text-xs text-slate-400 truncate pl-2 border-l border-slate-700">
                        {step.text}
                      </p>
                    ))}
                    {test.steps.length > 3 && (
                      <p className="text-xs text-slate-500 pl-2">+{test.steps.length - 3} more</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadTest(test)}
                      className="flex-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDeleteSavedTest(test.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-600/10 border border-red-900 hover:bg-red-600/20 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-10 h-10 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-sm text-slate-400">No saved tests yet</p>
              <p className="text-xs text-slate-500 mt-1">Build a test and click Save to store it here</p>
            </div>
          )
        )}
      </div>
    </aside>
  );
}

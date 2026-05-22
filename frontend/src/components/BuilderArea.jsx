import { useState } from 'react';
import StepBlock from './StepBlock';
import StepConfig from './StepConfig';

export default function BuilderArea({ addedSteps, onUpdateStepConfig, onRemoveStep, onSaveTest }) {
  const [selectedStep, setSelectedStep] = useState(null);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Builder Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Test Flow</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {addedSteps.length === 0
                ? "Add steps from the sidebar to build your test"
                : `${addedSteps.length} step${addedSteps.length !== 1 ? "s" : ""} in flow`}
            </p>
          </div>
          {addedSteps.length > 0 && (
            <button
              onClick={onSaveTest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save Test
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {addedSteps.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">Click steps in the sidebar to add them here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {addedSteps.map((step, index) => (
                <StepBlock
                  key={step.id}
                  step={step}
                  index={index}
                  isSelected={selectedStep?.id === step.id}
                  onSelect={() => setSelectedStep(step)}
                  onRemove={() => {
                    onRemoveStep(step.id);
                    if (selectedStep?.id === step.id) setSelectedStep(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Config Panel */}
      <div className="w-80 border-l border-slate-700 bg-slate-800 flex flex-col overflow-hidden">
        {!selectedStep ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-slate-400 text-sm">Select a step to configure</p>
            </div>
          </div>
        ) : (
          <StepConfig
            key={selectedStep.id}
            step={selectedStep}
            onConfigChange={(config) => onUpdateStepConfig(selectedStep.id, config)}
          />
        )}
      </div>
    </div>
  );
}

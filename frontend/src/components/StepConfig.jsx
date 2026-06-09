import STEP_CONFIGS, { FILTER_OPTIONS, ASSERTION_OPTIONS } from '../StepConfigs';
import ConfigInput from './ConfigInput';
import ConfigSelect from './ConfigSelect';
import { useState } from 'react';

function assertionMeta(type) {
  return ASSERTION_OPTIONS.find((a) => a.value === type) || ASSERTION_OPTIONS[0];
}

function shouldShowField(field, localConfig) {
  if (!field.showWhen) return true;
  const { field: depField, notPageLevel, needsValue } = field.showWhen;
  const depValue = localConfig[depField];
  const meta = assertionMeta(depValue);
  if (notPageLevel && meta.pageLevel) return false;
  if (needsValue && !meta.needsValue) return false;
  return true;
}

function StepConfig({ step, onConfigChange }) {
  const stepConfig = STEP_CONFIGS[step.text];
  const [localConfig, setLocalConfig] = useState(step.config || {});

  const handleFieldChange = (fieldName, value) => {
    const updated = { ...localConfig, [fieldName]: value };

    if (fieldName === 'additionalFilter') {
      if (!value) {
        delete updated.additionalFilterValue;
      } else {
        const opt = FILTER_OPTIONS.find((o) => o.value === value);
        if (opt && !opt.needsValue) {
          delete updated.additionalFilterValue;
        }
      }
    }

    if (fieldName === 'assertionType') {
      const meta = assertionMeta(value);
      if (meta.pageLevel) {
        delete updated.selectorType;
        delete updated.selectorValue;
        delete updated.additionalFilter;
        delete updated.additionalFilterValue;
      }
      if (!meta.needsValue) {
        delete updated.expectedValue;
      }
    }

    setLocalConfig(updated);
    onConfigChange(updated);
  };

  if (!stepConfig || stepConfig.fields.length === 0) {
    return (
      <div className="p-5">
        <div className="border-b border-slate-700 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-white">{step.text}</h3>
        </div>
        <p className="text-xs text-slate-400">No configuration needed — ready to run.</p>
      </div>
    );
  }

  const selectedFilter = localConfig.additionalFilter || '';
  const selectedFilterOption = FILTER_OPTIONS.find((o) => o.value === selectedFilter);
  const assertMeta = assertionMeta(localConfig.assertionType);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-700 shrink-0">
        <h3 className="text-sm font-semibold text-white">{step.text}</h3>
        <p className="text-xs text-slate-400 mt-0.5">Configure step parameters</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {stepConfig.fields.map((field) => {
          if (!shouldShowField(field, localConfig)) {
            return null;
          }

          if (field.type === 'filter' && assertMeta.pageLevel) {
            return null;
          }

          if (field.type === 'filter') {
            return (
              <div key={field.name} className="space-y-3">
                <div className="border-t border-slate-700 pt-3">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {field.label}
                  </label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => handleFieldChange('additionalFilter', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {selectedFilterOption?.needsValue && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Filter Value
                    </label>
                    <input
                      type={selectedFilterOption.valueType || 'text'}
                      placeholder={selectedFilterOption.placeholder}
                      value={localConfig.additionalFilterValue || ''}
                      onChange={(e) => handleFieldChange('additionalFilterValue', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            );
          }

          const assertFieldMeta = field.name === 'expectedValue' ? assertMeta : null;

          return (
            <div key={field.name}>
              {(field.type === 'text' || field.type === 'number') && (
                <ConfigInput
                  label={field.label}
                  type={assertFieldMeta?.valueType || field.type}
                  placeholder={assertFieldMeta?.placeholder || field.placeholder}
                  required={assertMeta.needsValue && field.name === 'expectedValue'}
                  value={localConfig[field.name] || ''}
                  onChange={(value) => handleFieldChange(field.name, value)}
                />
              )}
              {field.type === 'select' && (
                <ConfigSelect
                  label={field.label}
                  options={field.options}
                  value={localConfig[field.name] ?? field.default ?? ''}
                  onChange={(value) => handleFieldChange(field.name, value)}
                />
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(localConfig).length > 0 && (
        <div className="border-t border-slate-700 p-4 shrink-0 bg-slate-850">
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Config Preview</p>
          <pre className="text-xs text-slate-400 font-mono bg-slate-900 rounded p-3 overflow-auto max-h-28">
            {JSON.stringify(localConfig, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default StepConfig;

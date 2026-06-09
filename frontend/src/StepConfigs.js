const SELECTOR_OPTIONS = [
  'getByRole',
  'getByText',
  'getByLabel',
  'getByPlaceholder',
  'getByAltText',
  'getByTitle',
  'getByTestId',
  'CSS Selector',
  'XPath',
];

const ASSERTION_OPTIONS = [
  { value: 'toBeVisible', label: 'toBeVisible', needsValue: false },
  { value: 'toBeHidden', label: 'toBeHidden', needsValue: false },
  { value: 'toBeEnabled', label: 'toBeEnabled', needsValue: false },
  { value: 'toBeDisabled', label: 'toBeDisabled', needsValue: false },
  { value: 'toBeChecked', label: 'toBeChecked', needsValue: false },
  { value: 'toBeEmpty', label: 'toBeEmpty', needsValue: false },
  { value: 'toHaveText', label: 'toHaveText', needsValue: true, placeholder: 'Exact text' },
  { value: 'toContainText', label: 'toContainText', needsValue: true, placeholder: 'Partial text' },
  { value: 'toHaveValue', label: 'toHaveValue', needsValue: true, placeholder: 'Input value' },
  { value: 'toHaveAttribute', label: 'toHaveAttribute', needsValue: true, placeholder: 'name=submit or class=btn' },
  { value: 'toHaveCount', label: 'toHaveCount', needsValue: true, valueType: 'number', placeholder: '1' },
  { value: 'toHaveURL', label: 'toHaveURL (page)', needsValue: true, placeholder: 'https://example.com/page', pageLevel: true },
  { value: 'toHaveTitle', label: 'toHaveTitle (page)', needsValue: true, placeholder: 'Page title', pageLevel: true },
];

const FILTER_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'first', label: 'first', needsValue: false },
  { value: 'last', label: 'last', needsValue: false },
  { value: 'nth', label: 'nth(index)', needsValue: true, valueType: 'number', placeholder: '0' },
  { value: 'hasText', label: 'filter: hasText', needsValue: true, valueType: 'text', placeholder: 'visible text to match' },
  { value: 'hasNotText', label: 'filter: hasNotText', needsValue: true, valueType: 'text', placeholder: 'text that should NOT be present' },
  { value: 'has', label: 'filter: has', needsValue: true, valueType: 'text', placeholder: 'CSS selector of child, e.g. .icon' },
  { value: 'hasNot', label: 'filter: hasNot', needsValue: true, valueType: 'text', placeholder: 'CSS selector child must NOT have' },
  { value: 'locator', label: 'locator (sub-selector)', needsValue: true, valueType: 'text', placeholder: 'CSS sub-selector, e.g. >> .btn' },
  { value: 'and', label: 'and (intersect)', needsValue: true, valueType: 'text', placeholder: 'CSS selector to intersect with' },
  { value: 'or', label: 'or (union)', needsValue: true, valueType: 'text', placeholder: 'CSS selector to union with' },
];

const FILTER_FIELD = {
  name: 'additionalFilter',
  type: 'filter',
  label: 'Additional Filter',
};

/** Steps that run without opening the config panel */
const STEPS_WITHOUT_CONFIG = [
  'Close Tab',
  'Go Back',
  'Go Forward',
  'Refresh Page',
];

function getDefaultConfig(stepText) {
  if (STEPS_WITHOUT_CONFIG.includes(stepText)) {
    return { ready: true };
  }

  const stepConfig = STEP_CONFIGS[stepText];
  if (!stepConfig?.fields?.length) {
    return { ready: true };
  }

  const config = {};
  for (const field of stepConfig.fields) {
    if (field.default !== undefined && field.default !== '') {
      config[field.name] = field.default;
    }
  }
  return config;
}

function isStepConfigured(stepText, config = {}) {
  if (STEPS_WITHOUT_CONFIG.includes(stepText)) {
    return true;
  }

  const stepConfig = STEP_CONFIGS[stepText];
  if (!stepConfig) {
    return false;
  }

  if (!stepConfig.fields.length) {
    return true;
  }

  for (const field of stepConfig.fields) {
    if (!field.required) continue;
    const value = config[field.name];
    if (value === undefined || value === null || String(value).trim() === '') {
      return false;
    }
  }

  return true;
}

const STEP_CONFIGS = {
  'Navigate to URL': {
    fields: [
      { name: 'url', type: 'text', label: 'URL', placeholder: 'https://example.com', required: true },
      { name: 'waitUntil', type: 'select', label: 'Wait Until', options: ['domcontentloaded', 'load', 'networkidle'], default: 'domcontentloaded' },
    ],
  },
  'Click Element': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByRole' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'button', required: true },
      { name: 'clickOptions', type: 'select', label: 'Click Type', options: ['single', 'double', 'right'], default: 'single' },
      { ...FILTER_FIELD },
    ],
  },
  'Fill Form': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByLabel' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'Email', required: true },
      { name: 'inputValue', type: 'text', label: 'Input Value', placeholder: 'Enter text to type', required: true },
      { ...FILTER_FIELD },
    ],
  },
  'Assert Element': {
    fields: [
      { name: 'assertionType', type: 'select', label: 'Assertion Type', options: ASSERTION_OPTIONS.map((a) => a.value), default: 'toBeVisible' },
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByText', showWhen: { field: 'assertionType', notPageLevel: true } },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'Welcome', required: true, showWhen: { field: 'assertionType', notPageLevel: true } },
      { name: 'expectedValue', type: 'text', label: 'Expected Value', placeholder: 'Expected value', required: false, showWhen: { field: 'assertionType', needsValue: true } },
      { ...FILTER_FIELD },
    ],
  },
  'Select Option': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByLabel' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'Country', required: true },
      { name: 'optionValue', type: 'text', label: 'Option Value', placeholder: 'USA', required: true },
      { name: 'selectionMethod', type: 'select', label: 'Select By', options: ['value', 'label', 'index'], default: 'label' },
      { ...FILTER_FIELD },
    ],
  },
  'Wait for Element': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByRole' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'button', required: true },
      { name: 'state', type: 'select', label: 'Wait State', options: ['visible', 'attached', 'detached', 'hidden'], default: 'visible' },
      { name: 'timeout', type: 'number', label: 'Timeout (ms)', placeholder: '15000', default: '15000' },
      { ...FILTER_FIELD },
    ],
  },
  'Hover Element': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByRole' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'button', required: true },
      { ...FILTER_FIELD },
    ],
  },
  'Take Screenshot': {
    fields: [
      { name: 'screenshotType', type: 'select', label: 'Screenshot Type', options: ['fullPage', 'element', 'viewport'], default: 'fullPage' },
      { name: 'selectorType', type: 'select', label: 'Selector Type (if element)', options: SELECTOR_OPTIONS, default: 'getByRole' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value (if element)', placeholder: 'header', required: false },
      { name: 'fileName', type: 'text', label: 'File Name', placeholder: 'screenshot.png', default: 'screenshot.png' },
      { ...FILTER_FIELD },
    ],
  },
  'Press Key': {
    fields: [
      { name: 'key', type: 'select', label: 'Key', options: ['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Control', 'Shift', 'Alt'], default: 'Enter', required: true },
      { name: 'modifiers', type: 'text', label: 'Modifiers (optional)', placeholder: 'Control+Shift', required: false },
    ],
  },
  'Upload File': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByLabel' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'Upload file', required: true },
      { name: 'filePath', type: 'text', label: 'File Path', placeholder: '/path/to/file.pdf', required: true },
      { ...FILTER_FIELD },
    ],
  },
  'Switch to Frame': {
    fields: [
      { name: 'frameSelector', type: 'select', label: 'Frame Selector Type', options: ['name', 'url', 'CSS Selector', 'index'], default: 'name' },
      { name: 'frameValue', type: 'text', label: 'Frame Value', placeholder: 'iframe-name', required: true },
    ],
  },
  'Open New Tab': {
    fields: [
      { name: 'url', type: 'text', label: 'URL (optional)', placeholder: 'https://example.com', required: false },
    ],
  },
  'Close Tab': { fields: [] },
  'Go Back': { fields: [] },
  'Go Forward': { fields: [] },
  'Refresh Page': { fields: [] },
  'Scroll to Element': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByRole' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'footer', required: true },
      { name: 'behavior', type: 'select', label: 'Scroll Behavior', options: ['smooth', 'auto'], default: 'smooth' },
      { ...FILTER_FIELD },
    ],
  },
  'Check Checkbox': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByLabel' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'Accept terms', required: true },
      { ...FILTER_FIELD },
    ],
  },
  'Uncheck Checkbox': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByLabel' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'Subscribe to newsletter', required: true },
      { ...FILTER_FIELD },
    ],
  },
  'Clear Input': {
    fields: [
      { name: 'selectorType', type: 'select', label: 'Selector Type', options: SELECTOR_OPTIONS, default: 'getByLabel' },
      { name: 'selectorValue', type: 'text', label: 'Selector Value', placeholder: 'Email', required: true },
      { ...FILTER_FIELD },
    ],
  },
};

// Legacy saved tests may still reference "Assert Text"
STEP_CONFIGS['Assert Text'] = STEP_CONFIGS['Assert Element'];

export {
  FILTER_OPTIONS,
  ASSERTION_OPTIONS,
  SELECTOR_OPTIONS,
  STEPS_WITHOUT_CONFIG,
  getDefaultConfig,
  isStepConfigured,
};
export default STEP_CONFIGS;

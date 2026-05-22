const FILTER_OPTIONS = [
  { value: "",             label: "None" },
  { value: "first",        label: "first",              needsValue: false },
  { value: "last",         label: "last",               needsValue: false },
  { value: "nth",          label: "nth(index)",         needsValue: true,  valueType: "number",  placeholder: "0" },
  { value: "hasText",      label: "filter: hasText",    needsValue: true,  valueType: "text",    placeholder: "visible text to match" },
  { value: "hasNotText",   label: "filter: hasNotText", needsValue: true,  valueType: "text",    placeholder: "text that should NOT be present" },
  { value: "has",          label: "filter: has",         needsValue: true,  valueType: "text",    placeholder: "CSS selector of child, e.g. .icon" },
  { value: "hasNot",       label: "filter: hasNot",      needsValue: true,  valueType: "text",    placeholder: "CSS selector child must NOT have" },
  { value: "locator",      label: "locator (sub-selector)", needsValue: true, valueType: "text", placeholder: "CSS sub-selector, e.g. >> .btn" },
  { value: "and",          label: "and (intersect)",     needsValue: true,  valueType: "text",    placeholder: "CSS selector to intersect with" },
  { value: "or",           label: "or (union)",          needsValue: true,  valueType: "text",    placeholder: "CSS selector to union with" },
];

const FILTER_FIELD = {
  name: "additionalFilter",
  type: "filter",
  label: "Additional Filter",
};

const STEP_CONFIGS = {
    "Navigate to URL": {
      fields: [
        { name: "url", type: "text", label: "URL", placeholder: "https://example.com", required: true },
        { name: "waitUntil", type: "select", label: "Wait Until", options: ["load", "domcontentloaded", "networkidle"], default: "networkidle" }
      ]
    },
    "Click Element": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByText", "getByLabel", "getByPlaceholder", "getByTestId", "CSS Selector", "XPath"], default: "getByRole" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "button", required: true },
        { name: "clickOptions", type: "select", label: "Click Type", options: ["single", "double", "right"], default: "single" },
        { ...FILTER_FIELD },
      ]
    },
    "Fill Form": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByLabel", "getByPlaceholder", "CSS Selector", "XPath"], default: "getByLabel" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "Email", required: true },
        { name: "inputValue", type: "text", label: "Input Value", placeholder: "Enter text to type", required: true },
        { ...FILTER_FIELD },
      ]
    },
    "Assert Text": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByText", "getByRole", "getByLabel", "CSS Selector", "XPath"], default: "getByText" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "Welcome", required: true },
        { name: "assertionType", type: "select", label: "Assertion Type", options: ["toBeVisible", "toHaveText", "toContainText", "toBeHidden"], default: "toBeVisible" },
        { name: "expectedValue", type: "text", label: "Expected Value (if needed)", placeholder: "Expected text", required: false },
        { ...FILTER_FIELD },
      ]
    },
    "Select Option": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByLabel", "CSS Selector", "XPath"], default: "getByLabel" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "Country", required: true },
        { name: "optionValue", type: "text", label: "Option Value", placeholder: "USA", required: true },
        { name: "selectionMethod", type: "select", label: "Select By", options: ["value", "label", "index"], default: "label" },
        { ...FILTER_FIELD },
      ]
    },
    "Wait for Element": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByText", "getByLabel", "CSS Selector", "XPath"], default: "getByRole" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "button", required: true },
        { name: "state", type: "select", label: "Wait State", options: ["visible", "attached", "detached", "hidden"], default: "visible" },
        { name: "timeout", type: "number", label: "Timeout (ms)", placeholder: "30000", default: "30000" },
        { ...FILTER_FIELD },
      ]
    },
    "Hover Element": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByText", "getByLabel", "CSS Selector", "XPath"], default: "getByRole" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "button", required: true },
        { ...FILTER_FIELD },
      ]
    },
    "Take Screenshot": {
      fields: [
        { name: "screenshotType", type: "select", label: "Screenshot Type", options: ["fullPage", "element", "viewport"], default: "fullPage" },
        { name: "selectorType", type: "select", label: "Selector Type (if element)", options: ["getByRole", "getByText", "CSS Selector", "XPath"], default: "getByRole" },
        { name: "selectorValue", type: "text", label: "Selector Value (if element)", placeholder: "header", required: false },
        { name: "fileName", type: "text", label: "File Name", placeholder: "screenshot.png", default: "screenshot.png" },
        { ...FILTER_FIELD },
      ]
    },
    "Press Key": {
      fields: [
        { name: "key", type: "select", label: "Key", options: ["Enter", "Escape", "Tab", "Backspace", "Delete", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Control", "Shift", "Alt"], default: "Enter" },
        { name: "modifiers", type: "text", label: "Modifiers (optional)", placeholder: "Control+Shift", required: false },
      ]
    },
    "Upload File": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByLabel", "CSS Selector", "XPath"], default: "getByLabel" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "Upload file", required: true },
        { name: "filePath", type: "text", label: "File Path", placeholder: "/path/to/file.pdf", required: true },
        { ...FILTER_FIELD },
      ]
    },
    "Switch to Frame": {
      fields: [
        { name: "frameSelector", type: "select", label: "Frame Selector Type", options: ["name", "url", "CSS Selector", "index"], default: "name" },
        { name: "frameValue", type: "text", label: "Frame Value", placeholder: "iframe-name", required: true }
      ]
    },
    "Open New Tab": {
      fields: [
        { name: "url", type: "text", label: "URL (optional)", placeholder: "https://example.com", required: false }
      ]
    },
    "Close Tab": {
      fields: []
    },
    "Go Back": {
      fields: []
    },
    "Go Forward": {
      fields: []
    },
    "Refresh Page": {
      fields: []
    },
    "Scroll to Element": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByText", "CSS Selector", "XPath"], default: "getByRole" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "footer", required: true },
        { name: "behavior", type: "select", label: "Scroll Behavior", options: ["smooth", "auto"], default: "smooth" },
        { ...FILTER_FIELD },
      ]
    },
    "Check Checkbox": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByLabel", "CSS Selector", "XPath"], default: "getByLabel" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "Accept terms", required: true },
        { ...FILTER_FIELD },
      ]
    },
    "Uncheck Checkbox": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByRole", "getByLabel", "CSS Selector", "XPath"], default: "getByLabel" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "Subscribe to newsletter", required: true },
        { ...FILTER_FIELD },
      ]
    },
    "Clear Input": {
      fields: [
        { name: "selectorType", type: "select", label: "Selector Type", options: ["getByLabel", "getByPlaceholder", "CSS Selector", "XPath"], default: "getByLabel" },
        { name: "selectorValue", type: "text", label: "Selector Value", placeholder: "Email", required: true },
        { ...FILTER_FIELD },
      ]
    }
  };

export { FILTER_OPTIONS };
export default STEP_CONFIGS;

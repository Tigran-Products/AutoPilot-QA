const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TRACES_DIR = path.join(__dirname, 'traces');

if (!fs.existsSync(TRACES_DIR)) {
  fs.mkdirSync(TRACES_DIR, { recursive: true });
}

const DEFAULT_TIMEOUT = 15000;

async function waitForPageStable(page, timeout = DEFAULT_TIMEOUT) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: DEFAULT_TIMEOUT });
    } catch {
      // ignore
    }
  }
  await new Promise((r) => setTimeout(r, 300));
}

async function captureStepScreenshot(page) {
  await waitForPageStable(page, 8000);
  const buf = await page.screenshot({ type: 'png', fullPage: true });
  return buf.toString('base64');
}

async function executeSteps(steps) {
  const traceId = `trace-${Date.now()}`;
  console.log(`[stepExecutor] Starting execution of ${steps.length} steps (${traceId})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  let page = await context.newPage();

  page.setDefaultTimeout(DEFAULT_TIMEOUT);

  await context.tracing.start({ screenshots: true, snapshots: true });

  const results = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const startTime = Date.now();
    let screenshot = null;

    try {
      page = await executeStep(page, context, step);
      try {
        screenshot = await captureStepScreenshot(page);
      } catch (_) {}
      results.push({
        step: i + 1,
        type: step.text,
        status: 'passed',
        duration: Date.now() - startTime,
        screenshot,
      });
    } catch (error) {
      try {
        screenshot = await captureStepScreenshot(page);
      } catch (_) {}
      results.push({
        step: i + 1,
        type: step.text,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
        screenshot,
      });
      break;
    }
  }

  const tracePath = path.join(TRACES_DIR, `${traceId}.zip`);
  await context.tracing.stop({ path: tracePath });
  await browser.close();

  return { results, traceId };
}

async function executeStep(page, context, step) {
  const { text, config } = step;

  if (!config || Object.keys(config).length === 0) {
    throw new Error(`Step "${text}" has no configuration`);
  }

  switch (text) {
    case "Navigate to URL": {
      if (!config.url || config.url.trim() === '') {
        throw new Error('URL is required for Navigate step');
      }
      const waitUntil = config.waitUntil || 'load';
      await page.goto(config.url, { waitUntil, timeout: DEFAULT_TIMEOUT });
      await waitForPageStable(page);
      break;
    }

    case "Click Element": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await assertLocatorMatches(el, config);
      await el.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
      await el.scrollIntoViewIfNeeded();
      if (config.clickOptions === 'double') {
        await el.dblclick();
      } else if (config.clickOptions === 'right') {
        await el.click({ button: 'right' });
      } else {
        await el.click();
      }
      await waitForPageStable(page);
      break;
    }

    case "Fill Form": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
      await el.fill(config.inputValue || '');
      break;
    }

    case "Assert Text": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({ state: 'attached', timeout: DEFAULT_TIMEOUT });
      switch (config.assertionType) {
        case 'toBeVisible':
          if (!await el.isVisible()) throw new Error(`Element "${config.selectorValue}" is not visible`);
          break;
        case 'toHaveText':
          const actualText = await el.textContent();
          if (actualText !== config.expectedValue)
            throw new Error(`Expected text "${config.expectedValue}", got "${actualText}"`);
          break;
        case 'toContainText':
          const containsText = await el.textContent();
          if (!containsText.includes(config.expectedValue))
            throw new Error(`Text does not contain "${config.expectedValue}"`);
          break;
        case 'toBeHidden':
          if (await el.isVisible()) throw new Error(`Element "${config.selectorValue}" is visible but expected hidden`);
          break;
      }
      break;
    }

    case "Select Option": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
      if (config.selectionMethod === 'index') {
        await el.selectOption({ index: parseInt(config.optionValue) });
      } else if (config.selectionMethod === 'value') {
        await el.selectOption({ value: config.optionValue });
      } else {
        await el.selectOption({ label: config.optionValue });
      }
      break;
    }

    case "Wait for Element": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({
        state: config.state || 'visible',
        timeout: parseInt(config.timeout) || 5000
      });
      break;
    }

    case "Hover Element": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
      await el.hover();
      break;
    }

    case "Take Screenshot": {
      if (config.screenshotType === 'element' && config.selectorValue) {
        const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
        await el.screenshot({ path: config.fileName || 'screenshot.png' });
      } else if (config.screenshotType === 'fullPage') {
        await page.screenshot({ path: config.fileName || 'screenshot.png', fullPage: true });
      } else {
        await page.screenshot({ path: config.fileName || 'screenshot.png' });
      }
      break;
    }

    case "Press Key": {
      if (!config.key || config.key.trim() === '') {
        throw new Error('Key is required for Press Key step');
      }
      const key = config.modifiers
        ? `${config.modifiers}+${config.key}`
        : config.key;
      await page.keyboard.press(key);
      break;
    }

    case "Upload File": {
      requireSelector(config);
      if (!config.filePath || config.filePath.trim() === '') {
        throw new Error('File path is required for Upload step');
      }
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.setInputFiles(config.filePath);
      break;
    }

    case "Switch to Frame": {
      if (!config.frameValue || config.frameValue.trim() === '') {
        throw new Error('Frame identifier is required');
      }
      let frame;
      if (config.frameSelector === 'name') {
        frame = page.frameLocator(`[name="${config.frameValue}"]`);
      } else if (config.frameSelector === 'url') {
        frame = page.frame({ url: config.frameValue });
      } else if (config.frameSelector === 'index') {
        const frames = page.frames();
        frame = frames[parseInt(config.frameValue)];
      } else {
        frame = page.frameLocator(config.frameValue);
      }
      if (!frame) throw new Error(`Frame not found: ${config.frameValue}`);
      break;
    }

    case "Open New Tab": {
      const newPage = await context.newPage();
      if (config.url) {
        await newPage.goto(config.url);
      }
      page = newPage;
      break;
    }

    case "Close Tab": {
      await page.close();
      const pages = context.pages();
      if (pages.length > 0) {
        page = pages[pages.length - 1];
      }
      break;
    }

    case "Go Back": {
      await page.goBack();
      break;
    }

    case "Go Forward": {
      await page.goForward();
      break;
    }

    case "Refresh Page": {
      await page.reload();
      break;
    }

    case "Scroll to Element": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.scrollIntoViewIfNeeded();
      break;
    }

    case "Check Checkbox": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
      await el.check();
      break;
    }

    case "Uncheck Checkbox": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
      await el.uncheck();
      break;
    }

    case "Clear Input": {
      requireSelector(config);
      const el = getElement(page, config.selectorType, config.selectorValue, config.additionalFilter, config.additionalFilterValue);
      await el.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
      await el.clear();
      break;
    }

    default:
      throw new Error(`Unknown step type: "${text}"`);
  }

  return page;
}

function requireSelector(config) {
  if (!config.selectorType || !config.selectorValue || config.selectorValue.trim() === '') {
    throw new Error('Selector type and value are required');
  }
}

async function assertLocatorMatches(el, config) {
  const count = await el.count();
  if (count === 0) {
    const filter = config.additionalFilter
      ? ` with filter "${config.additionalFilter}"${config.additionalFilterValue ? ` = "${config.additionalFilterValue}"` : ''}`
      : '';
    throw new Error(
      `No elements matched "${config.selectorValue}" (${config.selectorType})${filter}. ` +
      'For SPAs, ensure the page finished loading (use Navigate with networkidle or add a Wait step).'
    );
  }
  if (config.additionalFilter === 'nth') {
    const index = parseInt(config.additionalFilterValue, 10);
    if (Number.isNaN(index) || index < 0) {
      throw new Error(`Invalid nth index: "${config.additionalFilterValue}"`);
    }
    if (index >= count) {
      throw new Error(
        `nth(${index}) is out of range: only ${count} element(s) matched "${config.selectorValue}". Use index 0–${count - 1}.`
      );
    }
  }
}

function getElement(page, selectorType, value, filterType, filterValue) {
  let el;
  switch (selectorType) {
    case "getByRole":        el = page.getByRole(value); break;
    case "getByText":        el = page.getByText(value); break;
    case "getByLabel":       el = page.getByLabel(value); break;
    case "getByPlaceholder": el = page.getByPlaceholder(value); break;
    case "getByTestId":      el = page.getByTestId(value); break;
    case "CSS Selector":     el = page.locator(value); break;
    case "XPath":            el = page.locator(`xpath=${value}`); break;
    default:                 el = page.locator(value); break;
  }

  if (!filterType) return el;

  switch (filterType) {
    case "first":       return el.first();
    case "last":        return el.last();
    case "nth":         return el.nth(parseInt(filterValue) || 0);
    case "hasText":     return el.filter({ hasText: filterValue });
    case "hasNotText":  return el.filter({ hasNotText: filterValue });
    case "has":         return el.filter({ has: page.locator(filterValue) });
    case "hasNot":      return el.filter({ hasNot: page.locator(filterValue) });
    case "locator":     return el.locator(filterValue);
    case "and":         return el.and(page.locator(filterValue));
    case "or":          return el.or(page.locator(filterValue));
    default:            return el;
  }
}

module.exports = { executeSteps };

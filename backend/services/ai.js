const Groq = require('groq-sdk');

let _groq = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Sends failed test data to LLaMA 3.3 70B for analysis.
 * Returns { issues: string[], suggestions: Suggestion[] }
 *
 * Suggestion shape:
 * {
 *   stepIndex: number,
 *   field: string,          // e.g. "selector", "url", "value"
 *   currentValue: string,
 *   suggestedValue: string,
 *   reason: string
 * }
 */
async function analyzeTest(steps, results) {
  const failedResults = results.filter(r => r.status === 'failed');

  const prompt = `You are an expert Playwright test automation engineer.
A user built a test using a no-code automation tool. The test failed. Analyze the test steps and failure details, then return actionable fix suggestions.

## Test Steps (full list):
${JSON.stringify(steps, null, 2)}

## Failed Step Results:
${JSON.stringify(failedResults, null, 2)}

## Instructions:
- Identify what likely caused each failure (wrong selector, wrong URL, timing issue, missing wait, etc.)
- Suggest concrete fixes for each failed step
- Be specific — if a selector is wrong, suggest a better one
- Keep suggestions concise and practical

## Response format (strict JSON, no markdown):
{
  "issues": ["brief description of issue 1", "brief description of issue 2"],
  "suggestions": [
    {
      "stepIndex": 0,
      "field": "selector",
      "currentValue": "#old-id",
      "suggestedValue": "[data-testid='submit']",
      "reason": "ID-based selectors are fragile; data-testid is more stable"
    }
  ]
}`;

  const completion = await getGroq().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty response from AI model');

  const parsed = JSON.parse(raw);

  return {
    issues:      Array.isArray(parsed.issues)      ? parsed.issues      : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

/**
 * Applies AI suggestions to a copy of the test steps.
 * Only modifies fields that exist in the step's config.
 */
function applyFixes(steps, suggestions) {
  const fixed = JSON.parse(JSON.stringify(steps)); // deep clone

  for (const s of suggestions) {
    const step = fixed[s.stepIndex];
    if (!step || !step.config) continue;
    if (s.field in step.config) {
      step.config[s.field] = s.suggestedValue;
    }
  }

  return fixed;
}

module.exports = { analyzeTest, applyFixes };

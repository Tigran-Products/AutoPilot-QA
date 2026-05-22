const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { executeSteps } = require('./stepExecutor');

const app = express();
const PORT = process.env.PORT || 3001;
const TRACES_DIR = path.join(__dirname, 'traces');
const TRACE_MAX_AGE_MS = 60 * 60 * 1000;

if (!fs.existsSync(TRACES_DIR)) {
  fs.mkdirSync(TRACES_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'manual-automation-api' });
});

function cleanOldTraces() {
  try {
    const files = fs.readdirSync(TRACES_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TRACES_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > TRACE_MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned old trace: ${file}`);
      }
    }
  } catch (err) {
    console.error('Trace cleanup error:', err.message);
  }
}

app.post('/api/run-test', async (req, res) => {
  const { steps } = req.body;

  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No steps provided'
    });
  }

  cleanOldTraces();

  console.log(`Running test with ${steps.length} steps...`);

  try {
    const { results, traceId } = await executeSteps(steps);
    const allPassed = results.every(r => r.status === 'passed');

    console.log(`Test finished: ${allPassed ? 'PASSED' : 'FAILED'} (${results.length}/${steps.length} steps executed)`);

    res.json({
      success: allPassed,
      totalSteps: steps.length,
      executedSteps: results.length,
      traceId,
      results
    });
  } catch (error) {
    console.error('Test execution error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Test execution failed',
      error: error.message
    });
  }
});

app.get('/api/traces/:traceId', (req, res) => {
  const { traceId } = req.params;

  if (!/^trace-\d+$/.test(traceId)) {
    return res.status(400).json({ error: 'Invalid trace ID' });
  }

  const tracePath = path.join(TRACES_DIR, `${traceId}.zip`);

  if (!fs.existsSync(tracePath)) {
    return res.status(404).json({ error: 'Trace not found' });
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${traceId}.zip"`);
  fs.createReadStream(tracePath).pipe(res);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Ready to accept requests at http://0.0.0.0:${PORT}/api/run-test`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`ERROR: Port ${PORT} is already in use. Kill the other process first:`);
    console.error(`  lsof -ti:${PORT} | xargs kill -9`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

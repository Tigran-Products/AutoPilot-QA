import Sidebar from './components/Sidebar';
import BuilderArea from './components/BuilderArea';
import Dashboard from './components/Dashboard';
import AuthPage from './components/auth/AuthPage';
import { apiUrl } from './config/api';
import { getDefaultConfig, isStepConfigured } from './StepConfigs';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

const STORAGE_KEY = 'savedTests';

function App() {
  const { user, loading } = useAuth();

  const [addedSteps,   setAddedSteps]   = useState([]);
  const [savedTests,   setSavedTests]   = useState([]);
  const [testResults,  setTestResults]  = useState(null);
  const [isRunning,    setIsRunning]    = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  // Load saved tests from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedTests(parsed);
      }
    } catch {
      setSavedTests([]);
    }
    setStorageReady(true);
  }, []);

  // Persist saved tests to localStorage
  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTests));
  }, [savedTests, storageReady]);

  async function handleRunTest() {
    const unconfigured = addedSteps.filter(s => !isStepConfigured(s.text, s.config));
    if (unconfigured.length > 0) {
      setTestResults({
        success: false,
        error: `${unconfigured.length} step(s) are missing required configuration: ${unconfigured.map(s => s.text).join(', ')}.`,
        totalSteps: addedSteps.length,
        executedSteps: 0,
        results: []
      });
      return;
    }

    setIsRunning(true);
    setTestResults(null);

    try {
      const token   = await user.getIdToken();
      const payload = addedSteps.map(step => ({ text: step.text, config: step.config }));

      const response = await fetch(apiUrl('/api/run-test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ steps: payload })
      });

      const result = await response.json();

      if (!response.ok) {
        setTestResults({
          success: false,
          error: result.error || result.message || 'Test execution failed',
          totalSteps: addedSteps.length,
          executedSteps: 0,
          results: []
        });
      } else {
        setTestResults(result);
      }
    } catch (error) {
      setTestResults({
        success: false,
        error: `Network error: ${error.message}`,
        totalSteps: addedSteps.length,
        executedSteps: 0,
        results: []
      });
    } finally {
      setIsRunning(false);
    }
  }

  function handleAddStep(step) {
    const newStep = {
      ...step,
      id: Date.now() + Math.random(),
      config: getDefaultConfig(step.text),
    };
    setAddedSteps(prev => [...prev, newStep]);
  }

  function handleUpdateStepConfig(stepId, config) {
    setAddedSteps(prev => prev.map(step =>
      step.id === stepId
        ? { ...step, config: { ...step.config, ...config } }
        : step
    ));
  }

  function handleRemoveStep(stepId) {
    setAddedSteps(prev => prev.filter(step => step.id !== stepId));
  }

  function handleSaveTest() {
    if (addedSteps.length === 0) return;
    const snapshot = addedSteps.map((step) => ({
      ...step,
      config: { ...step.config },
    }));
    setSavedTests((prev) => {
      const testName = `Test ${prev.length + 1}`;
      return [...prev, { id: Date.now(), name: testName, steps: snapshot }];
    });
  }

  function handleLoadTest(savedTest) {
    setAddedSteps(savedTest.steps);
  }

  function handleDeleteSavedTest(testId) {
    setSavedTests((prev) => prev.filter((t) => t.id !== testId));
  }

  // ── Loading spinner while Firebase resolves auth state ────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Not signed in → show auth page ───────────────────────────────────────────
  if (!user) {
    return <AuthPage />;
  }

  // ── Main app ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar
        handleAddStep={handleAddStep}
        savedTests={savedTests}
        onLoadTest={handleLoadTest}
        onDeleteSavedTest={handleDeleteSavedTest}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <BuilderArea
          addedSteps={addedSteps}
          onUpdateStepConfig={handleUpdateStepConfig}
          onRemoveStep={handleRemoveStep}
          onSaveTest={handleSaveTest}
        />
        <Dashboard
          addedSteps={addedSteps}
          onRunTest={handleRunTest}
          results={testResults}
          isRunning={isRunning}
        />
      </main>
    </div>
  );
}

export default App;

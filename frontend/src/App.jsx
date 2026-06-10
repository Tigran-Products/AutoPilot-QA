import Sidebar from './components/Sidebar';
import BuilderArea from './components/BuilderArea';
import Dashboard from './components/Dashboard';
import AuthPage from './components/auth/AuthPage';
import { apiUrl } from './config/api';
import { getDefaultConfig, isStepConfigured } from './StepConfigs';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { fetchTests, saveTest, deleteTest } from './services/firestore';
import { indexTest, deleteTestFromIndex, bulkIndexTests } from './services/algolia';

function cacheKey(uid) {
  return `savedTests_${uid}`;
}

function loadFromCache(uid) {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function writeToCache(uid, tests) {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(tests));
  } catch {}
}

function App() {
  const { user, loading } = useAuth();

  const [addedSteps,  setAddedSteps]  = useState([]);
  const [savedTests,  setSavedTests]  = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [isRunning,   setIsRunning]   = useState(false);

  // Track whether we've already synced Firestore for the current user
  const syncedUidRef = useRef(null);

  // When user signs in: load from cache immediately, then hydrate from Firestore
  useEffect(() => {
    if (!user) {
      setSavedTests([]);
      syncedUidRef.current = null;
      return;
    }
    if (syncedUidRef.current === user.uid) return;
    syncedUidRef.current = user.uid;

    // 1. Instant load from localStorage cache
    const cached = loadFromCache(user.uid);
    setSavedTests(cached);

    // 2. Background fetch from Firestore → replace cache & bulk index in Algolia
    fetchTests(user.uid)
      .then((tests) => {
        setSavedTests(tests);
        writeToCache(user.uid, tests);
        // Sync all tests to Algolia
        bulkIndexTests(user.uid, tests);
      })
      .catch((err) => {
        console.error('Firestore fetch error:', err.message);
        // Cache already shown — keep it as fallback
      });
  }, [user]);

  // ── Run test ─────────────────────────────────────────────────────────────────
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

  // ── Step management ───────────────────────────────────────────────────────────
  function handleAddStep(step) {
    setAddedSteps(prev => [...prev, {
      ...step,
      id: Date.now() + Math.random(),
      config: getDefaultConfig(step.text),
    }]);
  }

  function handleUpdateStepConfig(stepId, config) {
    setAddedSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, config: { ...step.config, ...config } } : step
    ));
  }

  function handleRemoveStep(stepId) {
    setAddedSteps(prev => prev.filter(step => step.id !== stepId));
  }

  // ── Saved test management (Firestore + cache + Algolia) ─────────────────────
  async function handleSaveTest() {
    if (addedSteps.length === 0 || !user) return;

    const newTest = {
      id: Date.now(),
      name: `Test ${savedTests.length + 1}`,
      createdAt: Date.now(),
      steps: addedSteps.map(s => ({ ...s, config: { ...s.config } })),
    };

    // Optimistic update
    const updated = [...savedTests, newTest];
    setSavedTests(updated);
    writeToCache(user.uid, updated);

    try {
      await saveTest(user.uid, newTest);
      // Index in Algolia after Firestore success
      indexTest(user.uid, newTest);
    } catch (err) {
      console.error('Failed to save test to Firestore:', err.message);
      // Rollback
      setSavedTests(savedTests);
      writeToCache(user.uid, savedTests);
    }
  }

  function handleLoadTest(savedTest) {
    setAddedSteps(savedTest.steps);
  }

  async function handleDeleteSavedTest(testId) {
    if (!user) return;

    // Optimistic update
    const updated = savedTests.filter(t => t.id !== testId);
    setSavedTests(updated);
    writeToCache(user.uid, updated);

    try {
      await deleteTest(user.uid, testId);
      // Remove from Algolia after Firestore success
      deleteTestFromIndex(user.uid, testId);
    } catch (err) {
      console.error('Failed to delete test from Firestore:', err.message);
      // Rollback
      setSavedTests(savedTests);
      writeToCache(user.uid, savedTests);
    }
  }

  // ── Auth loading spinner ──────────────────────────────────────────────────────
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

  if (!user) return <AuthPage />;

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

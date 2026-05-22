import Sidebar from './components/Sidebar';
import BuilderArea from './components/BuilderArea';
import Dashboard from './components/Dashboard';
import { apiUrl } from './config/api';
import { useState } from 'react';

function App() {
  const [addedSteps, setAddedSteps] = useState([]);
  const [savedTests, setSavedTests] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  async function handleRunTest() {
    const unconfigured = addedSteps.filter(s => Object.keys(s.config).length === 0);
    if (unconfigured.length > 0) {
      setTestResults({
        success: false,
        error: `${unconfigured.length} step(s) have no configuration. Configure all steps before running.`,
        totalSteps: addedSteps.length,
        executedSteps: 0,
        results: []
      });
      return;
    }

    setIsRunning(true);
    setTestResults(null);
    
    try {
      const payload = addedSteps.map(step => ({ text: step.text, config: step.config }));
      
      const response = await fetch(apiUrl('/api/run-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      config: {}
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
    const testName = `Test ${savedTests.length + 1}`;
    setSavedTests(prev => [...prev, { id: Date.now(), name: testName, steps: addedSteps }]);
  }

  function handleLoadTest(savedTest) {
    setAddedSteps(savedTest.steps);
  }

  function handleDeleteSavedTest(testId) {
    setSavedTests(prev => prev.filter(t => t.id !== testId));
  }

  

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
        <Dashboard addedSteps={addedSteps} onRunTest={handleRunTest} results={testResults} isRunning={isRunning} />
      </main>
    </div>
  );
}

export default App;

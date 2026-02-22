import { useState, useRef, useEffect, forwardRef } from 'react'
import './App.css'

const API_URL = '' // Uses Vite proxy to backend
const SSE_URL = 'http://localhost:3001' // Direct connection for EventSource (proxy can buffer SSE)

const initialResult = () => ({ status: 'idle', message: '', steps: [], completedAt: null })

function LogPanel({ result, stepsEndRef, label }) {
  const [expanded, setExpanded] = useState(true)
  if (result.status === 'idle') return null
  const hasSteps = result.steps.length > 0
  return (
    <section className={`log-panel result ${result.status} collapsible-section`}>
      <div
        className={`result-header ${hasSteps ? 'collapsible-header' : ''}`}
        onClick={hasSteps ? () => setExpanded((e) => !e) : undefined}
        role={hasSteps ? 'button' : undefined}
        tabIndex={hasSteps ? 0 : undefined}
        onKeyDown={hasSteps ? (e) => e.key === 'Enter' && setExpanded((x) => !x) : undefined}
        aria-expanded={hasSteps ? expanded : undefined}
      >
        {result.status === 'running' && <span className="status-dot running" />}
        {result.status === 'passed' && <span className="status-dot passed" />}
        {(result.status === 'failed' || result.status === 'stopped') && <span className="status-dot failed" />}
        <span className="result-message">{result.message}</span>
        {hasSteps && (
          <span className="collapse-icon" aria-hidden>
            {expanded ? '▼' : '▶'}
          </span>
        )}
      </div>
      {hasSteps && expanded && (
        <div className="steps-list collapsible-content">
          {result.steps.map((step, i) => (
            <div key={i} className={`step-item ${step.isSuccess ? 'step-success' : ''}`}>
              {step.isSuccess ? <span className="step-icon">✓</span> : null}
              <span className="step-text">{step.text}</span>
            </div>
          ))}
          <div ref={stepsEndRef} />
        </div>
      )}
    </section>
  )
}

const TestReportSection = forwardRef(function TestReportSection({ result, reportUrl, stepsEndRef, testCaseName }, ref) {
  const [expanded, setExpanded] = useState(true)
  const hasReport = result.status === 'passed' || result.status === 'failed' || result.status === 'stopped'
  if (!hasReport) return null

  const cacheBust = result.completedAt ? `?t=${result.completedAt}` : ''
  const iframeSrc = reportUrl ? `${reportUrl}${cacheBust}` : null

  return (
    <section ref={ref} className="test-report-section collapsible-section">
      <h3
        className="collapsible-header"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((x) => !x)}
        aria-expanded={expanded}
      >
        Test Report {testCaseName ? `– ${testCaseName}` : ''}
        <span className="collapse-icon" aria-hidden>
          {expanded ? '▼' : '▶'}
        </span>
      </h3>
      {expanded && (
        <div className="collapsible-content">
          {iframeSrc ? (
            <div className="report-iframe-wrapper">
              <iframe
                src={iframeSrc}
                title={`Playwright report - ${testCaseName || 'Test'}`}
                className="report-iframe"
              />
            </div>
          ) : (
            <LogPanel result={result} stepsEndRef={stepsEndRef} />
          )}
        </div>
      )}
    </section>
  )
})

function App() {
  const [attemptResult, setAttemptResult] = useState(initialResult())
  const [createResult, setCreateResult] = useState(initialResult())
  const [createCourseNegativeResult, setCreateCourseNegativeResult] = useState(initialResult())
  const [createTestResult, setCreateTestResult] = useState(initialResult())
  const [createTestNegativeResult, setCreateTestNegativeResult] = useState(initialResult())
  const [socialSignupResult, setSocialSignupResult] = useState(initialResult())
  const [loginResult, setLoginResult] = useState(initialResult())
  const [loginNegativeResult, setLoginNegativeResult] = useState(initialResult())
  const [signupResult, setSignupResult] = useState(initialResult())
  const [signupNegativeResult, setSignupNegativeResult] = useState(initialResult())
  const [askAIResult, setAskAIResult] = useState(initialResult())
  const [askAIPromptCasesResult, setAskAIPromptCasesResult] = useState(initialResult())
  const [elasticSearchResult, setElasticSearchResult] = useState(initialResult())
  const [activeTest, setActiveTest] = useState(null) // 'attempt' | 'create' | 'socialSignup' | 'login' | 'loginNegative' | 'signup' | 'signupNegative' | 'askAI' | 'askAIPromptCases' | 'elasticSearch'
  const [browserScreenshot, setBrowserScreenshot] = useState(null)
  const abortControllerRef = useRef(null)
  const attemptStepsRef = useRef(null)
  const createStepsRef = useRef(null)
  const createCourseNegativeStepsRef = useRef(null)
  const createTestStepsRef = useRef(null)
  const createTestNegativeStepsRef = useRef(null)
  const socialSignupStepsRef = useRef(null)
  const loginStepsRef = useRef(null)
  const loginNegativeStepsRef = useRef(null)
  const signupStepsRef = useRef(null)
  const signupNegativeStepsRef = useRef(null)
  const askAIStepsRef = useRef(null)
  const askAIPromptCasesStepsRef = useRef(null)
  const elasticSearchStepsRef = useRef(null)
  const screenshotEventSourceRef = useRef(null)
  const loginReportRef = useRef(null)
  const loginNegativeReportRef = useRef(null)
  const signupReportRef = useRef(null)
  const signupNegativeReportRef = useRef(null)
  const socialSignupReportRef = useRef(null)
  const askAIReportRef = useRef(null)
  const askAIPromptCasesReportRef = useRef(null)
  const elasticSearchReportRef = useRef(null)
  const attemptReportRef = useRef(null)
  const createReportRef = useRef(null)
  const createCourseNegativeReportRef = useRef(null)
  const createTestReportRef = useRef(null)
  const createTestNegativeReportRef = useRef(null)
  const prevActiveTestRef = useRef(null)

  const isRunning = activeTest !== null
  // Browser View sirf usi section me dikhe jab uska test run ho raha ho
  const showAttemptBrowserSection = activeTest === 'attempt'
  const showSocialSignupBrowserSection = activeTest === 'socialSignup'
  const showCreateBrowserSection = activeTest === 'create' || activeTest === 'createCourseNegative' || activeTest === 'createTest' || activeTest === 'createTestNegative'
  const showLoginBrowserSection = activeTest === 'login'
  const showLoginNegativeBrowserSection = activeTest === 'loginNegative'
  const showSignupBrowserSection = activeTest === 'signup'
  const showSignupNegativeBrowserSection = activeTest === 'signupNegative'
  const showAskAIBrowserSection = activeTest === 'askAI'
  const showAskAIPromptCasesBrowserSection = activeTest === 'askAIPromptCases'
  const showElasticSearchBrowserSection = activeTest === 'elasticSearch'

  const getSetResult = (testName) => {
    if (testName === 'attempt') return setAttemptResult
    if (testName === 'socialSignup') return setSocialSignupResult
    if (testName === 'login') return setLoginResult
    if (testName === 'loginNegative') return setLoginNegativeResult
    if (testName === 'signup') return setSignupResult
    if (testName === 'signupNegative') return setSignupNegativeResult
    if (testName === 'askAI') return setAskAIResult
    if (testName === 'askAIPromptCases') return setAskAIPromptCasesResult
    if (testName === 'elasticSearch') return setElasticSearchResult
    if (testName === 'createCourseNegative') return setCreateCourseNegativeResult
    if (testName === 'createTest') return setCreateTestResult
    if (testName === 'createTestNegative') return setCreateTestNegativeResult
    return setCreateResult
  }

  useEffect(() => {
    attemptStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [attemptResult.steps])

  useEffect(() => {
    createStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createResult.steps])

  useEffect(() => {
    createCourseNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createCourseNegativeResult.steps])

  useEffect(() => {
    createTestStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createTestResult.steps])

  useEffect(() => {
    createTestNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createTestNegativeResult.steps])

  useEffect(() => {
    socialSignupStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [socialSignupResult.steps])

  useEffect(() => {
    loginStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loginResult.steps])

  useEffect(() => {
    loginNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loginNegativeResult.steps])

  useEffect(() => {
    signupStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [signupResult.steps])

  useEffect(() => {
    signupNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [signupNegativeResult.steps])

  useEffect(() => {
    askAIStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [askAIResult.steps])

  useEffect(() => {
    askAIPromptCasesStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [askAIPromptCasesResult.steps])

  useEffect(() => {
    elasticSearchStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [elasticSearchResult.steps])

  const reportRefsMap = {
    login: loginReportRef,
    loginNegative: loginNegativeReportRef,
    signup: signupReportRef,
    signupNegative: signupNegativeReportRef,
    socialSignup: socialSignupReportRef,
    askAI: askAIReportRef,
    askAIPromptCases: askAIPromptCasesReportRef,
    elasticSearch: elasticSearchReportRef,
    attempt: attemptReportRef,
    create: createReportRef,
    createCourseNegative: createCourseNegativeReportRef,
    createTest: createTestReportRef,
    createTestNegative: createTestNegativeReportRef
  }
  useEffect(() => {
    if (prevActiveTestRef.current !== null && activeTest === null) {
      const ref = reportRefsMap[prevActiveTestRef.current]
      ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    prevActiveTestRef.current = activeTest
  }, [activeTest])

  const runTest = async (endpoint, testName) => {
    const setResult = getSetResult(testName)
    setActiveTest(testName)
    setResult({ status: 'running', message: 'Test running...', steps: [] })
    if (testName === 'attempt' || testName === 'create' || testName === 'createCourseNegative' || testName === 'createTest' || testName === 'createTestNegative' || testName === 'socialSignup' || testName === 'login' || testName === 'loginNegative' || testName === 'signup' || testName === 'signupNegative' || testName === 'askAI' || testName === 'askAIPromptCases' || testName === 'elasticSearch') {
      setBrowserScreenshot(null)
      try {
        screenshotEventSourceRef.current?.close()
        const es = new EventSource(`${SSE_URL}/api/browser-screenshot-stream`)
        es.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data)
            if (d.screenshot) setBrowserScreenshot(d.screenshot)
          } catch {}
        }
        es.onerror = () => es.close()
        screenshotEventSourceRef.current = es
      } catch {}
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), 660000)

    try {
      const response = await fetch(`${API_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: controller.signal
      })

      if (!response.ok || !response.body) {
        const text = await response.text()
        let data = {}
        try { data = text ? JSON.parse(text) : {}; } catch {}
        const msg = data.message || (response.status === 502 ? 'Backend server not running. Start it with: npm run server' : `Request failed (${response.status})`)
        throw new Error(msg)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)
            if (data.type === 'output') {
              setResult(prev => ({ ...prev, steps: [...prev.steps, { text: data.line, isSuccess: /^[✓✅]/.test(data.line) }] }))
            } else if (data.type === 'complete') {
              clearTimeout(timeoutId)
              abortControllerRef.current = null
              setActiveTest(null)
              screenshotEventSourceRef.current?.close()
              screenshotEventSourceRef.current = null
              setResult(prev => ({ ...prev, status: data.status === 'passed' ? 'passed' : 'failed', message: data.message || '', completedAt: Date.now() }))
            }
          } catch {}
        }
      }

      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer)
          if (data.type === 'complete') {
            setActiveTest(null)
            setResult(prev => ({ ...prev, status: data.status === 'passed' ? 'passed' : 'failed', message: data.message || '', completedAt: Date.now() }))
            screenshotEventSourceRef.current?.close()
            screenshotEventSourceRef.current = null
          }
        } catch {}
      }
      abortControllerRef.current = null
    } catch (err) {
      abortControllerRef.current = null
      setActiveTest(null)
      screenshotEventSourceRef.current?.close()
      screenshotEventSourceRef.current = null
      const setResult = getSetResult(testName)
      if (err.name === 'AbortError') {
        setResult(prev => ({ ...prev, status: 'stopped', message: 'Test stopped by user.' }))
      } else {
        setResult(prev => ({ ...prev, status: 'failed', message: err.message }))
      }
    }
  }

  const runAttemptCourse = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-attempt-course', 'attempt')
  }
  const runCreateCourse = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-create-course', 'create')
  }
  const runCreateCourseNegativeTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-create-course-negative', 'createCourseNegative')
  }
  const runCreateTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-create-test', 'createTest')
  }
  const runCreateTestNegativeTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-create-test-negative', 'createTestNegative')
  }
  const runSocialSignup = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-social-signup', 'socialSignup')
  }
  const runLoginTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-login', 'login')
  }
  const runLoginNegativeTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-login-negative', 'loginNegative')
  }
  const runSignupTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-signup', 'signup')
  }
  const runSignupNegativeTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-signup-negative', 'signupNegative')
  }
  const runAskAITest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-ask-ai', 'askAI')
  }
  const runAskAIPromptCasesTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-ask-ai-prompt-cases', 'askAIPromptCases')
  }
  const runElasticSearchTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-elasticsearch', 'elasticSearch')
  }

  const stopTest = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    try {
      await fetch(`${API_URL || ''}/api/stop-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    } catch {
      // Ignore - abort will handle UI update
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>FastLearner Test Panel</h1>
        <p>Run automation tests from the control panel</p>
      </header>

      {isRunning && (
        <div className="test-running-banner">
          <span className="banner-spinner" />
          <span>Test running</span>
          <p>A browser window has opened. The test is in progress.</p>
        </div>
      )}

      <main className="main">
        <section className="auth-test-section card card-with-log">
          <h2>Auth Test</h2>
          <p>Run login, signup, social signup, and negative tests.</p>
          <div className="button-group">
            <button
              type="button"
              className="attempt-btn"
              onClick={runLoginTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'login' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Login Test'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runLoginNegativeTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'loginNegative' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Negative Test'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runSignupTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'signup' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Signup Test'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runSignupNegativeTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'signupNegative' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Signup Negative Test Cases'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runSocialSignup}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'socialSignup' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Run Social Signup'
              )}
            </button>
            {(isRunning && (activeTest === 'login' || activeTest === 'loginNegative' || activeTest === 'signup' || activeTest === 'signupNegative' || activeTest === 'socialSignup')) && (
              <button
                className="stop-btn"
                onClick={stopTest}
              >
                Stop Test
              </button>
            )}
          </div>
          {(showLoginBrowserSection || showLoginNegativeBrowserSection || showSignupBrowserSection || showSignupNegativeBrowserSection || showSocialSignupBrowserSection) && (
            <section className="browser-section">
              <h3>Browser View</h3>
              <p className="browser-hint">Automation live run hota hua yahan dikhega</p>
              <div className="browser-frame">
                {browserScreenshot ? (
                  <img
                    src={`data:image/jpeg;base64,${browserScreenshot}`}
                    alt="Live test view"
                    className="browser-screenshot"
                  />
                ) : (
                  <div className="browser-placeholder">
                    <span className="browser-placeholder-spinner" />
                    <p>Waiting for browser...</p>
                  </div>
                )}
              </div>
            </section>
          )}
          <LogPanel result={loginResult} stepsEndRef={loginStepsRef} />
          <LogPanel result={loginNegativeResult} stepsEndRef={loginNegativeStepsRef} />
          <LogPanel result={signupResult} stepsEndRef={signupStepsRef} />
          <LogPanel result={signupNegativeResult} stepsEndRef={signupNegativeStepsRef} />
          <LogPanel result={socialSignupResult} stepsEndRef={socialSignupStepsRef} />
          <TestReportSection ref={loginReportRef} result={loginResult} reportUrl={(loginResult.status === 'passed' || loginResult.status === 'failed' || loginResult.status === 'stopped') ? '/reports/auth-login/' : null} stepsEndRef={loginStepsRef} testCaseName="Login Test" />
          <TestReportSection ref={loginNegativeReportRef} result={loginNegativeResult} reportUrl={(loginNegativeResult.status === 'passed' || loginNegativeResult.status === 'failed' || loginNegativeResult.status === 'stopped') ? '/reports/auth-login-negative/' : null} stepsEndRef={loginNegativeStepsRef} testCaseName="Negative Test" />
          <TestReportSection ref={signupReportRef} result={signupResult} reportUrl={(signupResult.status === 'passed' || signupResult.status === 'failed' || signupResult.status === 'stopped') ? '/reports/auth-signup/' : null} stepsEndRef={signupStepsRef} testCaseName="Signup Test" />
          <TestReportSection ref={signupNegativeReportRef} result={signupNegativeResult} reportUrl={(signupNegativeResult.status === 'passed' || signupNegativeResult.status === 'failed' || signupNegativeResult.status === 'stopped') ? '/reports/auth-signup-negative/' : null} stepsEndRef={signupNegativeStepsRef} testCaseName="Signup Negative Test Cases" />
          <TestReportSection ref={socialSignupReportRef} result={socialSignupResult} stepsEndRef={socialSignupStepsRef} testCaseName="Social Signup" />
        </section>

        <section className="copilot-test-section card card-with-log">
          <h2>Copilot Test</h2>
          <p>Run Ask AI and Copilot prompt test cases.</p>
          <div className="button-group">
            <button
              type="button"
              className="attempt-btn"
              onClick={runAskAITest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'askAI' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Ask AI Test'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runAskAIPromptCasesTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'askAIPromptCases' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Ask AI Prompt Cases'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runElasticSearchTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'elasticSearch' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Elastic Search Test'
              )}
            </button>
            {(isRunning && (activeTest === 'askAI' || activeTest === 'askAIPromptCases' || activeTest === 'elasticSearch')) && (
              <button
                className="stop-btn"
                onClick={stopTest}
              >
                Stop Test
              </button>
            )}
          </div>
          {(showAskAIBrowserSection || showAskAIPromptCasesBrowserSection || showElasticSearchBrowserSection) && (
            <section className="browser-section">
              <h3>Browser View</h3>
              <p className="browser-hint">Automation live run hota hua yahan dikhega</p>
              <div className="browser-frame">
                {browserScreenshot ? (
                  <img
                    src={`data:image/jpeg;base64,${browserScreenshot}`}
                    alt="Live test view"
                    className="browser-screenshot"
                  />
                ) : (
                  <div className="browser-placeholder">
                    <span className="browser-placeholder-spinner" />
                    <p>Waiting for browser...</p>
                  </div>
                )}
              </div>
            </section>
          )}
          <LogPanel result={askAIResult} stepsEndRef={askAIStepsRef} />
          <LogPanel result={askAIPromptCasesResult} stepsEndRef={askAIPromptCasesStepsRef} />
          <LogPanel result={elasticSearchResult} stepsEndRef={elasticSearchStepsRef} />
          <TestReportSection ref={askAIReportRef} result={askAIResult} reportUrl={(askAIResult.status === 'passed' || askAIResult.status === 'failed' || askAIResult.status === 'stopped') ? '/reports/auth-ask-ai/' : null} stepsEndRef={askAIStepsRef} testCaseName="Ask AI Test" />
          <TestReportSection ref={askAIPromptCasesReportRef} result={askAIPromptCasesResult} reportUrl={(askAIPromptCasesResult.status === 'passed' || askAIPromptCasesResult.status === 'failed' || askAIPromptCasesResult.status === 'stopped') ? '/reports/auth-ask-ai-prompt-cases/' : null} stepsEndRef={askAIPromptCasesStepsRef} testCaseName="Ask AI Prompt Cases" />
          <TestReportSection ref={elasticSearchReportRef} result={elasticSearchResult} reportUrl={(elasticSearchResult.status === 'passed' || elasticSearchResult.status === 'failed' || elasticSearchResult.status === 'stopped') ? '/reports/elasticsearch/' : null} stepsEndRef={elasticSearchStepsRef} testCaseName="Elastic Search Test" />
        </section>

        <section className="elasticsearch-test-section card card-with-log">
          <h2>Elasticsearch Test</h2>
          <p>Search Programming and related terms - verify courses appear in dropdown.</p>
          <div className="button-group">
            <button
              type="button"
              className="attempt-btn"
              onClick={runElasticSearchTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'elasticSearch' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Elasticsearch Search Test'
              )}
            </button>
            {isRunning && activeTest === 'elasticSearch' && (
              <button
                className="stop-btn"
                onClick={stopTest}
              >
                Stop Test
              </button>
            )}
          </div>
          {(showElasticSearchBrowserSection) && (
            <section className="browser-section">
              <h3>Browser View</h3>
              <p className="browser-hint">Automation live run hota hua yahan dikhega</p>
              <div className="browser-frame">
                {browserScreenshot ? (
                  <img
                    src={`data:image/jpeg;base64,${browserScreenshot}`}
                    alt="Live test view"
                    className="browser-screenshot"
                  />
                ) : (
                  <div className="browser-placeholder">
                    <span className="browser-placeholder-spinner" />
                    <p>Waiting for browser...</p>
                  </div>
                )}
              </div>
            </section>
          )}
          <LogPanel result={elasticSearchResult} stepsEndRef={elasticSearchStepsRef} />
          <TestReportSection ref={elasticSearchReportRef} result={elasticSearchResult} reportUrl={(elasticSearchResult.status === 'passed' || elasticSearchResult.status === 'failed' || elasticSearchResult.status === 'stopped') ? '/reports/elasticsearch/' : null} stepsEndRef={elasticSearchStepsRef} testCaseName="Elasticsearch Search" />
        </section>

        <div className="attempt-section-wrapper">
          <section className="card card-with-log">
            <h2>Attempt Course</h2>
            <p>Runs the full course flow: login, navigate, interact with Q&amp;A, Notes, and Reviews.</p>
            <div className="button-group">
              <button
                type="button"
                className="attempt-btn"
                onClick={runAttemptCourse}
                disabled={isRunning}
              >
                {isRunning && activeTest === 'attempt' ? (
                  <>
                    <span className="spinner" />
                    Running...
                  </>
                ) : (
                  'Run Attempt Course'
                )}
              </button>
              {isRunning && activeTest === 'attempt' && (
                <button
                  className="stop-btn"
                  onClick={stopTest}
                >
                  Stop Test
                </button>
              )}
            </div>
            <LogPanel result={attemptResult} stepsEndRef={attemptStepsRef} />
            <TestReportSection ref={attemptReportRef} result={attemptResult} stepsEndRef={attemptStepsRef} testCaseName="Attempt Course" />
          </section>

          {showAttemptBrowserSection && (
            <section className="browser-section">
              <h3>Browser View</h3>
              <p className="browser-hint">Automation live run hota hua yahan dikhega</p>
              <div className="browser-frame">
                {browserScreenshot ? (
                  <img
                    src={`data:image/jpeg;base64,${browserScreenshot}`}
                    alt="Live test view"
                    className="browser-screenshot"
                  />
                ) : (
                  <div className="browser-placeholder">
                    <span className="browser-placeholder-spinner" />
                    <p>Waiting for browser...</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <section className="card card-with-log">
          <h2>Create Course</h2>
          <p>Creates a new course: login, fill details, add sections &amp; topics, save and verify.</p>
          <div className="button-group">
            <button
              type="button"
              className="attempt-btn create-btn"
              onClick={runCreateCourse}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'create' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Run Create Course'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runCreateCourseNegativeTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'createCourseNegative' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Create Course Negative Test Cases'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runCreateTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'createTest' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Create Test'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runCreateTestNegativeTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'createTestNegative' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Create Test Negative Test Cases'
              )}
            </button>
            {(isRunning && (activeTest === 'create' || activeTest === 'createCourseNegative' || activeTest === 'createTest' || activeTest === 'createTestNegative')) && (
              <button
                className="stop-btn"
                onClick={stopTest}
              >
                Stop Test
              </button>
            )}
          </div>
          {showCreateBrowserSection && (
            <section className="browser-section">
              <h3>Browser View</h3>
              <p className="browser-hint">Automation live run hota hua yahan dikhega</p>
              <div className="browser-frame">
                {browserScreenshot ? (
                  <img
                    src={`data:image/jpeg;base64,${browserScreenshot}`}
                    alt="Live test view"
                    className="browser-screenshot"
                  />
                ) : (
                  <div className="browser-placeholder">
                    <span className="browser-placeholder-spinner" />
                    <p>Waiting for browser...</p>
                  </div>
                )}
              </div>
            </section>
          )}
          <LogPanel result={createResult} stepsEndRef={createStepsRef} />
          <LogPanel result={createCourseNegativeResult} stepsEndRef={createCourseNegativeStepsRef} />
          <LogPanel result={createTestResult} stepsEndRef={createTestStepsRef} />
          <LogPanel result={createTestNegativeResult} stepsEndRef={createTestNegativeStepsRef} />
          <TestReportSection ref={createReportRef} result={createResult} stepsEndRef={createStepsRef} testCaseName="Create Course" />
          <TestReportSection ref={createCourseNegativeReportRef} result={createCourseNegativeResult} reportUrl={(createCourseNegativeResult.status === 'passed' || createCourseNegativeResult.status === 'failed' || createCourseNegativeResult.status === 'stopped') ? '/reports/create-course-negative/' : null} stepsEndRef={createCourseNegativeStepsRef} testCaseName="Create Course Negative" />
          <TestReportSection ref={createTestReportRef} result={createTestResult} reportUrl={(createTestResult.status === 'passed' || createTestResult.status === 'failed' || createTestResult.status === 'stopped') ? '/reports/create-test/' : null} stepsEndRef={createTestStepsRef} testCaseName="Create Test" />
          <TestReportSection ref={createTestNegativeReportRef} result={createTestNegativeResult} reportUrl={(createTestNegativeResult.status === 'passed' || createTestNegativeResult.status === 'failed' || createTestNegativeResult.status === 'stopped') ? '/reports/create-test-negative/' : null} stepsEndRef={createTestNegativeStepsRef} testCaseName="Create Test Negative" />
        </section>
      </main>
    </div>
  )
}

export default App

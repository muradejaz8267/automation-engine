import { useState, useRef, useEffect, forwardRef } from 'react'
import './App.css'

// Production: same origin. Development: Vite proxy (API_URL '') + direct SSE (localhost:3001)
const API_URL = import.meta.env.VITE_API_URL ?? ''
const SSE_URL = import.meta.env.VITE_SSE_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')

const initialResult = () => ({ status: 'idle', message: '', steps: [], completedAt: null })

function EnvironmentSelector({ environment, setEnvironment, isRunning, compact }) {
  return (
    <div className={`section-env ${compact ? 'section-env-compact' : ''}`}>
      <span className="section-env-label">Environment</span>
      <div className="section-env-options">
        <label className={`env-option ${environment === 'staging' ? 'active' : ''}`}>
          <input
            type="radio"
            name="environment"
            value="staging"
            checked={environment === 'staging'}
            onChange={() => setEnvironment('staging')}
            disabled={isRunning}
          />
          <span>Staging</span>
        </label>
        <label className={`env-option ${environment === 'prod' ? 'active' : ''}`}>
          <input
            type="radio"
            name="environment"
            value="prod"
            checked={environment === 'prod'}
            onChange={() => setEnvironment('prod')}
            disabled={isRunning}
          />
          <span>Prod</span>
        </label>
      </div>
    </div>
  )
}

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

const TEST_CASES = [
  { key: 'attempt', label: 'Attempt Course' },
  { key: 'create', label: 'Create Course' },
  { key: 'createCourseNegative', label: 'Create Course Negative' },
  { key: 'createTest', label: 'Create Test' },
  { key: 'createTestNegative', label: 'Create Test Negative' },
  { key: 'addToFavorite', label: 'Add to Favorite' },
  { key: 'shareCourse', label: 'Share Course' },
  { key: 'mycoursenavbar', label: 'My Course Navbar' },
  { key: 'login', label: 'Login' },
  { key: 'loginNegative', label: 'Login Negative' },
  { key: 'signup', label: 'Signup' },
  { key: 'signupNegative', label: 'Signup Negative' },
  { key: 'socialSignup', label: 'Social Signup' },
  { key: 'askAI', label: 'Ask AI' },
  { key: 'askAIPromptCases', label: 'Ask AI Prompt Cases' },
  { key: 'elasticSearch', label: 'Elasticsearch' },
  { key: 'homePageFlow', label: 'Home Page Flow' },
  { key: 'updateProfile', label: 'Update Profile' },
  { key: 'premiumCoursePurchase', label: 'Premium Course Purchase' },
  { key: 'cancelSubscription', label: 'Cancel Subscription' },
]

function TestDashboard({ resultsMap, activeTest, runningSteps }) {
  const passed = Object.values(resultsMap).filter(r => r.status === 'passed').length
  const failed = Object.values(resultsMap).filter(r => r.status === 'failed' || r.status === 'stopped').length
  const runCount = passed + failed
  const total = TEST_CASES.length
  const coverage = total > 0 ? Math.round((runCount / total) * 100) : 0
  const passPct = runCount > 0 ? Math.round((passed / runCount) * 100) : 0
  const failPct = runCount > 0 ? Math.round((failed / runCount) * 100) : 0
  const donutBg = runCount > 0
    ? `conic-gradient(#22c55e 0% ${passPct}%, #ef4444 ${passPct}% ${passPct + failPct}%, rgba(148,163,184,0.3) ${passPct + failPct}% 100%)`
    : 'conic-gradient(rgba(148,163,184,0.3) 0% 100%)'

  return (
    <aside className="dashboard-sidebar">
      <h3 className="dashboard-title">Test Status</h3>

      <div className="dashboard-card">
        <h4>Pass / Fail</h4>
        <div className="donut-chart" style={{ background: donutBg }}>
          <div className="donut-hole">
            <span className="donut-value">{runCount}</span>
            <span className="donut-label">run</span>
          </div>
        </div>
        <div className="chart-legend">
          <span className="legend-item passed"><span className="legend-dot" /> {passed} Passed</span>
          <span className="legend-item failed"><span className="legend-dot" /> {failed} Failed</span>
        </div>
      </div>

      <div className="dashboard-card">
        <h4>Test Coverage</h4>
        <div className="coverage-bar-wrap">
          <div className="coverage-bar" style={{ width: `${coverage}%` }} />
        </div>
        <p className="coverage-text">{coverage}% ({runCount} / {total} cases run)</p>
      </div>

      {activeTest && (
        <div className="dashboard-card progress-card">
          <h4>Running: {TEST_CASES.find(t => t.key === activeTest)?.label || activeTest}</h4>
          <div className="progress-bar-wrap">
            <div className={`progress-bar-fill ${runningSteps === 0 ? 'indeterminate' : ''}`} style={{ width: runningSteps > 0 ? `${Math.min(95, runningSteps * 2)}%` : '30%' }} />
          </div>
          <p className="progress-text">{runningSteps} steps completed</p>
        </div>
      )}

      <div className="dashboard-card">
        <h4>Case Status</h4>
        <div className="case-list">
          {TEST_CASES.map(({ key, label }) => {
            const r = resultsMap[key]
            const status = r?.status || 'idle'
            return (
              <div key={key} className={`case-item ${status}`}>
                <span className="case-dot" />
                <span className="case-label">{label}</span>
                <span className="case-status">{status === 'passed' ? '✓' : status === 'failed' || status === 'stopped' ? '✗' : status === 'running' ? '...' : '—'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
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
  const [addToFavoriteResult, setAddToFavoriteResult] = useState(initialResult())
  const [shareCourseResult, setShareCourseResult] = useState(initialResult())
  const [mycoursenavbarResult, setMycoursenavbarResult] = useState(initialResult())
  const [socialSignupResult, setSocialSignupResult] = useState(initialResult())
  const [loginResult, setLoginResult] = useState(initialResult())
  const [loginNegativeResult, setLoginNegativeResult] = useState(initialResult())
  const [signupResult, setSignupResult] = useState(initialResult())
  const [signupNegativeResult, setSignupNegativeResult] = useState(initialResult())
  const [askAIResult, setAskAIResult] = useState(initialResult())
  const [askAIPromptCasesResult, setAskAIPromptCasesResult] = useState(initialResult())
  const [elasticSearchResult, setElasticSearchResult] = useState(initialResult())
  const [homePageFlowResult, setHomePageFlowResult] = useState(initialResult())
  const [updateProfileResult, setUpdateProfileResult] = useState(initialResult())
  const [premiumCoursePurchaseResult, setPremiumCoursePurchaseResult] = useState(initialResult())
  const [annualStandardSubscriptionResult, setAnnualStandardSubscriptionResult] = useState(initialResult())
  const [annualPremiumResult, setAnnualPremiumResult] = useState(initialResult())
  const [annualEnterpriseResult, setAnnualEnterpriseResult] = useState(initialResult())
  const [monthlyStandardResult, setMonthlyStandardResult] = useState(initialResult())
  const [monthlyPremiumResult, setMonthlyPremiumResult] = useState(initialResult())
  const [monthlyEnterpriseResult, setMonthlyEnterpriseResult] = useState(initialResult())
  const [aiGraderResult, setAiGraderResult] = useState(initialResult())
  const [cancelSubscriptionResult, setCancelSubscriptionResult] = useState(initialResult())
  const [activeTest, setActiveTest] = useState(null) // 'attempt' | 'create' | ... | 'premiumCoursePurchase'
  const [environment, setEnvironment] = useState('staging') // 'staging' | 'prod'
  const [subscriptionPeriod, setSubscriptionPeriod] = useState('annual') // 'annual' | 'monthly'
  const [browserScreenshot, setBrowserScreenshot] = useState(null)
  const abortControllerRef = useRef(null)
  const attemptStepsRef = useRef(null)
  const createStepsRef = useRef(null)
  const createCourseNegativeStepsRef = useRef(null)
  const createTestStepsRef = useRef(null)
  const createTestNegativeStepsRef = useRef(null)
  const addToFavoriteStepsRef = useRef(null)
  const shareCourseStepsRef = useRef(null)
  const mycoursenavbarStepsRef = useRef(null)
  const socialSignupStepsRef = useRef(null)
  const loginStepsRef = useRef(null)
  const loginNegativeStepsRef = useRef(null)
  const signupStepsRef = useRef(null)
  const signupNegativeStepsRef = useRef(null)
  const askAIStepsRef = useRef(null)
  const askAIPromptCasesStepsRef = useRef(null)
  const elasticSearchStepsRef = useRef(null)
  const homePageFlowStepsRef = useRef(null)
  const updateProfileStepsRef = useRef(null)
  const premiumCoursePurchaseStepsRef = useRef(null)
  const annualStandardSubscriptionStepsRef = useRef(null)
  const annualPremiumStepsRef = useRef(null)
  const annualEnterpriseStepsRef = useRef(null)
  const monthlyStandardStepsRef = useRef(null)
  const monthlyPremiumStepsRef = useRef(null)
  const monthlyEnterpriseStepsRef = useRef(null)
  const aiGraderStepsRef = useRef(null)
  const cancelSubscriptionStepsRef = useRef(null)
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
  const addToFavoriteReportRef = useRef(null)
  const shareCourseReportRef = useRef(null)
  const mycoursenavbarReportRef = useRef(null)
  const homePageFlowReportRef = useRef(null)
  const premiumCoursePurchaseReportRef = useRef(null)
  const annualStandardSubscriptionReportRef = useRef(null)
  const annualPremiumReportRef = useRef(null)
  const annualEnterpriseReportRef = useRef(null)
  const monthlyStandardReportRef = useRef(null)
  const monthlyPremiumReportRef = useRef(null)
  const monthlyEnterpriseReportRef = useRef(null)
  const aiGraderReportRef = useRef(null)
  const cancelSubscriptionReportRef = useRef(null)
  const prevActiveTestRef = useRef(null)

  const isRunning = activeTest !== null

  const resultsMap = {
    attempt: attemptResult,
    create: createResult,
    createCourseNegative: createCourseNegativeResult,
    createTest: createTestResult,
    createTestNegative: createTestNegativeResult,
    addToFavorite: addToFavoriteResult,
    shareCourse: shareCourseResult,
    mycoursenavbar: mycoursenavbarResult,
    login: loginResult,
    loginNegative: loginNegativeResult,
    signup: signupResult,
    signupNegative: signupNegativeResult,
    socialSignup: socialSignupResult,
    askAI: askAIResult,
    askAIPromptCases: askAIPromptCasesResult,
    elasticSearch: elasticSearchResult,
    homePageFlow: homePageFlowResult,
    updateProfile: updateProfileResult,
    premiumCoursePurchase: premiumCoursePurchaseResult,
    annualStandardSubscription: annualStandardSubscriptionResult,
    annualPremium: annualPremiumResult,
    annualEnterprise: annualEnterpriseResult,
    monthlyStandard: monthlyStandardResult,
    monthlyPremium: monthlyPremiumResult,
    monthlyEnterprise: monthlyEnterpriseResult,
    aiGrader: aiGraderResult,
    cancelSubscription: cancelSubscriptionResult,
  }
  const runningSteps = activeTest ? (resultsMap[activeTest]?.steps?.length || 0) : 0

  // Browser View sirf usi section me dikhe jab uska test run ho raha ho
  const showAttemptBrowserSection = activeTest === 'attempt'
  const showSocialSignupBrowserSection = activeTest === 'socialSignup'
  const showCreateBrowserSection = activeTest === 'create' || activeTest === 'createCourseNegative' || activeTest === 'createTest' || activeTest === 'createTestNegative' || activeTest === 'addToFavorite' || activeTest === 'shareCourse' || activeTest === 'mycoursenavbar'
  const showLoginBrowserSection = activeTest === 'login'
  const showLoginNegativeBrowserSection = activeTest === 'loginNegative'
  const showSignupBrowserSection = activeTest === 'signup'
  const showSignupNegativeBrowserSection = activeTest === 'signupNegative'
  const showAskAIBrowserSection = activeTest === 'askAI'
  const showAskAIPromptCasesBrowserSection = activeTest === 'askAIPromptCases'
  const showElasticSearchBrowserSection = activeTest === 'elasticSearch'
  const showHomePageFlowBrowserSection = activeTest === 'homePageFlow'
  const showUpdateProfileBrowserSection = activeTest === 'updateProfile'
  const showPremiumCoursePurchaseBrowserSection = activeTest === 'premiumCoursePurchase'
  const showSubscriptionBrowserSection = ['annualStandardSubscription', 'annualPremium', 'annualEnterprise', 'monthlyStandard', 'monthlyPremium', 'monthlyEnterprise', 'cancelSubscription'].includes(activeTest)
  const showAiGraderBrowserSection = activeTest === 'aiGrader'

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
    if (testName === 'addToFavorite') return setAddToFavoriteResult
    if (testName === 'shareCourse') return setShareCourseResult
    if (testName === 'mycoursenavbar') return setMycoursenavbarResult
    if (testName === 'homePageFlow') return setHomePageFlowResult
    if (testName === 'updateProfile') return setUpdateProfileResult
    if (testName === 'premiumCoursePurchase') return setPremiumCoursePurchaseResult
    if (testName === 'annualStandardSubscription') return setAnnualStandardSubscriptionResult
    if (testName === 'annualPremium') return setAnnualPremiumResult
    if (testName === 'annualEnterprise') return setAnnualEnterpriseResult
    if (testName === 'monthlyStandard') return setMonthlyStandardResult
    if (testName === 'monthlyPremium') return setMonthlyPremiumResult
    if (testName === 'monthlyEnterprise') return setMonthlyEnterpriseResult
    if (testName === 'aiGrader') return setAiGraderResult
    if (testName === 'cancelSubscription') return setCancelSubscriptionResult
    return setCreateResult
  }

  // Do not scroll to log while a test is running (keep browser view in view)
  useEffect(() => {
    if (activeTest === null) attemptStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [attemptResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) createStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) createCourseNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createCourseNegativeResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) createTestStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createTestResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) createTestNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [createTestNegativeResult.steps, activeTest])

  useEffect(() => {
    addToFavoriteStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [addToFavoriteResult.steps])

  useEffect(() => {
    shareCourseStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [shareCourseResult.steps])

  useEffect(() => {
    mycoursenavbarStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mycoursenavbarResult.steps])

  useEffect(() => {
    if (activeTest === null) homePageFlowStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [homePageFlowResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) updateProfileStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [updateProfileResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) premiumCoursePurchaseStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [premiumCoursePurchaseResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) annualStandardSubscriptionStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [annualStandardSubscriptionResult.steps, activeTest])
  useEffect(() => {
    if (activeTest === null) annualPremiumStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [annualPremiumResult.steps, activeTest])
  useEffect(() => {
    if (activeTest === null) annualEnterpriseStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [annualEnterpriseResult.steps, activeTest])
  useEffect(() => {
    if (activeTest === null) monthlyStandardStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [monthlyStandardResult.steps, activeTest])
  useEffect(() => {
    if (activeTest === null) monthlyPremiumStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [monthlyPremiumResult.steps, activeTest])
  useEffect(() => {
    if (activeTest === null) monthlyEnterpriseStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [monthlyEnterpriseResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) aiGraderStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiGraderResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) cancelSubscriptionStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [cancelSubscriptionResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) socialSignupStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [socialSignupResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) loginStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loginResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) loginNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loginNegativeResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) signupStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [signupResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) signupNegativeStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [signupNegativeResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) askAIStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [askAIResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) askAIPromptCasesStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [askAIPromptCasesResult.steps, activeTest])

  useEffect(() => {
    if (activeTest === null) elasticSearchStepsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [elasticSearchResult.steps, activeTest])

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
    createTestNegative: createTestNegativeReportRef,
    addToFavorite: addToFavoriteReportRef,
    shareCourse: shareCourseReportRef,
    mycoursenavbar: mycoursenavbarReportRef,
    homePageFlow: homePageFlowReportRef,
    premiumCoursePurchase: premiumCoursePurchaseReportRef,
    annualStandardSubscription: annualStandardSubscriptionReportRef,
    annualPremium: annualPremiumReportRef,
    annualEnterprise: annualEnterpriseReportRef,
    monthlyStandard: monthlyStandardReportRef,
    monthlyPremium: monthlyPremiumReportRef,
    monthlyEnterprise: monthlyEnterpriseReportRef,
    aiGrader: aiGraderReportRef,
    cancelSubscription: cancelSubscriptionReportRef,
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

    // Open EventSource FIRST so we're ready to receive screenshots as soon as test starts
    const needsBrowserView = ['attempt', 'create', 'createCourseNegative', 'createTest', 'createTestNegative', 'addToFavorite', 'shareCourse', 'mycoursenavbar', 'socialSignup', 'login', 'loginNegative', 'signup', 'signupNegative', 'askAI', 'askAIPromptCases', 'elasticSearch', 'homePageFlow', 'updateProfile', 'premiumCoursePurchase', 'annualStandardSubscription', 'annualPremium', 'annualEnterprise', 'monthlyStandard', 'monthlyPremium', 'monthlyEnterprise', 'aiGrader', 'cancelSubscription'].includes(testName)
    if (needsBrowserView) {
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
    const fetchPromise = fetch(`${API_URL || ''}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment }),
      signal: controller.signal
    })

    try {
      const response = await fetchPromise

      if (!response.ok || !response.body) {
        const text = await response.text()
        let data = {}
        try { data = text ? JSON.parse(text) : {}; } catch {}
        const msg = data.message ||
          (response.status === 502 || response.status === 500
            ? 'Backend error. Start the server: npm run server (in fastlearner-automation folder)'
            : `Request failed (${response.status})`)
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
        const isNetworkError = err.message?.includes('fetch') || err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch')
        const message = isNetworkError
          ? 'Backend not reachable. Start the server: npm run server (in fastlearner-automation folder)'
          : err.message
        setResult(prev => ({ ...prev, status: 'failed', message }))
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
  const runAddToFavoriteTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-add-to-favorite', 'addToFavorite')
  }
  const runShareCourseTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-share-course', 'shareCourse')
  }
  const runMycoursenavbarTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-mycoursenavbar', 'mycoursenavbar')
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
  const runHomePageFlow = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-home-page-flow', 'homePageFlow')
  }
  const runUpdateProfileTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-update-profile', 'updateProfile')
  }
  const runAiGraderTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-ai-grader', 'aiGrader')
  }
  const runPremiumCoursePurchaseTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-premium-course-purchase', 'premiumCoursePurchase')
  }
  const runStandardSubscriptionTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (subscriptionPeriod === 'annual') {
      runTest('/api/run-annual-standard-subscription', 'annualStandardSubscription')
    } else {
      runTest('/api/run-monthly-standard', 'monthlyStandard')
    }
  }
  const runPremiumSubscriptionTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (subscriptionPeriod === 'annual') {
      runTest('/api/run-annual-premium', 'annualPremium')
    } else {
      runTest('/api/run-monthly-premium', 'monthlyPremium')
    }
  }
  const runEnterpriseSubscriptionTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (subscriptionPeriod === 'annual') {
      runTest('/api/run-annual-enterprise', 'annualEnterprise')
    } else {
      runTest('/api/run-monthly-enterprise', 'monthlyEnterprise')
    }
  }
  const runCancelSubscriptionTest = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    runTest('/api/run-cancel-subscription', 'cancelSubscription')
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
        <div className="header-team-info">
          <div className="header-team-info-title">Team</div>
          <div className="header-team-info-row">
            <span className="header-team-role">Project Manager</span>
            <span className="header-team-name">Obaid Ul Quadir</span>
          </div>
          <div className="header-team-info-row">
            <span className="header-team-role">Project Manager</span>
            <span className="header-team-name">Umer Asif</span>
          </div>
          <div className="header-team-info-row">
            <span className="header-team-role">Automation Engineer</span>
            <span className="header-team-name">Murad Ejaz</span>
          </div>
          <div className="header-team-info-row">
            <span className="header-team-role">Automation Engineer</span>
            <span className="header-team-name">Umm E Hani</span>
          </div>
        </div>
        <div className="header-badge">AI TEST ASSISTANT</div>
        <h1>FastLearner Test Panel</h1>
        <p>Automated module-wise & end-to-end testing • JARVIS-style control</p>
      </header>

      <section className="test-plan-section">
        <h2 className="test-plan-title">Test Plan</h2>
        <p className="test-plan-desc">
          This test panel performs module-wise tests for the complete FastLearner platform and end-to-end tests.
          Through this panel, you can run the following testing types:
        </p>
        <ol className="test-plan-types">
          <li>Functional Testing of Modules</li>
          <li>Regression Testing</li>
          <li>Integration Testing</li>
          <li>System Testing</li>
        </ol>
        <div className="test-plan-env">
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} />
        </div>
        <div className="test-plan-actions">
          <button
            type="button"
            className="e2e-run-btn"
            onClick={runHomePageFlow}
            disabled={isRunning}
          >
            {isRunning && activeTest === 'homePageFlow' ? (
              <>
                <span className="spinner" />
                Running...
              </>
            ) : (
              'End to End Test Run'
            )}
          </button>
        </div>
      </section>

      {isRunning && (
        <div className="test-running-banner">
          <span className="banner-spinner" />
          <span>Test running</span>
          <p>A browser window has opened. The test is in progress.</p>
        </div>
      )}

      <div className="main-wrapper">
        <main className="main">
        <section className="auth-test-section card card-with-log">
          <h2>Auth Test</h2>
          <p>Run login, signup, social signup, and negative tests.</p>
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
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

        <section className="card card-with-log">
          <h2>Home page test</h2>
          <p>Run Home Page Flow: login → dashboard → check each button and link.</p>
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
          <div className="button-group">
            <button
              type="button"
              className="attempt-btn"
              onClick={runHomePageFlow}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'homePageFlow' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'HomePageFlow'
              )}
            </button>
            {isRunning && activeTest === 'homePageFlow' && (
              <button className="stop-btn" onClick={stopTest}>
                Stop Test
              </button>
            )}
          </div>
          {showHomePageFlowBrowserSection && (
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
          <LogPanel result={homePageFlowResult} stepsEndRef={homePageFlowStepsRef} />
          <TestReportSection ref={homePageFlowReportRef} result={homePageFlowResult} reportUrl={(homePageFlowResult.status === 'passed' || homePageFlowResult.status === 'failed' || homePageFlowResult.status === 'stopped') ? '/reports/home-page-flow/' : null} stepsEndRef={homePageFlowStepsRef} testCaseName="Home Page Flow" />
        </section>

        <section className="copilot-test-section card card-with-log">
          <h2>Copilot Test</h2>
          <p>Run Ask AI and Copilot prompt test cases.</p>
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
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
            {(isRunning && (activeTest === 'askAI' || activeTest === 'askAIPromptCases')) && (
              <button
                className="stop-btn"
                onClick={stopTest}
              >
                Stop Test
              </button>
            )}
          </div>
          {(showAskAIBrowserSection || showAskAIPromptCasesBrowserSection) && (
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
          <TestReportSection ref={askAIReportRef} result={askAIResult} reportUrl={(askAIResult.status === 'passed' || askAIResult.status === 'failed' || askAIResult.status === 'stopped') ? '/reports/auth-ask-ai/' : null} stepsEndRef={askAIStepsRef} testCaseName="Ask AI Test" />
          <TestReportSection ref={askAIPromptCasesReportRef} result={askAIPromptCasesResult} reportUrl={(askAIPromptCasesResult.status === 'passed' || askAIPromptCasesResult.status === 'failed' || askAIPromptCasesResult.status === 'stopped') ? '/reports/auth-ask-ai-prompt-cases/' : null} stepsEndRef={askAIPromptCasesStepsRef} testCaseName="Ask AI Prompt Cases" />
        </section>

        <section className="elasticsearch-test-section card card-with-log">
          <h2>Elasticsearch Test</h2>
          <p>Search Programming and related terms - verify courses appear in dropdown.</p>
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
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

        <section className="payment-subscription-section card card-with-log">
          <h2>Payment and Subscription</h2>
          <p>Premium course purchase and subscription plans (Annual / Monthly).</p>
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
          <div className="payment-subscription-content">
            <div className="payment-subscription-block">
              <h3 className="payment-sub-block-title">Premium Course Purchase</h3>
              <div className="button-group">
                <button
                  type="button"
                  className="attempt-btn"
                  onClick={runPremiumCoursePurchaseTest}
                  disabled={isRunning}
                >
                  {isRunning && activeTest === 'premiumCoursePurchase' ? (
                    <>
                      <span className="spinner" />
                      Running...
                    </>
                  ) : (
                    'Premium Course Purchase'
                  )}
                </button>
                <span className="script-ref">tests/student/premiumCoursePurchase.spec.js</span>
                {isRunning && activeTest === 'premiumCoursePurchase' && (
                  <button className="stop-btn" onClick={stopTest}>
                    Stop Test
                  </button>
                )}
              </div>
            </div>
            <div className="payment-subscription-block">
              <h3 className="payment-sub-block-title">Subscription</h3>
              <div className="subscription-period-options">
                <label className={`env-option ${subscriptionPeriod === 'annual' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="subscriptionPeriod"
                    value="annual"
                    checked={subscriptionPeriod === 'annual'}
                    onChange={() => setSubscriptionPeriod('annual')}
                    disabled={isRunning}
                  />
                  <span>Annual</span>
                </label>
                <label className={`env-option ${subscriptionPeriod === 'monthly' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="subscriptionPeriod"
                    value="monthly"
                    checked={subscriptionPeriod === 'monthly'}
                    onChange={() => setSubscriptionPeriod('monthly')}
                    disabled={isRunning}
                  />
                  <span>Monthly</span>
                </label>
              </div>
              <div className="button-group subscription-buttons">
                <button
                  type="button"
                  className="attempt-btn"
                  onClick={runStandardSubscriptionTest}
                  disabled={isRunning}
                >
                  {isRunning && (activeTest === 'annualStandardSubscription' || activeTest === 'monthlyStandard') ? (
                    <>
                      <span className="spinner" />
                      Running...
                    </>
                  ) : (
                    'Standard Subscription'
                  )}
                </button>
                <span className="script-ref">tests/student/{subscriptionPeriod === 'annual' ? 'annualStandardSubscription' : 'monthlyStandard'}.spec.js</span>
                <button
                  type="button"
                  className="attempt-btn"
                  onClick={runPremiumSubscriptionTest}
                  disabled={isRunning}
                >
                  {isRunning && (activeTest === 'annualPremium' || activeTest === 'monthlyPremium') ? (
                    <>
                      <span className="spinner" />
                      Running...
                    </>
                  ) : (
                    'Premium Subscription'
                  )}
                </button>
                <span className="script-ref">tests/student/{subscriptionPeriod === 'annual' ? 'annualPremium' : 'monthlyPremium'}.spec.js</span>
                <button
                  type="button"
                  className="attempt-btn"
                  onClick={runEnterpriseSubscriptionTest}
                  disabled={isRunning}
                >
                  {isRunning && (activeTest === 'annualEnterprise' || activeTest === 'monthlyEnterprise') ? (
                    <>
                      <span className="spinner" />
                      Running...
                    </>
                  ) : (
                    'Enterprise Subscription'
                  )}
                </button>
                <span className="script-ref">tests/student/{subscriptionPeriod === 'annual' ? 'annualEnterprise' : 'monthlyEnterprise'}.spec.js</span>
                {isRunning && (activeTest === 'annualStandardSubscription' || activeTest === 'annualPremium' || activeTest === 'annualEnterprise' || activeTest === 'monthlyStandard' || activeTest === 'monthlyPremium' || activeTest === 'monthlyEnterprise') && (
                  <button className="stop-btn" onClick={stopTest}>
                    Stop Test
                  </button>
                )}
              </div>
            </div>
            <div className="payment-subscription-block">
              <h3 className="payment-sub-block-title">Cancel Subscription</h3>
              <div className="button-group">
                <button
                  type="button"
                  className="attempt-btn"
                  onClick={runCancelSubscriptionTest}
                  disabled={isRunning}
                >
                  {isRunning && activeTest === 'cancelSubscription' ? (
                    <>
                      <span className="spinner" />
                      Running...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </button>
                <span className="script-ref">tests/student/cancelSubscription.spec.js</span>
                {isRunning && activeTest === 'cancelSubscription' && (
                  <button className="stop-btn" onClick={stopTest}>
                    Stop Test
                  </button>
                )}
              </div>
            </div>
          </div>
          {(showPremiumCoursePurchaseBrowserSection || showSubscriptionBrowserSection) && (
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
          <LogPanel result={premiumCoursePurchaseResult} stepsEndRef={premiumCoursePurchaseStepsRef} />
          <LogPanel result={annualStandardSubscriptionResult} stepsEndRef={annualStandardSubscriptionStepsRef} />
          <LogPanel result={annualPremiumResult} stepsEndRef={annualPremiumStepsRef} />
          <LogPanel result={annualEnterpriseResult} stepsEndRef={annualEnterpriseStepsRef} />
          <LogPanel result={monthlyStandardResult} stepsEndRef={monthlyStandardStepsRef} />
          <LogPanel result={monthlyPremiumResult} stepsEndRef={monthlyPremiumStepsRef} />
          <LogPanel result={monthlyEnterpriseResult} stepsEndRef={monthlyEnterpriseStepsRef} />
          <TestReportSection ref={premiumCoursePurchaseReportRef} result={premiumCoursePurchaseResult} reportUrl={(premiumCoursePurchaseResult.status === 'passed' || premiumCoursePurchaseResult.status === 'failed' || premiumCoursePurchaseResult.status === 'stopped') ? '/reports/premium-course-purchase/' : null} stepsEndRef={premiumCoursePurchaseStepsRef} testCaseName="Premium Course Purchase" />
          <TestReportSection ref={annualStandardSubscriptionReportRef} result={annualStandardSubscriptionResult} reportUrl={(annualStandardSubscriptionResult.status === 'passed' || annualStandardSubscriptionResult.status === 'failed' || annualStandardSubscriptionResult.status === 'stopped') ? '/reports/annual-standard-subscription/' : null} stepsEndRef={annualStandardSubscriptionStepsRef} testCaseName="Annual Standard Subscription" />
          <TestReportSection ref={annualPremiumReportRef} result={annualPremiumResult} reportUrl={(annualPremiumResult.status === 'passed' || annualPremiumResult.status === 'failed' || annualPremiumResult.status === 'stopped') ? '/reports/annual-premium/' : null} stepsEndRef={annualPremiumStepsRef} testCaseName="Annual Premium" />
          <TestReportSection ref={annualEnterpriseReportRef} result={annualEnterpriseResult} reportUrl={(annualEnterpriseResult.status === 'passed' || annualEnterpriseResult.status === 'failed' || annualEnterpriseResult.status === 'stopped') ? '/reports/annual-enterprise/' : null} stepsEndRef={annualEnterpriseStepsRef} testCaseName="Annual Enterprise" />
          <TestReportSection ref={monthlyStandardReportRef} result={monthlyStandardResult} reportUrl={(monthlyStandardResult.status === 'passed' || monthlyStandardResult.status === 'failed' || monthlyStandardResult.status === 'stopped') ? '/reports/monthly-standard/' : null} stepsEndRef={monthlyStandardStepsRef} testCaseName="Monthly Standard" />
          <TestReportSection ref={monthlyPremiumReportRef} result={monthlyPremiumResult} reportUrl={(monthlyPremiumResult.status === 'passed' || monthlyPremiumResult.status === 'failed' || monthlyPremiumResult.status === 'stopped') ? '/reports/monthly-premium/' : null} stepsEndRef={monthlyPremiumStepsRef} testCaseName="Monthly Premium" />
          <TestReportSection ref={monthlyEnterpriseReportRef} result={monthlyEnterpriseResult} reportUrl={(monthlyEnterpriseResult.status === 'passed' || monthlyEnterpriseResult.status === 'failed' || monthlyEnterpriseResult.status === 'stopped') ? '/reports/monthly-enterprise/' : null} stepsEndRef={monthlyEnterpriseStepsRef} testCaseName="Monthly Enterprise" />
          <LogPanel result={cancelSubscriptionResult} stepsEndRef={cancelSubscriptionStepsRef} />
          <TestReportSection ref={cancelSubscriptionReportRef} result={cancelSubscriptionResult} reportUrl={(cancelSubscriptionResult.status === 'passed' || cancelSubscriptionResult.status === 'failed' || cancelSubscriptionResult.status === 'stopped') ? '/reports/cancel-subscription/' : null} stepsEndRef={cancelSubscriptionStepsRef} testCaseName="Cancel Subscription" />
        </section>

        <section className="profile-test-section card card-with-log">
          <h2>Profile</h2>
          <p>Login, open profile dropdown, edit profile, update all fields except email.</p>
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
          <div className="button-group">
            <button
              type="button"
              className="attempt-btn"
              onClick={runUpdateProfileTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'updateProfile' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
            {isRunning && activeTest === 'updateProfile' && (
              <button
                className="stop-btn"
                onClick={stopTest}
              >
                Stop Test
              </button>
            )}
          </div>
          {showUpdateProfileBrowserSection && (
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
          <LogPanel result={updateProfileResult} stepsEndRef={updateProfileStepsRef} />
        </section>

        <section className="ai-grader-section card card-with-log">
          <h2>AI Grader</h2>
          <p>AI-powered grading with or without rubric, and text-based grading.</p>
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
          <div className="button-group">
            <button
              type="button"
              className="attempt-btn"
              onClick={runAiGraderTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'aiGrader' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'AI Grader With Rubric'
              )}
            </button>
            <span className="script-ref">tests/student/aiGrader.spec.js</span>
            {isRunning && activeTest === 'aiGrader' && (
              <button className="stop-btn" onClick={stopTest}>
                Stop Test
              </button>
            )}

            <button
              type="button"
              className="attempt-btn"
              disabled={isRunning}
            >
              AI Grader Without Rubric
            </button>
            <button
              type="button"
              className="attempt-btn"
              disabled={isRunning}
            >
              Text Based AI Grader
            </button>
          </div>
          {showAiGraderBrowserSection && (
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
          <LogPanel result={aiGraderResult} stepsEndRef={aiGraderStepsRef} />
          <TestReportSection ref={aiGraderReportRef} result={aiGraderResult} reportUrl={(aiGraderResult.status === 'passed' || aiGraderResult.status === 'failed' || aiGraderResult.status === 'stopped') ? '/reports/ai-grader/' : null} stepsEndRef={aiGraderStepsRef} testCaseName="AI Grader" />
        </section>

        <div className="attempt-section-wrapper">
          <section className="card card-with-log">
            <h2>Attempt Course</h2>
            <p>Runs the full course flow: login, navigate, interact with Q&amp;A, Notes, and Reviews.</p>
            <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
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
          <EnvironmentSelector environment={environment} setEnvironment={setEnvironment} isRunning={isRunning} compact />
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
            <button
              type="button"
              className="attempt-btn"
              onClick={runAddToFavoriteTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'addToFavorite' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Add to Favorite'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runShareCourseTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'shareCourse' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Share Course'
              )}
            </button>
            <button
              type="button"
              className="attempt-btn"
              onClick={runMycoursenavbarTest}
              disabled={isRunning}
            >
              {isRunning && activeTest === 'mycoursenavbar' ? (
                <>
                  <span className="spinner" />
                  Running...
                </>
              ) : (
                'Mycoursenavbar'
              )}
            </button>
            {(isRunning && (activeTest === 'create' || activeTest === 'createCourseNegative' || activeTest === 'createTest' || activeTest === 'createTestNegative' || activeTest === 'addToFavorite' || activeTest === 'shareCourse' || activeTest === 'mycoursenavbar')) && (
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
          <LogPanel result={addToFavoriteResult} stepsEndRef={addToFavoriteStepsRef} />
          <LogPanel result={shareCourseResult} stepsEndRef={shareCourseStepsRef} />
          <LogPanel result={mycoursenavbarResult} stepsEndRef={mycoursenavbarStepsRef} />
          <TestReportSection ref={createReportRef} result={createResult} reportUrl={(createResult.status === 'passed' || createResult.status === 'failed' || createResult.status === 'stopped') ? '/reports/create-course/' : null} stepsEndRef={createStepsRef} testCaseName="Create Course" />
          <TestReportSection ref={createCourseNegativeReportRef} result={createCourseNegativeResult} reportUrl={(createCourseNegativeResult.status === 'passed' || createCourseNegativeResult.status === 'failed' || createCourseNegativeResult.status === 'stopped') ? '/reports/create-course-negative/' : null} stepsEndRef={createCourseNegativeStepsRef} testCaseName="Create Course Negative" />
          <TestReportSection ref={createTestReportRef} result={createTestResult} reportUrl={(createTestResult.status === 'passed' || createTestResult.status === 'failed' || createTestResult.status === 'stopped') ? '/reports/create-test/' : null} stepsEndRef={createTestStepsRef} testCaseName="Create Test" />
          <TestReportSection ref={createTestNegativeReportRef} result={createTestNegativeResult} reportUrl={(createTestNegativeResult.status === 'passed' || createTestNegativeResult.status === 'failed' || createTestNegativeResult.status === 'stopped') ? '/reports/create-test-negative/' : null} stepsEndRef={createTestNegativeStepsRef} testCaseName="Create Test Negative" />
          <TestReportSection ref={addToFavoriteReportRef} result={addToFavoriteResult} reportUrl={(addToFavoriteResult.status === 'passed' || addToFavoriteResult.status === 'failed' || addToFavoriteResult.status === 'stopped') ? '/reports/add-to-favorite/' : null} stepsEndRef={addToFavoriteStepsRef} testCaseName="Add to Favorite" />
          <TestReportSection ref={shareCourseReportRef} result={shareCourseResult} reportUrl={(shareCourseResult.status === 'passed' || shareCourseResult.status === 'failed' || shareCourseResult.status === 'stopped') ? '/reports/share-course/' : null} stepsEndRef={shareCourseStepsRef} testCaseName="Share Course" />
          <TestReportSection ref={mycoursenavbarReportRef} result={mycoursenavbarResult} reportUrl={(mycoursenavbarResult.status === 'passed' || mycoursenavbarResult.status === 'failed' || mycoursenavbarResult.status === 'stopped') ? '/reports/mycoursenavbar/' : null} stepsEndRef={mycoursenavbarStepsRef} testCaseName="Mycoursenavbar" />
        </section>
        </main>
        <TestDashboard resultsMap={resultsMap} activeTest={activeTest} runningSteps={runningSteps} />
      </div>
    </div>
  )
}

export default App

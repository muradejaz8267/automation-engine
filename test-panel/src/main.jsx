import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(err) {
    return { hasError: true, error: err }
  }
  componentDidCatch(err, info) {
    console.error('App error:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem', fontFamily: 'system-ui', background: '#0a0e17', color: '#e2e8f0',
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
          <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, overflow: 'auto', maxWidth: '90%' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:2rem;font-family:system-ui;background:#0a0e17;color:#e2e8f0;min-height:100vh">Root element not found. Check index.html.</div>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}

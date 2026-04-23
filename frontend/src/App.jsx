import { useState, useEffect } from 'react'
import BubblePicker from './components/BubblePicker'
import Results from './components/Results'

export default function App() {
  const [companies, setCompanies] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(setCompanies)
      .catch(() => setError('Failed to load company data'))
  }, [])

  function toggleTicker(ticker) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      return next
    })
  }

  async function runOptimizer() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: [...selected] }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail)
      }
      setResults(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResults(null)
    setError(null)
  }

  if (results) {
    return <Results results={results} selected={selected} onBack={reset} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Portfolio Optimizer</h1>
          <p className="subtitle">
            Click stocks from any sector to select them, then run the optimizer
            to find the maximum Sharpe ratio allocation. No short selling.
          </p>
        </div>
        <div className="header-right">
          <span className="selected-count">
            {selected.size} stock{selected.size !== 1 ? 's' : ''} selected
          </span>
          <button
            className="btn-optimize"
            disabled={selected.size < 2 || loading}
            onClick={runOptimizer}
          >
            {loading ? 'Optimizing…' : 'Optimize Portfolio →'}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Running optimizer — fetching prices and solving…</p>
          <p className="loading-sub">This takes ~30 seconds</p>
        </div>
      )}

      {companies
        ? <BubblePicker companies={companies} selected={selected} onToggle={toggleTicker} />
        : <div className="loading-center">Loading companies…</div>
      }
    </div>
  )
}

import { useState } from 'react'
import BubblePicker from './BubblePicker'
import FightResults from './FightResults'

export default function FightAI({ companies, onBack }) {
  const [userSelected, setUserSelected] = useState(new Set())
  const [aiSelected, setAiSelected] = useState(new Set())
  const [fightResults, setFightResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function toggle(setter) {
    return ticker => setter(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      return next
    })
  }

  async function optimizeBoth() {
    setLoading(true)
    setError(null)
    try {
      const [userRes, aiRes] = await Promise.all([
        fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: [...userSelected] }),
        }).then(async r => {
          if (!r.ok) { const e = await r.json(); throw new Error(e.detail) }
          return r.json()
        }),
        fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: [...aiSelected] }),
        }).then(async r => {
          if (!r.ok) { const e = await r.json(); throw new Error(e.detail) }
          return r.json()
        }),
      ])
      setFightResults({ user: userRes, ai: aiRes })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (fightResults) {
    return (
      <FightResults
        userResults={fightResults.user}
        aiResults={fightResults.ai}
        onBack={() => setFightResults(null)}
      />
    )
  }

  return (
    <div className="fight-container">
      <div className="fight-topbar">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="fight-topbar-info">
          {error
            ? <span className="fight-error">{error}</span>
            : <span className="fight-topbar-counts">You: {userSelected.size} · AI: {aiSelected.size}</span>
          }
        </div>
        <button
          className="btn-optimize-fight"
          disabled={userSelected.size < 2 || aiSelected.size < 2 || loading}
          onClick={optimizeBoth}
        >
          {loading ? 'Optimizing…' : 'Optimize Both →'}
        </button>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Optimizing both portfolios…</p>
          <p className="loading-sub">This takes ~30 seconds</p>
        </div>
      )}

      <div className="fight-split">
        <div className="fight-half">
          <div className="fight-half-header">
            <h2 className="fight-title">User's Choices</h2>
            <span className="fight-count">{userSelected.size} selected</span>
          </div>
          <BubblePicker companies={companies} selected={userSelected} onToggle={toggle(setUserSelected)} cols={2} />
        </div>

        <div className="fight-divider" />

        <div className="fight-half">
          <div className="fight-half-header">
            <h2 className="fight-title fight-title-ai">AI's Choices</h2>
            <span className="fight-count">{aiSelected.size} selected</span>
          </div>
          <BubblePicker companies={companies} selected={aiSelected} onToggle={toggle(setAiSelected)} cols={2} />
        </div>
      </div>
    </div>
  )
}

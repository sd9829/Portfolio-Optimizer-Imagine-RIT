import { useState, useCallback } from 'react'
import BubblePicker from './BubblePicker'
import FightResults from './FightResults'

export default function FightAI({ companies, onBack }) {
  const [userSelected, setUserSelected] = useState(new Set())
  const [aiSelected,   setAiSelected]   = useState(new Set())
  const [fightResults, setFightResults] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // Stable references — never recreated, use functional update so they always
  // see the latest state without being re-created on every render.
  const toggleUser = useCallback(ticker => {
    setUserSelected(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      return next
    })
  }, [])

  const toggleAI = useCallback(ticker => {
    setAiSelected(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      return next
    })
  }, [])

  async function optimizeBoth() {
    // Snapshot tickers at call time
    const userTickers = [...userSelected]
    const aiTickers   = [...aiSelected]

    setLoading(true)
    setError(null)
    try {
        // Sequential — yf.download is not thread-safe under concurrent calls
      const post = async tickers => {
        const r = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers }),
        })
        if (!r.ok) { const e = await r.json(); throw new Error(e.detail) }
        return r.json()
      }
      const userRes = await post(userTickers)
      const aiRes   = await post(aiTickers)
      setFightResults({ user: userRes, ai: aiRes, userTickers, aiTickers })
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
        userTickers={fightResults.userTickers}
        aiTickers={fightResults.aiTickers}
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
          <BubblePicker
            key="user-picker"
            companies={companies}
            selected={userSelected}
            onToggle={toggleUser}
            blocked={aiSelected}
            cols={2}
          />
        </div>

        <div className="fight-divider" />

        <div className="fight-half">
          <div className="fight-half-header">
            <h2 className="fight-title fight-title-ai">AI's Choices</h2>
            <span className="fight-count">{aiSelected.size} selected</span>
          </div>
          <BubblePicker
            key="ai-picker"
            companies={companies}
            selected={aiSelected}
            onToggle={toggleAI}
            blocked={userSelected}
            cols={2}
          />
        </div>
      </div>
    </div>
  )
}

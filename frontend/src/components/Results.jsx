import { useState } from 'react'
import PortfolioCard from './PortfolioCard'
import SpinWheel from './SpinWheel'

export default function Results({ results, onBack }) {
  const [showWheel,  setShowWheel]  = useState(false)
  const [returnAdj,  setReturnAdj]  = useState(0)

  const adjReturn = returnAdj !== 0 ? results.optimal.return + returnAdj : null

  return (
    <div className="res-page">
      <header className="res-header">
        <button className="btn-back res-back-btn" onClick={onBack}>← Back</button>
        <h1 className="res-header-title">
          Optimization <span className="res-title-accent">Results</span>
        </h1>
      </header>

      <div className="res-main res-single">
        <PortfolioCard result={results} accent="#4b82f5" adjReturn={adjReturn} />
      </div>

      <div className="res-spin-section">
        <h3>Market Roulette</h3>
        <p>Stress-test your portfolio with a random market event</p>
        <button className="res-spinbtn" onClick={() => setShowWheel(true)}>
          🎰 Spin the Wheel
        </button>
      </div>

      {showWheel && (
        <SpinWheel
          onClose={() => setShowWheel(false)}
          userReturn={results.optimal.return}
          onAdjust={setReturnAdj}
        />
      )}
    </div>
  )
}

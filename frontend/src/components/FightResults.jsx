import { useState } from 'react'
import PortfolioCard from './PortfolioCard'
import SpinWheel from './SpinWheel'

export default function FightResults({ userResults, aiResults, userTickers, aiTickers, onBack }) {
  const [showWheel, setShowWheel] = useState(false)
  const [returnAdj, setReturnAdj] = useState(0)

  const adjReturn = returnAdj !== 0 ? userResults.optimal.return + returnAdj : null

  return (
    <div className="res-page">
      <header className="res-header">
        <button className="btn-back res-back-btn" onClick={onBack}>← Back to Selection</button>
        <h1 className="res-header-title">
          Fight <span className="res-title-accent">Results</span>
        </h1>
      </header>

      <div className="res-main res-fight">
        <div className="res-col">
          <div className="res-col-head" style={{ borderBottomColor: '#4b82f5' }}>
            <div className="res-col-pip" style={{ background: '#4b82f5', boxShadow: '0 0 10px #4b82f588' }} />
            <div>
              <h2>Your Portfolio</h2>
              {userTickers && (
                <div className="res-col-tickers">{userTickers.join(' · ')}</div>
              )}
            </div>
          </div>
          <PortfolioCard result={userResults} accent="#4b82f5" adjReturn={adjReturn} />
        </div>

        <div className="res-vdivider" />

        <div className="res-col">
          <div className="res-col-head" style={{ borderBottomColor: '#9b6bf5' }}>
            <div className="res-col-pip" style={{ background: '#9b6bf5', boxShadow: '0 0 10px #9b6bf588' }} />
            <div>
              <h2>AI's Portfolio</h2>
              {aiTickers && (
                <div className="res-col-tickers">{aiTickers.join(' · ')}</div>
              )}
            </div>
          </div>
          <PortfolioCard result={aiResults} accent="#9b6bf5" />
        </div>
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
          userReturn={userResults.optimal.return}
          onAdjust={setReturnAdj}
        />
      )}
    </div>
  )
}

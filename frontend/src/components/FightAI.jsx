import { useState } from 'react'
import BubblePicker from './BubblePicker'

export default function FightAI({ companies, onBack }) {
  const [userSelected, setUserSelected] = useState(new Set())
  const [aiSelected, setAiSelected] = useState(new Set())

  function toggle(setter) {
    return ticker => setter(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      return next
    })
  }

  return (
    <div className="fight-container">
      <div className="fight-half">
        <div className="fight-half-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h2 className="fight-title">User's Choices</h2>
          <span className="fight-count">{userSelected.size} selected</span>
        </div>
        <BubblePicker companies={companies} selected={userSelected} onToggle={toggle(setUserSelected)} cols={2} />
      </div>

      <div className="fight-divider" />

      <div className="fight-half">
        <div className="fight-half-header">
          <span />
          <h2 className="fight-title fight-title-ai">AI's Choices</h2>
          <span className="fight-count">{aiSelected.size} selected</span>
        </div>
        <BubblePicker companies={companies} selected={aiSelected} onToggle={toggle(setAiSelected)} cols={2} />
      </div>
    </div>
  )
}

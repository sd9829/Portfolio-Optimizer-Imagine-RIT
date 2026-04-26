import { useState, useRef } from 'react'

const SEGMENTS = [
  {
    label: '1999 Dot-Com Frenzy',
    wheel: "Dot-Com '99",
    ret:   0.07,
    color: '#10d08a',
    note:  'Nasdaq surged 86% in a year — internet mania at its peak.',
  },
  {
    label: '2017 FAANG Rally',
    wheel: 'FAANG Rally',
    ret:   0.05,
    color: '#4b82f5',
    note:  'Facebook, Apple, Amazon, Netflix & Google led the longest bull run in history.',
  },
  {
    label: '2021 Meme Stock Mania',
    wheel: 'Meme Mania',
    ret:   0.03,
    color: '#9b6bf5',
    note:  "Reddit's WallStreetBets sent GameStop up 1,700% — retail investors took Wall St by storm.",
  },
  {
    label: '1995 Goldilocks Economy',
    wheel: 'Goldilocks',
    ret:   0.01,
    color: '#14b8a6',
    note:  'Low inflation, low unemployment, steady S&P gains — conditions were just right.',
  },
  {
    label: '2011 US Debt Ceiling Crisis',
    wheel: 'Debt Ceiling',
    ret:   0.00,
    color: '#64748b',
    note:  'Political standoff over the debt limit spooked markets — S&P ended the year flat.',
  },
  {
    label: '2022 Fed Rate Shock',
    wheel: 'Rate Shock',
    ret:  -0.03,
    color: '#f59e0b',
    note:  'Fastest rate-hike cycle in 40 years crushed tech valuations and growth stocks.',
  },
  {
    label: '2020 COVID Crash',
    wheel: "COVID '20",
    ret:  -0.05,
    color: '#f97316',
    note:  'Pandemic panic triggered the fastest 34% market drop in history — just 33 days.',
  },
  {
    label: '2008 Lehman Collapse',
    wheel: "Lehman '08",
    ret:  -0.08,
    color: '#f04055',
    note:  'Global banking near-failure. S&P fell 57% peak-to-trough; credit markets froze.',
  },
]

const SIZE  = 360
const R     = 160
const CX    = SIZE / 2
const CY    = SIZE / 2
const TOTAL = SEGMENTS.length
const SLICE = 360 / TOTAL

function slicePath(i) {
  const rad = deg => (deg * Math.PI) / 180
  const s = rad(i * SLICE - 90)
  const e = rad((i + 1) * SLICE - 90)
  return `M ${CX},${CY} L ${CX + R * Math.cos(s)},${CY + R * Math.sin(s)} A ${R},${R} 0 0,1 ${CX + R * Math.cos(e)},${CY + R * Math.sin(e)} Z`
}

function labelPos(i) {
  const rad = deg => (deg * Math.PI) / 180
  const mid = rad((i + 0.5) * SLICE - 90)
  return { x: CX + R * 0.62 * Math.cos(mid), y: CY + R * 0.62 * Math.sin(mid), rot: (i + 0.5) * SLICE }
}

const fmtRet = r => (r >= 0 ? '+' : '') + (r * 100).toFixed(0) + '%'

export default function SpinWheel({ onClose, userReturn, onAdjust }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result,   setResult]   = useState(null)
  const [cumAdj,   setCumAdj]   = useState(0)
  const [history,  setHistory]  = useState([])
  const targetRef = useRef(null)

  function spin() {
    if (spinning) return
    setSpinning(true)

    const idx = Math.floor(Math.random() * TOTAL)
    targetRef.current = idx

    const targetAngle = (342 - idx * SLICE + 3600) % 360
    const delta       = (targetAngle - rotation % 360 + 360) % 360
    const newRotation = rotation + (5 + Math.floor(Math.random() * 5)) * 360 + delta
    setRotation(newRotation)

    setTimeout(() => {
      const seg = SEGMENTS[targetRef.current]
      const newAdj = cumAdj + seg.ret
      setSpinning(false)
      setResult(seg)
      setCumAdj(newAdj)
      setHistory(prev => [seg, ...prev])
      if (onAdjust) onAdjust(newAdj)
    }, 4500)
  }

  const adjReturn = userReturn != null ? userReturn + cumAdj : null

  return (
    <div className="wheel-overlay" onClick={onClose}>
      <div className="wheel-modal" onClick={e => e.stopPropagation()}>
        <button className="wheel-close" onClick={onClose}>✕</button>
        <h2 className="wheel-title">Market Roulette</h2>

        <div className="wheel-wrap">
          <div className="wheel-pointer">▼</div>
          <svg
            width={SIZE} height={SIZE}
            style={{
              transform:  `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              display: 'block',
            }}
          >
            {SEGMENTS.map((seg, i) => {
              const lp = labelPos(i)
              return (
                <g key={i}>
                  <path d={slicePath(i)} fill={seg.color} stroke="#07091a" strokeWidth={2} />
                  <text
                    x={lp.x} y={lp.y}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={9.5}
                    fontWeight={700}
                    transform={`rotate(${lp.rot}, ${lp.x}, ${lp.y})`}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    <tspan x={lp.x} dy="-0.65em">{seg.wheel}</tspan>
                    <tspan x={lp.x} dy="1.3em" fontSize={9} fill="rgba(255,255,255,0.8)">
                      {fmtRet(seg.ret)}
                    </tspan>
                  </text>
                </g>
              )
            })}
            <circle cx={CX} cy={CY} r={22} fill="#07091a" stroke="#1a2340" strokeWidth={2} />
          </svg>
        </div>

        <button className="btn-spin" onClick={spin} disabled={spinning}>
          {spinning ? 'Spinning…' : history.length === 0 ? 'SPIN' : 'SPIN AGAIN'}
        </button>

        {result && !spinning && (
          <div className="wheel-result-box" style={{ borderColor: result.color }}>
            <div className="wheel-result-event" style={{ color: result.color }}>
              {result.label}
            </div>
            <div className={`wheel-result-impact ${result.ret >= 0 ? 'wr-pos' : 'wr-neg'}`}>
              Return impact on your portfolio: {fmtRet(result.ret)}
            </div>
            <div className="wheel-result-note">{result.note}</div>
            {adjReturn != null && (
              <div className="wheel-result-adj">
                <span>Your adjusted return</span>
                <strong style={{ color: adjReturn >= userReturn ? '#10d08a' : '#f04055' }}>
                  {(adjReturn * 100).toFixed(2)}%
                </strong>
              </div>
            )}
            <div className="wheel-result-disclaimer">AI's portfolio is unaffected</div>
          </div>
        )}

        {history.length > 0 && (
          <div className="wheel-history">
            <div className="wheel-history-label">Spin History</div>
            {history.map((h, i) => (
              <div key={i} className="wheel-history-row">
                <span style={{ color: h.color }}>{h.label}</span>
                <span style={{ color: h.ret >= 0 ? '#10d08a' : '#f04055', fontWeight: 700 }}>
                  {fmtRet(h.ret)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

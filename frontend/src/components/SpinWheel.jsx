import { useState, useRef } from 'react'

const SEGMENTS = [
  { label: 'Bull Run',      color: '#4f8ef7' },
  { label: 'Market Crash',  color: '#e05c5c' },
  { label: 'Tech Boom',     color: '#50c878' },
  { label: 'Recession',     color: '#f5a623' },
  { label: 'Rate Hike',     color: '#a78bfa' },
  { label: 'Crypto Crash',  color: '#fb923c' },
  { label: 'Oil Shock',     color: '#34d399' },
  { label: 'Steady Growth', color: '#f472b6' },
  { label: 'Flash Crash',   color: '#60a5fa' },
  { label: 'Moon Shot',     color: '#fbbf24' },
]

const SIZE   = 360
const R      = 160
const CX     = SIZE / 2
const CY     = SIZE / 2
const TOTAL  = SEGMENTS.length
const SLICE  = 360 / TOTAL

// SVG arc path for one pie slice, starting segments at the top (-90°)
function slicePath(i) {
  const toRad = deg => (deg * Math.PI) / 180
  const start = toRad(i * SLICE - 90)
  const end   = toRad((i + 1) * SLICE - 90)
  const x1 = CX + R * Math.cos(start)
  const y1 = CY + R * Math.sin(start)
  const x2 = CX + R * Math.cos(end)
  const y2 = CY + R * Math.sin(end)
  return `M ${CX},${CY} L ${x1},${y1} A ${R},${R} 0 0,1 ${x2},${y2} Z`
}

// Center of each label, placed 62% of the way to the edge
function labelPos(i) {
  const toRad = deg => (deg * Math.PI) / 180
  const mid = toRad((i + 0.5) * SLICE - 90)
  return {
    x:   CX + R * 0.62 * Math.cos(mid),
    y:   CY + R * 0.62 * Math.sin(mid),
    rot: (i + 0.5) * SLICE,
  }
}

export default function SpinWheel({ onClose }) {
  const [rotation, setRotation] = useState(0)
  const [spinning,  setSpinning]  = useState(false)
  const [result,    setResult]    = useState(null)
  const targetRef = useRef(null)

  function spin() {
    if (spinning) return
    setResult(null)
    setSpinning(true)

    const targetIndex = Math.floor(Math.random() * TOTAL)
    targetRef.current = targetIndex

    // Angle that puts targetIndex's centre under the top pointer
    // Derived from: (i * SLICE - 72 + newRotation) mod 360 = 270
    const targetAngle = (342 - targetIndex * SLICE + 3600) % 360
    const currentMod  = rotation % 360
    const delta       = (targetAngle - currentMod + 360) % 360
    const extraSpins  = (5 + Math.floor(Math.random() * 5)) * 360
    const newRotation = rotation + extraSpins + delta

    setRotation(newRotation)

    setTimeout(() => {
      setSpinning(false)
      setResult(SEGMENTS[targetRef.current])
    }, 4500)
  }

  return (
    <div className="wheel-overlay" onClick={onClose}>
      <div className="wheel-modal" onClick={e => e.stopPropagation()}>
        <button className="wheel-close" onClick={onClose}>✕</button>
        <h2 className="wheel-title">Spin Your Fate</h2>

        <div className="wheel-wrap">
          {/* Pointer arrow sitting above the wheel */}
          <div className="wheel-pointer">▼</div>

          <svg
            width={SIZE}
            height={SIZE}
            style={{
              transform:  `rotate(${rotation}deg)`,
              transition: spinning
                ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                : 'none',
              display: 'block',
            }}
          >
            {SEGMENTS.map((seg, i) => {
              const lp = labelPos(i)
              return (
                <g key={i}>
                  <path
                    d={slicePath(i)}
                    fill={seg.color}
                    stroke="#0f0f0f"
                    strokeWidth={2}
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={11}
                    fontWeight={700}
                    transform={`rotate(${lp.rot}, ${lp.x}, ${lp.y})`}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {seg.label}
                  </text>
                </g>
              )
            })}
            {/* Centre cap */}
            <circle cx={CX} cy={CY} r={20} fill="#111" stroke="#333" strokeWidth={2} />
          </svg>
        </div>

        <button className="btn-spin" onClick={spin} disabled={spinning}>
          {spinning ? 'Spinning…' : 'SPIN'}
        </button>

        {result && !spinning && (
          <div className="wheel-result">
            <p>You landed on</p>
            <strong style={{ color: result.color }}>{result.label}</strong>
          </div>
        )}
      </div>
    </div>
  )
}

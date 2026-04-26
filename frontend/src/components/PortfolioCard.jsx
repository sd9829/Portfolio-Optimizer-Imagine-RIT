import { useEffect, useRef } from 'react'

const BAR_PAL = [
  '#4b82f5','#7c6df5','#9b6bf5','#c44bf5',
  '#ec4899','#f04055','#f59e0b','#10d08a',
  '#14b8a6','#06b6d4',
]

const pct = v => (v * 100).toFixed(2) + '%'

function FrontierChart({ frontier, optimal, minVariance, accent }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !frontier?.length) return

    const dpr = window.devicePixelRatio || 1
    const W = cv.offsetWidth || 400
    const H = 220
    cv.width = W * dpr
    cv.height = H * dpr
    const ctx = cv.getContext('2d')
    ctx.scale(dpr, dpr)

    const P = { t: 16, r: 16, b: 38, l: 54 }
    const pw = W - P.l - P.r
    const ph = H - P.t - P.b

    const pts = [...frontier].filter(p => isFinite(p.sharpe)).sort((a, b) => a.risk - b.risk)
    if (!pts.length) return

    const xs = pts.map(p => p.risk), ys = pts.map(p => p.return), ss = pts.map(p => p.sharpe)
    const [xn, xx] = [Math.min(...xs), Math.max(...xs)]
    const [yn, yx] = [Math.min(...ys), Math.max(...ys)]
    const [sn, sx] = [Math.min(...ss), Math.max(...ss)]

    const X = v => P.l + (v - xn) / (xx - xn || 1) * pw
    const Y = v => P.t + (1 - (v - yn) / (yx - yn || 1)) * ph
    const hexRGB = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]
    const [ar, ag, ab] = hexRGB(accent)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(P.l, P.t + i*ph/4); ctx.lineTo(P.l+pw, P.t + i*ph/4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(P.l + i*pw/4, P.t); ctx.lineTo(P.l + i*pw/4, P.t+ph); ctx.stroke()
    }
    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(P.l,P.t); ctx.lineTo(P.l,P.t+ph); ctx.lineTo(P.l+pw,P.t+ph); ctx.stroke()
    // Labels
    ctx.fillStyle = '#4e6290'; ctx.font = '11px -apple-system,sans-serif'; ctx.textAlign = 'center'
    for (let i = 0; i <= 4; i++)
      ctx.fillText(((xn + i*(xx-xn)/4)*100).toFixed(1)+'%', X(xn + i*(xx-xn)/4), P.t+ph+24)
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++)
      ctx.fillText(((yn + i*(yx-yn)/4)*100).toFixed(1)+'%', P.l-6, Y(yn + i*(yx-yn)/4)+4)
    ctx.textAlign = 'center'; ctx.fillText('Risk (σ)', P.l+pw/2, H-3)
    ctx.save(); ctx.translate(14, P.t+ph/2); ctx.rotate(-Math.PI/2); ctx.fillText('Return',0,0); ctx.restore()
    // Curve
    ctx.beginPath()
    pts.forEach((p,i) => i===0 ? ctx.moveTo(X(p.risk),Y(p.return)) : ctx.lineTo(X(p.risk),Y(p.return)))
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1.5; ctx.stroke()
    // Points (low→high Sharpe gradient)
    pts.forEach(p => {
      const t = sx===sn ? 0.5 : (p.sharpe-sn)/(sx-sn)
      ctx.beginPath(); ctx.arc(X(p.risk), Y(p.return), 2.5, 0, Math.PI*2)
      ctx.fillStyle = `rgba(${Math.round(30+(ar-30)*t)},${Math.round(50+(ag-50)*t)},${Math.round(80+(ab-80)*t)},.9)`
      ctx.fill()
    })
    // Min Variance
    ctx.beginPath(); ctx.arc(X(minVariance.risk), Y(minVariance.return), 9, 0, Math.PI*2)
    ctx.fillStyle = '#10d08a'; ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('MV', X(minVariance.risk), Y(minVariance.return)+3)
    // Optimal
    ctx.beginPath(); ctx.arc(X(optimal.risk), Y(optimal.return), 10, 0, Math.PI*2)
    ctx.fillStyle = accent; ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('★', X(optimal.risk), Y(optimal.return)+5)
  }, [frontier, optimal, minVariance, accent])

  return <canvas ref={canvasRef} className="res-frontier-canvas" />
}

export default function PortfolioCard({ result, accent, adjReturn }) {
  const { optimal, min_variance, frontier } = result
  const hasAdj = adjReturn != null && adjReturn !== optimal.return

  return (
    <>
      <div className="res-card">
        <div className="res-card-title">Optimal · Max Sharpe</div>
        <div className="res-stats">
          <div className="res-stat">
            <div className="res-stat-label">Expected Return</div>
            <div className="res-stat-val" style={{ color: '#10d08a' }}>{pct(optimal.return)}</div>
            {hasAdj && (
              <div
                className="res-adj-pill"
                style={{ background: adjReturn >= optimal.return ? 'rgba(16,208,138,.15)' : 'rgba(240,64,85,.15)',
                         color:      adjReturn >= optimal.return ? '#10d08a' : '#f04055' }}
              >
                Market adj: {pct(adjReturn)}
              </div>
            )}
          </div>
          <div className="res-stat">
            <div className="res-stat-label">Risk (σ)</div>
            <div className="res-stat-val" style={{ color: '#f04055' }}>{pct(optimal.risk)}</div>
          </div>
          <div className="res-stat">
            <div className="res-stat-label">Sharpe Ratio</div>
            <div className="res-stat-val" style={{ color: accent }}>{parseFloat(optimal.sharpe).toFixed(4)}</div>
          </div>
        </div>
        <table className="res-wtable">
          <thead>
            <tr>
              <th>Ticker</th>
              <th style={{ textAlign: 'right', paddingRight: 12 }}>Weight</th>
              <th>Allocation</th>
            </tr>
          </thead>
          <tbody>
            {optimal.weights.map((w, i) => {
              const c = BAR_PAL[i % BAR_PAL.length]
              return (
                <tr key={w.ticker}>
                  <td className="res-w-tick" style={{ color: c }}>{w.ticker}</td>
                  <td className="res-w-pct" style={{ color: c }}>{(w.weight * 100).toFixed(2)}%</td>
                  <td style={{ width: '45%' }}>
                    <div className="res-bar-bg">
                      <div className="res-bar-fill" style={{ width: `${Math.min(w.weight*100,100).toFixed(1)}%`, background: c }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="res-card">
        <div className="res-card-title">Minimum Variance</div>
        <div className="res-stats">
          <div className="res-stat">
            <div className="res-stat-label">Expected Return</div>
            <div className="res-stat-val" style={{ color: '#10d08a' }}>{pct(min_variance.return)}</div>
          </div>
          <div className="res-stat">
            <div className="res-stat-label">Risk (σ)</div>
            <div className="res-stat-val" style={{ color: '#f04055' }}>{pct(min_variance.risk)}</div>
          </div>
          <div className="res-stat">
            <div className="res-stat-label">Sharpe Ratio</div>
            <div className="res-stat-val" style={{ color: accent }}>{parseFloat(min_variance.sharpe).toFixed(4)}</div>
          </div>
        </div>
      </div>

      <div className="res-card">
        <div className="res-card-title">Efficient Frontier · {frontier.length} points</div>
        <FrontierChart frontier={frontier} optimal={optimal} minVariance={min_variance} accent={accent} />
        <div className="res-legend">
          <div className="res-leg"><div className="res-ldot" style={{ background: accent }} />Optimal ★</div>
          <div className="res-leg"><div className="res-ldot" style={{ background: '#10d08a' }} />Min Variance</div>
          <div className="res-leg">
            <div className="res-ldot" style={{ background: '#334155' }} />
            →
            <div className="res-ldot" style={{ background: accent, marginLeft: 4 }} />
            Low → High Sharpe
          </div>
        </div>
      </div>
    </>
  )
}

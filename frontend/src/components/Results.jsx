import { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from 'recharts'
import SpinWheel from './SpinWheel'

const pct = v => `${(v * 100).toFixed(1)}%`

export default function Results({ results, selected, onBack }) {
  const [showWheel, setShowWheel] = useState(false)
  const { optimal, min_variance, frontier } = results

  const frontierData = frontier.map(p => ({
    risk:   +(p.risk   * 100).toFixed(2),
    return: +(p.return * 100).toFixed(2),
    sharpe: +p.sharpe.toFixed(2),
  }))

  const weightData = optimal.weights.map(w => ({
    ticker: w.ticker,
    name: w.name || w.ticker,
    weight: +(w.weight * 100).toFixed(2),
  }))

  return (
    <div className="results">
      <button className="btn-back" onClick={onBack}>← Back to picker</button>

      <div className="results-header">
        <h2>Optimization Results</h2>
        <p className="subtitle">
          {selected.size} stocks selected · {optimal.weights.length} received meaningful weight
        </p>
      </div>

      <div className="stats-grid">
        <StatCard title="Max Sharpe Portfolio" data={optimal}      accent="#4f8ef7" />
        <StatCard title="Min Variance Portfolio" data={min_variance} accent="#50c878" />
      </div>

      <section className="chart-section">
        <h3>Efficient Frontier</h3>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis
              dataKey="risk"
              name="Risk"
              type="number"
              tickFormatter={v => `${v}%`}
              label={{ value: 'Annual Risk (Std Dev)', position: 'insideBottom', offset: -16, fill: '#666', fontSize: 13 }}
            />
            <YAxis
              dataKey="return"
              name="Return"
              type="number"
              tickFormatter={v => `${v}%`}
              label={{ value: 'Annual Return', angle: -90, position: 'insideLeft', offset: 10, fill: '#666', fontSize: 13 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="chart-tooltip">
                    <p>Return: <b>{d.return}%</b></p>
                    <p>Risk:   <b>{d.risk}%</b></p>
                    <p>Sharpe: <b>{d.sharpe}</b></p>
                  </div>
                )
              }}
            />
            <Scatter data={frontierData} fill="#4f8ef7" opacity={0.65} />
            <ReferenceDot
              x={+(optimal.risk   * 100).toFixed(2)}
              y={+(optimal.return * 100).toFixed(2)}
              r={10} fill="#e05c5c" stroke="#fff" strokeWidth={2}
              label={{ value: 'Max Sharpe', position: 'top', fill: '#e05c5c', fontSize: 12 }}
            />
            <ReferenceDot
              x={+(min_variance.risk   * 100).toFixed(2)}
              y={+(min_variance.return * 100).toFixed(2)}
              r={8} fill="#50c878" stroke="#fff" strokeWidth={2}
              label={{ value: 'Min Var', position: 'top', fill: '#50c878', fontSize: 12 }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </section>

      <section className="chart-section">
        <h3>Optimal Portfolio Weights</h3>
        {weightData.length === 0
          ? <p className="no-weights">All weights below threshold — try selecting more stocks.</p>
          : (
            <ResponsiveContainer width="100%" height={Math.max(200, weightData.length * 44)}>
              <BarChart
                data={weightData}
                layout="vertical"
                margin={{ top: 10, right: 70, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" tickFormatter={v => `${v}%`} stroke="#555" />
                <YAxis type="category" dataKey="ticker" width={55} stroke="#555" tick={{ fill: '#aaa', fontSize: 13 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="chart-tooltip">
                        <p><b>{d.name}</b></p>
                        <p>Weight: <b>{d.weight}%</b></p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="weight" radius={[0, 6, 6, 0]}>
                  {weightData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${200 + i * 22}, 70%, 58%)`} />
                  ))}
                  <LabelList
                    dataKey="weight"
                    position="right"
                    formatter={v => `${v}%`}
                    style={{ fill: '#aaa', fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </section>

      <div className="gamble-section">
        <button className="btn-gamble" onClick={() => setShowWheel(true)}>GAMBLE? 👀</button>
      </div>

      {showWheel && <SpinWheel onClose={() => setShowWheel(false)} />}
    </div>
  )
}

function StatCard({ title, data, accent }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <h4>{title}</h4>
      <div className="stat-row">
        <span>Annual Return</span>
        <strong style={{ color: accent }}>{pct(data.return)}</strong>
      </div>
      <div className="stat-row">
        <span>Annual Risk (Std Dev)</span>
        <strong>{pct(data.risk)}</strong>
      </div>
      <div className="stat-row">
        <span>Sharpe Ratio</span>
        <strong>{data.sharpe.toFixed(2)}</strong>
      </div>
    </div>
  )
}

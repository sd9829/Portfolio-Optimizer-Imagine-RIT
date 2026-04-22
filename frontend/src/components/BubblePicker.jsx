import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const SECTOR_COLORS = {
  'Information Technology': '#4f8ef7',
  'Health Care':            '#e05c5c',
  'Financials':             '#50c878',
  'Consumer Discretionary': '#f5a623',
  'Consumer Staples':       '#a78bfa',
  'Energy':                 '#fb923c',
  'Industrials':            '#34d399',
  'Materials':              '#f472b6',
  'Real Estate':            '#60a5fa',
  'Communication Services': '#4ade80',
  'Utilities':              '#94a3b8',
}

const W = 1600
const H = 980
const COLS = 4

export default function BubblePicker({ companies, selected, onToggle }) {
  const containerRef = useRef(null)
  const svgRef      = useRef(null)
  const onToggleRef = useRef(onToggle)

  // Always keep callback ref fresh so D3 handlers don't close over stale props
  useEffect(() => { onToggleRef.current = onToggle }, [onToggle])

  // Build SVG + simulation — runs once when company data arrives
  useEffect(() => {
    if (!companies || !svgRef.current) return

    const sectorList = Object.keys(companies)
    const ROWS = Math.ceil(sectorList.length / COLS)
    const cellW = W / COLS
    const cellH = H / ROWS

    const sectorCenters = {}
    sectorList.forEach((s, i) => {
      sectorCenters[s] = {
        x: (i % COLS + 0.5) * cellW,
        y: (Math.floor(i / COLS) + 0.5) * cellH,
      }
    })

    // Flatten all companies into D3 nodes
    const nodes = []
    sectorList.forEach(sector => {
      companies[sector].forEach(c => {
        const cx = sectorCenters[sector].x
        const cy = sectorCenters[sector].y
        nodes.push({
          ...c,
          sector,
          color: SECTOR_COLORS[sector] ?? '#888',
          r: Math.max(20, Math.min(40, 5 + Math.sqrt(c.price) * 1.4)),
          // start near sector center with slight jitter
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 60,
        })
      })
    })

    // Clear any previous render
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

    // Sector background halos
    sectorList.forEach(sector => {
      const { x, y } = sectorCenters[sector]
      svg.append('ellipse')
        .attr('cx', x).attr('cy', y)
        .attr('rx', cellW * 0.44).attr('ry', cellH * 0.44)
        .attr('fill', SECTOR_COLORS[sector] ?? '#888')
        .attr('opacity', 0.07)

      svg.append('text')
        .attr('x', x).attr('y', y - cellH * 0.38)
        .attr('text-anchor', 'middle')
        .attr('fill', SECTOR_COLORS[sector] ?? '#888')
        .attr('font-size', 13)
        .attr('font-weight', 600)
        .attr('letter-spacing', 0.5)
        .style('pointer-events', 'none')
        .text(sector)
    })

    // Tooltip div (lives in the container, not the SVG)
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'bubble-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')

    // Company circles
    svg.selectAll('.bubble')
      .data(nodes, d => d.ticker)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('r', d => d.r)
      .attr('fill', d => d.color)
      .attr('opacity', 0.72)
      .attr('stroke', 'transparent')
      .attr('stroke-width', 3.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.company}</strong><br/>${d.ticker}&nbsp;·&nbsp;$${d.price.toFixed(2)}`)
      })
      .on('mousemove', event => {
        const rect = containerRef.current.getBoundingClientRect()
        tooltip
          .style('left', `${event.clientX - rect.left + 14}px`)
          .style('top',  `${event.clientY - rect.top  - 48}px`)
      })
      .on('mouseout', () => tooltip.style('opacity', 0))
      .on('click', (event, d) => onToggleRef.current(d.ticker))

    // Ticker text labels inside circles
    svg.selectAll('.bubble-label')
      .data(nodes, d => d.ticker)
      .enter()
      .append('text')
      .attr('class', 'bubble-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', d => d.r > 30 ? 11 : 9)
      .attr('font-weight', 700)
      .style('pointer-events', 'none')
      .text(d => d.ticker)

    // Force simulation — clusters bubbles by sector
    const sim = d3.forceSimulation(nodes)
      .force('x',       d3.forceX(d => sectorCenters[d.sector].x).strength(0.45))
      .force('y',       d3.forceY(d => sectorCenters[d.sector].y).strength(0.45))
      .force('collide', d3.forceCollide(d => d.r + 2.5).strength(0.9))
      .force('charge',  d3.forceManyBody().strength(-6))
      .alphaDecay(0.025)

    sim.on('tick', () => {
      svg.selectAll('.bubble')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      svg.selectAll('.bubble-label')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    })

    return () => {
      sim.stop()
      tooltip.remove()
    }
  }, [companies])

  // Update selection visuals only — no simulation restart needed
  useEffect(() => {
    if (!svgRef.current) return
    d3.select(svgRef.current).selectAll('.bubble')
      .attr('stroke',       d => selected.has(d.ticker) ? '#ffffff' : 'transparent')
      .attr('stroke-width', d => selected.has(d.ticker) ? 3.5 : 0)
      .attr('opacity',      d => selected.has(d.ticker) ? 1 : 0.72)
  }, [selected])

  return (
    <div ref={containerRef} className="bubble-container">
      <div className="bubble-scroll">
        <svg ref={svgRef} />
      </div>
    </div>
  )
}

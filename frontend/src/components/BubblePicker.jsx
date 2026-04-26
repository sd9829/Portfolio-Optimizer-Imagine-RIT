import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const SECTOR_COLORS = {
  'Information Technology': '#4f8ef7',  // blue
  'Health Care':            '#e05c5c',  // red
  'Financials':             '#c084fc',  // purple
  'Consumer Discretionary': '#f5a623',  // amber
  'Consumer Staples':       '#a3e635',  // lime
  'Energy':                 '#fde047',  // yellow
  'Industrials':            '#34d399',  // emerald
  'Materials':              '#f472b6',  // pink
  'Real Estate':            '#fb923c',  // orange
  'Communication Services': '#06b6d4',  // cyan
  'Utilities':              '#94a3b8',  // gray
}

function wrapName(name, r) {
  const maxChars = Math.floor(r * 0.32)
  const words = name.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  if (lines.length > 2) {
    lines.length = 2
    if (lines[1].length > maxChars) lines[1] = lines[1].slice(0, maxChars - 1) + '…'
  }
  return lines
}

export default function BubblePicker({ companies, selected, onToggle, blocked = new Set(), cols = 4 }) {
  const containerRef = useRef(null)
  const svgRef       = useRef(null)
  const onToggleRef  = useRef(onToggle)
  const blockedRef   = useRef(blocked)

  useEffect(() => { onToggleRef.current = onToggle }, [onToggle])
  useEffect(() => { blockedRef.current  = blocked  }, [blocked])

  useEffect(() => {
    if (!companies || !svgRef.current) return

    const sectorList = Object.keys(companies)
    const ROWS = Math.ceil(sectorList.length / cols)

    let W, cellW, cellH, H
    if (cols === 4) {
      W = 2000; H = 1350
      cellW = W / cols
      cellH = H / ROWS
    } else {
      W = containerRef.current?.clientWidth || cols * 500
      cellW = W / cols
      cellH = Math.round(cellW * 0.9)
      H = cellH * ROWS
    }

    const sectorCenters = {}
    sectorList.forEach((s, i) => {
      sectorCenters[s] = {
        x: (i % cols + 0.5) * cellW,
        y: (Math.floor(i / cols) + 0.5) * cellH,
      }
    })

    const nodes = []
    sectorList.forEach(sector => {
      companies[sector].forEach(c => {
        const cx = sectorCenters[sector].x
        const cy = sectorCenters[sector].y
        const r  = Math.max(50, Math.min(78, 20 + c.company.length * 2.0))
        nodes.push({
          ...c,
          sector,
          color: SECTOR_COLORS[sector] ?? '#888',
          r,
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 60,
        })
      })
    })

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

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
        .attr('font-size', 18)
        .attr('font-weight', 800)
        .attr('letter-spacing', 0.8)
        .style('pointer-events', 'none')
        .text(sector)
    })

    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'bubble-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')

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
          .html(`<strong>${d.ticker}</strong>&nbsp;·&nbsp;$${d.price.toFixed(2)}`)
      })
      .on('mousemove', event => {
        const rect = containerRef.current.getBoundingClientRect()
        tooltip
          .style('left', `${event.clientX - rect.left + 14}px`)
          .style('top',  `${event.clientY - rect.top  - 48}px`)
      })
      .on('mouseout', () => tooltip.style('opacity', 0))
      .on('click', (event, d) => {
        if (blockedRef.current.has(d.ticker)) return
        onToggleRef.current(d.ticker)
      })

    // Company name + price labels
    const labels = svg.selectAll('.bubble-label')
      .data(nodes, d => d.ticker)
      .enter()
      .append('text')
      .attr('class', 'bubble-label')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-weight', 700)
      .attr('font-size', d => d.r > 60 ? 11 : 10)
      .style('pointer-events', 'none')

    labels.each(function(d) {
      const nameLines = wrapName(d.company, d.r)
      const totalLines = nameLines.length + 1  // +1 for price
      // center the whole block (name + price) vertically
      nameLines.forEach((line, i) => {
        d3.select(this).append('tspan')
          .attr('x', d.x)
          .attr('dy', i === 0 ? `${-(totalLines - 1) * 0.6}em` : '1.2em')
          .text(line)
      })
      // price line — slightly smaller and dimmer
      d3.select(this).append('tspan')
        .attr('class', 'price-tspan')
        .attr('x', d.x)
        .attr('dy', '1.2em')
        .attr('font-size', d.r > 60 ? 10 : 9)
        .attr('fill', '#ffffffaa')
        .text(`$${d.price.toFixed(2)}`)
    })

    const sim = d3.forceSimulation(nodes)
      .force('x',       d3.forceX(d => sectorCenters[d.sector].x).strength(0.45))
      .force('y',       d3.forceY(d => sectorCenters[d.sector].y).strength(0.45))
      .force('collide', d3.forceCollide(d => d.r + 3).strength(0.9))
      .force('charge',  d3.forceManyBody().strength(-8))
      .alphaDecay(0.025)

    sim.on('tick', () => {
      svg.selectAll('.bubble')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      svg.selectAll('.bubble-label')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .selectAll('tspan')
        .attr('x', function() { return d3.select(this.parentNode).datum().x })
    })

    return () => {
      sim.stop()
      tooltip.remove()
    }
  }, [companies, cols])

  useEffect(() => {
    if (!svgRef.current) return
    d3.select(svgRef.current).selectAll('.bubble')
      .attr('stroke',       d => selected.has(d.ticker) ? '#ffffff' : 'transparent')
      .attr('stroke-width', d => selected.has(d.ticker) ? 3.5 : 0)
      .attr('opacity',      d => selected.has(d.ticker) ? 1 : blocked.has(d.ticker) ? 0.2 : 0.72)
      .style('cursor',      d => blocked.has(d.ticker) ? 'not-allowed' : 'pointer')
  }, [selected, blocked])

  return (
    <div ref={containerRef} className="bubble-container">
      <div className="bubble-scroll" style={cols !== 4 ? { minWidth: 0 } : undefined}>
        <svg ref={svgRef} />
      </div>
    </div>
  )
}

import styles from './EloChart.module.css'

interface EloChartProps {
  historial: number[]
  fechas?: (string | null)[]
}

function formatFecha(fecha: string): string {
  const [, m, d] = fecha.split('-')
  return `${d}/${m}`
}

export function EloChart({ historial, fechas }: EloChartProps) {
  if (historial.length < 2) return null

  const width = 290
  const height = 130
  const padLeft = 40
  const padRight = 20
  const padTop = 16
  const padBottom = 42

  const min = Math.min(...historial)
  const max = Math.max(...historial)
  const range = max - min || 1

  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  const points = historial.map((val, i) => ({
    x: padLeft + (i / (historial.length - 1)) * chartW,
    y: padTop + chartH - ((val - min) / range) * chartH,
    val,
    fecha: fechas?.[i] ?? null,
  }))

  const yTicks = [min, Math.round((min + max) / 2), max]
  if (yTicks[0] === yTicks[1]) yTicks.splice(1, 1)
  if (yTicks[yTicks.length - 1] === yTicks[yTicks.length - 2]) yTicks.pop()

  const baselineY = padTop + chartH

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Elo: ${historial.join(', ')}`}
    >
      <text
        x={10}
        y={padTop + chartH / 2}
        className={styles.axisTitle}
        transform={`rotate(-90, 10, ${padTop + chartH / 2})`}
      >
        Elo
      </text>

      <text
        x={padLeft + chartW / 2}
        y={height - 4}
        className={styles.axisTitle}
      >
        Fecha
      </text>

      {yTicks.map((tick) => {
        const y = padTop + chartH - ((tick - min) / range) * chartH
        return (
          <g key={tick}>
            <line x1={padLeft} x2={width - padRight} y1={y} y2={y} className={styles.gridLine} />
            <text x={padLeft - 4} y={y + 3} className={styles.yLabel}>{tick}</text>
          </g>
        )
      })}

      <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} className={styles.line} />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} className={styles.dot} />
          <text x={p.x} y={p.y - 8} className={styles.valLabel}>{p.val}</text>
          {p.fecha && (
            <text x={p.x} y={baselineY + 14} className={styles.xLabel}>
              {formatFecha(p.fecha)}
            </text>
          )}
        </g>
      ))}

      {points.map((p, i) => {
        if (i === 0) return null
        const diff = p.val - points[i - 1].val
        if (diff === 0) return null
        return (
          <text
            key={`d${i}`}
            x={(p.x + points[i - 1].x) / 2}
            y={Math.min(p.y, points[i - 1].y) - 2}
            className={diff > 0 ? styles.diffUp : styles.diffDown}
          >
            {diff > 0 ? `+${diff}` : diff}
          </text>
        )
      })}
    </svg>
  )
}

'use client'

interface MiniChartProps {
  data: number[]
  color: string
  type: 'bar' | 'line'
  labels?: string[]
}

export default function MiniChart({ data, color, type, labels }: MiniChartProps) {
  if (!data.length) return null

  const max = Math.max(...data, 1)
  const width = 200
  const height = 64
  const padding = 4
  const barWidth = Math.max(4, (width - padding * 2) / data.length - 4)

  if (type === 'bar') {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-16"
        preserveAspectRatio="none"
        role="img"
        aria-label={labels ? `Gráfico: ${labels.join(', ')}` : 'Gráfico de barras'}
      >
        {data.map((val, i) => {
          const barHeight = Math.max(2, (val / max) * (height - padding * 2))
          const x = padding + i * ((width - padding * 2) / data.length) + 2
          const y = height - padding - barHeight
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              fill={color}
              opacity={0.7 + (val / max) * 0.3}
            >
              <title>{labels?.[i] ? `${labels[i]}: ${val}` : `${val}`}</title>
            </rect>
          )
        })}
      </svg>
    )
  }

  // Line chart with area fill
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const points = data.map((val, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding + chartHeight - (val / max) * chartHeight,
  }))

  // Build smooth curve using bezier
  const buildPath = () => {
    if (points.length < 2) return ''
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i]
      const next = points[i + 1]
      const cpx1 = curr.x + (next.x - curr.x) * 0.4
      const cpx2 = next.x - (next.x - curr.x) * 0.4
      d += ` C ${cpx1} ${curr.y}, ${cpx2} ${next.y}, ${next.x} ${next.y}`
    }
    return d
  }

  // Build area path
  const buildAreaPath = () => {
    const linePath = buildPath()
    if (!linePath) return ''
    const lastPoint = points[points.length - 1]
    const firstPoint = points[0]
    return `${linePath} L ${lastPoint.x} ${height - padding} L ${firstPoint.x} ${height - padding} Z`
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-16"
      preserveAspectRatio="none"
      role="img"
      aria-label={labels ? `Gráfico: ${labels.join(', ')}` : 'Gráfico de línea'}
    >
      {/* Area fill */}
      <path
        d={buildAreaPath()}
        fill={color}
        opacity={0.15}
      />
      {/* Line */}
      <path
        d={buildPath()}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="white"
          stroke={color}
          strokeWidth={2}
        >
          <title>{labels?.[i] ? `${labels[i]}: ${data[i]}` : `${data[i]}`}</title>
        </circle>
      ))}
    </svg>
  )
}

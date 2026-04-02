import React from 'react'
import { format, parseISO } from 'date-fns'
import type { BooleanConfig, ChartDataPoint } from '../../types'

interface Props {
  data: ChartDataPoint[]
  config: BooleanConfig
}

export default function BooleanChart({ data, config }: Props): React.ReactElement {
  const filtered = data.filter((d) => d.value !== null && d.value !== '')

  if (filtered.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
        No data in selected range
      </div>
    )
  }

  const yesLabel = config.labelYes ?? 'Yes'
  const noLabel = config.labelNo ?? 'No'
  const yesCount = filtered.filter((d) => d.value === 'true').length
  const pct = Math.round((yesCount / filtered.length) * 100)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          <span className="text-gray-700 dark:text-gray-300">{yesLabel}: {yesCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          <span className="text-gray-700 dark:text-gray-300">{noLabel}: {filtered.length - yesCount}</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400">{pct}% {yesLabel}</div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Dot strip */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {filtered.map((d) => (
          <div
            key={d.date}
            title={`${format(parseISO(d.date), 'MMM d, yyyy')}: ${d.value === 'true' ? yesLabel : noLabel}`}
            className={`w-5 h-5 rounded-sm cursor-default transition-transform hover:scale-125 ${
              d.value === 'true'
                ? 'bg-green-500'
                : 'bg-red-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

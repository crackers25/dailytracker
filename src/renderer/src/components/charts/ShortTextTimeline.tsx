import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { ChartDataPoint } from '../../types'

export default function ShortTextTimeline({ data }: { data: ChartDataPoint[] }): React.ReactElement {
  const [tooltip, setTooltip] = useState<{ text: string; date: string } | null>(null)

  const filtered = data.filter((d) => d.value !== null && d.value !== '')

  if (filtered.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
        No entries in selected range
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tooltip && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
          {format(parseISO(tooltip.date), 'MMM d, yyyy')}: <span className="text-gray-800 dark:text-gray-200 not-italic font-medium">{tooltip.text}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pb-2">
        {filtered.map((d) => (
          <span
            key={d.date}
            className="inline-flex flex-col items-start bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-950 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 rounded-lg px-2.5 py-1.5 cursor-default transition-colors"
            onMouseEnter={() => setTooltip({ text: String(d.value), date: d.date })}
            onMouseLeave={() => setTooltip(null)}
          >
            <span className="text-xs text-gray-400 dark:text-gray-500 leading-none mb-0.5">
              {format(parseISO(d.date), 'M/d')}
            </span>
            <span className="text-sm text-gray-800 dark:text-gray-200 max-w-32 truncate">
              {String(d.value)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

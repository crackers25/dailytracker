import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { ChartDataPoint } from '../../types'

export default function LongTextFeed({ data }: { data: ChartDataPoint[] }): React.ReactElement {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const filtered = data.filter((d) => d.value !== null && d.value !== '')

  if (filtered.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
        No entries in selected range
      </div>
    )
  }

  const toggle = (date: string): void =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {filtered.map((d) => {
        const text = String(d.value)
        const isLong = text.length > 200
        const isOpen = expanded.has(d.date)

        return (
          <div key={d.date} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
              {format(parseISO(d.date), 'EEEE, MMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {isLong && !isOpen ? text.slice(0, 200) + '…' : text}
            </p>
            {isLong && (
              <button
                onClick={() => toggle(d.date)}
                className="text-xs text-primary-600 hover:underline mt-1"
              >
                {isOpen ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

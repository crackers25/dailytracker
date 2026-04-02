import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import type { DurationConfig, ChartDataPoint } from '../../types'

function parseMinutes(value: string, unit: string): number {
  if (unit === 'hms') {
    const [h, m] = value.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  return Number(value) || 0
}

function formatTick(minutes: number): string {
  if (minutes >= 60) return `${Math.round(minutes / 60)}h`
  return `${minutes}m`
}

const CustomTooltip = ({
  active,
  payload,
  label,
  unit
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
}): React.ReactElement | null => {
  if (!active || !payload?.length) return null
  const mins = payload[0].value
  const display = unit === 'hms'
    ? `${Math.floor(mins / 60)}h ${mins % 60}m`
    : `${mins} min`
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500 text-xs mb-1">{label ? format(parseISO(label), 'MMM d, yyyy') : ''}</p>
      <p className="font-semibold">{display}</p>
    </div>
  )
}

export default function DurationChart({ data, config }: { data: ChartDataPoint[]; config: DurationConfig }): React.ReactElement {
  const chartData = data
    .filter((d) => d.value !== null && d.value !== '')
    .map((d) => ({ date: d.date, value: parseMinutes(String(d.value), config.unit) }))

  if (chartData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">No data in selected range</div>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="date" tickFormatter={(d: string) => format(parseISO(d), 'M/d')} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatTick} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={35} />
        <Tooltip content={<CustomTooltip unit={config.unit} />} />
        <Bar dataKey="value" fill="#f59e0b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

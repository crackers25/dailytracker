import React from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import type { ChartDataPoint } from '../../types'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

const CustomTooltip = ({
  active,
  payload
}: {
  active?: boolean
  payload?: Array<{ payload: { date: string; minutes: number } }>
}): React.ReactElement | null => {
  if (!active || !payload?.length) return null
  const { date, minutes } = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500 text-xs mb-1">{format(parseISO(date), 'MMM d, yyyy')}</p>
      <p className="font-semibold">{minutesToTime(minutes)}</p>
    </div>
  )
}

export default function TimeOfDayChart({ data }: { data: ChartDataPoint[] }): React.ReactElement {
  const chartData = data
    .filter((d) => d.value !== null && d.value !== '')
    .map((d, i) => ({ date: d.date, x: i, minutes: timeToMinutes(String(d.value)) }))

  if (chartData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">No data in selected range</div>
  }

  const yTicks = [0, 360, 720, 1080, 1440]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="x"
          type="number"
          domain={[0, chartData.length - 1]}
          tickFormatter={(i: number) => chartData[i] ? format(parseISO(chartData[i].date), 'M/d') : ''}
          ticks={chartData.map((_, i) => i)}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="minutes"
          type="number"
          domain={[0, 1440]}
          ticks={yTicks}
          tickFormatter={minutesToTime}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={chartData} fill="#10b981" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

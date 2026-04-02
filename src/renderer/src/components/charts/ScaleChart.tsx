import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { ScaleConfig, ChartDataPoint } from '../../types'

interface Props {
  data: ChartDataPoint[]
  config: ScaleConfig
  name: string
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
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      <p className="font-semibold text-gray-900 dark:text-gray-100">
        {payload[0].value}{unit ? ` ${unit}` : ''}
      </p>
    </div>
  )
}

export default function ScaleChart({ data, config, name }: Props): React.ReactElement {
  const chartData = data
    .filter((d) => d.value !== null && d.value !== '')
    .map((d) => ({ date: d.date, value: Number(d.value) }))

  if (chartData.length === 0) {
    return <EmptyChart />
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => format(parseISO(d), 'M/d')}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[config.min ?? 0, config.max ?? 10]}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip unit={config.unit} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          fill={`url(#grad-${name})`}
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function EmptyChart(): React.ReactElement {
  return (
    <div className="h-48 flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
      No data in selected range
    </div>
  )
}

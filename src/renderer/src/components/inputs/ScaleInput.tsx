import React from 'react'
import type { ScaleConfig } from '../../types'

interface Props {
  config: ScaleConfig
  value: string
  onChange: (v: string) => void
}

export default function ScaleInput({ config, value, onChange }: Props): React.ReactElement {
  const min = config.min ?? 0
  const max = config.max ?? 10
  const step = config.step ?? 1
  const numVal = value !== '' ? Number(value) : Math.round((min + max) / 2)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numVal}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-primary-600"
        />
        <span className="w-16 text-center font-mono font-semibold text-lg text-primary-600 dark:text-primary-400">
          {numVal}
          {config.unit ? ` ${config.unit}` : ''}
        </span>
      </div>
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
        <span>{min}{config.unit ? ` ${config.unit}` : ''}</span>
        <span>{max}{config.unit ? ` ${config.unit}` : ''}</span>
      </div>
    </div>
  )
}

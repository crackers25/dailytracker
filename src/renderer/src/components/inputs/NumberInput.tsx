import React from 'react'
import type { NumberConfig } from '../../types'

interface Props {
  config: NumberConfig
  value: string
  onChange: (v: string) => void
}

export default function NumberInput({ config, value, onChange }: Props): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="input flex-1"
        placeholder="Enter a number"
        value={value}
        min={config.min}
        max={config.max}
        onChange={(e) => onChange(e.target.value)}
      />
      {config.unit && (
        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 font-medium">
          {config.unit}
        </span>
      )}
    </div>
  )
}

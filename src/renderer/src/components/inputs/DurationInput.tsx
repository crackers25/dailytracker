import React from 'react'
import type { DurationConfig } from '../../types'

interface Props {
  config: DurationConfig
  value: string
  onChange: (v: string) => void
}

export default function DurationInput({ config, value, onChange }: Props): React.ReactElement {
  if (config.unit === 'hms') {
    // value stored as "H:MM" — parse into hours and minutes
    const [hStr, mStr] = value ? value.split(':') : ['0', '00']
    const hours = parseInt(hStr || '0', 10)
    const minutes = parseInt(mStr || '0', 10)

    const update = (h: number, m: number): void => {
      onChange(`${h}:${String(m).padStart(2, '0')}`)
    }

    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="input w-20 text-center"
          min={0}
          value={hours}
          onChange={(e) => update(Math.max(0, parseInt(e.target.value || '0', 10)), minutes)}
          placeholder="0"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">hr</span>
        <input
          type="number"
          className="input w-20 text-center"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => update(hours, Math.min(59, Math.max(0, parseInt(e.target.value || '0', 10))))}
          placeholder="0"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">min</span>
      </div>
    )
  }

  // minutes only
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="input w-32"
        placeholder="0"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">minutes</span>
    </div>
  )
}

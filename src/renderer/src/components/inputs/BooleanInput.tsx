import React from 'react'
import type { BooleanConfig } from '../../types'

interface Props {
  config: BooleanConfig
  value: string
  onChange: (v: string) => void
}

export default function BooleanInput({ config, value, onChange }: Props): React.ReactElement {
  const labelYes = config.labelYes ?? 'Yes'
  const labelNo = config.labelNo ?? 'No'
  const current = value === 'true' ? 'true' : value === 'false' ? 'false' : null

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange('true')}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
          current === 'true'
            ? 'bg-green-500 border-green-500 text-white shadow-md'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700'
        }`}
      >
        {labelYes}
      </button>
      <button
        type="button"
        onClick={() => onChange('false')}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
          current === 'false'
            ? 'bg-red-500 border-red-500 text-white shadow-md'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700'
        }`}
      >
        {labelNo}
      </button>
    </div>
  )
}

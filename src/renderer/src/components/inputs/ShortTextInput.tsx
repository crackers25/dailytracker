import React from 'react'
import type { TextConfig } from '../../types'

interface Props {
  config: TextConfig
  value: string
  onChange: (v: string) => void
}

export default function ShortTextInput({ config, value, onChange }: Props): React.ReactElement {
  return (
    <input
      type="text"
      className="input"
      placeholder={config.placeholder ?? 'Enter text…'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

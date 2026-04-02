import React from 'react'
import type { TextConfig } from '../../types'

interface Props {
  config: TextConfig
  value: string
  onChange: (v: string) => void
}

export default function LongTextInput({ config, value, onChange }: Props): React.ReactElement {
  return (
    <textarea
      className="input resize-none"
      rows={5}
      placeholder={config.placeholder ?? 'Write your notes here…'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

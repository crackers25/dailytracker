import React from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function TimeOfDayInput({ value, onChange }: Props): React.ReactElement {
  return (
    <input
      type="time"
      className="input w-48"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

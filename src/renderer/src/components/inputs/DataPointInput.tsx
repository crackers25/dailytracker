import React from 'react'
import type { DataPoint } from '../../types'
import ScaleInput from './ScaleInput'
import BooleanInput from './BooleanInput'
import NumberInput from './NumberInput'
import TimeOfDayInput from './TimeOfDayInput'
import DurationInput from './DurationInput'
import ShortTextInput from './ShortTextInput'
import LongTextInput from './LongTextInput'

interface Props {
  dataPoint: DataPoint
  value: string
  onChange: (v: string) => void
}

export default function DataPointInput({ dataPoint, value, onChange }: Props): React.ReactElement {
  const { type, config } = dataPoint

  switch (type) {
    case 'scale':
      return <ScaleInput config={config as never ?? { min: 0, max: 10, step: 1 }} value={value} onChange={onChange} />
    case 'boolean':
      return <BooleanInput config={config as never ?? {}} value={value} onChange={onChange} />
    case 'number':
      return <NumberInput config={config as never ?? {}} value={value} onChange={onChange} />
    case 'time_of_day':
      return <TimeOfDayInput value={value} onChange={onChange} />
    case 'duration':
      return <DurationInput config={config as never ?? { unit: 'minutes' }} value={value} onChange={onChange} />
    case 'short_text':
      return <ShortTextInput config={config as never ?? {}} value={value} onChange={onChange} />
    case 'long_text':
      return <LongTextInput config={config as never ?? {}} value={value} onChange={onChange} />
    default:
      return <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
  }
}

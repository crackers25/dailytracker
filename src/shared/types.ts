// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  createdAt: string
}

export interface Tracker {
  id: number
  userId: number
  title: string
  description: string | null
  startDate: string // 'YYYY-MM-DD'
  createdAt: string
}

export type DataPointType =
  | 'scale'
  | 'boolean'
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'time_of_day'
  | 'duration'

export interface ScaleConfig {
  min: number
  max: number
  step: number
  unit?: string
}

export interface BooleanConfig {
  labelYes?: string
  labelNo?: string
}

export interface TextConfig {
  placeholder?: string
}

export interface NumberConfig {
  unit?: string
  min?: number
  max?: number
}

export interface TimeOfDayConfig {
  label?: string
}

export interface DurationConfig {
  unit: 'minutes' | 'hms'
}

export type DataPointConfig =
  | ScaleConfig
  | BooleanConfig
  | TextConfig
  | NumberConfig
  | TimeOfDayConfig
  | DurationConfig

export interface DataPoint {
  id: number
  trackerId: number
  name: string
  type: DataPointType
  config: DataPointConfig | null
  displayOrder: number
}

export interface Record {
  id: number
  trackerId: number
  date: string // 'YYYY-MM-DD'
  createdAt: string
  updatedAt: string
}

export interface RecordValue {
  id: number
  recordId: number
  dataPointId: number
  value: string // JSON-stringified
}

export interface RecordWithValues extends Record {
  values: RecordValue[]
}

// ─── IPC Payload Types ────────────────────────────────────────────────────────

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
}

export interface CreateTrackerPayload {
  title: string
  description?: string
  startDate: string
}

export interface UpdateTrackerPayload {
  id: number
  title?: string
  description?: string
  startDate?: string
}

export interface CreateDataPointPayload {
  trackerId: number
  name: string
  type: DataPointType
  config?: DataPointConfig
  displayOrder?: number
}

export interface UpdateDataPointPayload {
  id: number
  name?: string
  type?: DataPointType
  config?: DataPointConfig
  displayOrder?: number
}

export interface UpsertRecordPayload {
  trackerId: number
  date: string
  values: { dataPointId: number; value: string }[]
}

export interface ExportPDFPayload {
  trackerId: number
  startDate: string
  endDate: string
}

// ─── Chart Data ───────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  date: string
  value: string | number | boolean | null
  displayValue: string
}

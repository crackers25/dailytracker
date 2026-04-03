import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/ui/Layout'
import type { DataPoint, DataPointConfig, DataPointType, Tracker } from '../types'
import { format } from 'date-fns'

const DATA_POINT_TYPES: { value: DataPointType; label: string; description: string }[] = [
  { value: 'scale', label: 'Sliding Scale', description: 'A draggable slider (e.g. 0–10 pain scale)' },
  { value: 'boolean', label: 'Yes / No', description: 'A simple yes or no toggle' },
  { value: 'number', label: 'Number', description: 'A numeric value with optional unit' },
  { value: 'time_of_day', label: 'Time of Day', description: 'A specific time (e.g. 10:30 AM)' },
  { value: 'duration', label: 'Duration', description: 'An elapsed time (e.g. 45 min)' },
  { value: 'short_text', label: 'Short Text', description: 'A single-line text entry' },
  { value: 'long_text', label: 'Long Text / Journal', description: 'A multi-line text entry' }
]

interface DraftDataPoint {
  id?: number
  name: string
  type: DataPointType
  config: Record<string, unknown>
  isNew?: boolean
  hasValues?: boolean
}

export default function CreateEditTracker(): React.ReactElement {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)!
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dataPoints, setDataPoints] = useState<DraftDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'info' | 'datapoints'>('info')

  // Drag-and-drop state
  const dragIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isEdit || !id) return
    setLoading(true)
    Promise.all([
      window.api.trackers.get(Number(id)),
      window.api.dataPoints.list(Number(id))
    ]).then(([trackerRes, dpRes]) => {
      const t = trackerRes.tracker as Tracker
      setTitle(t.title)
      setDescription(t.description ?? '')
      setStartDate(t.startDate)
      if (dpRes.dataPoints) {
        setDataPoints(
          (dpRes.dataPoints as (DataPoint & { hasValues?: boolean })[]).map((dp) => ({
            id: dp.id,
            name: dp.name,
            type: dp.type,
            config: (dp.config as Record<string, unknown>) ?? {},
            hasValues: dp.hasValues ?? false
          }))
        )
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) return setError('Title is required')
    setSaving(true)
    setError(null)

    try {
      let trackerId = id ? Number(id) : null

      if (!isEdit) {
        const result = await window.api.trackers.create(
          user.id,
          title.trim(),
          description.trim() || null,
          startDate
        )
        if (result.error) return setError(result.error)
        trackerId = (result.tracker as Tracker).id
      } else {
        const result = await window.api.trackers.update(Number(id), {
          title: title.trim(),
          description: description.trim() || null,
          startDate
        })
        if (result.error) return setError(result.error)
      }

      if (!trackerId) return

      // Save data points
      for (let i = 0; i < dataPoints.length; i++) {
        const dp = dataPoints[i]
        const config = Object.keys(dp.config).length ? (dp.config as DataPointConfig) : null
        if (dp.isNew || !dp.id) {
          await window.api.dataPoints.create(trackerId, dp.name, dp.type, config, i)
        } else {
          await window.api.dataPoints.update(dp.id, { name: dp.name, type: dp.type, config, displayOrder: i })
        }
      }

      navigate(`/tracker/${trackerId}`)
    } finally {
      setSaving(false)
    }
  }

  const addDataPoint = (): void => {
    setDataPoints((prev) => [
      ...prev,
      { name: '', type: 'scale', config: { min: 0, max: 10, step: 1 }, isNew: true }
    ])
  }

  const removeDataPoint = async (index: number): Promise<void> => {
    const dp = dataPoints[index]
    if (dp.id && !dp.isNew && dp.hasValues) {
      const ok = window.confirm(
        `"${dp.name}" has existing recorded data. Deleting it will permanently remove all values for this field. This cannot be undone. Continue?`
      )
      if (!ok) return
    }
    if (dp.id && !dp.isNew) {
      await window.api.dataPoints.delete(dp.id)
    }
    setDataPoints((prev) => prev.filter((_, i) => i !== index))
  }

  const updateDataPoint = (index: number, updates: Partial<DraftDataPoint>): void => {
    setDataPoints((prev) =>
      prev.map((dp, i) => {
        if (i !== index) return dp
        const next = { ...dp, ...updates }
        if (updates.type && updates.type !== dp.type) {
          next.config = defaultConfig(updates.type)
        }
        return next
      })
    )
  }

  // Drag handlers
  const handleDragStart = (index: number): void => {
    dragIndex.current = index
  }

  const handleDragOver = (e: React.DragEvent, overIndex: number): void => {
    e.preventDefault()
    setDragOverIndex(overIndex)
    const from = dragIndex.current
    if (from === null || from === overIndex) return
    dragIndex.current = overIndex
    setDataPoints((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(overIndex, 0, item)
      return next
    })
  }

  const handleDragEnd = (): void => {
    dragIndex.current = null
    setDragOverIndex(null)
  }

  if (loading) {
    return (
      <Layout title={isEdit ? 'Edit Tracker' : 'New Tracker'} backTo="/">
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      </Layout>
    )
  }

  return (
    <Layout title={isEdit ? 'Edit Tracker' : 'New Tracker'} backTo="/">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setStep('info')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              step === 'info'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            1. Tracker Info
          </button>
          <button
            onClick={() => setStep('datapoints')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              step === 'datapoints'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            2. Data Points {dataPoints.length > 0 && `(${dataPoints.length})`}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {step === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Medication Log, Sleep Tracker, Exercise Log"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Optional: what are you tracking and why?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('datapoints')} className="btn-primary flex-1">
                Next: Add Data Points →
              </button>
            </div>
          </div>
        )}

        {step === 'datapoints' && (
          <div className="space-y-4">
            {dataPoints.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  No data points yet. Add things you want to track each day.
                </p>
                <button onClick={addDataPoint} className="btn-secondary">
                  + Add first data point
                </button>
              </div>
            )}

            {dataPoints.map((dp, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${dragOverIndex === i && dragIndex.current !== i ? 'opacity-50' : 'opacity-100'}`}
              >
                <DataPointEditor
                  dp={dp}
                  onChange={(updates) => updateDataPoint(i, updates)}
                  onRemove={() => removeDataPoint(i)}
                />
              </div>
            ))}

            {dataPoints.length > 0 && (
              <button onClick={addDataPoint} className="btn-secondary w-full">
                + Add data point
              </button>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('info')} className="btn-secondary flex-1">
                ← Back
              </button>
              <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Tracker'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function defaultConfig(type: DataPointType): Record<string, unknown> {
  switch (type) {
    case 'scale': return { min: 0, max: 10, step: 1 }
    case 'boolean': return { labelYes: 'Yes', labelNo: 'No' }
    case 'number': return { unit: '' }
    case 'time_of_day': return {}
    case 'duration': return { unit: 'minutes' }
    case 'short_text': return { placeholder: '' }
    case 'long_text': return { placeholder: '' }
    default: return {}
  }
}

function DataPointEditor({
  dp,
  onChange,
  onRemove
}: {
  dp: DraftDataPoint
  onChange: (updates: Partial<DraftDataPoint>) => void
  onRemove: () => void
}): React.ReactElement {
  const typeInfo = DATA_POINT_TYPES.find((t) => t.value === dp.type)
  const typeLocked = !dp.isNew && !!dp.hasValues

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div
          className="shrink-0 mt-6 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400"
          title="Drag to reorder"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Pain level, Took medication, Notes"
                value={dp.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </div>
            <div className="w-52">
              <label className="label">Type</label>
              <select
                className={`input ${typeLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={dp.type}
                disabled={typeLocked}
                onChange={(e) => onChange({ type: e.target.value as DataPointType })}
                title={typeLocked ? 'Type cannot be changed after data has been recorded' : undefined}
              >
                {DATA_POINT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {typeLocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Type locked — data exists
                </p>
              )}
            </div>
          </div>

          {typeInfo && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{typeInfo.description}</p>
          )}

          <DataPointConfigEditor type={dp.type} config={dp.config} onChange={(c) => onChange({ config: c })} />
        </div>

        <button onClick={onRemove} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shrink-0 mt-5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function DataPointConfigEditor({
  type,
  config,
  onChange
}: {
  type: DataPointType
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}): React.ReactElement | null {
  const set = (key: string, value: unknown): void => onChange({ ...config, [key]: value })

  switch (type) {
    case 'scale':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label text-xs">Min</label>
              <input type="number" className="input" value={String(config.min ?? 0)} onChange={(e) => set('min', Number(e.target.value))} />
            </div>
            <div>
              <label className="label text-xs">Max</label>
              <input type="number" className="input" value={String(config.max ?? 10)} onChange={(e) => set('max', Number(e.target.value))} />
            </div>
            <div>
              <label className="label text-xs">Unit (optional)</label>
              <input type="text" className="input" placeholder="e.g. kg" value={String(config.unit ?? '')} onChange={(e) => set('unit', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label text-xs">Hint text (optional)</label>
            <input type="text" className="input" placeholder="e.g. Rate your pain from 0 (none) to 10 (severe)" value={String(config.hint ?? '')} onChange={(e) => set('hint', e.target.value)} />
          </div>
        </div>
      )
    case 'boolean':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Yes label</label>
              <input type="text" className="input" value={String(config.labelYes ?? 'Yes')} onChange={(e) => set('labelYes', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">No label</label>
              <input type="text" className="input" value={String(config.labelNo ?? 'No')} onChange={(e) => set('labelNo', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label text-xs">Hint text (optional)</label>
            <input type="text" className="input" placeholder="e.g. Did you take your medication today?" value={String(config.hint ?? '')} onChange={(e) => set('hint', e.target.value)} />
          </div>
        </div>
      )
    case 'number':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label text-xs">Unit (optional)</label>
              <input type="text" className="input" placeholder="e.g. mg, lbs" value={String(config.unit ?? '')} onChange={(e) => set('unit', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Min (optional)</label>
              <input type="number" className="input" value={String(config.min ?? '')} onChange={(e) => set('min', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="label text-xs">Max (optional)</label>
              <input type="number" className="input" value={String(config.max ?? '')} onChange={(e) => set('max', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
          <div>
            <label className="label text-xs">Hint text (optional)</label>
            <input type="text" className="input" placeholder="e.g. Enter your weight in pounds" value={String(config.hint ?? '')} onChange={(e) => set('hint', e.target.value)} />
          </div>
        </div>
      )
    case 'time_of_day':
      return (
        <div>
          <label className="label text-xs">Hint text (optional)</label>
          <input type="text" className="input" placeholder="e.g. What time did you wake up?" value={String(config.hint ?? '')} onChange={(e) => set('hint', e.target.value)} />
        </div>
      )
    case 'duration':
      return (
        <div className="space-y-2">
          <div className="w-40">
            <label className="label text-xs">Format</label>
            <select className="input" value={String(config.unit ?? 'minutes')} onChange={(e) => set('unit', e.target.value)}>
              <option value="minutes">Minutes (e.g. 45)</option>
              <option value="hms">Hours:Minutes</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Hint text (optional)</label>
            <input type="text" className="input" placeholder="e.g. How long did you sleep?" value={String(config.hint ?? '')} onChange={(e) => set('hint', e.target.value)} />
          </div>
        </div>
      )
    case 'short_text':
    case 'long_text':
      return (
        <div className="space-y-2">
          <div>
            <label className="label text-xs">Placeholder text (optional)</label>
            <input type="text" className="input" placeholder="Hint text shown inside the input field" value={String(config.placeholder ?? '')} onChange={(e) => set('placeholder', e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Hint text (optional)</label>
            <input type="text" className="input" placeholder="Helper text shown below the input" value={String(config.hint ?? '')} onChange={(e) => set('hint', e.target.value)} />
          </div>
        </div>
      )
    default:
      return null
  }
}

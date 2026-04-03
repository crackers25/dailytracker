import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import DataPointInput from '../components/inputs/DataPointInput'
import type { DataPoint, RecordValue } from '../types'
import { format, parseISO } from 'date-fns'

export default function AddEditRecord(): React.ReactElement {
  const { id, date } = useParams<{ id: string; date: string }>()
  const navigate = useNavigate()
  const trackerId = Number(id)

  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [values, setValues] = useState<Record<number, string>>({})
  const [selectedDate, setSelectedDate] = useState(date ?? format(new Date(), 'yyyy-MM-dd'))
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (forDate: string): Promise<void> => {
    setLoading(true)
    const [dpRes, recordRes] = await Promise.all([
      window.api.dataPoints.list(trackerId),
      window.api.records.getByDate(trackerId, forDate)
    ])

    const dps = (dpRes.dataPoints ?? []) as DataPoint[]
    setDataPoints(dps)

    // Default all values to '' (blank / not recorded)
    const initialValues: Record<number, string> = {}
    dps.forEach((dp) => {
      initialValues[dp.id] = ''
    })

    if (recordRes.record && recordRes.values) {
      setIsEdit(true)
      ;(recordRes.values as RecordValue[]).forEach((rv) => {
        initialValues[rv.dataPointId] = rv.value
      })
    } else {
      setIsEdit(false)
    }

    setValues(initialValues)
    setLoading(false)
  }

  useEffect(() => {
    loadData(selectedDate)
  }, [trackerId])

  const handleDateChange = async (newDate: string): Promise<void> => {
    setSelectedDate(newDate)
    await loadData(newDate)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      // Only save non-blank values
      const payload = Object.entries(values)
        .filter(([, v]) => v !== '')
        .map(([dpId, value]) => ({
          dataPointId: Number(dpId),
          value
        }))
      const result = await window.api.records.upsert(trackerId, selectedDate, payload)
      if (result.error) {
        setError(result.error)
      } else {
        navigate(`/tracker/${trackerId}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const updateValue = (dataPointId: number, value: string): void => {
    setValues((prev) => ({ ...prev, [dataPointId]: value }))
  }

  return (
    <Layout
      title={isEdit ? 'Edit Record' : 'Add Record'}
      backTo={`/tracker/${trackerId}`}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Date selector */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-5">
              {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
          {isEdit && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              Editing existing record for this date
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : dataPoints.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm mb-4">This tracker has no data points yet.</p>
            <button
              onClick={() => navigate(`/tracker/${trackerId}/edit`)}
              className="btn-secondary"
            >
              Add data points
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {dataPoints.map((dp) => {
                const val = values[dp.id] ?? ''
                const hint = (dp.config as Record<string, unknown> | null)?.hint as string | undefined
                  ?? (dp.config as Record<string, unknown> | null)?.placeholder as string | undefined
                return (
                  <div key={dp.id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <label className="label text-sm mb-0">{dp.name}</label>
                      {val !== '' && (
                        <button
                          type="button"
                          onClick={() => updateValue(dp.id, '')}
                          title="Clear value"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 -mt-0.5 ml-2 shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <DataPointInput
                      dataPoint={dp}
                      value={val}
                      onChange={(v) => updateValue(dp.id, v)}
                    />
                    {hint && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{hint}</p>
                    )}
                    {val === '' && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 italic">Not recorded</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => navigate(`/tracker/${trackerId}`)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

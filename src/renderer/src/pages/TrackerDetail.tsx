import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import type { Record as DailyRecord, Tracker, DataPoint, RecordValue } from '../types'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  addMonths,
  subMonths
} from 'date-fns'

type TabType = 'calendar' | 'list'

export default function TrackerDetail(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const trackerId = Number(id)

  const [tracker, setTracker] = useState<Tracker | null>(null)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [recordDates, setRecordDates] = useState<Set<string>>(new Set())
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [tab, setTab] = useState<TabType>('calendar')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const today = format(new Date(), 'yyyy-MM-dd')

  const loadData = async (): Promise<void> => {
    const [trackerRes, dpRes, datesRes, recordsRes] = await Promise.all([
      window.api.trackers.get(trackerId),
      window.api.dataPoints.list(trackerId),
      window.api.records.listDates(trackerId),
      window.api.records.list(trackerId)
    ])
    if (trackerRes.tracker) setTracker(trackerRes.tracker as Tracker)
    if (dpRes.dataPoints) setDataPoints(dpRes.dataPoints as DataPoint[])
    if (datesRes.dates) setRecordDates(new Set(datesRes.dates as string[]))
    if (recordsRes.records) setRecords(recordsRes.records as DailyRecord[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [trackerId])

  const handleDayClick = (date: string): void => {
    navigate(`/tracker/${trackerId}/record/${date}`)
  }

  if (loading || !tracker) {
    return (
      <Layout title="Tracker" backTo="/">
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      </Layout>
    )
  }

  const todayHasRecord = recordDates.has(today)

  return (
    <Layout
      title={tracker.title}
      backTo="/"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/tracker/${trackerId}/visualize`)}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Charts
          </button>
          <button
            onClick={() => navigate(`/tracker/${trackerId}/record/${today}`)}
            className="btn-primary text-xs px-3 py-1.5"
          >
            {todayHasRecord ? 'Edit Today' : '+ Add Record'}
          </button>
        </div>
      }
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tracker info */}
        {tracker.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tracker.description}</p>
        )}
        <div className="flex items-center gap-4 mb-6 text-xs text-gray-400 dark:text-gray-500">
          <span>Started {format(parseISO(tracker.startDate), 'MMM d, yyyy')}</span>
          <span>·</span>
          <span>{recordDates.size} record{recordDates.size !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{dataPoints.length} data point{dataPoints.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['calendar', 'list'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
                tab === t
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t === 'calendar' ? 'Calendar' : 'List'}
            </button>
          ))}
        </div>

        {tab === 'calendar' && (
          <CalendarView
            month={calendarMonth}
            recordDates={recordDates}
            startDate={tracker.startDate}
            onMonthChange={setCalendarMonth}
            onDayClick={handleDayClick}
          />
        )}

        {tab === 'list' && (
          <ListView
            records={records}
            dataPoints={dataPoints}
            trackerId={trackerId}
            onRecordClick={(date) => navigate(`/tracker/${trackerId}/record/${date}`)}
          />
        )}
      </div>
    </Layout>
  )
}

// ─── Calendar View ─────────────────────────────────────────────────────────────

function CalendarView({
  month,
  recordDates,
  startDate,
  onMonthChange,
  onDayClick
}: {
  month: Date
  recordDates: Set<string>
  startDate: string
  onMonthChange: (m: Date) => void
  onDayClick: (date: string) => void
}): React.ReactElement {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })
  const firstDayOfWeek = getDay(start) // 0=Sun

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="card p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="btn-ghost p-1.5 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-sm">{format(month, 'MMMM yyyy')}</span>
        <button
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="btn-ghost p-1.5 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasRecord = recordDates.has(dateStr)
          const isCurrentDay = dateStr === today
          const isBeforeStart = dateStr < startDate

          return (
            <button
              key={dateStr}
              onClick={() => !isBeforeStart && onDayClick(dateStr)}
              disabled={isBeforeStart}
              className={`
                relative flex flex-col items-center py-2 rounded-lg mx-0.5 my-0.5 transition-colors text-sm
                ${isBeforeStart ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'}
                ${isCurrentDay ? 'font-bold' : ''}
                ${!isSameMonth(day, month) ? 'opacity-30' : ''}
              `}
            >
              <span
                className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm
                  ${isCurrentDay ? 'bg-primary-600 text-white' : ''}
                `}
              >
                {format(day, 'd')}
              </span>
              {hasRecord && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isCurrentDay ? 'bg-white' : 'bg-primary-500'}`} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
        <span>Record entered</span>
      </div>
    </div>
  )
}

// ─── List View ─────────────────────────────────────────────────────────────────

function ListView({
  records,
  dataPoints,
  trackerId,
  onRecordClick
}: {
  records: DailyRecord[]
  dataPoints: DataPoint[]
  trackerId: number
  onRecordClick: (date: string) => void
}): React.ReactElement {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [valuesMap, setValuesMap] = useState<Record<number, RecordValue[]>>({})

  const toggleRecord = async (record: DailyRecord): Promise<void> => {
    if (expanded.has(record.id)) {
      setExpanded((prev) => {
        const next = new Set(prev)
        next.delete(record.id)
        return next
      })
      return
    }

    if (!valuesMap[record.id]) {
      const result = await window.api.records.getWithValues(record.id)
      if (result.values) {
        setValuesMap((prev) => ({ ...prev, [record.id]: result.values as RecordValue[] }))
      }
    }

    setExpanded((prev) => new Set(prev).add(record.id))
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
        No records yet. Add your first record above.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div key={record.id} className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => toggleRecord(record)}
          >
            <span className="font-medium text-sm">{format(parseISO(record.date), 'EEEE, MMM d, yyyy')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onRecordClick(record.date) }}
                className="text-xs text-primary-600 hover:underline"
              >
                Edit
              </button>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expanded.has(record.id) ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expanded.has(record.id) && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              {dataPoints.map((dp) => {
                const val = (valuesMap[record.id] ?? []).find((v) => v.dataPointId === dp.id)
                return (
                  <div key={dp.id}>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{dp.name}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {val ? formatValue(val.value, dp) : <span className="text-gray-300 dark:text-gray-600 italic">No entry</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function formatValue(raw: string, dp: DataPoint): string {
  const config = dp.config as Record<string, unknown> | null
  switch (dp.type) {
    case 'boolean':
      return raw === 'true'
        ? String(config?.labelYes ?? 'Yes')
        : String(config?.labelNo ?? 'No')
    case 'scale':
      return `${raw}${config?.unit ? ' ' + config.unit : ''}`
    case 'number':
      return `${raw}${config?.unit ? ' ' + config.unit : ''}`
    case 'duration':
      return config?.unit === 'hms' ? raw : `${raw} min`
    default:
      return raw
  }
}

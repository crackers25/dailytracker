import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import ScaleChart from '../components/charts/ScaleChart'
import NumberChart from '../components/charts/NumberChart'
import BooleanChart from '../components/charts/BooleanChart'
import DurationChart from '../components/charts/DurationChart'
import TimeOfDayChart from '../components/charts/TimeOfDayChart'
import ShortTextTimeline from '../components/charts/ShortTextTimeline'
import LongTextFeed from '../components/charts/LongTextFeed'
import type {
  DataPoint,
  Tracker,
  Record as DailyRecord,
  RecordValue,
  ChartDataPoint,
  ScaleConfig,
  NumberConfig,
  BooleanConfig,
  DurationConfig
} from '../types'
import { format, parseISO, eachDayOfInterval, isWithinInterval } from 'date-fns'

export default function Visualize(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const trackerId = Number(id)

  const isPrint = searchParams.get('print') === '1'

  const [tracker, setTracker] = useState<Tracker | null>(null)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([])
  const [valuesMap, setValuesMap] = useState<Record<number, RecordValue[]>>({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [startDate, setStartDate] = useState(
    searchParams.get('startDate') ?? format(new Date(), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    searchParams.get('endDate') ?? format(new Date(), 'yyyy-MM-dd')
  )

  const loadData = useCallback(async (): Promise<void> => {
    const [trackerRes, dpRes, recordsRes] = await Promise.all([
      window.api.trackers.get(trackerId),
      window.api.dataPoints.list(trackerId),
      window.api.records.list(trackerId)
    ])

    const t = trackerRes.tracker as Tracker
    setTracker(t)

    if (!searchParams.get('startDate')) {
      setStartDate(t.startDate)
    }

    setDataPoints((dpRes.dataPoints ?? []) as DataPoint[])
    const recs = (recordsRes.records ?? []) as DailyRecord[]
    setAllRecords(recs)

    // Load all record values in parallel
    const valueResults = await Promise.all(
      recs.map((r) => window.api.records.getWithValues(r.id))
    )
    const map: Record<number, RecordValue[]> = {}
    valueResults.forEach((res) => {
      if (res.record && res.values) {
        map[(res.record as DailyRecord).id] = res.values as RecordValue[]
      }
    })
    setValuesMap(map)
    setLoading(false)
  }, [trackerId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getChartData = (dataPoint: DataPoint): ChartDataPoint[] => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    return allRecords
      .filter((r) => {
        const d = parseISO(r.date)
        return isWithinInterval(d, { start, end })
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => {
        const vals = valuesMap[r.id] ?? []
        const val = vals.find((v) => v.dataPointId === dataPoint.id)
        return {
          date: r.date,
          value: val ? val.value : null,
          displayValue: val ? val.value : ''
        }
      })
  }

  const handleExportPDF = async (): Promise<void> => {
    setExporting(true)
    try {
      await window.api.report.exportPDF(trackerId, startDate, endDate)
    } finally {
      setExporting(false)
    }
  }

  if (loading || !tracker) {
    return (
      <Layout title="Charts" backTo={`/tracker/${trackerId}`}>
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      </Layout>
    )
  }

  const content = (
    <div className={isPrint ? 'p-8' : 'max-w-3xl mx-auto px-4 py-6'}>
      {/* Date range selector */}
      {!isPrint && (
        <div className="card p-4 mb-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="label">From</label>
              <input
                type="date"
                className="input w-40"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">To</label>
              <input
                type="date"
                className="input w-40"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 pb-2">
              {allRecords.filter((r) => r.date >= startDate && r.date <= endDate).length} records in range
            </div>
            <div className="ml-auto">
              <button
                onClick={handleExportPDF}
                className="btn-secondary text-xs"
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : '↓ Export PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print header */}
      {isPrint && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{tracker.title}</h1>
          {tracker.description && <p className="text-gray-500 mt-1">{tracker.description}</p>}
          <p className="text-sm text-gray-400 mt-2">
            Report: {format(parseISO(startDate), 'MMM d, yyyy')} – {format(parseISO(endDate), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      {/* Charts */}
      {dataPoints.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No data points configured for this tracker.
        </div>
      ) : (
        <div className="space-y-6">
          {dataPoints.map((dp) => (
            <DataPointSection
              key={dp.id}
              dataPoint={dp}
              data={getChartData(dp)}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (isPrint) {
    return <div className="bg-white min-h-screen">{content}</div>
  }

  return (
    <Layout title={`Charts — ${tracker.title}`} backTo={`/tracker/${trackerId}`}>
      {content}
    </Layout>
  )
}

function DataPointSection({
  dataPoint,
  data
}: {
  dataPoint: DataPoint
  data: ChartDataPoint[]
}): React.ReactElement {
  const config = dataPoint.config as Record<string, unknown> | null

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{dataPoint.name}</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{typeLabel(dataPoint.type)}</p>

      {dataPoint.type === 'scale' && (
        <ScaleChart data={data} config={(config ?? { min: 0, max: 10, step: 1 }) as ScaleConfig} name={dataPoint.name} />
      )}
      {dataPoint.type === 'number' && (
        <NumberChart data={data} config={(config ?? {}) as NumberConfig} />
      )}
      {dataPoint.type === 'boolean' && (
        <BooleanChart data={data} config={(config ?? {}) as BooleanConfig} />
      )}
      {dataPoint.type === 'duration' && (
        <DurationChart data={data} config={(config ?? { unit: 'minutes' }) as DurationConfig} />
      )}
      {dataPoint.type === 'time_of_day' && (
        <TimeOfDayChart data={data} />
      )}
      {dataPoint.type === 'short_text' && (
        <ShortTextTimeline data={data} />
      )}
      {dataPoint.type === 'long_text' && (
        <LongTextFeed data={data} />
      )}
    </div>
  )
}

function typeLabel(type: DataPoint['type']): string {
  switch (type) {
    case 'scale': return 'Sliding scale'
    case 'boolean': return 'Yes / No'
    case 'number': return 'Number'
    case 'time_of_day': return 'Time of day'
    case 'duration': return 'Duration'
    case 'short_text': return 'Short text'
    case 'long_text': return 'Long text / Journal'
    default: return type
  }
}

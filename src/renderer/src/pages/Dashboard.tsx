import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/ui/Layout'
import type { Tracker } from '../types'
import { format, parseISO, differenceInDays } from 'date-fns'

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const [trackers, setTrackers] = useState<Tracker[]>([])
  const [loading, setLoading] = useState(true)

  const loadTrackers = async (): Promise<void> => {
    const result = await window.api.trackers.list(user.id)
    if (result.trackers) setTrackers(result.trackers as Tracker[])
    setLoading(false)
  }

  useEffect(() => {
    loadTrackers()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number): Promise<void> => {
    e.stopPropagation()
    if (!confirm('Delete this tracker and all its records?')) return
    await window.api.trackers.delete(id)
    setTrackers((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <Layout
      title={`${user.username}'s Trackers`}
      actions={
        <button onClick={() => navigate('/tracker/new')} className="btn-primary text-xs px-3 py-1.5">
          + New Tracker
        </button>
      }
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : trackers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No trackers yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Create your first tracker to start logging daily data.
            </p>
            <button onClick={() => navigate('/tracker/new')} className="btn-primary">
              Create your first tracker
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trackers.map((tracker) => (
              <TrackerCard
                key={tracker.id}
                tracker={tracker}
                onClick={() => navigate(`/tracker/${tracker.id}`)}
                onDelete={(e) => handleDelete(e, tracker.id)}
                onEdit={(e) => {
                  e.stopPropagation()
                  navigate(`/tracker/${tracker.id}/edit`)
                }}
                onVisualize={(e) => {
                  e.stopPropagation()
                  navigate(`/tracker/${tracker.id}/visualize`)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function TrackerCard({
  tracker,
  onClick,
  onDelete,
  onEdit,
  onVisualize
}: {
  tracker: Tracker
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onVisualize: (e: React.MouseEvent) => void
}): React.ReactElement {
  const daysSinceStart = differenceInDays(new Date(), parseISO(tracker.startDate))

  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{tracker.title}</h3>
          {tracker.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{tracker.description}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Started {format(parseISO(tracker.startDate), 'MMM d, yyyy')}
            {' · '}
            {daysSinceStart >= 0
              ? `${daysSinceStart} day${daysSinceStart !== 1 ? 's' : ''} ago`
              : `starts in ${Math.abs(daysSinceStart)} day${Math.abs(daysSinceStart) !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onVisualize} className="btn-ghost p-1.5 rounded-lg" title="View charts">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button onClick={onEdit} className="btn-ghost p-1.5 rounded-lg" title="Edit tracker">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={onDelete} className="btn-ghost p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" title="Delete tracker">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

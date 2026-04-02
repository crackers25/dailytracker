import { ipcMain } from 'electron'
import { trackerRepo } from '../database/repos/trackerRepo'
import { dataPointRepo } from '../database/repos/dataPointRepo'
import type { DataPointType, DataPointConfig } from '../../shared/types'

function mapTracker(t: ReturnType<typeof trackerRepo.findById>) {
  if (!t) return null
  return {
    id: t.id,
    userId: t.user_id,
    title: t.title,
    description: t.description,
    startDate: t.start_date,
    createdAt: t.created_at
  }
}

function mapDataPoint(dp: ReturnType<typeof dataPointRepo.findById>) {
  if (!dp) return null
  return {
    id: dp.id,
    trackerId: dp.tracker_id,
    name: dp.name,
    type: dp.type,
    config: dp.config ? JSON.parse(dp.config) : null,
    displayOrder: dp.display_order
  }
}

export function registerTrackerHandlers(): void {
  ipcMain.handle('trackers:list', (_event, userId: number) => {
    try {
      const trackers = trackerRepo.listByUser(userId)
      return { trackers: trackers.map(mapTracker) }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('trackers:get', (_event, id: number) => {
    try {
      const tracker = trackerRepo.findById(id)
      if (!tracker) return { error: 'Tracker not found' }
      return { tracker: mapTracker(tracker) }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle(
    'trackers:create',
    (_event, userId: number, title: string, description: string | null, startDate: string) => {
      try {
        const tracker = trackerRepo.create(userId, title, description, startDate)
        return { tracker: mapTracker(tracker) }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'trackers:update',
    (
      _event,
      id: number,
      fields: { title?: string; description?: string | null; startDate?: string }
    ) => {
      try {
        const tracker = trackerRepo.update(id, fields)
        return { tracker: mapTracker(tracker) }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle('trackers:delete', (_event, id: number) => {
    try {
      trackerRepo.delete(id)
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  // ─── Data Points ──────────────────────────────────────────────────────────

  ipcMain.handle('dataPoints:list', (_event, trackerId: number) => {
    try {
      const points = dataPointRepo.listByTracker(trackerId)
      return { dataPoints: points.map(mapDataPoint) }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle(
    'dataPoints:create',
    (
      _event,
      trackerId: number,
      name: string,
      type: DataPointType,
      config: DataPointConfig | null,
      displayOrder: number
    ) => {
      try {
        const dp = dataPointRepo.create(trackerId, name, type, config, displayOrder)
        return { dataPoint: mapDataPoint(dp) }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'dataPoints:update',
    (
      _event,
      id: number,
      fields: {
        name?: string
        type?: DataPointType
        config?: DataPointConfig | null
        displayOrder?: number
      }
    ) => {
      try {
        const dp = dataPointRepo.update(id, fields)
        return { dataPoint: mapDataPoint(dp) }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle('dataPoints:reorder', (_event, items: { id: number; displayOrder: number }[]) => {
    try {
      dataPointRepo.reorder(items)
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('dataPoints:delete', (_event, id: number) => {
    try {
      dataPointRepo.delete(id)
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })
}

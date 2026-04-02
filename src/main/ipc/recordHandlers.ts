import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { recordRepo } from '../database/repos/recordRepo'
import { getDb } from '../database/db'
import path from 'path'
import fs from 'fs'

function mapRecord(r: ReturnType<typeof recordRepo.findById>) {
  if (!r) return null
  return {
    id: r.id,
    trackerId: r.tracker_id,
    date: r.date,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

function mapValue(v: { id: number; record_id: number; data_point_id: number; value: string }) {
  return {
    id: v.id,
    recordId: v.record_id,
    dataPointId: v.data_point_id,
    value: v.value
  }
}

export function registerRecordHandlers(): void {
  ipcMain.handle('records:list', (_event, trackerId: number) => {
    try {
      const records = recordRepo.listByTracker(trackerId)
      return { records: records.map(mapRecord) }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('records:listDates', (_event, trackerId: number) => {
    try {
      const dates = recordRepo.listDatesWithRecords(trackerId)
      return { dates }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('records:getByDate', (_event, trackerId: number, date: string) => {
    try {
      const record = recordRepo.findByDate(trackerId, date)
      if (!record) return { record: null, values: [] }
      const values = recordRepo.getValues(record.id)
      return { record: mapRecord(record), values: values.map(mapValue) }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('records:getWithValues', (_event, recordId: number) => {
    try {
      const record = recordRepo.findById(recordId)
      if (!record) return { error: 'Record not found' }
      const values = recordRepo.getValues(record.id)
      return { record: mapRecord(record), values: values.map(mapValue) }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle(
    'records:upsert',
    (
      _event,
      trackerId: number,
      date: string,
      values: { dataPointId: number; value: string }[]
    ) => {
      try {
        const record = recordRepo.upsert(trackerId, date, values)
        return { record: mapRecord(record) }
      } catch (err) {
        return { error: String(err) }
      }
    }
  )

  ipcMain.handle('records:delete', (_event, id: number) => {
    try {
      recordRepo.delete(id)
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  // ─── Settings ─────────────────────────────────────────────────────────────

  ipcMain.handle('settings:get', (_event, key: string) => {
    try {
      const db = getDb()
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
        | { value: string }
        | undefined
      return { value: row?.value ?? null }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    try {
      const db = getDb()
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  // ─── PDF Export ───────────────────────────────────────────────────────────

  ipcMain.handle(
    'report:exportPDF',
    async (_event, trackerId: number, startDate: string, endDate: string) => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { error: 'No focused window' }

      // Show save dialog first
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Export PDF Report',
        defaultPath: path.join(
          app.getPath('documents'),
          `tracker-report-${startDate}-to-${endDate}.pdf`
        ),
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      })

      if (canceled || !filePath) return { canceled: true }

      // Create hidden window with print mode
      const printWin = new BrowserWindow({
        show: false,
        width: 1200,
        height: 900,
        webPreferences: {
          preload: path.join(__dirname, '../preload/index.js'),
          contextIsolation: true
        }
      })

      const mainURL = win.webContents.getURL()
      const baseURL = mainURL.split('#')[0]
      const printURL = `${baseURL}#/tracker/${trackerId}/visualize?print=1&startDate=${startDate}&endDate=${endDate}`

      await printWin.loadURL(printURL)
      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 2000))

      try {
        const data = await printWin.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          landscape: false
        })
        fs.writeFileSync(filePath, data)
        return { success: true, filePath }
      } finally {
        printWin.destroy()
      }
    }
  )
}

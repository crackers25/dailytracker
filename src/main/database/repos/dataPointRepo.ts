import { getDb } from '../db'
import type { DataPointType, DataPointConfig } from '../../../shared/types'

export interface DbDataPoint {
  id: number
  tracker_id: number
  name: string
  type: DataPointType
  config: string | null // JSON string
  display_order: number
}

export const dataPointRepo = {
  listByTracker(trackerId: number): DbDataPoint[] {
    const db = getDb()
    return db
      .prepare('SELECT * FROM data_points WHERE tracker_id = ? ORDER BY display_order ASC, id ASC')
      .all(trackerId) as DbDataPoint[]
  },

  findById(id: number): DbDataPoint | undefined {
    const db = getDb()
    return db
      .prepare('SELECT * FROM data_points WHERE id = ?')
      .get(id) as DbDataPoint | undefined
  },

  create(
    trackerId: number,
    name: string,
    type: DataPointType,
    config: DataPointConfig | null,
    displayOrder: number
  ): DbDataPoint {
    const db = getDb()
    const configStr = config ? JSON.stringify(config) : null
    return db
      .prepare(
        'INSERT INTO data_points (tracker_id, name, type, config, display_order) VALUES (?, ?, ?, ?, ?) RETURNING *'
      )
      .get(trackerId, name, type, configStr, displayOrder) as DbDataPoint
  },

  update(
    id: number,
    fields: {
      name?: string
      type?: DataPointType
      config?: DataPointConfig | null
      displayOrder?: number
    }
  ): DbDataPoint | undefined {
    const db = getDb()
    const parts: string[] = []
    const values: unknown[] = []
    if (fields.name !== undefined) {
      parts.push('name = ?')
      values.push(fields.name)
    }
    if (fields.type !== undefined) {
      parts.push('type = ?')
      values.push(fields.type)
    }
    if ('config' in fields) {
      parts.push('config = ?')
      values.push(fields.config ? JSON.stringify(fields.config) : null)
    }
    if (fields.displayOrder !== undefined) {
      parts.push('display_order = ?')
      values.push(fields.displayOrder)
    }
    if (!parts.length) return this.findById(id)
    values.push(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.prepare(`UPDATE data_points SET ${parts.join(', ')} WHERE id = ? RETURNING *`).get(...(values as any[])) as DbDataPoint | undefined
  },

  reorder(items: { id: number; displayOrder: number }[]): void {
    const db = getDb()
    const stmt = db.prepare('UPDATE data_points SET display_order = ? WHERE id = ?')
    const updateMany = db.transaction(() => {
      for (const item of items) {
        stmt.run(item.displayOrder, item.id)
      }
    })
    updateMany()
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM data_points WHERE id = ?').run(id)
  }
}

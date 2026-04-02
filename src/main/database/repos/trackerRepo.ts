import { getDb } from '../db'

export interface DbTracker {
  id: number
  user_id: number
  title: string
  description: string | null
  start_date: string
  created_at: string
}

export const trackerRepo = {
  listByUser(userId: number): DbTracker[] {
    const db = getDb()
    return db
      .prepare('SELECT * FROM trackers WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as DbTracker[]
  },

  findById(id: number): DbTracker | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM trackers WHERE id = ?').get(id) as DbTracker | undefined
  },

  create(userId: number, title: string, description: string | null, startDate: string): DbTracker {
    const db = getDb()
    return db
      .prepare(
        'INSERT INTO trackers (user_id, title, description, start_date) VALUES (?, ?, ?, ?) RETURNING *'
      )
      .get(userId, title, description, startDate) as DbTracker
  },

  update(
    id: number,
    fields: { title?: string; description?: string | null; startDate?: string }
  ): DbTracker | undefined {
    const db = getDb()
    const parts: string[] = []
    const values: unknown[] = []
    if (fields.title !== undefined) {
      parts.push('title = ?')
      values.push(fields.title)
    }
    if ('description' in fields) {
      parts.push('description = ?')
      values.push(fields.description)
    }
    if (fields.startDate !== undefined) {
      parts.push('start_date = ?')
      values.push(fields.startDate)
    }
    if (!parts.length) return this.findById(id)
    values.push(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.prepare(`UPDATE trackers SET ${parts.join(', ')} WHERE id = ? RETURNING *`).get(...(values as any[])) as DbTracker | undefined
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM trackers WHERE id = ?').run(id)
  }
}

import { getDb } from '../db'

export interface DbRecord {
  id: number
  tracker_id: number
  date: string
  created_at: string
  updated_at: string
}

export interface DbRecordValue {
  id: number
  record_id: number
  data_point_id: number
  value: string
}

export const recordRepo = {
  listByTracker(trackerId: number): DbRecord[] {
    const db = getDb()
    return db
      .prepare('SELECT * FROM records WHERE tracker_id = ? ORDER BY date DESC')
      .all(trackerId) as DbRecord[]
  },

  listDatesWithRecords(trackerId: number): string[] {
    const db = getDb()
    const rows = db
      .prepare('SELECT date FROM records WHERE tracker_id = ? ORDER BY date ASC')
      .all(trackerId) as { date: string }[]
    return rows.map((r) => r.date)
  },

  findByDate(trackerId: number, date: string): DbRecord | undefined {
    const db = getDb()
    return db
      .prepare('SELECT * FROM records WHERE tracker_id = ? AND date = ?')
      .get(trackerId, date) as DbRecord | undefined
  },

  findById(id: number): DbRecord | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM records WHERE id = ?').get(id) as DbRecord | undefined
  },

  getValues(recordId: number): DbRecordValue[] {
    const db = getDb()
    return db
      .prepare('SELECT * FROM record_values WHERE record_id = ?')
      .all(recordId) as DbRecordValue[]
  },

  upsert(
    trackerId: number,
    date: string,
    values: { dataPointId: number; value: string }[]
  ): DbRecord {
    const db = getDb()

    const upsertRecord = db.transaction(() => {
      // Upsert the record (insert or get existing)
      let record = db
        .prepare('SELECT * FROM records WHERE tracker_id = ? AND date = ?')
        .get(trackerId, date) as DbRecord | undefined

      if (!record) {
        record = db
          .prepare(
            'INSERT INTO records (tracker_id, date) VALUES (?, ?) RETURNING *'
          )
          .get(trackerId, date) as DbRecord
      } else {
        db.prepare("UPDATE records SET updated_at = datetime('now') WHERE id = ?").run(record.id)
      }

      // Delete existing values for this record, then re-insert
      db.prepare('DELETE FROM record_values WHERE record_id = ?').run(record.id)

      const insertValue = db.prepare(
        'INSERT INTO record_values (record_id, data_point_id, value) VALUES (?, ?, ?)'
      )
      for (const v of values) {
        insertValue.run(record.id, v.dataPointId, v.value)
      }

      return record
    })

    return upsertRecord() as DbRecord
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM records WHERE id = ?').run(id)
  }
}

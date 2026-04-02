import { getDb } from '../db'
import bcrypt from 'bcryptjs'

export interface DbUser {
  id: number
  username: string
  password_hash: string
  created_at: string
}

export const userRepo = {
  create(username: string, password: string): DbUser {
    const db = getDb()
    const hash = bcrypt.hashSync(password, 10)
    const stmt = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING *'
    )
    return stmt.get(username, hash) as DbUser
  },

  findByUsername(username: string): DbUser | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined
  },

  verifyPassword(username: string, password: string): DbUser | null {
    const user = this.findByUsername(username)
    if (!user) return null
    const valid = bcrypt.compareSync(password, user.password_hash)
    return valid ? user : null
  },

  findById(id: number): DbUser | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined
  }
}

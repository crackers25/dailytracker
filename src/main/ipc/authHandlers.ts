import { ipcMain } from 'electron'
import { userRepo } from '../database/repos/userRepo'

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:register', (_event, username: string, password: string) => {
    try {
      const existing = userRepo.findByUsername(username)
      if (existing) {
        return { error: 'Username already taken' }
      }
      const user = userRepo.create(username, password)
      return { user: { id: user.id, username: user.username, createdAt: user.created_at } }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('auth:login', (_event, username: string, password: string) => {
    try {
      const user = userRepo.verifyPassword(username, password)
      if (!user) {
        return { error: 'Invalid username or password' }
      }
      return { user: { id: user.id, username: user.username, createdAt: user.created_at } }
    } catch (err) {
      return { error: String(err) }
    }
  })

  ipcMain.handle('auth:getUser', (_event, userId: number) => {
    try {
      const user = userRepo.findById(userId)
      if (!user) return { error: 'User not found' }
      return { user: { id: user.id, username: user.username, createdAt: user.created_at } }
    } catch (err) {
      return { error: String(err) }
    }
  })
}

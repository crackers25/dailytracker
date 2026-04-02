import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { getDb } from './database/db'
import { registerAuthHandlers } from './ipc/authHandlers'
import { registerTrackerHandlers } from './ipc/trackerHandlers'
import { registerRecordHandlers } from './ipc/recordHandlers'
import { initUpdater } from './updater'

function createWindow(): void {
  // isDev is evaluated inside whenReady so app is fully initialized
  const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Set app user model ID for Windows taskbar
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.dailytracker.app')
  }

  // Initialize DB on startup
  getDb()

  // Register all IPC handlers
  registerAuthHandlers()
  registerTrackerHandlers()
  registerRecordHandlers()

  createWindow()
  initUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

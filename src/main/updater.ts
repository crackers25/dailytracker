import { autoUpdater } from 'electron-updater'
import { dialog, BrowserWindow } from 'electron'
import log from 'electron-log'

// Route electron-updater logs through electron-log
autoUpdater.logger = log
log.transports.file.level = 'info'

// Don't auto-download — we'll prompt the user first
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

export function initUpdater(): void {
  // Only check for updates in production (packaged) builds
  if (!app().isPackaged) return

  autoUpdater.checkForUpdates().catch((err) => {
    log.error('Update check failed:', err)
  })

  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `Daily Tracker ${info.version} is available.`,
        detail: 'Would you like to download and install it now? The app will restart when ready.',
        buttons: ['Download Update', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded.',
        detail: 'Restart Daily Tracker to apply the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err)
  })
}

// Lazy import of app to avoid accessing it at module load time
function app() {
  return require('electron').app as Electron.App
}

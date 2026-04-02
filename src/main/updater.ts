import { autoUpdater } from 'electron-updater'
import { dialog, shell } from 'electron'
import log from 'electron-log'

// Route electron-updater logs through electron-log
autoUpdater.logger = log
log.transports.file.level = 'info'

// On Mac, unsigned apps are blocked by Gatekeeper from background installs,
// so we open the GitHub Releases page instead and let the user download manually.
// On Windows, auto-download and install works fine.
autoUpdater.autoDownload = process.platform !== 'darwin'
autoUpdater.autoInstallOnAppQuit = process.platform !== 'darwin'

const RELEASES_URL = 'https://github.com/crackers25/dailytracker/releases/latest'

export function initUpdater(): void {
  // Only check for updates in production (packaged) builds
  if (!app().isPackaged) return

  autoUpdater.checkForUpdates().catch((err) => {
    log.error('Update check failed:', err)
  })

  autoUpdater.on('update-available', (info) => {
    if (process.platform === 'darwin') {
      // Mac: open releases page so user can download and install manually
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `Daily Tracker ${info.version} is available.`,
          detail:
            'Download the new version from GitHub Releases, then open the .dmg and drag it to Applications to update.',
          buttons: ['Open Download Page', 'Later'],
          defaultId: 0,
          cancelId: 1
        })
        .then(({ response }) => {
          if (response === 0) {
            shell.openExternal(RELEASES_URL)
          }
        })
    } else {
      // Windows: auto-download is enabled above; just notify
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `Daily Tracker ${info.version} is available.`,
        detail: 'The update is downloading in the background. You will be prompted to restart when ready.',
        buttons: ['OK']
      })
    }
  })

  autoUpdater.on('update-downloaded', () => {
    // Only fires on Windows (autoDownload is false on Mac)
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

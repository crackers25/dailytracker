import { contextBridge, ipcRenderer } from 'electron'
import type {
  DataPointType,
  DataPointConfig
} from '../shared/types'

const api = {
  auth: {
    register: (username: string, password: string) =>
      ipcRenderer.invoke('auth:register', username, password),
    login: (username: string, password: string) =>
      ipcRenderer.invoke('auth:login', username, password),
    getUser: (userId: number) => ipcRenderer.invoke('auth:getUser', userId)
  },

  trackers: {
    list: (userId: number) => ipcRenderer.invoke('trackers:list', userId),
    get: (id: number) => ipcRenderer.invoke('trackers:get', id),
    create: (userId: number, title: string, description: string | null, startDate: string) =>
      ipcRenderer.invoke('trackers:create', userId, title, description, startDate),
    update: (
      id: number,
      fields: { title?: string; description?: string | null; startDate?: string }
    ) => ipcRenderer.invoke('trackers:update', id, fields),
    delete: (id: number) => ipcRenderer.invoke('trackers:delete', id)
  },

  dataPoints: {
    list: (trackerId: number) => ipcRenderer.invoke('dataPoints:list', trackerId),
    create: (
      trackerId: number,
      name: string,
      type: DataPointType,
      config: DataPointConfig | null,
      displayOrder: number
    ) => ipcRenderer.invoke('dataPoints:create', trackerId, name, type, config, displayOrder),
    update: (
      id: number,
      fields: {
        name?: string
        type?: DataPointType
        config?: DataPointConfig | null
        displayOrder?: number
      }
    ) => ipcRenderer.invoke('dataPoints:update', id, fields),
    reorder: (items: { id: number; displayOrder: number }[]) =>
      ipcRenderer.invoke('dataPoints:reorder', items),
    delete: (id: number) => ipcRenderer.invoke('dataPoints:delete', id)
  },

  records: {
    list: (trackerId: number) => ipcRenderer.invoke('records:list', trackerId),
    listDates: (trackerId: number) => ipcRenderer.invoke('records:listDates', trackerId),
    getByDate: (trackerId: number, date: string) =>
      ipcRenderer.invoke('records:getByDate', trackerId, date),
    getWithValues: (recordId: number) => ipcRenderer.invoke('records:getWithValues', recordId),
    upsert: (
      trackerId: number,
      date: string,
      values: { dataPointId: number; value: string }[]
    ) => ipcRenderer.invoke('records:upsert', trackerId, date, values),
    delete: (id: number) => ipcRenderer.invoke('records:delete', id)
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value)
  },

  report: {
    exportPDF: (trackerId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke('report:exportPDF', trackerId, startDate, endDate)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api

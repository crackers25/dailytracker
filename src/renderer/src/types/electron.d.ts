import type { DataPointType, DataPointConfig } from '../../../shared/types'

// Mirror the preload API shape without importing from preload (different tsconfig project)
interface API {
  auth: {
    register: (username: string, password: string) => Promise<{ user?: { id: number; username: string; createdAt: string }; error?: string }>
    login: (username: string, password: string) => Promise<{ user?: { id: number; username: string; createdAt: string }; error?: string }>
    getUser: (userId: number) => Promise<{ user?: { id: number; username: string; createdAt: string }; error?: string }>
  }
  trackers: {
    list: (userId: number) => Promise<{ trackers?: unknown[]; error?: string }>
    get: (id: number) => Promise<{ tracker?: unknown; error?: string }>
    create: (userId: number, title: string, description: string | null, startDate: string) => Promise<{ tracker?: unknown; error?: string }>
    update: (id: number, fields: { title?: string; description?: string | null; startDate?: string }) => Promise<{ tracker?: unknown; error?: string }>
    delete: (id: number) => Promise<{ success?: boolean; error?: string }>
  }
  dataPoints: {
    list: (trackerId: number) => Promise<{ dataPoints?: unknown[]; error?: string }>
    create: (trackerId: number, name: string, type: DataPointType, config: DataPointConfig | null, displayOrder: number) => Promise<{ dataPoint?: unknown; error?: string }>
    update: (id: number, fields: { name?: string; type?: DataPointType; config?: DataPointConfig | null; displayOrder?: number }) => Promise<{ dataPoint?: unknown; error?: string }>
    reorder: (items: { id: number; displayOrder: number }[]) => Promise<{ success?: boolean; error?: string }>
    delete: (id: number) => Promise<{ success?: boolean; error?: string }>
  }
  records: {
    list: (trackerId: number) => Promise<{ records?: unknown[]; error?: string }>
    listDates: (trackerId: number) => Promise<{ dates?: string[]; error?: string }>
    getByDate: (trackerId: number, date: string) => Promise<{ record?: unknown; values?: unknown[]; error?: string }>
    getWithValues: (recordId: number) => Promise<{ record?: unknown; values?: unknown[]; error?: string }>
    upsert: (trackerId: number, date: string, values: { dataPointId: number; value: string }[]) => Promise<{ record?: unknown; error?: string }>
    delete: (id: number) => Promise<{ success?: boolean; error?: string }>
  }
  settings: {
    get: (key: string) => Promise<{ value: string | null; error?: string }>
    set: (key: string, value: string) => Promise<{ success?: boolean; error?: string }>
  }
  report: {
    exportPDF: (trackerId: number, startDate: string, endDate: string) => Promise<{ success?: boolean; canceled?: boolean; filePath?: string; error?: string }>
  }
}

declare global {
  interface Window {
    api: API
  }
}

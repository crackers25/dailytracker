import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateEditTracker from './pages/CreateEditTracker'
import TrackerDetail from './pages/TrackerDetail'
import AddEditRecord from './pages/AddEditRecord'
import Visualize from './pages/Visualize'

function RequireAuth({ children }: { children: React.ReactNode }): React.ReactElement {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App(): React.ReactElement {
  const theme = useThemeStore((s) => s.theme)

  // Apply theme class on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/tracker/new"
          element={
            <RequireAuth>
              <CreateEditTracker />
            </RequireAuth>
          }
        />
        <Route
          path="/tracker/:id/edit"
          element={
            <RequireAuth>
              <CreateEditTracker />
            </RequireAuth>
          }
        />
        <Route
          path="/tracker/:id"
          element={
            <RequireAuth>
              <TrackerDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/tracker/:id/record/:date"
          element={
            <RequireAuth>
              <AddEditRecord />
            </RequireAuth>
          }
        />
        <Route
          path="/tracker/:id/visualize"
          element={
            <RequireAuth>
              <Visualize />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

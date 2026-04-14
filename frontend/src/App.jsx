/**
 * App.jsx — Root router with protected and public routes.
 */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import JobDetail  from './pages/JobDetail'
import CreateJob  from './pages/CreateJob'
import ApplyJob   from './pages/ApplyJob'

/** Wrapper: redirect to /login if not authenticated */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/** Wrapper: redirect to /dashboard if already logged in */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e35',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />

        <div className="gradient-blob" aria-hidden="true" />

        <div className="page-content">
          <Routes>
            {/* Public */}
            <Route path="/"       element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"  element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/apply/:jobId" element={<ApplyJob />} />

            {/* HR Protected */}
            <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/jobs/:id"       element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/jobs/new"       element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
            <Route path="/jobs/:id/edit"  element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

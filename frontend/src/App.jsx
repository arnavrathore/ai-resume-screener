/**
 * App.jsx — Root router with protected and public routes.
 */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login         from './pages/Login'
import CandidateLogin from './pages/CandidateLogin'
import CandidateJobs  from './pages/CandidateJobs'
import Dashboard     from './pages/Dashboard'
import AllCandidates from './pages/AllCandidates'
import JobDetail     from './pages/JobDetail'
import CreateJob     from './pages/CreateJob'
import ApplyJob      from './pages/ApplyJob'
import ResumeUpload  from './pages/ResumeUpload'

/** Wrapper: redirect to /candidate-login if not authenticated or not a candidate */
function CandidateRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/candidate-login" replace />
  if (user?.role !== 'candidate') return <Navigate to="/login" replace />
  return children
}

/** Wrapper: redirect to /login if not authenticated, or enforce allowed roles */
function ProtectedRoute({ children, allowedRoles = ['hr'] }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user?.role)) {
    return user?.role === 'candidate' ? <Navigate to="/apply" replace /> : <Navigate to="/login" replace />
  }
  return children
}

/** Wrapper: redirect authenticated users away from public auth pages */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return children

  return user?.role === 'candidate' ? <Navigate to="/apply" replace /> : <Navigate to="/dashboard" replace />
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
            <Route path="/" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/candidate-login" element={<PublicOnlyRoute><CandidateLogin /></PublicOnlyRoute>} />

            {/* Candidate */}
            <Route path="/apply" element={<CandidateRoute><CandidateJobs /></CandidateRoute>} />
            <Route path="/jobs" element={<CandidateRoute><CandidateJobs /></CandidateRoute>} />
            <Route path="/apply/:jobId" element={<CandidateRoute><ApplyJob /></CandidateRoute>} />
            <Route path="/upload-resume/:jobId" element={<CandidateRoute><ResumeUpload /></CandidateRoute>} />

            {/* HR Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/candidates" element={<ProtectedRoute><AllCandidates /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/jobs/new" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
            <Route path="/jobs/:id/edit" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

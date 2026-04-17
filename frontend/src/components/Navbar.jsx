/**
 * Navbar.jsx — Top navigation bar for HR authenticated pages.
 */
import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, PlusCircle, LogOut, Cpu, Users } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
            <Cpu size={16} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            <span className="text-white">AI</span>
            <span className="text-brand-400">Screener</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive('/dashboard')
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <Link
            to="/candidates"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive('/candidates')
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={15} />
            All Candidates
          </Link>
          <Link
            to="/jobs/new"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive('/jobs/new')
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <PlusCircle size={15} />
            Post Job
          </Link>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium text-white leading-none">{user?.full_name}</span>
            <span className="text-xs text-white/40 mt-0.5 capitalize">{user?.role} user</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold uppercase shrink-0">
            {user?.full_name?.[0] || 'H'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            title="Logout"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { jobsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Search, MapPin, Building, ArrowRight, LogOut, Briefcase } from 'lucide-react'

export default function CandidateJobs() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data } = await jobsAPI.list(true, search) // Only active jobs for candidates
      setJobs(data)
    } catch (error) {
      toast.error('Unable to load job postings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [search])

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-surface-900/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Briefcase size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Find Your Next Opportunity</h1>
                <p className="text-white/60 text-sm mt-0.5">Browse active job postings and apply with ease</p>
              </div>
            </div>

            {/* Right: Welcome + Logout */}
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-white/60">Welcome back,</p>
                <p className="text-white font-semibold">{user?.full_name || user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20"
                title="Sign out"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by title, company..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white">Loading job opportunities...</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-white/60 text-lg mb-2">No jobs found</div>
            <p className="text-white/40">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div key={job.id} className="glass-card p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Building size={14} />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-4 line-clamp-3">
                  {job.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/50">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </div>
                  <Link
                    to={`/apply/${job.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Apply Now
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
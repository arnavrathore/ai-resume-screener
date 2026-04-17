import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { candidatesAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Search, Clock, CheckCircle, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  shortlisted: { label: 'Shortlisted', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/15' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
}

export default function AllCandidates() {
  const [candidates, setCandidates] = useState([])
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchAllCandidates = async () => {
    setLoading(true)
    try {
      const { data } = await candidatesAPI.listAll()
      setCandidates(data)
      setFilteredCandidates(data)
    } catch (error) {
      toast.error('Unable to load candidates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllCandidates()
  }, [])

  // Filter by name or email
  useEffect(() => {
    if (!search.trim()) {
      setFilteredCandidates(candidates)
    } else {
      const q = search.toLowerCase()
      setFilteredCandidates(
        candidates.filter((c) =>
          c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        )
      )
    }
  }, [search, candidates])

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">Candidate Management</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">All Applicants</h1>
            <p className="mt-2 text-white/60 max-w-2xl">
              View every candidate across all jobs, their match scores, and application status.
            </p>
          </div>
        </section>

        <div className="glass-card p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 bg-surface-700 border border-white/10 text-white placeholder-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 text-center text-white/60">Loading candidates…</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-20 text-center text-white/60">
              {search ? 'No candidates match your search.' : 'No candidates found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-white/60">
                      Candidate Name
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-white/60">
                      Email
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-white/60">
                      Applied For
                    </th>
                    <th className="text-center py-4 px-4 text-xs font-semibold uppercase tracking-wider text-white/60">
                      Match Score
                    </th>
                    <th className="text-center py-4 px-4 text-xs font-semibold uppercase tracking-wider text-white/60">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => {
                    const statusCfg = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.pending
                    const StatusIcon = statusCfg.icon
                    const scoreColor =
                      candidate.total_score >= 80
                        ? 'text-green-400'
                        : candidate.total_score >= 60
                          ? 'text-yellow-400'
                          : 'text-red-400'

                    return (
                      <tr
                        key={candidate.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm font-medium text-white">
                          {candidate.name}
                        </td>
                        <td className="py-4 px-4 text-sm text-white/60">{candidate.email}</td>
                        <td className="py-4 px-4 text-sm text-white/60">{candidate.job_title}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm font-semibold ${scoreColor}`}>
                            {candidate.total_score.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon size={13} />
                            {statusCfg.label}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredCandidates.length > 0 && (
            <div className="mt-6 text-sm text-white/60 text-center">
              Showing {filteredCandidates.length} of {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

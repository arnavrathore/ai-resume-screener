import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import JobCard from '../components/JobCard'
import { jobsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data } = await jobsAPI.list(activeOnly, search)
      setJobs(data)
    } catch (error) {
      toast.error('Unable to load job postings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [activeOnly, search])

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job posting? This cannot be undone.')) return
    try {
      await jobsAPI.delete(jobId)
      toast.success('Job deleted.')
      fetchJobs()
    } catch (error) {
      toast.error('Failed to delete job.')
    }
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">HR Dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Manage job postings and applicants</h1>
            <p className="mt-2 text-white/60 max-w-2xl">Create jobs, track active positions, and instantly view candidate counts for every posting.</p>
          </div>

          <Link to="/jobs/new" className="btn-primary whitespace-nowrap">Create a new job</Link>
        </section>

        <section className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-sm text-white/60">Search jobs</p>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or description"
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveOnly((prev) => !prev)}
                className="btn-secondary whitespace-nowrap"
              >
                {activeOnly ? 'Showing active only' : 'Showing all jobs'}
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-white/60">Loading jobs…</div>
            ) : jobs.length === 0 ? (
              <div className="py-20 text-center text-white/60">
                No job postings match your query yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          <aside className="glass-card p-6 space-y-5">
            <div>
              <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">Quick tips</p>
              <h2 className="mt-3 text-xl font-semibold text-white">Keep hiring moving</h2>
              <p className="mt-2 text-white/60 text-sm leading-relaxed">
                Create roles with clear required skills, post them quickly, and review candidate rankings instantly from the job details page.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/70">Use the “View” button to see applicant rankings and shortlist top matches.</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/70">Click “Edit” to update job requirements without losing candidate data.</p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

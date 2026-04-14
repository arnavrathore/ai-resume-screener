import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CandidateCard from '../components/CandidateCard'
import ResumeUploadModal from '../components/ResumeUploadModal'
import { jobsAPI, rankingsAPI } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Rejected', value: 'rejected' },
]

export default function JobDetail() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status_filter: '', min_score: 0, skill_contains: '', min_experience: '' })
  const [running, setRunning] = useState(false)
  const [weights, setWeights] = useState(null)
  const [showWeights, setShowWeights] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const fetchJob = async () => {
    try {
      const { data } = await jobsAPI.get(id)
      setJob(data)
    } catch (error) {
      toast.error('Unable to load job details.')
    }
  }

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const params = {
        status_filter: filters.status_filter || undefined,
        min_score: filters.min_score || undefined,
        skill_contains: filters.skill_contains || undefined,
        min_experience: filters.min_experience || undefined,
      }
      const { data } = await rankingsAPI.get(id, params)
      setCandidates(data)
    } catch (error) {
      toast.error('Unable to load ranked candidates.')
    } finally {
      setLoading(false)
    }
  }

  const fetchWeights = async () => {
    try {
      const { data } = await rankingsAPI.getWeights()
      setWeights(data)
    } catch (error) {
      toast.error('Unable to load ranking weights.')
    }
  }

  useEffect(() => {
    fetchJob()
    fetchCandidates()
    fetchWeights()
  }, [id])

  useEffect(() => {
    fetchCandidates()
  }, [filters])

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleRankingRun = async (customWeights = null) => {
    setRunning(true)
    try {
      await rankingsAPI.run(id, customWeights)
      toast.success('Ranking updated.')
      fetchCandidates()
    } catch (error) {
      toast.error('Ranking execution failed.')
    } finally {
      setRunning(false)
    }
  }

  const handleWeightsUpdate = async () => {
    try {
      await rankingsAPI.updateWeights(weights)
      toast.success('Weights updated.')
      handleRankingRun(weights)
    } catch (error) {
      toast.error('Failed to update weights.')
    }
  }

  const handleStatusChange = (candidateId, status) => {
    setCandidates((prev) => prev.map((item) => item.candidate_id === candidateId ? { ...item, status } : item))
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <section className="glass-card p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">Job details</p>
              <h1 className="text-3xl font-semibold text-white">{job?.title || 'Loading...'}</h1>
              <p className="text-white/60 max-w-2xl">Review matched candidates, tune filters, and recompute scoring as needed.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/jobs/new" className="btn-secondary">Create new job</Link>
              <Link to={`/jobs/${id}/edit`} className="btn-primary">Edit posting</Link>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-secondary"
              >
                Upload resume
              </button>
              <button
                onClick={() => handleRankingRun()}
                disabled={running}
                className="btn-secondary"
              >
                {running ? 'Recomputing…' : 'Recompute ranking'}
              </button>
              <button
                onClick={() => setShowWeights(!showWeights)}
                className="btn-secondary"
              >
                {showWeights ? 'Hide' : 'Tune'} Weights
              </button>
            </div>
          </div>

          {showWeights && weights && (
            <div className="mt-6 p-6 bg-surface-800 rounded-2xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Adjust Ranking Weights</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Skills Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={weights.weight_skills}
                    onChange={(e) => setWeights({ ...weights, weight_skills: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Experience Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={weights.weight_experience}
                    onChange={(e) => setWeights({ ...weights, weight_experience: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Education Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={weights.weight_education}
                    onChange={(e) => setWeights({ ...weights, weight_education: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Keywords Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={weights.weight_keywords}
                    onChange={(e) => setWeights({ ...weights, weight_keywords: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={handleWeightsUpdate} className="btn-primary">Update & Recompute</button>
                <button onClick={() => setShowWeights(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {job && (
            <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-4">
                <div className="rounded-3xl bg-surface-800 p-6 border border-white/10">
                  <p className="text-sm text-white/60 uppercase tracking-[0.3em] mb-3">Summary</p>
                  <p className="text-white/80 leading-relaxed">{job.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-surface-800 p-6 border border-white/10">
                    <p className="text-sm text-white/60 uppercase tracking-[0.3em] mb-3">Required skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills?.map((skill) => (
                        <span key={skill} className="skill-pill">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-surface-800 p-6 border border-white/10">
                    <p className="text-sm text-white/60 uppercase tracking-[0.3em] mb-3">Requirements</p>
                    <div className="space-y-2 text-sm text-white/60">
                      <p><span className="text-white">Experience:</span> {job.experience_level}</p>
                      <p><span className="text-white">Education:</span> {job.education_requirement || 'Any'}</p>
                      <p><span className="text-white">Deadline:</span> {job.deadline ? new Date(job.deadline).toLocaleString() : 'No deadline'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-surface-800 p-6 border border-white/10 space-y-4">
                <div>
                  <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">Applicant snapshot</p>
                  <div className="mt-4 grid gap-3 text-sm text-white/70">
                    <p><span className="font-semibold text-white">Total applicants:</span> {job.candidate_count}</p>
                    <p><span className="font-semibold text-white">Top skills:</span> {job.required_skills?.slice(0, 3).join(', ') || 'None'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-white/60 uppercase tracking-[0.35em]">Filter candidates</p>
                  <div className="grid gap-3">
                    <select
                      value={filters.status_filter}
                      onChange={handleFilterChange('status_filter')}
                      className="input"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="Minimum score"
                      value={filters.min_score}
                      onChange={handleFilterChange('min_score')}
                      className="input"
                    />
                    <input
                      value={filters.skill_contains}
                      onChange={handleFilterChange('skill_contains')}
                      placeholder="Skill contains"
                      className="input"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Minimum experience"
                      value={filters.min_experience}
                      onChange={handleFilterChange('min_experience')}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">Candidate rankings</p>
              <h2 className="text-2xl font-semibold text-white">Ranked applicants</h2>
            </div>
            <p className="text-sm text-white/60">Click a card to expand and review candidate score details.</p>
          </div>

          {loading ? (
            <div className="glass-card p-10 text-center text-white/60">Loading candidates…</div>
          ) : candidates.length === 0 ? (
            <div className="glass-card p-10 text-center text-white/60">No candidates available for this job yet.</div>
          ) : (
            <div className="grid gap-4">
              {candidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.ranking_id}
                  candidate={candidate}
                  rank={index + 1}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ResumeUploadModal
        jobId={id}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={() => {
          setShowUploadModal(false)
          fetchCandidates()
          toast.success('Resume uploaded successfully.')
        }}
      />
    </div>
  )
}
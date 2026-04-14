import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { jobsAPI } from '../services/api'
import toast from 'react-hot-toast'

const EXPERIENCE_OPTIONS = [
  'Entry', '0-1 years', '1-3 years', '2-4 years', '4-6 years', '5+ years', 'Senior', 'Lead', 'Manager'
]

export default function CreateJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    required_skills: '',
    experience_level: '2-4 years',
    education_requirement: '',
    deadline: '',
  })

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ;(async () => {
      try {
        const { data } = await jobsAPI.get(id)
        setJobData({
          title: data.title,
          description: data.description,
          required_skills: (data.required_skills || []).join(', '),
          experience_level: data.experience_level,
          education_requirement: data.education_requirement || '',
          deadline: data.deadline ? data.deadline.slice(0, 16) : '',
        })
      } catch (error) {
        toast.error('Unable to load job details.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleChange = (field) => (event) => {
    setJobData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: jobData.title.trim(),
        description: jobData.description.trim(),
        required_skills: jobData.required_skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience_level: jobData.experience_level,
        education_requirement: jobData.education_requirement.trim() || null,
        deadline: jobData.deadline || null,
      }

      if (id) {
        await jobsAPI.update(id, payload)
        toast.success('Job updated successfully.')
      } else {
        await jobsAPI.create(payload)
        toast.success('Job posted successfully.')
      }
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to save job.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="glass-card p-8 space-y-6">
          <div>
            <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">{id ? 'Edit job' : 'New posting'}</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{id ? 'Update job requirements' : 'Create a new job posting'}</h1>
            <p className="mt-2 text-white/60">Capture the exact skills and experience you want from candidates.</p>
          </div>

          {loading ? (
            <div className="py-14 text-center text-white/60">Loading job details…</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="label">Job title</label>
                <input
                  id="title"
                  value={jobData.title}
                  onChange={handleChange('title')}
                  className="input"
                  placeholder="Senior Backend Engineer"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="label">Job description</label>
                <textarea
                  id="description"
                  value={jobData.description}
                  onChange={handleChange('description')}
                  className="input min-h-[140px] resize-none"
                  placeholder="Describe the responsibilities, team, and ideal candidate."
                  required
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label htmlFor="required_skills" className="label">Required skills</label>
                  <input
                    id="required_skills"
                    value={jobData.required_skills}
                    onChange={handleChange('required_skills')}
                    className="input"
                    placeholder="Python, FastAPI, PostgreSQL"
                  />
                  <p className="mt-2 text-xs text-white/50">Separate skills with commas.</p>
                </div>

                <div>
                  <label htmlFor="experience_level" className="label">Experience level</label>
                  <select
                    id="experience_level"
                    value={jobData.experience_level}
                    onChange={handleChange('experience_level')}
                    className="input"
                  >
                    {EXPERIENCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label htmlFor="education_requirement" className="label">Education requirement</label>
                  <input
                    id="education_requirement"
                    value={jobData.education_requirement}
                    onChange={handleChange('education_requirement')}
                    className="input"
                    placeholder="Bachelor of Technology"
                  />
                </div>
                <div>
                  <label htmlFor="deadline" className="label">Application deadline</label>
                  <input
                    id="deadline"
                    type="datetime-local"
                    value={jobData.deadline}
                    onChange={handleChange('deadline')}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/60">You can always update the posting later.</p>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving…' : id ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

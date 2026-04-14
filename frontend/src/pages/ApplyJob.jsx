import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FileUpload from '../components/FileUpload'
import { jobsAPI, candidatesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ApplyJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await jobsAPI.get(jobId)
        setJob(data)
      } catch {
        toast.error('Could not load the job. Please verify the link.')
      }
    })()
  }, [jobId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!resumeFile) {
      toast.error('Please upload a resume file.')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', email.trim())
      formData.append('job_id', jobId)
      formData.append('resume', resumeFile)
      const { data } = await candidatesAPI.upload(formData)
      toast.success(data.message)
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Resume upload failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 py-10 px-4">
      <div className="max-w-3xl mx-auto glass-card p-8">
        <div className="space-y-4">
          <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">Candidate application</p>
          <h1 className="text-3xl font-semibold text-white">Apply for {job?.title || 'this position'}</h1>
          <p className="text-white/60">Upload your resume and submit your details to apply for this role.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="label">Resume file</label>
            <FileUpload onFileSelect={setResumeFile} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >Back to dashboard</button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { candidatesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ResumeUploadModal({ jobId, isOpen, onClose, onUploadSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    const isValid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selected.type)
    if (!isValid) {
      toast.error('Please upload a PDF or DOCX file.')
      return
    }
    setFile(selected)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !file) {
      toast.error('Name, email, and resume file are required.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', email.trim())
      formData.append('job_id', jobId)
      formData.append('resume', file)

      const { data } = await candidatesAPI.upload(formData)
      toast.success(data.message || 'Resume uploaded successfully.')
      setName('')
      setEmail('')
      setFile(null)
      onUploadSuccess?.()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-surface-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-brand-300 uppercase tracking-[0.35em]">Upload resume</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Submit candidate resume</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
            type="button"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="candidate-name" className="label">Candidate name</label>
            <input
              id="candidate-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="candidate-email" className="label">Candidate email</label>
            <input
              id="candidate-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="jane.doe@example.com"
              required
            />
          </div>

          <div>
            <label className="label">Resume file</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-400"
            />
            {file && (
              <p className="mt-2 text-sm text-white/70">Selected: {file.name}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Parsing resume…' : 'Upload and parse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

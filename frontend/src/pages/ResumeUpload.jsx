import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { candidatesAPI, jobsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { User, FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'

export default function ResumeUpload() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [jobLoading, setJobLoading] = useState(true)

  // Step 1: Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    name: '',
    email: ''
  })

  // Step 2: File Upload
  const [file, setFile] = useState(null)

  // Step 3: Confirmation
  const [uploadResult, setUploadResult] = useState(null)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await jobsAPI.get(jobId)
        setJob(data)
      } catch (error) {
        toast.error('Job not found or no longer available.')
        navigate('/')
      } finally {
        setJobLoading(false)
      }
    }
    fetchJob()
  }, [jobId, navigate])

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return

    // Client-side validation for file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const fileExtension = selected.name.toLowerCase().split('.').pop()

    if (!allowedTypes.includes(selected.type) && !['pdf', 'docx'].includes(fileExtension)) {
      toast.error('Invalid file type. Please upload a PDF or DOCX file.')
      return
    }

    setFile(selected)
  }

  const validateStep1 = () => {
    if (!personalDetails.name.trim()) {
      toast.error('Please enter your full name.')
      return false
    }
    if (!personalDetails.email.trim() || !personalDetails.email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!file) {
      toast.error('Please select a resume file to upload.')
      return false
    }
    return true
  }

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', personalDetails.name.trim())
      formData.append('email', personalDetails.email.trim())
      formData.append('job_id', jobId)
      formData.append('resume', file)

      const { data } = await candidatesAPI.upload(formData)
      setUploadResult(data)
      setCurrentStep(3)
      toast.success('Resume uploaded and processed successfully!')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading job details...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Job not found.</div>
      </div>
    )
  }

  const steps = [
    { number: 1, title: 'Personal Details', icon: User },
    { number: 2, title: 'Upload Resume', icon: FileText },
    { number: 3, title: 'Confirmation', icon: CheckCircle }
  ]

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Apply for Position</h1>
          <p className="text-white/60">{job.title} at {job.company}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number

            return (
              <React.Fragment key={step.number}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                  isCompleted ? 'bg-green-500 border-green-500' :
                  isActive ? 'border-brand-500 bg-brand-500/20' :
                  'border-white/30 bg-white/5'
                }`}>
                  <Icon size={20} className={isCompleted || isActive ? 'text-white' : 'text-white/50'} />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-white/30'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="glass-card p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">Personal Information</h2>
                <p className="text-white/60">Please provide your contact details</p>
              </div>

              <div>
                <label className="label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={personalDetails.name}
                  onChange={(e) => setPersonalDetails(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={personalDetails.email}
                  onChange={(e) => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">Upload Your Resume</h2>
                <p className="text-white/60">Upload your resume in PDF or DOCX format</p>
              </div>

              <div>
                <label className="label">Resume File</label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-400 file:cursor-pointer"
                />
                {file && (
                  <p className="mt-2 text-sm text-green-400">Selected: {file.name}</p>
                )}
                <p className="mt-2 text-xs text-white/50">Only PDF and DOCX files are accepted. Maximum size: 10MB.</p>
              </div>
            </div>
          )}

          {currentStep === 3 && uploadResult && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle size={64} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Application Submitted!</h2>
                <p className="text-white/60 mb-4">Your resume has been successfully uploaded and processed.</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 text-left">
                <h3 className="text-lg font-semibold text-white mb-3">Application Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-white/60">Name:</span> {personalDetails.name}</p>
                  <p><span className="text-white/60">Email:</span> {personalDetails.email}</p>
                  <p><span className="text-white/60">Position:</span> {job.title}</p>
                  <p><span className="text-white/60">File:</span> {file?.name}</p>
                  {uploadResult.match_score && (
                    <p><span className="text-white/60">Match Score:</span> {Math.round(uploadResult.match_score * 100)}%</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-white/60">
                You will receive an email confirmation shortly. Thank you for applying!
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={currentStep === 1 ? () => navigate('/') : prevStep}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <ArrowLeft size={16} />
              {currentStep === 1 ? 'Back to Jobs' : 'Previous'}
            </button>

            <div className="flex gap-3">
              {currentStep < 3 && (
                <button
                  type="button"
                  onClick={currentStep === 2 ? handleSubmit : nextStep}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? 'Processing...' : currentStep === 2 ? 'Submit Application' : 'Next'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  View More Jobs
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
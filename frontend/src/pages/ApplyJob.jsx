import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { jobsAPI, candidatesAPI } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowRight, ArrowLeft, User, FileText, CheckCircle, Upload, X } from 'lucide-react'

export default function ApplyJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    resumeFile: null
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await jobsAPI.get(jobId)
        setJob(data)
      } catch {
        toast.error('Could not load the job. Please verify the link.')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [jobId, navigate])

  useEffect(() => {
    // Redirect logic based on authentication status
    if (!loading && job) {
      if (!isAuthenticated) {
        // Not authenticated - redirect to candidate login
        navigate(`/candidate-login?redirect=/upload-resume/${jobId}`)
      } else if (user?.role === 'candidate') {
        // Authenticated as candidate - redirect to resume upload
        navigate(`/upload-resume/${jobId}`)
      }
      // HR users stay on this page (can use the upload form)
    }
  }, [isAuthenticated, user, loading, job, jobId, navigate])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Strict file validation: only allow .pdf and .docx
    const fileExtension = file.name.toLowerCase().split('.').pop()
    if (!['pdf', 'docx'].includes(fileExtension)) {
      toast.error('Invalid file type. Please upload a PDF or DOCX resume.')
      // Reset the file input
      event.target.value = ''
      setFormData(prev => ({ ...prev, resumeFile: null }))
      return
    }

    setFormData(prev => ({ ...prev, resumeFile: file }))
  }

  const removeFile = () => {
    setFormData(prev => ({ ...prev, resumeFile: null }))
    // Reset the file input element
    const fileInput = document.getElementById('resume-file')
    if (fileInput) fileInput.value = ''
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          toast.error('Please enter the candidate\'s full name.')
          return false
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          toast.error('Please enter a valid email address.')
          return false
        }
        return true
      case 2:
        if (!formData.resumeFile) {
          toast.error('Please select a resume file to upload.')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return

    setSubmitting(true)
    try {
      const submitData = new FormData()
      submitData.append('name', formData.name.trim())
      submitData.append('email', formData.email.trim())
      submitData.append('job_id', jobId)
      submitData.append('resume', formData.resumeFile)

      const { data } = await candidatesAPI.upload(submitData)
      toast.success(data.message || 'Resume uploaded successfully.')
      setCurrentStep(3)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Resume upload failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Details', icon: User },
    { number: 2, title: 'Upload', icon: FileText },
    { number: 3, title: 'Done', icon: CheckCircle }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading job details...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Job not found.</div>
      </div>
    )
  }

  // For HR users: show the 3-step upload form
  if (user?.role === 'hr') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit Application</h1>
            <p className="text-slate-600">{job.title} at {job.company}</p>
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
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-600' :
                    'border-slate-300 bg-white text-slate-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-300'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Candidate Details</h2>
                  <p className="text-slate-600">Enter the candidate's contact information</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Jane Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="jane.doe@example.com"
                    required
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Upload Resume</h2>
                  <p className="text-slate-600">Select the candidate's resume file</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Resume File
                  </label>

                  {!formData.resumeFile ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <div className="text-sm">
                        <label htmlFor="resume-file" className="cursor-pointer">
                          <span className="font-medium text-indigo-600 hover:text-indigo-500">
                            Click to upload
                          </span>
                          <span className="text-slate-500"> or drag and drop</span>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">PDF or DOCX files only</p>
                      <input
                        id="resume-file"
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formData.resumeFile.name}</p>
                          <p className="text-xs text-slate-500">
                            {(formData.resumeFile.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle size={64} className="text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Application Submitted!</h2>
                  <p className="text-slate-600">The candidate's resume has been successfully uploaded and processed.</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 text-left">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Submission Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-600">Name:</span> {formData.name}</p>
                    <p><span className="text-slate-600">Email:</span> {formData.email}</p>
                    <p><span className="text-slate-600">Position:</span> {job.title}</p>
                    <p><span className="text-slate-600">File:</span> {formData.resumeFile?.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={currentStep === 1 ? () => navigate('/dashboard') : prevStep}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                disabled={submitting}
              >
                <ArrowLeft size={16} />
                {currentStep === 1 ? 'Back to Dashboard' : 'Previous'}
              </button>

              <div className="flex gap-3">
                {currentStep < 3 && (
                  <button
                    type="button"
                    onClick={currentStep === 2 ? handleSubmit : nextStep}
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {submitting ? 'Submitting...' : currentStep === 2 ? 'Submit Application' : 'Next'}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback for any other case (shouldn't reach here normally)
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="mb-6">
          <User size={48} className="text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Apply for {job.title}</h1>
          <p className="text-slate-600">at {job.company}</p>
        </div>

        <p className="text-slate-600 mb-6">
          To apply for this position, please use the candidate portal.
        </p>

        <button
          onClick={() => navigate('/candidate-login')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          Go to Candidate Portal
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

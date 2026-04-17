import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, Users, User } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState('hr')

  // Autofill credentials when role changes
  useEffect(() => {
    if (userRole === 'hr') {
      setEmail('hr@company.com')
      setPassword('password123')
    } else {
      setEmail('candidate@email.com')
      setPassword('password123')
    }
  }, [userRole])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const user = await login(email.trim(), password, userRole)
      toast.success('Welcome back!')
      
      // Redirect based on role
      if (user.role === 'candidate') {
        navigate('/apply')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'hr', label: 'HR Portal', icon: Users, description: 'Manage jobs and review candidates' },
    { value: 'candidate', label: 'Candidate Portal', icon: User, description: 'Apply for jobs and submit resumes' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-900">
      <div className="w-full max-w-md bg-surface-800 rounded-2xl shadow-2xl border border-white/10 p-8">
        {/* Role Selection Tabs */}
        <div className="mb-8">
          <div className="flex rounded-xl bg-surface-700 p-1 border border-white/10">
            {roleOptions.map((option) => {
              const Icon = option.icon
              const isSelected = userRole === option.value
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUserRole(option.value)}
                  className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-surface-600'
                  }`}
                >
                  <Icon size={18} />
                  <span>{option.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
          
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold text-white">
              {roleOptions.find(opt => opt.value === userRole)?.label}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {roleOptions.find(opt => opt.value === userRole)?.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-700 border border-white/10 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="you@company.com"
                required
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-700 border border-white/10 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

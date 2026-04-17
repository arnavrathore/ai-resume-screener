import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock } from 'lucide-react'

export default function CandidateLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/upload-resume'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      if (user.role !== 'candidate') {
        toast.error('This login is for candidates only. Please use the HR portal.')
        return
      }
      toast.success('Welcome back!')
      navigate(redirectTo)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-8">
        <div className="mb-8 text-center">
          <p className="text-sm text-brand-300 font-semibold uppercase tracking-[0.35em]">Candidate Portal</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Login to Apply</h1>
          <p className="mt-2 text-sm text-white/60">Secure access for candidates to submit their resumes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pr-10"
                placeholder="you@company.com"
                required
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            Don't have an account?{' '}
            <a href="/hr-login" className="text-brand-400 hover:text-brand-300 transition-colors">
              HR Portal
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
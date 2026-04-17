/**
 * api.js — Axios client pre-configured for the FastAPI backend.
 * All requests use /api prefix which Vite proxies to http://localhost:8000
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response interceptor: redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

// ── Jobs ───────────────────────────────────────────────────────────────────
export const jobsAPI = {
  list:    (activeOnly = true, search = '') => api.get('/jobs', {
    params: { active_only: activeOnly, search: search || undefined },
  }),
  summary: (activeOnly = true) => api.get('/jobs/summary', {
    params: { active_only: activeOnly },
  }),
  get:     (id)    => api.get(`/jobs/${id}`),
  create:  (data)  => api.post('/jobs', data),
  update:  (id, data) => api.put(`/jobs/${id}`, data),
  delete:  (id)    => api.delete(`/jobs/${id}`),
}

// ── Candidates ─────────────────────────────────────────────────────────────
export const candidatesAPI = {  listAll:    ()        => api.get('/candidates'),  upload:     (formData) => api.post('/candidates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listByJob:  (jobId)  => api.get(`/candidates/job/${jobId}`),
  get:        (id)     => api.get(`/candidates/${id}`),
  delete:     (id)     => api.delete(`/candidates/${id}`),
}

// ── Rankings ───────────────────────────────────────────────────────────────
export const rankingsAPI = {
  run:          (jobId, weights) => api.post(`/rankings/run/${jobId}`, weights),
  get:          (jobId, params)  => api.get(`/rankings/${jobId}`, { params }),
  updateStatus: (rankingId, status) => api.patch(`/rankings/${rankingId}/status`, { status }),
  getWeights:   () => api.get('/rankings/config/weights'),
  updateWeights:(data) => api.put('/rankings/config/weights', data),
}

export default api

/**
 * JobCard.jsx — Card shown in the HR Dashboard job listing.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, Briefcase, ChevronRight, BookOpen, Upload } from 'lucide-react'

function formatDeadline(deadline) {
  if (!deadline) return 'No deadline'
  const d = new Date(deadline)
  const now = new Date()
  const diff = Math.ceil((d - now) / 86400000)
  if (diff < 0)  return 'Expired'
  if (diff === 0) return 'Due today'
  if (diff <= 7)  return `${diff}d left`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function JobCard({ job, onDelete }) {
  const deadlineText = formatDeadline(job.deadline)
  const isExpired    = deadlineText === 'Expired'

  return (
    <div className="glass-card p-5 hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-brand-500/10 group animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {/* Active / Expired badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge ${job.is_active && !isExpired ? 'badge-shortlisted' : 'badge-rejected'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${job.is_active && !isExpired ? 'bg-green-400' : 'bg-red-400'}`} />
              {job.is_active && !isExpired ? 'Active' : 'Closed'}
            </span>
            <span className="text-white/30 text-xs">#{job.id}</span>
          </div>

          <h3 className="font-semibold text-white text-base leading-snug truncate group-hover:text-brand-300 transition-colors">
            {job.title}
          </h3>

          <p className="text-white/50 text-xs mt-1.5 line-clamp-2">{job.description}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Briefcase size={12} /> {job.experience_level}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} /> {job.candidate_count} applicant{job.candidate_count !== 1 ? 's' : ''}
            </span>
            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400/70' : ''}`}>
              <Clock size={12} /> {deadlineText}
            </span>
            {job.education_requirement && (
              <span className="flex items-center gap-1">
                <BookOpen size={12} /> {job.education_requirement}
              </span>
            )}
          </div>

          {/* Skills */}
          {job.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.required_skills.slice(0, 5).map((s) => (
                <span key={s} className="skill-pill">{s}</span>
              ))}
              {job.required_skills.length > 5 && (
                <span className="skill-pill opacity-60">+{job.required_skills.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Link
            to={`/jobs/${job.id}`}
            className="btn-primary text-xs px-3 py-1.5"
          >
            View <ChevronRight size={13} />
          </Link>
          <Link
            to={`/apply/${job.id}`}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            <Upload size={13} />
            Upload
          </Link>
          <Link
            to={`/jobs/${job.id}/edit`}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(job.id)}
            className="btn-danger text-xs px-3 py-1.5"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

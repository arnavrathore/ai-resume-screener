/**
 * CandidateCard.jsx — Ranked candidate row for the Job Detail page.
 */
import React, { useState } from 'react'
import { Mail, FileText, GraduationCap, Briefcase, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react'
import ScoreBadge from './ScoreBadge'
import { rankingsAPI } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     cls: 'badge-pending',     icon: Clock },
  shortlisted: { label: 'Shortlisted', cls: 'badge-shortlisted', icon: CheckCircle },
  rejected:    { label: 'Rejected',    cls: 'badge-rejected',    icon: XCircle },
}

function ScoreBar({ label, value }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/50">{label}</span>
        <span className="text-white font-medium">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function CandidateCard({ candidate, rank, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [status,   setStatus]   = useState(candidate.status)

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  const updateStatus = async (newStatus) => {
    try {
      setLoading(true)
      await rankingsAPI.updateStatus(candidate.ranking_id, newStatus)
      setStatus(newStatus)
      toast.success(`Candidate ${newStatus}`)
      onStatusChange?.(candidate.candidate_id, newStatus)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`glass-card overflow-hidden transition-all duration-300
      ${rank === 1 ? 'border-brand-500/40 shadow-brand-500/10 shadow-xl' : 'hover:border-white/20'}`}>

      {/* Rank ribbon for #1 */}
      {rank === 1 && (
        <div className="bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white flex items-center gap-2">
          🏆 Top Match
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Score ring */}
          <ScoreBadge score={candidate.total_score} size={64} />

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/30 text-xs font-mono">#{rank}</span>
                  <h3 className="font-semibold text-white text-base">{candidate.candidate_name}</h3>
                  <span className={`badge ${cfg.cls}`}>
                    <StatusIcon size={11} /> {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40 flex-wrap">
                  <span className="flex items-center gap-1"><Mail size={11} />{candidate.candidate_email}</span>
                  <span className="flex items-center gap-1"><FileText size={11} />{candidate.resume_filename}</span>
                  <span className="flex items-center gap-1"><Briefcase size={11} />{candidate.parsed_experience}y exp</span>
                  <span className="flex items-center gap-1"><GraduationCap size={11} />{candidate.parsed_education || '—'}</span>
                </div>
                <div className="mt-4 max-w-md">
                  <ScoreBar label="Match Score" value={candidate.total_score} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {status !== 'shortlisted' && (
                  <button
                    onClick={() => updateStatus('shortlisted')}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               bg-green-500/20 border border-green-500/30 text-green-400
                               hover:bg-green-500/30 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={12} /> Shortlist
                  </button>
                )}
                {status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus('rejected')}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               bg-red-500/20 border border-red-500/30 text-red-400
                               hover:bg-red-500/30 transition-all disabled:opacity-50"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                )}
                {status !== 'pending' && (
                  <button
                    onClick={() => updateStatus('pending')}
                    disabled={loading}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Skills */}
            {candidate.parsed_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {candidate.parsed_skills.slice(0, 8).map((s) => (
                  <span key={s} className="skill-pill">{s}</span>
                ))}
                {candidate.parsed_skills.length > 8 && (
                  <span className="skill-pill opacity-60">+{candidate.parsed_skills.length - 8}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-xs text-white/40 hover:text-brand-400 transition-colors w-full justify-center"
        >
          Score Breakdown
          <ChevronDown size={13} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Score breakdown bars */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-x-8 gap-y-3 animate-fade-in">
            <ScoreBar label="Skills Match"    value={candidate.skill_score} />
            <ScoreBar label="Experience"      value={candidate.experience_score} />
            <ScoreBar label="Education"       value={candidate.education_score} />
            <ScoreBar label="Keyword Overlap" value={candidate.keyword_score} />
          </div>
        )}
      </div>
    </div>
  )
}

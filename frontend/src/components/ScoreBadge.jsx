/**
 * ScoreBadge.jsx — Circular score ring + percentage display.
 */
import React from 'react'

function getScoreColor(score) {
  if (score >= 70) return { stroke: '#4ade80', text: 'text-green-400', bg: 'rgba(74,222,128,0.1)' }
  if (score >= 45) return { stroke: '#facc15', text: 'text-yellow-400', bg: 'rgba(250,204,21,0.1)' }
  return           { stroke: '#f87171', text: 'text-red-400',   bg: 'rgba(248,113,113,0.1)' }
}

export default function ScoreBadge({ score, size = 72 }) {
  const { stroke, text, bg } = getScoreColor(score)
  const radius     = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset     = circumference - (score / 100) * circumference
  const fontSize   = size < 60 ? 'text-xs' : 'text-sm'

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, background: bg }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={stroke} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className={`relative font-bold ${fontSize} ${text}`}>
        {Math.round(score)}%
      </span>
    </div>
  )
}

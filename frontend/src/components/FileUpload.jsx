/**
 * FileUpload.jsx — Drag-and-drop file upload zone for resumes.
 */
import React, { useRef, useState } from 'react'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'

export default function FileUpload({ onFileSelect, accept = '.pdf,.docx', maxMB = 10 }) {
  const inputRef = useRef(null)
  const [file,     setFile]     = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState(null)

  const validate = (f) => {
    setError(null)
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are accepted.')
      return false
    }
    if (f.size > maxMB * 1024 * 1024) {
      setError(`File size must be under ${maxMB} MB.`)
      return false
    }
    return true
  }

  const handleFile = (f) => {
    if (f && validate(f)) {
      setFile(f)
      onFileSelect(f)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const removeFile = (e) => {
    e.stopPropagation()
    setFile(null)
    setError(null)
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${file    ? 'border-green-500/40 bg-green-500/5 cursor-default' :
            dragging ? 'border-brand-500 bg-brand-500/10 scale-[1.01]' :
                       'border-white/15 hover:border-brand-500/50 hover:bg-brand-500/5'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {file ? (
          /* File selected state */
          <div className="flex items-center justify-center gap-3">
            <CheckCircle size={28} className="text-green-400 shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-white font-medium text-sm truncate">{file.name}</p>
              <p className="text-white/40 text-xs mt-0.5">
                {(file.size / 1024).toFixed(0)} KB • {file.name.split('.').pop().toUpperCase()}
              </p>
            </div>
            <button
              onClick={removeFile}
              className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
              title="Remove file"
            >
              <X size={16} className="text-white/50" />
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200
              ${dragging ? 'bg-brand-500/30 scale-110' : 'bg-white/5'}`}
            >
              {dragging ? <Upload size={26} className="text-brand-400" /> : <FileText size={26} className="text-white/30" />}
            </div>
            <div>
              <p className="text-white/70 font-medium text-sm">
                {dragging ? 'Drop your resume here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-white/30 text-xs mt-1">PDF or DOCX · Max {maxMB} MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  )
}

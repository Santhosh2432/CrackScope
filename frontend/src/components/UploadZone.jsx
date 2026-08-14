import { useRef, useState } from 'react'

export default function UploadZone({ onFile, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = e => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  const handleChange = e => {
    const f = e.target.files[0]
    if (f) {
      onFile(f)
      e.target.value = ''
    }
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-custom py-14 px-10 text-center transition-all duration-300 shadow-sm
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${dragging 
          ? 'border-accent bg-accent/5 scale-[0.99] shadow-accent/5 shadow-lg' 
          : 'border-white/10 bg-surface hover:bg-surface-hover hover:border-white/20'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <div className={`text-5xl mb-4 leading-none transition-transform duration-300 ${dragging ? 'translate-y-[-4px] text-accent' : 'text-muted/60'}`}>
        ⬆
      </div>
      <div className="text-lg md:text-xl font-sans font-bold text-text-main mb-2">
        Drop your file here or <span className="text-accent underline underline-offset-4 decoration-accent/30 hover:decoration-accent">click to browse</span>
      </div>
      <div className="font-mono text-2xs md:text-xs text-muted max-w-md mx-auto leading-relaxed">
        Upload an image or video to detect wall cracks and windows
      </div>

      <div className="flex justify-center gap-2 mt-6 flex-wrap">
        {['JPG','PNG','BMP','WEBP','MP4','AVI','MOV','MKV'].map(f => (
          <span 
            key={f} 
            className="font-mono text-3xs px-2.5 py-1 rounded border border-white/5 bg-surface-active/50 text-muted uppercase tracking-wider"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}

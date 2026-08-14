import { useEffect, useState } from 'react'

export default function Header() {
  const [status, setStatus] = useState('checking')
  const [classes, setClasses] = useState([])

  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => {
        setStatus('online')
        setClasses([...d.models.crack, ...d.models.window])
      })
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <header className="py-10 border-b border-white/5 mb-12 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-accent/15 animate-pulse-glow">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
              <path d="M3 3h16v16H3z" stroke="#000" strokeWidth="1.8"/>
              <path d="M7 14l3-3 2 2 5-6" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight">
              Crack<span className="text-accent">Scope</span>
            </h1>
            <p className="font-mono text-2xs md:text-xs text-muted tracking-widest uppercase mt-1">
              YOLOv8 Wall Crack &amp; Window Detection System
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap items-center">
          <Pill 
            color={status === 'online' ? 'bg-window' : status === 'offline' ? 'bg-crack' : 'bg-minor'} 
            glow={status === 'online'}
          >
            {status === 'online' 
              ? `Model ready · ${classes.join(', ')}` 
              : status === 'offline' 
                ? 'Server offline — run start_backend.bat' 
                : 'Connecting...'}
          </Pill>
          <Pill color="bg-crack">Wall Crack</Pill>
          <Pill color="bg-window">Window</Pill>
        </div>
      </div>
    </header>
  )
}

function Pill({ color, glow, children }) {
  return (
    <div className="font-mono text-2xs md:text-xs px-3.5 py-1.5 rounded-full border border-white/5 bg-surface text-muted flex items-center gap-2 transition-all hover:border-white/10 hover:text-text-main shadow-sm">
      <span className={`w-1.5 h-1.5 rounded-full ${color} ${glow ? 'animate-ping duration-1000' : ''}`} />
      {children}
    </div>
  )
}

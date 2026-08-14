import { useState } from 'react'

const SEVERITY_COLORS = { 
  minor: 'text-minor border-minor/20 bg-minor/5', 
  moderate: 'text-moderate border-moderate/20 bg-moderate/5', 
  severe: 'text-severe border-severe/20 bg-severe/5' 
}

const CLASS_BADGES = {
  wallcrack: 'text-crack bg-crack-dim border-crack/20',
  window: 'text-window bg-window-dim border-window/20',
}

export default function ResultView({ result, onClear }) {
  if (!result) return null

  const { result_url, total_detections, counts, detections, total_frames, filename, type } = result
  const crackCount  = Object.entries(counts).filter(([k]) => k.includes('crack')).reduce((s,[,v])=>s+v,0)
  const windowCount = Object.entries(counts).filter(([k]) => k.includes('window')).reduce((s,[,v])=>s+v,0)

  return (
    <div className="animate-[fadeUp_0.4s_ease-out]">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-sans font-extrabold tracking-tight text-text-main flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          Detection Results
        </h2>
        <button 
          onClick={onClear} 
          className="font-mono text-2xs px-3.5 py-1.5 bg-surface-active/30 border border-white/5 text-muted hover:text-accent hover:border-accent/40 rounded-md cursor-pointer transition-all duration-300 uppercase tracking-wider"
        >
          ✕ Clear
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Detections" value={total_detections} color="text-accent border-accent/15" glow="shadow-accent/5" />
        <StatCard label="Wall Cracks" value={crackCount} color="text-crack border-crack/15" glow="shadow-crack/5" />
        <StatCard label="Windows Detected" value={windowCount} color="text-window border-window/15" glow="shadow-window/5" />
        {total_frames ? (
          <StatCard label="Total Frames" value={total_frames} color="text-purple-400 border-purple-400/15" glow="shadow-purple-400/5" />
        ) : (
          <StatCard label="Resource Type" value={type.toUpperCase()} color="text-blue-400 border-blue-400/15" glow="shadow-blue-400/5" />
        )}
      </div>

      {/* Legend & Summary */}
      <div className="flex gap-4 mb-5 flex-wrap items-center bg-surface/50 border border-white/5 p-4 rounded-custom">
        <span className="font-mono text-3xs uppercase tracking-widest text-muted mr-2">Legend:</span>
        <LegendItem color="bg-crack" label="Wall Crack"/>
        <LegendItem color="bg-window" label="Window"/>
        <LegendItem color="bg-minor" label="Minor Severity"/>
        <LegendItem color="bg-moderate" label="Moderate Severity"/>
        <LegendItem color="bg-severe" label="Severe Severity"/>
      </div>

      {/* Output Media Card */}
      <div className="bg-surface border border-white/5 rounded-custom overflow-hidden mb-6 shadow-xl shadow-black/30">
        <div className="px-5 py-3.5 border-b border-white/5 bg-surface-hover/80 flex justify-between items-center font-mono text-2xs">
          <span className="text-text-main font-semibold truncate max-w-[200px] md:max-w-xs">{filename}</span>
          <a 
            href={result_url} 
            download 
            className="px-3.5 py-1.5 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black text-accent rounded-md text-decoration-none transition-all duration-300 font-bold tracking-wider"
          >
            ⬇ Download
          </a>
        </div>
        
        <div className="relative group bg-black aspect-video md:max-h-[580px] flex items-center justify-center">
          {type === 'video' ? (
            <video
              key={result_url}
              src={result_url}
              controls
              preload="metadata"
              playsInline
              className="w-full h-full max-h-[580px] object-contain"
              onError={(e) => {
                const parent = e.target.parentElement
                if (parent && !parent.querySelector('.video-error')) {
                  const msg = document.createElement('div')
                  msg.className = 'video-error absolute inset-0 flex items-center justify-center text-center p-6 bg-black/90 font-mono text-xs text-crack'
                  msg.innerHTML = '⚠ Video play failed in browser.<br/>Please download to play on your media player.'
                  parent.appendChild(msg)
                }
              }}
            />
          ) : (
            <img 
              src={result_url} 
              alt="detection result" 
              className="w-full h-full max-h-[580px] object-contain" 
            />
          )}
        </div>
      </div>

      {/* Detection Table */}
      {detections && detections.length > 0 && (
        <div className="space-y-3">
          <div className="font-mono text-2xs text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Detections Breakdown</span>
            <span className="text-accent font-semibold">({detections.length} total)</span>
          </div>
          
          <div className="bg-surface border border-white/5 rounded-custom overflow-hidden shadow-lg max-h-[360px] overflow-y-auto">
            <table className="w-full border-collapse font-mono text-xs text-left">
              <thead className="bg-surface-hover/80 text-muted sticky top-0 border-b border-white/5 backdrop-blur-md z-10">
                <tr>
                  <th className="py-3 px-4 font-normal text-3xs uppercase tracking-wider text-center w-12">#</th>
                  <th className="py-3 px-4 font-normal text-3xs uppercase tracking-wider">Class</th>
                  <th className="py-3 px-4 font-normal text-3xs uppercase tracking-wider">Severity</th>
                  <th className="py-3 px-4 font-normal text-3xs uppercase tracking-wider text-center">Confidence</th>
                  <th className="py-3 px-4 font-normal text-3xs uppercase tracking-wider">Bounding Box</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {detections.map((d, i) => {
                  const isCrack = d.class.includes('crack')
                  const badgeStyle = CLASS_BADGES[d.class] || 'text-muted border-white/10'
                  const confPct    = Math.round(d.confidence * 100)
                  const sevStyle   = SEVERITY_COLORS[d.severity] || 'text-muted border-white/5 bg-transparent'
                  
                  return (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-4 text-center text-muted text-2xs">{i+1}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded border text-3xs font-extrabold uppercase tracking-wide ${badgeStyle}`}>
                          {d.class}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {d.severity ? (
                          <span className={`inline-block px-2.5 py-0.5 rounded border text-3xs font-extrabold uppercase tracking-wide ${sevStyle}`}>
                            {d.severity}
                          </span>
                        ) : (
                          <span className="text-muted/50">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                            <div 
                              className="h-full bg-accent rounded-full shadow-[0_0_4px_#d8ff33]" 
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-text-main text-2xs w-8 text-right">{confPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted text-3xs">
                        [{d.bbox.join(', ')}]
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, glow }) {
  return (
    <div className={`bg-surface border border-white/5 rounded-custom p-4.5 transition-all duration-300 hover:border-white/10 hover:translate-y-[-2px] shadow-sm hover:shadow-md ${glow}`}>
      <div className="font-mono text-3xs text-muted uppercase tracking-wider mb-2.5">{label}</div>
      <div className={`text-2xl md:text-3xl font-sans font-extrabold leading-none ${color}`}>{value}</div>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2 font-mono text-3xs text-muted">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  )
}

export default function DetectionHistory({ history, onSelect, onClear }) {
  if (!history.length) return null

  return (
    <div className="mt-12 relative z-10">
      <div className="flex justify-between items-center mb-4">
        <div className="font-mono text-2xs text-muted uppercase tracking-wider">
          Detection History ({history.length})
        </div>
        <button 
          onClick={onClear} 
          className="font-mono text-3xs px-2.5 py-1 bg-surface-active/30 border border-white/5 hover:border-crack/40 hover:text-crack text-muted rounded-md cursor-pointer transition-all duration-300 uppercase tracking-widest"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {history.map((item, i) => {
          const crackCount  = Object.entries(item.counts).filter(([k])=>k.includes('crack')).reduce((s,[,v])=>s+v,0)
          const windowCount = Object.entries(item.counts).filter(([k])=>k.includes('window')).reduce((s,[,v])=>s+v,0)
          const time = new Date(item.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

          return (
            <div
              key={i}
              onClick={() => onSelect(item)}
              className="bg-surface border border-white/5 rounded-custom overflow-hidden cursor-pointer transition-all duration-300 hover:border-accent hover:translate-y-[-2px] hover:shadow-md hover:shadow-black/20 group"
            >
              <div className="h-28 overflow-hidden bg-black relative flex items-center justify-center">
                {item.type === 'video' ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 text-muted text-2xs font-mono">
                    <span className="text-2xl transition-transform duration-300 group-hover:scale-110">🎬</span>
                    <span>Video Output</span>
                  </div>
                ) : (
                  <img 
                    src={item.result_url} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-sm rounded px-2 py-0.5 font-mono text-3xs text-text-main border border-white/5">
                  {time}
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-mono text-2xs text-text-main font-semibold mb-2 truncate group-hover:text-accent transition-colors">
                  {item.filename}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Tag textcolor="text-crack" bg="bg-crack-dim border-crack/10">
                    {crackCount} crack{crackCount !== 1 ? 's' : ''}
                  </Tag>
                  <Tag textcolor="text-window" bg="bg-window-dim border-window/10">
                    {windowCount} window{windowCount !== 1 ? 's' : ''}
                  </Tag>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tag({ textcolor, bg, children }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-3xs font-mono font-bold ${textcolor} ${bg}`}>
      {children}
    </span>
  )
}

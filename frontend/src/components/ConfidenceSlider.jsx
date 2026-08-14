export default function ConfidenceSlider({ value, onChange }) {
  return (
    <div className="bg-surface border border-white/5 rounded-custom p-5 mb-4 shadow-sm hover:border-white/10 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="font-mono text-2xs md:text-xs text-muted uppercase tracking-wider">
          Confidence Threshold
        </span>
        <span className="font-mono text-sm font-bold text-accent bg-accent-dim px-3 py-1 rounded-md border border-accent/10">
          {value.toFixed(2)}
        </span>
      </div>

      <input
        type="range"
        min="0.10" max="0.90" step="0.05"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent cursor-ew-resize h-1.5 bg-white/5 rounded-lg appearance-none transition-all hover:bg-white/10"
      />

      <div className="flex justify-between mt-3">
        <span className="font-mono text-3xs md:text-2xs text-muted">0.10 — More detections</span>
        <span className="font-mono text-3xs md:text-2xs text-muted">0.90 — Higher precision</span>
      </div>
    </div>
  )
}

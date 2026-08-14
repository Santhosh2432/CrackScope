const SEVERITY_COLORS = { minor: '#ffd166', moderate: '#ff9f1c', severe: '#ff4444' }

export default function ReportExport({ result }) {
  if (!result || !result.detections) return null

  const exportCSV = () => {
    const rows = [
      ['#', 'Class', 'Severity', 'Confidence', 'X1', 'Y1', 'X2', 'Y2'],
      ...result.detections.map((d, i) => [
        i + 1, d.class, d.severity || '-',
        (d.confidence * 100).toFixed(1) + '%',
        ...d.bbox
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    download(`crackscope_report_${Date.now()}.csv`, 'text/csv', csv)
  }

  const exportJSON = () => {
    const data = {
      filename:         result.filename,
      timestamp:        new Date(result.timestamp * 1000).toISOString(),
      total_detections: result.total_detections,
      counts:           result.counts,
      detections:       result.detections,
    }
    download(`crackscope_report_${Date.now()}.json`, 'application/json', JSON.stringify(data, null, 2))
  }

  const exportTXT = () => {
    const cracks  = result.detections.filter(d => d.class.includes('crack'))
    const windows = result.detections.filter(d => d.class.includes('window'))
    const sevCounts = cracks.reduce((acc, d) => { acc[d.severity] = (acc[d.severity]||0)+1; return acc }, {})

    const lines = [
      '========================================',
      '   CrackScope Inspection Report',
      '========================================',
      `File      : ${result.filename}`,
      `Date      : ${new Date(result.timestamp * 1000).toLocaleString()}`,
      `Total     : ${result.total_detections} detection(s)`,
      '',
      'SUMMARY',
      '----------------------------------------',
      `Wall Cracks : ${cracks.length}`,
      `  - Minor    : ${sevCounts.minor || 0}`,
      `  - Moderate : ${sevCounts.moderate || 0}`,
      `  - Severe   : ${sevCounts.severe || 0}`,
      `Windows     : ${windows.length}`,
      '',
      'DETECTIONS',
      '----------------------------------------',
      ...result.detections.map((d, i) =>
        `${i+1}. ${d.class.toUpperCase()} | ${d.severity ? d.severity.toUpperCase() : 'N/A'} | Conf: ${(d.confidence*100).toFixed(1)}% | BBox: [${d.bbox.join(', ')}]`
      ),
    ]
    download(`crackscope_report_${Date.now()}.txt`, 'text/plain', lines.join('\n'))
  }

  return (
    <div className="bg-surface border border-white/5 rounded-custom p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
      <div>
        <div className="font-mono text-3xs text-muted uppercase tracking-wider mb-1">
          Export Report
        </div>
        <div className="font-mono text-2xs md:text-xs text-text-main">
          {result.total_detections} detection(s) — <span className="text-accent/90">{result.filename}</span>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <ExportBtn onClick={exportTXT} label="TXT Report"/>
        <ExportBtn onClick={exportCSV} label="CSV"/>
        <ExportBtn onClick={exportJSON} label="JSON"/>
      </div>
    </div>
  )
}

function ExportBtn({ onClick, label }) {
  return (
    <button 
      onClick={onClick} 
      className="font-mono text-3xs px-4 py-2 bg-surface-hover hover:bg-accent hover:text-black border border-white/5 hover:border-accent rounded-md cursor-pointer transition-all duration-300 tracking-wider flex items-center gap-1.5 font-bold"
    >
      <span>⬇</span> {label}
    </button>
  )
}

function download(filename, type, content) {
  const blob = new Blob([content], { type })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

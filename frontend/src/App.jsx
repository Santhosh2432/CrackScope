import { useState } from 'react'
import Header           from './components/Header'
import UploadZone       from './components/UploadZone'
import ConfidenceSlider from './components/ConfidenceSlider'
import ResultView       from './components/ResultView'
import DetectionHistory from './components/DetectionHistory'
import ReportExport     from './components/ReportExport'

const MAX_HISTORY = 10

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [confidence,   setConfidence]   = useState(0.25)
  const [loading,      setLoading]      = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [progressMsg,  setProgressMsg]  = useState('')
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState(null)
  const [history,      setHistory]      = useState([])

  const handleFile = file => {
    setSelectedFile(file)
    setResult(null)
    setError(null)
  }

  const runDetection = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    setProgress(0)

    const isVideo = selectedFile.type.startsWith('video/')
    setProgressMsg(isVideo ? 'Processing video frames...' : 'Analyzing image...')

    // Fake progress animation
    let pct = 0
    const interval = setInterval(() => {
      pct = Math.min(pct + (isVideo ? 1 : 4), 90)
      setProgress(pct)
    }, isVideo ? 300 : 100)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const endpoint = isVideo ? '/detect/video' : '/detect/image'
      const url      = `${endpoint}?conf=${confidence}`
      const resp     = await fetch(url, { method: 'POST', body: formData })
      const data     = await resp.json()

      if (!resp.ok) throw new Error(data.detail || 'Detection failed')

      clearInterval(interval)
      setProgress(100)

      setTimeout(() => {
        setLoading(false)
        setProgress(0)
        setResult(data)
        setHistory(prev => [data, ...prev].slice(0, MAX_HISTORY))
        setSelectedFile(null)
      }, 400)

    } catch (err) {
      clearInterval(interval)
      setLoading(false)
      setProgress(0)
      setError(err.message)
    }
  }

  const clearResult = () => {
    setResult(null)
    setSelectedFile(null)
    setError(null)
  }

  return (
    <div className="max-w-[960px] mx-auto px-6 pb-20 relative z-10">
      <Header />

      {/* Confidence slider always visible */}
      <ConfidenceSlider value={confidence} onChange={setConfidence} />

      {/* Upload zone — hide when showing results */}
      {!result && (
        <UploadZone onFile={handleFile} disabled={loading} />
      )}

      {/* File preview */}
      {selectedFile && !loading && (
        <FilePreview file={selectedFile} />
      )}

      {/* Detect button */}
      {selectedFile && !loading && !result && (
        <button
          onClick={runDetection}
          className="w-full mt-4 py-4 px-6 bg-accent hover:bg-[#c4ec29] text-black font-sans text-base font-bold rounded-custom cursor-pointer transition-all duration-300 shadow-lg shadow-accent/10 hover:shadow-accent/25 hover:-translate-y-0.5 tracking-wider flex items-center justify-center gap-2"
        >
          <span>▶</span> Run Detection
        </button>
      )}

      {/* Progress */}
      {loading && <ProgressBar pct={progress} label={progressMsg} />}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-crack/10 border border-crack/20 rounded-custom p-4 md:p-5 font-mono text-sm text-crack shadow-lg flex items-start gap-3">
          <span className="text-lg">⚠</span>
          <div>
            <div className="font-bold">Detection Error</div>
            <div className="text-xs text-crack/80 mt-1">{error}</div>
            <div className="text-xs text-muted mt-2">Make sure the backend server is running on port 8000.</div>
          </div>
        </div>
      )}

      {/* Export + Results */}
      {result && (
        <div className="space-y-6 mt-6">
          <ReportExport result={result} />
          <ResultView result={result} onClear={clearResult} />
        </div>
      )}

      {/* Upload another button after results */}
      {result && (
        <button
          onClick={clearResult}
          className="w-full mt-6 py-3.5 px-6 bg-transparent text-text-main font-mono text-xs font-bold border border-white/10 rounded-custom hover:border-accent hover:text-accent cursor-pointer transition-all duration-300 tracking-wider flex items-center justify-center gap-2"
        >
          <span>⬆</span> Upload Another File
        </button>
      )}

      {/* History */}
      <DetectionHistory
        history={history}
        onSelect={item => { setResult(item); setSelectedFile(null) }}
        onClear={() => setHistory([])}
      />
    </div>
  )
}

function FilePreview({ file }) {
  const isVideo = file.type.startsWith('video/')
  const size = file.size < 1024*1024
    ? (file.size/1024).toFixed(1) + ' KB'
    : (file.size/(1024*1024)).toFixed(2) + ' MB'

  return (
    <div className="mt-4 bg-surface-hover border border-white/5 rounded-custom p-4 flex items-center gap-4 transition-all hover:border-white/10">
      <span className="text-3xl filter drop-shadow">{isVideo ? '🎬' : '🖼'}</span>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm text-text-main font-semibold truncate">{file.name}</div>
        <div className="font-mono text-xs text-muted mt-1">{size}</div>
      </div>
    </div>
  )
}

function ProgressBar({ pct, label }) {
  return (
    <div className="mt-4 bg-surface border border-white/5 rounded-custom p-5 shadow-inner">
      <div className="flex justify-between font-mono text-xs text-muted mb-3">
        <span className="font-medium animate-pulse">{label}</span>
        <span className="font-semibold text-accent">{Math.round(pct)}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_#d8ff33]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

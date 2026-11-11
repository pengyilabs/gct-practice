import { useCallback, useRef } from 'react'
import { fmtTime } from '../lib/storage.js'

const RATES = [0.75, 1, 1.25, 1.5]

export function ScrubBar({ currentTime, duration, listening, onSeek, onSeekQuestion, big = false }) {
  const trackRef = useRef(null)
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const seekFromEvent = useCallback(
    (e) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const frac = Math.max(0, Math.min(1, x / rect.width))
      onSeek(frac * duration)
    },
    [duration, onSeek]
  )

  const jumpToQuestion = onSeekQuestion || ((q) => onSeek(q.audioStart))

  return (
    <div
      ref={trackRef}
      className={`scrub ${big ? 'scrub-big' : ''}`}
      role="slider"
      aria-label="音频进度"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
      onMouseDown={(e) => {
        seekFromEvent(e)
        const move = (ev) => seekFromEvent(ev)
        const up = () => {
          window.removeEventListener('mousemove', move)
          window.removeEventListener('mouseup', up)
        }
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', up)
      }}
      onTouchStart={seekFromEvent}
      onTouchMove={seekFromEvent}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onSeek(currentTime - 5)
        if (e.key === 'ArrowRight') onSeek(currentTime + 5)
      }}
    >
      <div className="scrub-track">
        <div className="scrub-fill" style={{ width: `${pct}%` }} />
        {listening.map((q) => (
          <button
            key={q.n}
            className={`scrub-tick ${big ? 'scrub-tick-big' : ''}`}
            style={{ left: `${duration > 0 ? (q.audioStart / duration) * 100 : 0}%` }}
            title={`第 ${q.n} 题 ${fmtTime(q.audioStart)}`}
            aria-label={`跳到第 ${q.n} 题`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              jumpToQuestion(q)
            }}
          >
            {big && <span className="tick-num">{q.n}</span>}
          </button>
        ))}
        <div className="scrub-thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function MiniPlayer({
  playing,
  currentTime,
  duration,
  rate,
  listening,
  onToggle,
  onSkip,
  onSeek,
  onSeekQuestion,
  onRate,
  onExpand,
}) {
  const cycleRate = () => onRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])

  return (
    <div className="mini-player">
      <ScrubBar
        currentTime={currentTime}
        duration={duration}
        listening={listening}
        onSeek={onSeek}
        onSeekQuestion={onSeekQuestion}
      />
      <div className="mini-row">
        <button className="mini-play" onClick={onToggle} aria-label={playing ? '暂停' : '播放'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button className="mini-skip" onClick={() => onSkip(-10)} aria-label="后退 10 秒">
          ⏪10
        </button>
        <button className="mini-skip" onClick={() => onSkip(10)} aria-label="前进 10 秒">
          10⏩
        </button>
        <span className="mini-time">
          {fmtTime(currentTime)} / {fmtTime(duration)}
        </span>
        <button
          className="rate-btn rate-cycle"
          onClick={cycleRate}
          aria-label={`播放速度 ${rate} 倍，点击切换`}
        >
          {rate}×
        </button>
        <button className="mini-expand" onClick={onExpand} aria-label="展开播放器">
          ⌃
        </button>
      </div>
    </div>
  )
}

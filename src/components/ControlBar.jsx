import { useCallback, useRef } from 'react'
import { fmtTime } from '../lib/storage.js'

const RATES = [0.75, 1, 1.25, 1.5]

function SegmentScrub({ start, end, currentTime, onSeek }) {
  const trackRef = useRef(null)
  const len = Math.max(0, end - start)
  const cur = Math.min(Math.max(currentTime - start, 0), len)
  const pct = len > 0 ? (cur / len) * 100 : 0

  const seekFromEvent = useCallback(
    (e) => {
      const el = trackRef.current
      if (!el || len <= 0) return
      const rect = el.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const frac = Math.max(0, Math.min(1, x / rect.width))
      onSeek(start + frac * len)
    },
    [len, start, onSeek]
  )

  return (
    <div
      ref={trackRef}
      className="scrub"
      role="slider"
      aria-label="本题音频进度"
      aria-valuemin={0}
      aria-valuemax={Math.round(len)}
      aria-valuenow={Math.round(cur)}
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
        if (e.key === 'ArrowLeft') onSeek(Math.max(start, start + cur - 5))
        if (e.key === 'ArrowRight') onSeek(Math.min(end, start + cur + 5))
      }}
    >
      <div className="scrub-track">
        <div className="scrub-fill" style={{ width: `${pct}%` }} />
        <div className="scrub-thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ControlBar({
  focusN,
  total,
  hasAudio,
  segStart,
  segEnd,
  currentTime,
  playing,
  rate,
  onToggle,
  onPrev,
  onNext,
  onSeekSeg,
  onRate,
  onGrid,
  onSubmit,
}) {
  const cycleRate = () => onRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])
  const len = Math.max(0, segEnd - segStart)
  const cur = hasAudio ? Math.min(Math.max(currentTime - segStart, 0), len) : 0

  return (
    <div className="ctrl-bar">
      {hasAudio ? (
        <div className="ctrl-scrub-row">
          <span className="ctrl-time">{fmtTime(cur)}</span>
          <SegmentScrub
            start={segStart}
            end={segEnd}
            currentTime={currentTime}
            onSeek={onSeekSeg}
          />
          <span className="ctrl-time">{fmtTime(len)}</span>
        </div>
      ) : (
        <div className="ctrl-scrub-row">
          <span className="ctrl-noaudio">本题无听力音频 · 可直接作答</span>
        </div>
      )}

      <div className="ctrl-row">
        <button
          className="ctrl-chip ctrl-rate"
          onClick={cycleRate}
          aria-label={`播放速度 ${rate} 倍，点击切换`}
        >
          {rate}×
        </button>

        <div className="ctrl-center">
          <button
            className="ctrl-arrow"
            onClick={onPrev}
            disabled={focusN <= 1}
            aria-label="上一题"
          >
            ‹
          </button>
          <button
            className="ctrl-play"
            onClick={onToggle}
            disabled={!hasAudio}
            aria-label={playing ? '暂停' : '播放本题音频'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          {focusN >= total ? (
            <button className="ctrl-submit" onClick={onSubmit} aria-label="交卷查看成绩">
              交卷
            </button>
          ) : (
            <button className="ctrl-arrow" onClick={onNext} aria-label="下一题">
              ›
            </button>
          )}
        </div>

        <button
          className="ctrl-chip ctrl-grid"
          onClick={onGrid}
          aria-label={`答题卡，第 ${focusN} / ${total} 题`}
        >
          <span aria-hidden="true">▤</span>
          <span>
            {focusN}/{total}
          </span>
        </button>
      </div>
    </div>
  )
}

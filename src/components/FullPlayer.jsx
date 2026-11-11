import { ScrubBar } from './MiniPlayer.jsx'
import { fmtTime } from '../lib/storage.js'

const RATES = [0.75, 1, 1.25, 1.5]

export default function FullPlayer({
  pack,
  playing,
  currentTime,
  duration,
  rate,
  listening,
  autoFollow,
  currentN,
  onToggle,
  onSkip,
  onSeek,
  onSeekQuestion,
  onRate,
  onAutoFollow,
  onCollapse,
}) {
  const current = listening.find((q) => q.n === currentN)

  return (
    <div className="full-player" role="dialog" aria-label="播放器">
      <div className="full-sheet">
        <button className="sheet-collapse" onClick={onCollapse} aria-label="收起播放器">
          ⌄
        </button>

        <div className="full-art">
          <div className="disc" aria-hidden="true">
            <span className="disc-hole" />
          </div>
          <h2 className="full-title">{pack.title}</h2>
          <p className="full-sub">
            {current
              ? `正在播放 · 第 ${current.n} 题 ${fmtTime(current.audioStart)}–${fmtTime(current.audioEnd)}`
              : '听力练习 · GCT 练习一'}
          </p>
        </div>

        <ScrubBar
          big
          currentTime={currentTime}
          duration={duration}
          listening={listening}
          onSeek={onSeek}
          onSeekQuestion={onSeekQuestion}
        />
        <div className="full-times">
          <span>{fmtTime(currentTime)}</span>
          <span>{fmtTime(duration)}</span>
        </div>

        <div className="full-controls">
          <button className="skip-big" onClick={() => onSkip(-10)} aria-label="后退 10 秒">
            ⏪<span>10</span>
          </button>
          <button className="play-big" onClick={onToggle} aria-label={playing ? '暂停' : '播放'}>
            {playing ? '⏸' : '▶'}
          </button>
          <button className="skip-big" onClick={() => onSkip(10)} aria-label="前进 10 秒">
            <span>10</span>⏩
          </button>
        </div>

        <div className="full-row">
          <div className="rate-menu rate-menu-big" role="group" aria-label="播放速度">
            {RATES.map((r) => (
              <button
                key={r}
                className={`rate-btn ${rate === r ? 'rate-on' : ''}`}
                onClick={() => onRate(r)}
              >
                {r}×
              </button>
            ))}
          </div>
          <label className="follow-toggle">
            <input
              type="checkbox"
              checked={autoFollow}
              onChange={(e) => onAutoFollow(e.target.checked)}
            />
            <span className="follow-slider" aria-hidden="true" />
            <span>自动跟随</span>
          </label>
        </div>

        <p className="full-hint">
          点击播放条上的题号刻度可跳到对应题目音频；手动切题会暂停自动跟随。
        </p>
      </div>
    </div>
  )
}

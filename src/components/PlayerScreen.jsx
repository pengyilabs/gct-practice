import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QuestionCard from './QuestionCard.jsx'
import MiniPlayer from './MiniPlayer.jsx'
import FullPlayer from './FullPlayer.jsx'
import ScoreSummary from './ScoreSummary.jsx'
import { loadProgress, saveProgress } from '../lib/storage.js'

export default function PlayerScreen() {
  const { id } = useParams()
  const [pack, setPack] = useState(null)
  const [error, setError] = useState(null)

  const [answers, setAnswers] = useState({})
  const [score, setScore] = useState(null)
  const [scoreOpen, setScoreOpen] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const [fullOpen, setFullOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const [autoFollow, setAutoFollow] = useState(true)
  const [focusN, setFocusN] = useState(1)

  const audioRef = useRef(null)
  const lastSegNRef = useRef(null)

  // ---- load pack + saved progress -------------------------------------
  useEffect(() => {
    let alive = true
    fetch(`/tests/${id}/pack.json`)
      .then((r) => {
        if (!r.ok) throw new Error('pack fetch failed: ' + r.status)
        return r.json()
      })
      .then((p) => {
        if (!alive) return
        setPack(p)
        const prog = loadProgress(p.id)
        if (prog) {
          setAnswers(prog.answers || {})
          setScore(prog.score || null)
        }
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [id])

  // ---- persistence -----------------------------------------------------
  const persist = useCallback(
    (nextAnswers, nextScore) => {
      saveProgress(id, { answers: nextAnswers, score: nextScore })
    },
    [id]
  )

  const selectAnswer = useCallback(
    (n, key) => {
      setAnswers((prev) => {
        const next = { ...prev, [n]: key }
        persist(next, score)
        return next
      })
    },
    [persist, score]
  )

  // ---- audio helpers ---------------------------------------------------
  const seek = useCallback((t) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(t, a.duration || t))
    setCurrentTime(a.currentTime)
  }, [])

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      a.play().catch(() => {})
    } else {
      a.pause()
    }
  }, [])

  const skip = useCallback(
    (delta) => seek((audioRef.current?.currentTime || 0) + delta),
    [seek]
  )

  const changeRate = useCallback((r) => {
    setRate(r)
    if (audioRef.current) audioRef.current.playbackRate = r
  }, [])

  // ---- one-question focus + auto-follow --------------------------------
  const listening = useMemo(
    () => (pack ? pack.questions.filter((q) => q.audioStart != null) : []),
    [pack]
  )

  const currentN = useMemo(() => {
    if (!listening.length) return null
    let cur = null
    for (const q of listening) {
      if (currentTime >= q.audioStart && currentTime < q.audioEnd) {
        cur = q.n
        break
      }
    }
    return cur
  }, [listening, currentTime])

  const goTo = useCallback(
    (n) => {
      if (!pack) return
      const clamped = Math.max(1, Math.min(n, pack.questions.length))
      setFocusN(clamped)
      setAutoFollow(false)
    },
    [pack]
  )

  // follow audio segment changes
  useEffect(() => {
    if (currentN == null || currentN === lastSegNRef.current) return
    lastSegNRef.current = currentN
    if (autoFollow) setFocusN(currentN)
  }, [currentN, autoFollow])

  // play (or pause) the audio segment of a question, focusing it
  const playSegment = useCallback(
    (q) => {
      const a = audioRef.current
      if (!a) return
      const inSeg = a.currentTime >= q.audioStart && a.currentTime < q.audioEnd
      if (inSeg && !a.paused) {
        a.pause()
        return
      }
      if (!inSeg) seek(q.audioStart)
      a.play().catch(() => {})
      setFocusN(q.n)
      setAutoFollow(true)
    },
    [seek]
  )

  // jump the track to a question's segment (from scrub ticks / score sheet)
  const seekToQuestion = useCallback(
    (q) => {
      seek(q.audioStart)
      setFocusN(q.n)
      setAutoFollow(true)
    },
    [seek]
  )

  // ---- scoring ---------------------------------------------------------
  const submit = useCallback(() => {
    if (!pack) return
    const bySection = {}
    let total = 0
    const wrong = []
    for (const q of pack.questions) {
      const sec = pack.sections.find((s) => s.id === q.section)
      const name = sec ? sec.part : '其他'
      if (!bySection[name]) bySection[name] = { correct: 0, total: 0 }
      bySection[name].total += 1
      if (answers[q.n] === q.answer) {
        total += 1
        bySection[name].correct += 1
      } else {
        wrong.push(q.n)
      }
    }
    const s = { total, questionCount: pack.questions.length, bySection, wrong, at: Date.now() }
    setScore(s)
    persist(answers, s)
    setScoreOpen(true)
  }, [pack, answers, persist])

  if (error) {
    return (
      <div className="screen screen-center">
        <p>加载失败：{error}</p>
        <Link className="btn-primary" to="/">
          返回首页
        </Link>
      </div>
    )
  }
  if (!pack) return <div className="screen screen-center"><p className="hint">正在加载练习…</p></div>

  const total = pack.questions.length
  const answeredCount = pack.questions.filter((q) => answers[q.n] != null).length
  const base = `/tests/${pack.id}/`
  const focusQ = pack.questions.find((q) => q.n === focusN) || pack.questions[0]
  const sectionOf = (q) => pack.sections.find((s) => s.id === q.section)

  return (
    <div className="screen player-screen">
      <header className="player-top">
        <Link to="/" className="icon-btn" aria-label="返回">
          ‹
        </Link>
        <div className="player-title-wrap">
          <h1 className="player-title">{pack.title}</h1>
          <p className="player-progress">
            已答 {answeredCount} / {total}
          </p>
        </div>
        <button
          className="icon-btn"
          aria-label="交卷查看成绩"
          onClick={submit}
          title="交卷 / 查看成绩"
        >
          ✓
        </button>
      </header>

      <nav className="q-focus-bar" aria-label="题目导航">
        <button
          className="nav-arrow"
          onClick={() => goTo(focusN - 1)}
          disabled={focusN <= 1}
          aria-label="上一题"
        >
          ‹
        </button>
        <button className="q-focus-count" onClick={() => setGridOpen(true)}>
          <span className="q-focus-n">{focusN}</span>
          <span className="q-focus-t">/ {total} 题 · 答题卡</span>
        </button>
        <button
          className="nav-arrow"
          onClick={() => goTo(focusN + 1)}
          disabled={focusN >= total}
          aria-label="下一题"
        >
          ›
        </button>
      </nav>

      <div className="q-focus">
        <QuestionCard
          key={focusQ.n}
          question={focusQ}
          section={sectionOf(focusQ)}
          base={base}
          selected={answers[focusQ.n]}
          onSelect={(key) => selectAnswer(focusQ.n, key)}
          onPlaySegment={() => playSegment(focusQ)}
          segPlaying={playing && currentN === focusQ.n}
          segActive={currentN === focusQ.n}
        />

        <div className="q-focus-foot">
          <button
            className="btn-nav"
            onClick={() => goTo(focusN - 1)}
            disabled={focusN <= 1}
          >
            ‹ 上一题
          </button>
          {focusN < total ? (
            <button className="btn-nav btn-nav-next" onClick={() => goTo(focusN + 1)}>
              下一题 ›
            </button>
          ) : (
            <button className="btn-primary btn-nav-next" onClick={submit}>
              交卷 / 查看成绩
            </button>
          )}
        </div>
        <p className="hint">随时可改答案，交卷后仍可回来修改并重新交卷。</p>
      </div>

      <MiniPlayer
        playing={playing}
        currentTime={currentTime}
        duration={duration || pack.audioDuration}
        rate={rate}
        listening={listening}
        onToggle={togglePlay}
        onSkip={skip}
        onSeek={seek}
        onSeekQuestion={seekToQuestion}
        onRate={changeRate}
        onExpand={() => setFullOpen(true)}
      />

      {fullOpen && (
        <FullPlayer
          pack={pack}
          playing={playing}
          currentTime={currentTime}
          duration={duration || pack.audioDuration}
          rate={rate}
          listening={listening}
          autoFollow={autoFollow}
          currentN={currentN}
          onToggle={togglePlay}
          onSkip={skip}
          onSeek={seek}
          onSeekQuestion={seekToQuestion}
          onRate={changeRate}
          onAutoFollow={setAutoFollow}
          onCollapse={() => setFullOpen(false)}
        />
      )}

      {gridOpen && (
        <div
          className="sheet-overlay"
          role="dialog"
          aria-label="答题卡"
          onClick={() => setGridOpen(false)}
        >
          <div className="score-sheet grid-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" aria-hidden="true" />
            <h2 className="score-title">答题卡</h2>
            <p className="hint">
              已答 {answeredCount} / {total} · 点击题号跳转
            </p>
            <div className="grid-chips">
              {pack.questions.map((q) => (
                <button
                  key={q.n}
                  className={`grid-chip ${answers[q.n] != null ? 'grid-answered' : ''} ${
                    q.n === focusN ? 'grid-focus' : ''
                  }`}
                  onClick={() => {
                    setGridOpen(false)
                    goTo(q.n)
                  }}
                >
                  {q.n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {scoreOpen && (
        <ScoreSummary
          pack={pack}
          answers={answers}
          score={score}
          onClose={() => setScoreOpen(false)}
          onJump={(n) => {
            setScoreOpen(false)
            goTo(n)
          }}
        />
      )}

      {/* single shared audio element */}
      <audio
        ref={audioRef}
        src={base + pack.audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      >
        <track kind="captions" />
      </audio>
    </div>
  )
}

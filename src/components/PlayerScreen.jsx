import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QuestionCard from './QuestionCard.jsx'
import ControlBar from './ControlBar.jsx'
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
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [rate, setRate] = useState(1)
  const [focusN, setFocusN] = useState(1)

  const audioRef = useRef(null)

  // lock page scroll behind open sheets
  useEffect(() => {
    const open = gridOpen || scoreOpen
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [gridOpen, scoreOpen])

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

  // ---- question = track helpers ---------------------------------------
  const focusQ = pack
    ? pack.questions.find((q) => q.n === focusN) || pack.questions[0]
    : null

  const seek = useCallback((t) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(t, a.duration || t))
    setCurrentTime(a.currentTime)
  }, [])

  const inFocusSeg = useCallback(() => {
    const a = audioRef.current
    if (!a || !focusQ || focusQ.audioStart == null) return false
    return a.currentTime >= focusQ.audioStart && a.currentTime < focusQ.audioEnd
  }, [focusQ])

  // play/pause the current question's "track"
  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a || !focusQ || focusQ.audioStart == null) return
    if (!a.paused) {
      a.pause()
      return
    }
    if (!inFocusSeg()) seek(focusQ.audioStart)
    a.play().catch(() => {})
  }, [focusQ, inFocusSeg, seek])

  // move between questions like tracks: keep playback going on the new track
  const goTo = useCallback(
    (n) => {
      if (!pack) return
      const clamped = Math.max(1, Math.min(n, pack.questions.length))
      setFocusN(clamped)
      const q = pack.questions.find((x) => x.n === clamped)
      const a = audioRef.current
      if (!a || !q) return
      if (q.audioStart == null) {
        a.pause()
        return
      }
      const inSeg = a.currentTime >= q.audioStart && a.currentTime < q.audioEnd
      if (!inSeg) seek(q.audioStart)
    },
    [pack, seek]
  )

  const changeRate = useCallback((r) => {
    setRate(r)
    if (audioRef.current) audioRef.current.playbackRate = r
  }, [])

  // ---- auto-advance to the next track when this one ends ---------------
  useEffect(() => {
    if (!playing || !pack || !focusQ || focusQ.audioStart == null) return
    if (currentTime < focusQ.audioEnd) return
    const next = pack.questions.find((q) => q.n > focusQ.n && q.audioStart != null)
    const a = audioRef.current
    if (next) {
      setFocusN(next.n)
      if (a) a.currentTime = next.audioStart
    } else if (a) {
      a.pause()
    }
  }, [currentTime, playing, pack, focusQ])

  // ---- scoring ---------------------------------------------------------
  const submit = useCallback(() => {
    if (!pack) return
    const bySection = {}
    let total = 0
    const wrong = []
    const skipped = []
    for (const q of pack.questions) {
      const sec = pack.sections.find((s) => s.id === q.section)
      const name = sec ? sec.part : '其他'
      if (!bySection[name]) bySection[name] = { correct: 0, total: 0 }
      bySection[name].total += 1
      if (answers[q.n] === q.answer) {
        total += 1
        bySection[name].correct += 1
      } else if (answers[q.n] == null) {
        skipped.push(q.n)
      } else {
        wrong.push(q.n)
      }
    }
    const s = { total, questionCount: pack.questions.length, bySection, wrong, skipped, at: Date.now() }
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

      <div className="q-focus">
        <QuestionCard
          key={focusQ.n}
          question={focusQ}
          section={sectionOf(focusQ)}
          base={base}
          selected={answers[focusQ.n]}
          onSelect={(key) => selectAnswer(focusQ.n, key)}
        />
        <p className="hint">随时可改答案，交卷后仍可回来修改并重新交卷。</p>
      </div>

      <ControlBar
        focusN={focusN}
        total={total}
        hasAudio={focusQ.audioStart != null}
        segStart={focusQ.audioStart ?? 0}
        segEnd={focusQ.audioEnd ?? 0}
        currentTime={currentTime}
        playing={playing}
        rate={rate}
        onToggle={togglePlay}
        onPrev={() => goTo(focusN - 1)}
        onNext={() => goTo(focusN + 1)}
        onSeekSeg={seek}
        onRate={changeRate}
        onGrid={() => setGridOpen(true)}
      />

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
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      >
        <track kind="captions" />
      </audio>
    </div>
  )
}

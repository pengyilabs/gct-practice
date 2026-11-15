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
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const [focusN, setFocusN] = useState(1)
  const [confirmExit, setConfirmExit] = useState(false)

  const audioRef = useRef(null)

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

  // ---- warm the image cache so picture questions switch instantly -------
  useEffect(() => {
    if (!pack) return
    pack.questions.forEach((q) => {
      if (q.type === 'picture' && q.image) {
        const img = new Image()
        img.src = `/tests/${pack.id}/${q.image}`
      }
    })
  }, [pack])

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

  // the bar is one recording: play/pause only, seeking is the slider's job
  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (!a.paused) {
      a.pause()
      return
    }
    a.play().catch(() => {})
  }, [])

  // jump to the current question's audio segment and play it
  const playQuestion = useCallback(() => {
    const a = audioRef.current
    if (!a || !focusQ || focusQ.audioStart == null) return
    if (!inFocusSeg()) seek(focusQ.audioStart)
    a.play().catch(() => {})
  }, [focusQ, inFocusSeg, seek])

  // moving to a question parks the recording at that question's start, so the
  // slider always shows where you are; reading questions leave it untouched
  const goTo = useCallback(
    (n) => {
      if (!pack) return
      const next = Math.max(1, Math.min(n, pack.questions.length))
      setFocusN(next)
      const q = pack.questions.find((item) => item.n === next)
      if (q && q.audioStart != null) seek(q.audioStart)
    },
    [pack, seek]
  )

  const changeRate = useCallback((r) => {
    setRate(r)
    if (audioRef.current) audioRef.current.playbackRate = r
  }, [])

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
  const sectionOf = (q) => pack.sections.find((s) => s.id === q.section)
  const focusSection = sectionOf(focusQ)
  const titleParts = focusSection ? focusSection.title.split(' · ') : []
  const kicker =
    titleParts.length > 1 ? `${focusSection.part} · ${titleParts[0]}` : focusSection?.part
  const headline =
    titleParts.length > 1 ? titleParts.slice(1).join(' · ') : focusSection?.title

  return (
    <div className="screen player-screen">
      <aside className="q-side" aria-label="题目列表">
        <div className="q-side-head">
          <p className="q-side-pack">{pack.title}</p>
          <p className="q-side-progress">
            已答 {answeredCount} / {total}
          </p>
          <div className="q-side-bar">
            <i style={{ width: `${(answeredCount / total) * 100}%` }} />
          </div>
        </div>

        <nav className="q-side-list">
          {pack.sections.map((sec) => {
            const secQs = pack.questions.filter((q) => q.section === sec.id)
            if (!secQs.length) return null
            return (
              <div className="q-side-group" key={sec.id}>
                <p className="q-side-sec">
                  {sec.part} · {sec.title}
                </p>
                <div className="q-side-chips">
                  {secQs.map((q) => (
                    <button
                      key={q.n}
                      className={`q-side-chip ${answers[q.n] != null ? 'is-done' : ''} ${
                        q.n === focusN ? 'is-focus' : ''
                      }`}
                      onClick={() => goTo(q.n)}
                      aria-current={q.n === focusN ? 'true' : undefined}
                      aria-label={`第 ${q.n} 题${answers[q.n] != null ? '，已答' : ''}`}
                    >
                      {q.n}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="q-side-foot">
          <button className="btn-primary q-side-submit" onClick={submit}>
            交卷
          </button>
        </div>
      </aside>

      <div className="player-main">
        <div className="q-focus">
          {focusSection && (
            <header className="article-head">
              <div className="article-nav">
                <button className="cancel-btn" onClick={() => setConfirmExit(true)}>
                  ✕ 退出练习
                </button>
                <span className="article-pack">{pack.title}</span>
              </div>
              <h2 className="article-title">
                <span className="article-kicker">{kicker}</span>
                <span className="article-sep" aria-hidden="true">
                  ·
                </span>
                {headline}
              </h2>
              {focusSection.instruction && (
                <p className="article-lede">{focusSection.instruction}</p>
              )}
            </header>
          )}
          <QuestionCard
            key={focusQ.n}
            question={focusQ}
            base={base}
            selected={answers[focusQ.n]}
            onSelect={(key) => selectAnswer(focusQ.n, key)}
            onPlayAudio={playQuestion}
          />
        </div>

        <ControlBar
          focusN={focusN}
          total={total}
          currentTime={currentTime}
          duration={duration}
          playing={playing}
          rate={rate}
          onToggle={togglePlay}
          onPrev={() => goTo(focusN - 1)}
          onNext={() => goTo(focusN + 1)}
          onSeek={seek}
          onRate={changeRate}
          onGrid={() => setGridOpen(true)}
          onSubmit={submit}
        />
      </div>

      {confirmExit && (
        <div
          className="sheet-overlay confirm-overlay"
          role="dialog"
          aria-label="退出练习"
          onClick={() => setConfirmExit(false)}
        >
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="confirm-title">退出练习？</h2>
            <p className="hint">进度已保存，你可以随时回来继续答题。</p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setConfirmExit(false)}>
                继续答题
              </button>
              <Link className="btn-primary" to="/">
                退出练习
              </Link>
            </div>
          </div>
        </div>
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
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      >
        <track kind="captions" />
      </audio>
    </div>
  )
}

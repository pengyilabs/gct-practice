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
  const [fullOpen, setFullOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const [autoFollow, setAutoFollow] = useState(true)
  const [scrolledAway, setScrolledAway] = useState(false)

  const audioRef = useRef(null)
  const cardRefs = useRef(new Map())
  const lastSegNRef = useRef(null)
  const programmaticScrollRef = useRef(0)
  const rafRef = useRef(0)

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

  // ---- auto-follow -----------------------------------------------------
  const scrollToQuestion = useCallback((n) => {
    const el = cardRefs.current.get(n)
    if (!el) return
    programmaticScrollRef.current = Date.now()
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      programmaticScrollRef.current = Date.now()
    }, 800)
  }, [])

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

  // follow audio segment changes
  useEffect(() => {
    if (currentN == null || currentN === lastSegNRef.current) return
    lastSegNRef.current = currentN
    if (autoFollow) scrollToQuestion(currentN)
  }, [currentN, autoFollow, scrollToQuestion])

  const checkScrolledAway = useCallback(() => {
    if (currentN == null) {
      setScrolledAway(false)
      return
    }
    const el = cardRefs.current.get(currentN)
    if (!el) return
    const r = el.getBoundingClientRect()
    const visible = r.bottom > 90 && r.top < window.innerHeight - 140
    setScrolledAway(!visible)
  }, [currentN])

  // manual scroll detection + visibility
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() - programmaticScrollRef.current > 400) {
        setAutoFollow(false)
      }
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(checkScrolledAway)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [checkScrolledAway])

  useEffect(() => {
    checkScrolledAway()
  }, [currentN, checkScrolledAway])

  const backToCurrent = useCallback(() => {
    if (currentN != null) scrollToQuestion(currentN)
    setAutoFollow(true)
  }, [currentN, scrollToQuestion])

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
            已答 {answeredCount} / {pack.questions.length}
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

      <div className="question-feed">
        {pack.questions.map((q) => (
          <QuestionCard
            key={q.n}
            question={q}
            section={sectionOf(q)}
            base={base}
            selected={answers[q.n]}
            onSelect={(key) => selectAnswer(q.n, key)}
            onSeek={seek}
            onPlayFrom={() => {
              seek(q.audioStart)
              const a = audioRef.current
              if (a && a.paused) a.play().catch(() => {})
            }}
            cardRef={(el) => {
              if (el) cardRefs.current.set(q.n, el)
              else cardRefs.current.delete(q.n)
            }}
          />
        ))}

        <div className="feed-end">
          <button className="btn-primary btn-large" onClick={submit}>
            交卷 / 查看成绩
          </button>
          <p className="hint">随时可改答案，交卷后仍可回来修改并重新交卷。</p>
        </div>
      </div>

      {scrolledAway && currentN != null && (
        <button className="back-to-current" onClick={backToCurrent}>
          ↑ 回到当前（第 {currentN} 题）
        </button>
      )}

      <MiniPlayer
        playing={playing}
        currentTime={currentTime}
        duration={duration || pack.audioDuration}
        rate={rate}
        listening={listening}
        onToggle={togglePlay}
        onSkip={skip}
        onSeek={seek}
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
          onRate={changeRate}
          onAutoFollow={setAutoFollow}
          onCollapse={() => setFullOpen(false)}
        />
      )}

      {scoreOpen && (
        <ScoreSummary
          pack={pack}
          answers={answers}
          score={score}
          onClose={() => setScoreOpen(false)}
          onJump={(n) => {
            setScoreOpen(false)
            scrollToQuestion(n)
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

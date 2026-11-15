import { useEffect, useRef, useState } from 'react'
import ReviewBlock from './ReviewBlock.jsx'

// the bar is taller on phones (extra strip under the Netlify badge), so the
// clearance is measured instead of hard-coded
function barClearance() {
  const bar = document.querySelector('.ctrl-bar')
  return bar ? bar.getBoundingClientRect().height + 12 : 140
}

export default function QuestionCard({
  question: q,
  base,
  selected,
  onSelect,
  onPlayAudio,
}) {
  // answering is the only thing that opens the review: it stays for as long as
  // the answer exists, so there is nothing to collapse
  const revealed = selected != null
  const [revealTick, setRevealTick] = useState(0)
  const reviewRef = useRef(null)
  const isListening = q.audioStart != null

  const choose = (key) => {
    onSelect(key)
    setRevealTick((t) => t + 1)
  }

  // when a fresh answer opens below the fold, lift it above the control bar
  useEffect(() => {
    if (!revealTick) return
    const el = reviewRef.current
    if (!el) return
    const overflow = el.getBoundingClientRect().bottom - (window.innerHeight - barClearance())
    if (overflow > 0) window.scrollBy({ top: overflow + 12, behavior: 'smooth' })
  }, [revealTick])

  return (
    <article className="q-flat" id={`q-${q.n}`}>
      <div className="q-meta">
        <span className="q-label">第 {q.n} 题</span>
        {isListening && onPlayAudio && (
          <button className="btn-listen" onClick={onPlayAudio}>
            ▶ 听本题
          </button>
        )}
      </div>

      <div className="q-body">
        <QContent
          q={q}
          base={base}
          selected={selected}
          onSelect={choose}
          revealed={revealed}
        />
      </div>

      {revealed && (
        <div ref={reviewRef}>
          <ReviewBlock question={q} selected={selected} />
        </div>
      )}
    </article>
  )
}

function QContent({ q, base, selected, onSelect, revealed }) {
  if (q.type === 'picture') {
    return (
      <>
        {q.image && (
          <img
            className="q-image"
            src={base + q.image}
            alt={`第 ${q.n} 题看图选项 A B C`}
            loading="eager"
            decoding="async"
          />
        )}
        <ChoiceRow
          q={q}
          selected={selected}
          onSelect={onSelect}
          revealed={revealed}
          variant="chip"
        />
      </>
    )
  }

  if (q.type === 'truefalse') {
    return (
      <>
        <p className="q-statement">
          <span className="star">★</span>
          {q.prompt}
        </p>
        <ChoiceRow
          q={q}
          selected={selected}
          onSelect={onSelect}
          revealed={revealed}
          variant="tf"
        />
      </>
    )
  }

  if (q.type === 'order') {
    return (
      <>
        <div className="word-chips">
          {q.prompt.split(/[\s　]+/).filter(Boolean).map((w, i) => (
            <span key={i} className="word-chip">
              {w}
            </span>
          ))}
        </div>
        <ChoiceRow
          q={q}
          selected={selected}
          onSelect={onSelect}
          revealed={revealed}
          variant="sentence"
        />
      </>
    )
  }

  if (q.type === 'char') {
    return (
      <>
        <p className="q-statement q-blank-sentence">{q.prompt}</p>
        <ChoiceRow
          q={q}
          selected={selected}
          onSelect={onSelect}
          revealed={revealed}
          variant="char"
        />
      </>
    )
  }

  // default: mcq
  return (
    <>
      <p className="q-prompt">{q.prompt}</p>
      <ChoiceRow
        q={q}
        selected={selected}
        onSelect={onSelect}
        revealed={revealed}
        variant="list"
      />
    </>
  )
}

function ChoiceRow({ q, selected, onSelect, revealed, variant }) {
  return (
    <div className={`choices choices-${variant}`} role="radiogroup" aria-label={`第 ${q.n} 题选项`}>
      {q.choices.map((c) => {
        const isSel = selected === c.key
        const isRight = revealed && c.key === q.answer
        const isWrong = revealed && isSel && c.key !== q.answer
        const state = isRight ? 'choice-correct' : isWrong ? 'choice-wrong' : ''
        return (
          <button
            key={c.key}
            role="radio"
            aria-checked={isSel}
            className={`choice choice-${variant} ${isSel ? 'choice-selected' : ''} ${state}`}
            onClick={() => onSelect(c.key)}
          >
            {variant === 'char' ? (
              <span className="char-glyph">{c.text}</span>
            ) : variant === 'chip' ? (
              <span className="char-glyph">{c.key}</span>
            ) : (
              <>
                {variant !== 'tf' && <span className="choice-key">{c.key}</span>}
                {variant === 'tf' ? (
                  <span className="tf-wrap">
                    <span className="tf-glyph">{c.key}</span>
                    <span>{c.text}</span>
                  </span>
                ) : (
                  <span className="choice-text">{c.text}</span>
                )}
              </>
            )}
            {(isRight || isWrong) && (
              <span className={`choice-mark ${isRight ? 'choice-mark-ok' : 'choice-mark-bad'}`}>
                {isRight ? '✓' : '✗'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

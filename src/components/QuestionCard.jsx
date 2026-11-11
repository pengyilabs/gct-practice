import { useState } from 'react'
import ReviewBlock from './ReviewBlock.jsx'
import { fmtTime } from '../lib/storage.js'

export default function QuestionCard({
  question: q,
  section,
  base,
  selected,
  onSelect,
}) {
  const [showAnswer, setShowAnswer] = useState(false)
  const isListening = q.audioStart != null

  return (
    <article className={`q-card ${isListening ? 'q-card-listening' : ''}`} id={`q-${q.n}`}>
      <header className="q-head">
        <span className="q-num">{q.n}</span>
        <div className="q-head-text">
          <span className="q-section">
            {section ? `${section.part} · ${section.title}` : q.type}
          </span>
          <span className="time-chip time-chip-static">
            {isListening ? `♪ ${fmtTime(q.audioStart)} – ${fmtTime(q.audioEnd)}` : '随时可答'}
          </span>
        </div>
      </header>

      <div className="q-body">
        <QContent q={q} base={base} selected={selected} onSelect={onSelect} />
      </div>

      <footer className="q-foot">
        <button
          className={`btn-ghost ${showAnswer ? 'btn-ghost-on' : ''}`}
          onClick={() => setShowAnswer((v) => !v)}
          aria-expanded={showAnswer}
        >
          {showAnswer ? '收起答案' : '查看答案'}
        </button>
      </footer>

      {showAnswer && <ReviewBlock question={q} selected={selected} />}
    </article>
  )
}

function QContent({ q, base, selected, onSelect }) {
  if (q.type === 'picture') {
    return (
      <>
        <p className="q-prompt">{q.prompt}</p>
        {q.image && (
          <img
            className="q-image"
            src={base + q.image}
            alt={`第 ${q.n} 题看图选项 A B C`}
            loading="lazy"
          />
        )}
        <ChoiceRow q={q} selected={selected} onSelect={onSelect} variant="chip" />
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
        <ChoiceRow q={q} selected={selected} onSelect={onSelect} variant="tf" />
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
        <p className="q-hint">连词成句：选出排列正确的一句</p>
        <ChoiceRow q={q} selected={selected} onSelect={onSelect} variant="sentence" />
      </>
    )
  }

  if (q.type === 'char') {
    return (
      <>
        <p className="q-statement q-blank-sentence">{q.prompt}</p>
        <ChoiceRow q={q} selected={selected} onSelect={onSelect} variant="char" />
      </>
    )
  }

  // default: mcq
  return (
    <>
      <p className="q-prompt">{q.prompt}</p>
      <ChoiceRow q={q} selected={selected} onSelect={onSelect} variant="list" />
    </>
  )
}

function ChoiceRow({ q, selected, onSelect, variant }) {
  return (
    <div className={`choices choices-${variant}`} role="radiogroup" aria-label={`第 ${q.n} 题选项`}>
      {q.choices.map((c) => {
        const isSel = selected === c.key
        return (
          <button
            key={c.key}
            role="radio"
            aria-checked={isSel}
            className={`choice choice-${variant} ${isSel ? 'choice-selected' : ''}`}
            onClick={() => onSelect(c.key)}
          >
            {variant === 'char' ? (
              <span className="char-glyph">{c.text}</span>
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
          </button>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import ReviewBlock from './ReviewBlock.jsx'

export default function QuestionCard({
  question: q,
  base,
  selected,
  onSelect,
  onPlayAudio,
}) {
  // answered questions reopen the answer panel so their marks stay visible
  const [showAnswer, setShowAnswer] = useState(selected != null)
  const isListening = q.audioStart != null

  const choose = (key) => {
    onSelect(key)
    setShowAnswer(true)
  }

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
          revealed={showAnswer}
        />
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

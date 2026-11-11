export default function ReviewBlock({ question: q, selected }) {
  const correct = q.choices.find((c) => c.key === q.answer)
  const mine = q.choices.find((c) => c.key === selected)
  const isRight = selected === q.answer

  return (
    <div className="review-block">
      <div className="review-row">
        <span className="review-label">正确答案</span>
        <span className="review-value review-right">
          {q.answer}
          {correct && correct.text ? ` · ${correct.text}` : ''}
        </span>
      </div>
      <div className="review-row">
        <span className="review-label">你的答案</span>
        {selected == null ? (
          <span className="review-value review-none">未作答</span>
        ) : (
          <span className={`review-value ${isRight ? 'review-right' : 'review-wrong'}`}>
            {selected}
            {mine && mine.text ? ` · ${mine.text}` : ''}
            {isRight ? ' ✓' : ' ✗'}
          </span>
        )}
      </div>

      {q.transcript && (
        <div className="review-transcript">
          <div className="review-label">听力原文</div>
          {q.transcript.map((line, i) => (
            <p key={i} className="transcript-line">
              {line}
            </p>
          ))}
        </div>
      )}

      {q.explanation && (
        <p className="review-explanation">
          <span className="review-label">解析 </span>
          {q.explanation}
        </p>
      )}
    </div>
  )
}

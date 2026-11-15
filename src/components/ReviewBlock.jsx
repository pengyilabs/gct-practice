export default function ReviewBlock({ question: q, selected }) {
  const isRight = selected === q.answer

  return (
    <div className="review-block">
      <p className={`review-result ${isRight ? 'is-right' : 'is-wrong'}`}>
        {isRight ? '回答正确' : `回答错误，正确答案是 ${q.answer}`}
      </p>

      {q.transcript && q.transcript.length > 0 && (
        <>
          <p className="review-caption">听力原文</p>
          <div className="review-text">
            {q.transcript.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </>
      )}

      {q.explanation && (
        <>
          <p className="review-caption">解析</p>
          <p className="review-text">{q.explanation}</p>
        </>
      )}
    </div>
  )
}

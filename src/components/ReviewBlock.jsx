import { useState } from 'react'

export default function ReviewBlock({ question: q, selected }) {
  const isRight = selected === q.answer
  const transcriptText = q.transcript ? q.transcript.join('') : ''
  // short transcripts stay open; longer ones fold away so the panel stays compact
  const [showTranscript, setShowTranscript] = useState(transcriptText.length <= 40)

  return (
    <div className="review-block">
      <div className="review-tags">
        <span className="review-tag review-tag-right">
          正确答案 <b>{q.answer}</b>
        </span>
        {selected == null ? (
          <span className="review-tag review-tag-none">
            你的答案 <b>未作答</b>
          </span>
        ) : (
          <span className={`review-tag ${isRight ? 'review-tag-right' : 'review-tag-wrong'}`}>
            你的答案 <b>{selected}</b> {isRight ? '✓' : '✗'}
          </span>
        )}
      </div>

      {q.transcript && (
        <div className="review-transcript-wrap">
          <button
            className="review-toggle"
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
          >
            {showTranscript ? '收起听力原文' : '显示听力原文'}
          </button>
          {showTranscript && (
            <div className="review-transcript">
              {q.transcript.map((line, i) => (
                <p key={i} className="transcript-line">
                  {line}
                </p>
              ))}
            </div>
          )}
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

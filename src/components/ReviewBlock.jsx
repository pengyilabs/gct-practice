import Annotated from './Annotated.jsx'
import { loadSettings } from '../lib/settings.js'

export default function ReviewBlock({ question: q, selected }) {
  const isRight = selected === q.answer
  const { pinyin: showPinyin, english: showEnglish } = loadSettings()

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
              <Annotated
                key={i}
                text={line}
                showPinyin={showPinyin}
                en={showEnglish ? q.transcriptEn?.[i] : null}
              />
            ))}
          </div>
        </>
      )}

      {q.explanation && (
        <>
          <p className="review-caption">解析</p>
          <div className="review-text">
            <Annotated
              text={q.explanation}
              showPinyin={showPinyin}
              en={showEnglish ? q.explanationEn : null}
            />
          </div>
        </>
      )}
    </div>
  )
}

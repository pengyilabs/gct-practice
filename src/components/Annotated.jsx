import { useEffect, useState } from 'react'

const HAN = /[\u4e00-\u9fff]/

export default function Annotated({ text, showPinyin, en }) {
  const [py, setPy] = useState(null)

  // pinyin-pro carries a large dictionary, so it is only fetched once someone
  // turns pinyin on
  useEffect(() => {
    if (!showPinyin || !HAN.test(text)) {
      setPy(null)
      return undefined
    }
    let alive = true
    import('pinyin-pro').then(({ pinyin }) => {
      if (!alive) return
      setPy(pinyin(text, { toneType: 'symbol' }).replace(/\s+([，。：；！？、])/g, '$1'))
    })
    return () => {
      alive = false
    }
  }, [text, showPinyin])

  return (
    <>
      {py && <p className="review-pinyin">{py}</p>}
      <p className="review-line">{text}</p>
      {en && <p className="review-en">{en}</p>}
    </>
  )
}

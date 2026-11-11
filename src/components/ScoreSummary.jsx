export default function ScoreSummary({ pack, answers, score, onClose, onJump }) {
  const s = score || { total: 0, questionCount: pack.questions.length, bySection: {}, wrong: [] }
  const total = s.questionCount || pack.questions.length
  const pct = Math.round((s.total / total) * 100)

  return (
    <div className="sheet-overlay" role="dialog" aria-label="成绩" onClick={onClose}>
      <div className="score-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="score-title">本次成绩</h2>

        <div className="score-ring" style={{ '--pct': pct }}>
          <div className="score-ring-inner">
            <span className="score-big">{s.total}</span>
            <span className="score-total">/ {total}</span>
          </div>
        </div>
        <p className="score-pct">正确率 {pct}%</p>

        <div className="score-breakdown">
          {Object.entries(s.bySection || {}).map(([name, v]) => (
            <div key={name} className="breakdown-row">
              <span className="breakdown-name">{name}</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${v.total ? (v.correct / v.total) * 100 : 0}%` }}
                />
              </div>
              <span className="breakdown-num">
                {v.correct}/{v.total}
              </span>
            </div>
          ))}
        </div>

        {s.wrong && s.wrong.length > 0 && (
          <div className="wrong-list">
            <h3 className="wrong-title">错题（{s.wrong.length}）· 点击跳转</h3>
            <div className="wrong-chips">
              {s.wrong.map((n) => (
                <button key={n} className="wrong-chip" onClick={() => onJump(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
        {s.wrong && s.wrong.length === 0 && (
          <p className="score-perfect">🎉 全部答对，太棒了！</p>
        )}

        <button className="btn-primary btn-large" onClick={onClose}>
          返回继续练习
        </button>
      </div>
    </div>
  )
}

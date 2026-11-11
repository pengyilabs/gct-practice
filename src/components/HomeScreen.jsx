import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadProgress, fmtTime } from '../lib/storage.js'

export default function HomeScreen({ manifest, error }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('全部')

  const levels = useMemo(() => {
    if (!manifest) return ['全部']
    const set = new Set(manifest.map((t) => t.level))
    return ['全部', ...Array.from(set)]
  }, [manifest])

  const tests = useMemo(() => {
    if (!manifest) return []
    const q = query.trim().toLowerCase()
    return manifest.filter((t) => {
      const okLevel = level === '全部' || t.level === level
      const okQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.level.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      return okLevel && okQuery
    })
  }, [manifest, query, level])

  return (
    <div className="screen home-screen">
      <header className="home-hero">
        <div className="hero-badge">UESTC · GCT</div>
        <h1 className="hero-title">
          汉语听力<span className="hero-accent">阅读</span>练习
        </h1>
        <p className="hero-sub">播客式刷题 · 边听边答 · 对答案看成绩</p>
      </header>

      <div className="home-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            placeholder="搜索练习卷，如 GCT-202611"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索练习卷"
          />
        </div>
        <div className="chip-row" role="tablist" aria-label="等级筛选">
          {levels.map((lv) => (
            <button
              key={lv}
              role="tab"
              aria-selected={level === lv}
              className={`chip ${level === lv ? 'chip-active' : ''}`}
              onClick={() => setLevel(lv)}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="hint-error">加载失败：{error}</p>}
      {!manifest && !error && <p className="hint">正在加载练习列表…</p>}

      <div className="test-list">
        {tests.map((t) => {
          const prog = loadProgress(t.id)
          return (
            <Link key={t.id} to={`/test/${t.id}`} className="test-card">
              <div className="test-card-main">
                <div className="test-card-top">
                  <span className="level-tag">{t.level}</span>
                  {prog && prog.score && (
                    <span
                      className={`score-badge ${
                        prog.score.total >= 46 ? 'score-good' : 'score-bad'
                      }`}
                    >
                      上次 {prog.score.total}/{t.questionCount}
                    </span>
                  )}
                </div>
                <h2 className="test-card-title">{t.title}</h2>
                <p className="test-card-meta">
                  {t.questionCount} 题 · {fmtTime(t.durationSec)} 听力音频 ·{' '}
                  {t.language === 'zh' ? '中文' : t.language}
                </p>
              </div>
              <div className="test-card-arrow" aria-hidden="true">
                ›
              </div>
            </Link>
          )
        })}
        {manifest && tests.length === 0 && (
          <div className="empty-state">
            <p className="hint">没有匹配的练习卷，换个关键词试试。</p>
            <button
              className="btn-ghost"
              onClick={() => {
                setQuery('')
                setLevel('全部')
              }}
            >
              清除筛选条件
            </button>
          </div>
        )}
      </div>

      <footer className="home-footer">
        作答记录与成绩保存在本机浏览器（localStorage）
      </footer>
    </div>
  )
}

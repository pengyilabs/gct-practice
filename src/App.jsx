import { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import HomeScreen from './components/HomeScreen.jsx'
import PlayerScreen from './components/PlayerScreen.jsx'

export default function App() {
  const [manifest, setManifest] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/tests/index.json')
      .then((r) => {
        if (!r.ok) throw new Error('manifest fetch failed: ' + r.status)
        return r.json()
      })
      .then(setManifest)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/"
          element={<HomeScreen manifest={manifest} error={error} />}
        />
        <Route path="/test/:id" element={<PlayerScreen />} />
        <Route
          path="*"
          element={
            <div className="screen-center">
              <p>页面不存在</p>
              <Link className="btn-primary" to="/">
                返回首页
              </Link>
            </div>
          }
        />
      </Routes>
    </div>
  )
}

const PREFIX = 'gct:progress:'

export function loadProgress(packId) {
  try {
    const raw = localStorage.getItem(PREFIX + packId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProgress(packId, data) {
  try {
    localStorage.setItem(PREFIX + packId, JSON.stringify(data))
  } catch {
    /* storage full or unavailable — practice still works in-memory */
  }
}

export function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

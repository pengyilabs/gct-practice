import { useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings.js'

function Switch({ on, label, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch ${on ? 'is-on' : ''}`}
      onClick={onClick}
    >
      <i />
    </button>
  )
}

export default function SettingsSheet({ onClose }) {
  const [settings, setSettings] = useState(loadSettings)

  const toggle = (key) => setSettings(saveSettings({ [key]: !settings[key] }))

  return (
    <div className="sheet-overlay" role="dialog" aria-label="设置" onClick={onClose}>
      <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="settings-head">
          <h2 className="settings-title">设置</h2>
          <button className="settings-close" onClick={onClose} aria-label="关闭设置">
            ✕
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-copy">
            <p className="settings-name">答案显示拼音</p>
            <p className="settings-desc">听力原文和解析上方标注拼音</p>
          </div>
          <Switch
            on={settings.pinyin}
            label="答案显示拼音"
            onClick={() => toggle('pinyin')}
          />
        </div>

        <div className="settings-row">
          <div className="settings-copy">
            <p className="settings-name">答案显示英文</p>
            <p className="settings-desc">在中文下方给出英文意思</p>
          </div>
          <Switch
            on={settings.english}
            label="答案显示英文"
            onClick={() => toggle('english')}
          />
        </div>

        <p className="settings-note">设置保存在本机，对所有练习卷生效。</p>
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import StatusBar from './StatusBar'
import { useClock } from '../hooks/useClock'

const PRIORITY_COLOR = { high: '#ff453a', medium: '#ff9f0a', low: '#30d158' }
const CAT_ICON = { work: '💼', personal: '🏠', health: '💪', shopping: '🛒' }

const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS_JA = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function LockScreen({ todos, onUnlock }) {
  const time = useClock()
  const touchStartY = useRef(null)
  const [unlocking, setUnlocking] = useState(false)

  const h = time.getHours().toString().padStart(2, '0')
  const m = time.getMinutes().toString().padStart(2, '0')
  const dateStr = `${MONTHS_JA[time.getMonth()]}${time.getDate()}日（${DAYS_JA[time.getDay()]}）`

  const pending = todos.filter(t => !t.done)
  const visible = pending.slice(0, 4)

  function triggerUnlock() {
    if (unlocking) return
    setUnlocking(true)
    setTimeout(onUnlock, 380)
  }

  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e) {
    if (touchStartY.current === null) return
    const dy = touchStartY.current - e.changedTouches[0].clientY
    if (dy > 40) triggerUnlock()
    touchStartY.current = null
  }

  return (
    <div
      className={`ls ${unlocking ? 'ls-unlock' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={triggerUnlock}
    >
      {/* Animated wallpaper */}
      <div className="ls-bg"/>
      <div className="ls-bg-orb ls-bg-orb1"/>
      <div className="ls-bg-orb ls-bg-orb2"/>
      <div className="ls-bg-orb ls-bg-orb3"/>

      {/* Status bar */}
      <div className="ls-statusbar-wrap">
        <StatusBar/>
      </div>

      {/* Dynamic island */}
      <div className="ls-island"/>

      {/* Time */}
      <div className="ls-time-wrap">
        <div className="ls-clock">{h}:{m}</div>
        <div className="ls-date">{dateStr}</div>
      </div>

      {/* Todo widget */}
      <div className="ls-widget" onClick={e => e.stopPropagation()}>
        <div className="ls-widget-header">
          <span className="ls-widget-icon">☑</span>
          <span className="ls-widget-title">Todo</span>
          <span className="ls-widget-badge">{pending.length}</span>
        </div>

        {visible.length === 0 ? (
          <div className="ls-widget-empty">すべてのタスク完了！🎉</div>
        ) : (
          <div className="ls-widget-list">
            {visible.map((todo, i) => (
              <div key={todo.id} className="ls-todo-row" style={{ borderBottomColor: i < visible.length - 1 ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                <span className="ls-todo-dot" style={{ background: PRIORITY_COLOR[todo.priority] }}/>
                <span className="ls-todo-cat">{CAT_ICON[todo.category] || '📋'}</span>
                <span className="ls-todo-text">{todo.text}</span>
              </div>
            ))}
            {pending.length > 4 && (
              <div className="ls-widget-more">他 {pending.length - 4} 件…</div>
            )}
          </div>
        )}
      </div>

      {/* Second smaller widget — completion rate */}
      <div className="ls-mini-widgets">
        <div className="ls-mini-widget">
          <div className="ls-mini-val">{todos.filter(t => t.done).length}</div>
          <div className="ls-mini-label">完了</div>
        </div>
        <div className="ls-mini-widget">
          <div className="ls-mini-val">{pending.length}</div>
          <div className="ls-mini-label">残り</div>
        </div>
        <div className="ls-mini-widget">
          <div className="ls-mini-val">
            {todos.length > 0 ? Math.round((todos.filter(t => t.done).length / todos.length) * 100) : 0}%
          </div>
          <div className="ls-mini-label">達成率</div>
        </div>
      </div>

      {/* Bottom */}
      <div className="ls-bottom">
        <div className="ls-bottom-icons">
          <button className="ls-icon-btn" onClick={e => e.stopPropagation()}>
            🔦
          </button>
          <button className="ls-icon-btn" onClick={e => e.stopPropagation()}>
            📷
          </button>
        </div>
        <div className="ls-swipe-hint">
          <div className="ls-swipe-bar"/>
          <span>タップまたは上にスワイプして開く</span>
        </div>
      </div>
    </div>
  )
}

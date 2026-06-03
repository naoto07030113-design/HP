import { useState, useRef } from 'react'
import StatusBar from './StatusBar'

const PRIORITY = {
  high:   { label: '高', color: '#ff453a', bg: 'rgba(255,69,58,0.18)' },
  medium: { label: '中', color: '#ff9f0a', bg: 'rgba(255,159,10,0.18)' },
  low:    { label: '低', color: '#30d158', bg: 'rgba(48,209,88,0.18)' },
}

const CATEGORIES = [
  { id: 'all',      icon: '📋', label: 'すべて' },
  { id: 'work',     icon: '💼', label: '仕事' },
  { id: 'personal', icon: '🏠', label: '個人' },
  { id: 'health',   icon: '💪', label: '健康' },
  { id: 'shopping', icon: '🛒', label: '買物' },
]

const TABS = [
  { id: 'today', label: '今日' },
  { id: 'all',   label: 'すべて' },
  { id: 'done',  label: '完了' },
]

export default function TodoApp({ todos, addTodo, toggleTodo, deleteTodo, clearCompleted, onLock }) {
  const [tab, setTab]         = useState('today')
  const [cat, setCat]         = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filtered = todos.filter(t => {
    const matchCat = cat === 'all' || t.category === cat
    if (tab === 'today')  return matchCat && !t.done && (t.dueDate === today || !t.dueDate)
    if (tab === 'all')    return matchCat && !t.done
    if (tab === 'done')   return matchCat && t.done
    return matchCat
  })

  const todayCount  = todos.filter(t => !t.done && (t.dueDate === today || !t.dueDate)).length
  const totalPending = todos.filter(t => !t.done).length
  const doneCount   = todos.filter(t => t.done).length

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <div className="app-sb-wrap">
          <StatusBar/>
        </div>
        <div className="app-nav">
          <button className="app-nav-side" onClick={onLock}>🔒 ロック</button>
          <h1 className="app-nav-title">Todo</h1>
          <button className="app-nav-side app-nav-add" onClick={() => setShowAdd(true)}>＋</button>
        </div>

        {/* Summary */}
        <div className="app-summary">
          <div className="app-sum-card app-sum-blue">
            <div className="app-sum-num">{todayCount}</div>
            <div className="app-sum-lbl">今日</div>
          </div>
          <div className="app-sum-card app-sum-gray">
            <div className="app-sum-num">{totalPending}</div>
            <div className="app-sum-lbl">未完了</div>
          </div>
          <div className="app-sum-card app-sum-green">
            <div className="app-sum-num">{doneCount}</div>
            <div className="app-sum-lbl">完了</div>
          </div>
        </div>

        {/* Category filter */}
        <div className="app-cats">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`app-cat ${cat === c.id ? 'app-cat-active' : ''}`}
              onClick={() => setCat(c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="app-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`app-tab ${tab === t.id ? 'app-tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="app-list-wrap">
        {filtered.length === 0 ? (
          <div className="app-empty">
            <div className="app-empty-icon">
              {tab === 'done' ? '🏆' : '✅'}
            </div>
            <div className="app-empty-title">
              {tab === 'done' ? '完了したタスクはありません' : 'タスクはありません'}
            </div>
            {tab !== 'done' && (
              <div className="app-empty-sub">＋ボタンで新しいタスクを追加</div>
            )}
          </div>
        ) : (
          <div className="app-list">
            {filtered.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
            {tab === 'done' && doneCount > 0 && (
              <button className="app-clear-btn" onClick={clearCompleted}>
                完了済みを全て削除
              </button>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="app-fab" onClick={() => setShowAdd(true)}>＋</button>

      {/* Add modal */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onAdd={addTodo}
        />
      )}
    </div>
  )
}

/* ──────── Todo Item ──────── */
function TodoItem({ todo, onToggle, onDelete }) {
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(null)

  function onTouchStart(e) { startX.current = e.touches[0].clientX }
  function onTouchMove(e) {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setSwipeX(Math.max(dx, -80))
  }
  function onTouchEnd() {
    if (swipeX < -50) {
      setSwipeX(-80)
    } else {
      setSwipeX(0)
    }
    startX.current = null
  }

  const pColor = PRIORITY[todo.priority]?.color ?? '#888'
  const catObj  = CATEGORIES.find(c => c.id === todo.category) ?? CATEGORIES[0]

  return (
    <div className="ti-wrap">
      <div className="ti-delete-bg" onClick={() => onDelete(todo.id)}>🗑</div>
      <div
        className={`ti ${todo.done ? 'ti-done' : ''}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="ti-stripe" style={{ background: pColor }}/>
        <button
          className={`ti-check ${todo.done ? 'ti-check-done' : ''}`}
          onClick={() => onToggle(todo.id)}
          style={{ borderColor: pColor, background: todo.done ? pColor : 'transparent' }}
        >
          {todo.done && '✓'}
        </button>
        <div className="ti-body">
          <div className="ti-text">{todo.text}</div>
          <div className="ti-meta">
            <span>{catObj.icon}</span>
            <span className={`ti-priority`} style={{ color: pColor, background: PRIORITY[todo.priority]?.bg }}>
              {PRIORITY[todo.priority]?.label}
            </span>
            {todo.dueDate && <span className="ti-date">📅 {todo.dueDate}</span>}
          </div>
        </div>
        <button className="ti-del-btn" onClick={() => onDelete(todo.id)}>✕</button>
      </div>
    </div>
  )
}

/* ──────── Add Modal ──────── */
function AddModal({ onClose, onAdd }) {
  const [text, setText]         = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('personal')
  const [dueDate, setDueDate]   = useState('')

  function submit() {
    if (!text.trim()) return
    onAdd({ text: text.trim(), priority, category, dueDate })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2 className="modal-title">新しいTodo</h2>

        <input
          className="modal-input"
          type="text"
          placeholder="タスクを入力…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
        />

        <div className="modal-row">
          <div className="modal-label">優先度</div>
          <div className="modal-options">
            {Object.entries(PRIORITY).map(([k, v]) => (
              <button
                key={k}
                className={`modal-opt ${priority === k ? 'modal-opt-active' : ''}`}
                style={priority === k ? { background: v.bg, borderColor: v.color, color: v.color } : {}}
                onClick={() => setPriority(k)}
              >
                {v.label}優先
              </button>
            ))}
          </div>
        </div>

        <div className="modal-row">
          <div className="modal-label">カテゴリ</div>
          <div className="modal-options modal-options-wrap">
            {CATEGORIES.slice(1).map(c => (
              <button
                key={c.id}
                className={`modal-opt ${category === c.id ? 'modal-opt-active modal-opt-blue' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-row">
          <div className="modal-label">期限日（任意）</div>
          <input
            className="modal-input modal-date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <button className="modal-submit" disabled={!text.trim()} onClick={submit}>
          追加する
        </button>
      </div>
    </div>
  )
}

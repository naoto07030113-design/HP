import { useState, useEffect } from 'react'

const KEY = 'iphone-todos-v1'
const today = () => new Date().toISOString().split('T')[0]

const INITIAL = [
  { id: 1, text: 'プレゼン資料の最終確認', category: 'work', priority: 'high', done: false, dueDate: today() },
  { id: 2, text: 'チームミーティングの準備', category: 'work', priority: 'medium', done: false, dueDate: today() },
  { id: 3, text: '牛乳と卵を買う', category: 'shopping', priority: 'low', done: false, dueDate: today() },
  { id: 4, text: 'ジムでトレーニング', category: 'health', priority: 'medium', done: false, dueDate: today() },
  { id: 5, text: '週次レポートの提出', category: 'work', priority: 'high', done: true, dueDate: today() },
]

export function useTodos() {
  const [todos, setTodos] = useState(() => {
    try {
      const s = localStorage.getItem(KEY)
      return s ? JSON.parse(s) : INITIAL
    } catch {
      return INITIAL
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(todos))
  }, [todos])

  function addTodo({ text, category = 'personal', priority = 'medium', dueDate = '' }) {
    setTodos(p => [...p, { id: Date.now(), text, category, priority, done: false, dueDate }])
  }

  function toggleTodo(id) {
    setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTodo(id) {
    setTodos(p => p.filter(t => t.id !== id))
  }

  function clearCompleted() {
    setTodos(p => p.filter(t => !t.done))
  }

  return { todos, addTodo, toggleTodo, deleteTodo, clearCompleted }
}

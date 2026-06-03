import { useState } from 'react'
import LockScreen from './components/LockScreen'
import TodoApp from './components/TodoApp'
import { useTodos } from './hooks/useTodos'

export default function App() {
  const [locked, setLocked]       = useState(true)
  const [animating, setAnimating] = useState(false)
  const todos                     = useTodos()

  function handleUnlock() {
    setAnimating(true)
    setTimeout(() => { setLocked(false); setAnimating(false) }, 380)
  }

  function handleLock() {
    setLocked(true)
  }

  return (
    <div className="root-bg">
      <div className={`phone ${animating ? 'phone-unlock' : ''}`}>
        {locked ? (
          <LockScreen todos={todos.todos} onUnlock={handleUnlock}/>
        ) : (
          <TodoApp {...todos} onLock={handleLock}/>
        )}
      </div>
    </div>
  )
}

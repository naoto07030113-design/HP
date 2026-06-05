import { createContext, useContext, useReducer, useEffect } from 'react'
import { SEED_DATA } from '../data/seedData.js'
import { calculateScore } from '../lib/aiScoring.js'
import { generateId } from '../lib/utils.js'

const ProspectContext = createContext(null)

const STORAGE_KEY = 'sales_ai_prospects'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveToStorage(prospects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects))
  } catch {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':
      return action.payload

    case 'ADD': {
      const { score, breakdown } = calculateScore(action.payload)
      const newItem = {
        ...action.payload,
        id: generateId(),
        ai_score: score,
        ai_score_breakdown: breakdown,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
      return [...state, newItem]
    }

    case 'UPDATE': {
      const { score, breakdown } = calculateScore(action.payload)
      return state.map(p =>
        p.id === action.payload.id
          ? { ...p, ...action.payload, ai_score: score, ai_score_breakdown: breakdown, updated_at: new Date().toISOString().split('T')[0] }
          : p
      )
    }

    case 'DELETE':
      return state.filter(p => p.id !== action.payload)

    case 'UPDATE_STATUS':
      return state.map(p =>
        p.id === action.payload.id
          ? { ...p, status: action.payload.status, updated_at: new Date().toISOString().split('T')[0] }
          : p
      )

    case 'BULK_ADD': {
      const newItems = action.payload.map(item => {
        const { score, breakdown } = calculateScore(item)
        return {
          ...item,
          id: generateId(),
          ai_score: score,
          ai_score_breakdown: breakdown,
          status: item.status || '未接触',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
        }
      })
      return [...state, ...newItems]
    }

    case 'RESET':
      return SEED_DATA

    default:
      return state
  }
}

export function ProspectProvider({ children }) {
  const stored = loadFromStorage()
  const [prospects, dispatch] = useReducer(reducer, stored || SEED_DATA)

  useEffect(() => {
    saveToStorage(prospects)
  }, [prospects])

  return (
    <ProspectContext.Provider value={{ prospects, dispatch }}>
      {children}
    </ProspectContext.Provider>
  )
}

export function useProspects() {
  const ctx = useContext(ProspectContext)
  if (!ctx) throw new Error('useProspects must be used within ProspectProvider')
  return ctx
}

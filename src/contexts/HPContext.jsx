import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loadHPData, saveHPData } from '../lib/hpData.js'

const HPContext = createContext(null)

export function HPProvider({ children }) {
  const [data, setData] = useState(() => loadHPData())

  // Auto-save on changes
  useEffect(() => {
    saveHPData(data)
  }, [data])

  const updateCompany = useCallback((updates) => {
    setData(prev => ({
      ...prev,
      company: {
        ...prev.company,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const updateClinic = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      clinics: prev.clinics.map(c =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      ),
    }))
  }, [])

  const publishPage = useCallback((id) => {
    if (id === 'company') {
      setData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          status: 'published',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }))
    } else {
      setData(prev => ({
        ...prev,
        clinics: prev.clinics.map(c =>
          c.id === id
            ? { ...c, status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : c
        ),
      }))
    }
  }, [])

  const unpublishPage = useCallback((id) => {
    if (id === 'company') {
      setData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          status: 'draft',
          publishedAt: null,
          updatedAt: new Date().toISOString(),
        },
      }))
    } else {
      setData(prev => ({
        ...prev,
        clinics: prev.clinics.map(c =>
          c.id === id
            ? { ...c, status: 'draft', publishedAt: null, updatedAt: new Date().toISOString() }
            : c
        ),
      }))
    }
  }, [])

  const getClinic = useCallback((id) => {
    return data.clinics.find(c => c.id === id) || null
  }, [data.clinics])

  const getPage = useCallback((pageId) => {
    if (pageId === 'company') return { type: 'company', data: data.company }
    const clinic = data.clinics.find(c => c.id === pageId)
    if (clinic) return { type: 'clinic', data: clinic }
    return null
  }, [data])

  return (
    <HPContext.Provider value={{
      company: data.company,
      clinics: data.clinics,
      updateCompany,
      updateClinic,
      publishPage,
      unpublishPage,
      getClinic,
      getPage,
    }}>
      {children}
    </HPContext.Provider>
  )
}

export function useHP() {
  const ctx = useContext(HPContext)
  if (!ctx) throw new Error('useHP must be inside HPProvider')
  return ctx
}

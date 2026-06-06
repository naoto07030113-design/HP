import { createContext, useContext, useReducer, useCallback } from 'react'
import { generateBlogArticle, proofreadArticle, generateSEOMetadata } from '../lib/claudeAPI.js'
import { syncToSharedStorage } from '../lib/hpIntegration.js'

const STORAGE_KEY = 'blog_articles'
const SETTINGS_KEY = 'blog_settings'

export const DEFAULT_SETTINGS = {
  claudeApiKey: '',
  defaultModel: 'claude-haiku-4-5-20251001',
  defaultTone: '専門的でわかりやすい',
  defaultWordCount: 800,
  defaultCategory: '症状・疾患別',
}

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadArticles() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v ? JSON.parse(v) : []
  } catch { return [] }
}

function loadSettings() {
  try {
    const v = localStorage.getItem(SETTINGS_KEY)
    return v ? { ...DEFAULT_SETTINGS, ...JSON.parse(v) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

function persistArticles(articles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  syncToSharedStorage(articles)
}

function persistSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

const initial = {
  articles: loadArticles(),
  settings: loadSettings(),
  generating: false,
  proofreading: false,
  generatingError: null,
  proofreadResult: null,
  proofreadError: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ARTICLE': {
      const articles = [action.payload, ...state.articles]
      persistArticles(articles)
      return { ...state, articles }
    }
    case 'UPDATE_ARTICLE': {
      const articles = state.articles.map(a =>
        a.id === action.id ? { ...a, ...action.payload, updatedAt: new Date().toISOString() } : a
      )
      persistArticles(articles)
      return { ...state, articles }
    }
    case 'DELETE_ARTICLE': {
      const articles = state.articles.filter(a => a.id !== action.id)
      persistArticles(articles)
      return { ...state, articles }
    }
    case 'GENERATING_START':
      return { ...state, generating: true, generatingError: null }
    case 'GENERATING_END':
      return { ...state, generating: false }
    case 'GENERATING_ERROR':
      return { ...state, generating: false, generatingError: action.error }
    case 'PROOFREAD_START':
      return { ...state, proofreading: true, proofreadResult: null, proofreadError: null }
    case 'PROOFREAD_DONE':
      return { ...state, proofreading: false, proofreadResult: action.result }
    case 'PROOFREAD_ERROR':
      return { ...state, proofreading: false, proofreadError: action.error }
    case 'PROOFREAD_CLEAR':
      return { ...state, proofreadResult: null, proofreadError: null }
    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.payload }
      persistSettings(settings)
      return { ...state, settings }
    }
    default:
      return state
  }
}

const BlogContext = createContext(null)

export function BlogProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)

  const makeArticle = (data, extra = {}) => ({
    id: genId(),
    title: data.title || '無題の記事',
    content: data.content || '',
    excerpt: data.excerpt || '',
    photos: data.photos || [],
    category: data.category || state.settings.defaultCategory,
    tags: data.tags || [],
    status: 'draft',
    aiGenerated: extra.aiGenerated || false,
    aiModel: extra.aiModel || null,
    topic: extra.topic || null,
    seo: data.seo || { title: '', description: '', keywords: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    scheduledFor: data.scheduledFor || null,
    hp: { exported: false, exportedAt: null, hpArticleId: null },
  })

  const createArticle = useCallback((data) => {
    const article = makeArticle(data)
    dispatch({ type: 'ADD_ARTICLE', payload: article })
    return article
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.defaultCategory])

  const updateArticle = useCallback((id, data) => {
    dispatch({ type: 'UPDATE_ARTICLE', id, payload: data })
  }, [])

  const deleteArticle = useCallback((id) => {
    dispatch({ type: 'DELETE_ARTICLE', id })
  }, [])

  const publishArticle = useCallback((id) => {
    dispatch({ type: 'UPDATE_ARTICLE', id, payload: { status: 'published', publishedAt: new Date().toISOString() } })
  }, [])

  const unpublishArticle = useCallback((id) => {
    dispatch({ type: 'UPDATE_ARTICLE', id, payload: { status: 'draft', publishedAt: null } })
  }, [])

  const scheduleArticle = useCallback((id, scheduledFor) => {
    dispatch({ type: 'UPDATE_ARTICLE', id, payload: { status: 'scheduled', scheduledFor } })
  }, [])

  const generateArticle = useCallback(async (topic, options = {}) => {
    const { claudeApiKey, defaultModel, defaultTone, defaultWordCount, defaultCategory } = state.settings
    if (!claudeApiKey) throw new Error('Claude APIキーが設定されていません。設定ページで入力してください。')

    dispatch({ type: 'GENERATING_START' })
    try {
      const result = await generateBlogArticle(claudeApiKey, topic, {
        model: options.model || defaultModel,
        tone: options.tone || defaultTone,
        wordCount: options.wordCount || defaultWordCount,
        category: options.category || defaultCategory,
      })
      const article = makeArticle(
        { ...result, category: options.category || defaultCategory },
        { aiGenerated: true, aiModel: options.model || defaultModel, topic }
      )
      dispatch({ type: 'ADD_ARTICLE', payload: article })
      dispatch({ type: 'GENERATING_END' })
      return article
    } catch (err) {
      dispatch({ type: 'GENERATING_ERROR', error: err.message })
      throw err
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings])

  const proofread = useCallback(async (title, content) => {
    const { claudeApiKey, defaultModel } = state.settings
    if (!claudeApiKey) throw new Error('Claude APIキーが設定されていません。')

    dispatch({ type: 'PROOFREAD_START' })
    try {
      const result = await proofreadArticle(claudeApiKey, title, content, defaultModel)
      dispatch({ type: 'PROOFREAD_DONE', result })
      return result
    } catch (err) {
      dispatch({ type: 'PROOFREAD_ERROR', error: err.message })
      throw err
    }
  }, [state.settings])

  const generateSEO = useCallback(async (title, content) => {
    const { claudeApiKey, defaultModel } = state.settings
    if (!claudeApiKey) return null
    try {
      return await generateSEOMetadata(claudeApiKey, title, content, defaultModel)
    } catch { return null }
  }, [state.settings])

  const clearProofread = useCallback(() => dispatch({ type: 'PROOFREAD_CLEAR' }), [])

  const updateSettings = useCallback((data) => dispatch({ type: 'UPDATE_SETTINGS', payload: data }), [])

  const getArticle = useCallback((id) => state.articles.find(a => a.id === id), [state.articles])

  const getTodaysArticle = useCallback(() => {
    const today = new Date().toDateString()
    return state.articles.find(a => new Date(a.createdAt).toDateString() === today)
  }, [state.articles])

  return (
    <BlogContext.Provider value={{
      articles: state.articles,
      settings: state.settings,
      generating: state.generating,
      proofreading: state.proofreading,
      generatingError: state.generatingError,
      proofreadResult: state.proofreadResult,
      proofreadError: state.proofreadError,
      createArticle,
      updateArticle,
      deleteArticle,
      publishArticle,
      unpublishArticle,
      scheduleArticle,
      generateArticle,
      proofread,
      generateSEO,
      clearProofread,
      updateSettings,
      getArticle,
      getTodaysArticle,
    }}>
      {children}
    </BlogContext.Provider>
  )
}

export function useBlog() {
  const ctx = useContext(BlogContext)
  if (!ctx) throw new Error('useBlog must be inside BlogProvider')
  return ctx
}

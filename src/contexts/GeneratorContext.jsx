import { createContext, useContext, useState } from 'react'

export const GeneratorContext = createContext(null)

const defaultData = {
  industry: null,
  businessName: '',
  tagline: '',
  phone: '',
  address: '',
  email: '',
  colorSchemeId: 'ocean',
  designStyle: 'modern',
  about: '',
  services: [
    { icon: '⭐', title: '', description: '' },
    { icon: '🔑', title: '', description: '' },
    { icon: '💡', title: '', description: '' },
  ],
  hours: '',
  instagram: '',
  twitter: '',
  facebook: '',
}

export function GeneratorProvider({ children }) {
  const [data, setData] = useState(defaultData)
  const [step, setStep] = useState(1)

  const update = (updates) => setData(prev => ({ ...prev, ...updates }))
  const nextStep = () => setStep(s => Math.min(s + 1, 5))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))
  const goToStep = (n) => setStep(n)
  const reset = () => { setData(defaultData); setStep(1) }

  return (
    <GeneratorContext.Provider value={{ data, update, step, nextStep, prevStep, goToStep, reset }}>
      {children}
    </GeneratorContext.Provider>
  )
}

export const useGenerator = () => {
  const ctx = useContext(GeneratorContext)
  if (!ctx) throw new Error('useGenerator must be inside GeneratorProvider')
  return ctx
}

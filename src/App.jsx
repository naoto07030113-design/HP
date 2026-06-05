import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GeneratorProvider } from './contexts/GeneratorContext'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import PreviewPage from './pages/PreviewPage'

export default function App() {
  return (
    <BrowserRouter>
      <GeneratorProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/preview" element={<PreviewPage />} />
        </Routes>
      </GeneratorProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProspectProvider } from './contexts/ProspectContext.jsx'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Prospects from './pages/Prospects.jsx'
import ProspectDetail from './pages/ProspectDetail.jsx'
import Kanban from './pages/Kanban.jsx'
import Import from './pages/Import.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ProspectProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="prospects" element={<Prospects />} />
            <Route path="prospects/:id" element={<ProspectDetail />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="import" element={<Import />} />
          </Route>
        </Routes>
      </ProspectProvider>
    </BrowserRouter>
  )
}

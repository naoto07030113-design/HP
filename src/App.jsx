import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProspectProvider } from './contexts/ProspectContext.jsx'
import { BlogProvider } from './contexts/BlogContext.jsx'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Prospects from './pages/Prospects.jsx'
import ProspectDetail from './pages/ProspectDetail.jsx'
import Kanban from './pages/Kanban.jsx'
import Import from './pages/Import.jsx'
import Blog from './pages/Blog.jsx'
import BlogEditor from './pages/BlogEditor.jsx'
import BlogList from './pages/BlogList.jsx'
import BlogSettings from './pages/BlogSettings.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ProspectProvider>
        <BlogProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="prospects" element={<Prospects />} />
              <Route path="prospects/:id" element={<ProspectDetail />} />
              <Route path="kanban" element={<Kanban />} />
              <Route path="import" element={<Import />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/editor" element={<BlogEditor />} />
              <Route path="blog/editor/:id" element={<BlogEditor />} />
              <Route path="blog/articles" element={<BlogList />} />
              <Route path="blog/settings" element={<BlogSettings />} />
            </Route>
          </Routes>
        </BlogProvider>
      </ProspectProvider>
    </BrowserRouter>
  )
}

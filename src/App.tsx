import { Link, Route, Routes } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import PatientBooking from './pages/PatientBooking'

export default function App() {
  return (
    <>
      <nav className="sticky top-0 z-20 flex items-center justify-center gap-3 border-b bg-white/80 p-3 backdrop-blur">
        <Link to="/" className="rounded-full border px-3 py-1">CRM</Link>
        <Link to="/booking" className="rounded-full border px-3 py-1">患者予約</Link>
      </nav>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/booking" element={<PatientBooking />} />
      </Routes>
    </>
  )
}

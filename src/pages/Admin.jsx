import { Route, Routes } from 'react-router-dom'
import AppShell from '../components/AppShell'
import AdminHome from './admin/AdminHome'
import DesignEditor from './admin/DesignEditor'

export default function Admin() {
  return (
    <AppShell>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="diseno/:id" element={<DesignEditor />} />
      </Routes>
    </AppShell>
  )
}

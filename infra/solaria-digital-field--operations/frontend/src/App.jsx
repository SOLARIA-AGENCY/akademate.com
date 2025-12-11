import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Agents from './pages/Agents'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function App() {
  return (
    <SocketProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </SocketProvider>
  )
}

export default App
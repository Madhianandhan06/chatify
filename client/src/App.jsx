import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './AuthPage'
import Home from '../pages/Home'
import { API_URL } from './apiConfig'

function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return <p>Checking authentication...</p>
  }

  return user ? children : <Navigate to="/" replace />
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!active) return

        const data = await res.json().catch(() => null)
        setUser(res.ok ? (data?.user ?? null) : null)
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      active = false
    }
  }, [])

  function handleAuthSuccess(nextUser) {
    setUser(nextUser)
  }

  return (
    <div className="bg-slate-100 min-h-screen">
      <Routes>
        <Route path="/" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/home" element={<ProtectedRoute user={user} loading={loading}><Home user={user} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
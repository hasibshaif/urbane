import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'

// Development mode - set to true to bypass authentication for testing
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true'

function App() {
  // Check if user is already authenticated from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('authToken')
  })

  const handleAuthSuccess = (token: string) => {
    setIsAuthenticated(true)
    localStorage.setItem('authToken', token)
  }

  // In dev mode, allow free navigation to all pages
  // In production, enforce authentication requirements
  const shouldAllowAccess = (requireAuth: boolean) => {
    if (DEV_MODE) return true
    return requireAuth ? isAuthenticated : true
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          DEV_MODE ? (
            <Navigate to="/discover" replace />
          ) : isAuthenticated ? (
            <Navigate to="/discover" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={(token) => handleAuthSuccess(token)}
            isAuthenticated={isAuthenticated}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <RegisterPage
            onSignup={(token) => handleAuthSuccess(token)}
            isAuthenticated={isAuthenticated}
          />
        }
      />
      <Route
        path="/onboarding"
        element={
          shouldAllowAccess(true) ? (
            <OnboardingPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/discover"
        element={
          shouldAllowAccess(true) ? (
            <LandingPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

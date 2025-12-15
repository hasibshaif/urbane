import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'

const isDev = import.meta.env.DEV

function App() {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('authToken'))

  const onLogin = (token: string) => {
    setIsAuth(true)
    localStorage.setItem('authToken', token)
  }

  const needsAuth = (page: boolean) => {
    if (isDev) return true
    return page ? isAuth : true
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isDev || isAuth ? '/discover' : '/login'}
            replace
          />
        }
      />
      <Route
        path="/login"
        element={<LoginPage onLogin={onLogin} isAuthenticated={isAuth} />}
      />
      <Route
        path="/signup"
        element={<RegisterPage onSignup={onLogin} isAuthenticated={isAuth} />}
      />
      <Route
        path="/onboarding"
        element={
          needsAuth(true) ? (
            <OnboardingPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/discover"
        element={
          needsAuth(true) ? (
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

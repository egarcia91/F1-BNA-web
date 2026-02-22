import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import './index.css'
import App from './App.tsx'

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()

const root = (
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  clientId ? (
    <GoogleOAuthProvider clientId={clientId}>{root}</GoogleOAuthProvider>
  ) : (
    root
  ),
)

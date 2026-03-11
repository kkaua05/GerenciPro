import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './hooks/useToast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Financeiro from './pages/Financeiro'
import Agenda from './pages/Agenda'
import './styles/global.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Rota Pública - Login */}
            <Route path="/login" element={<Login />} />

            {/* Rotas Protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/clientes" element={
              <ProtectedRoute>
                <AppLayout><Clientes /></AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/financeiro" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><Financeiro /></AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/agenda" element={
              <ProtectedRoute>
                <AppLayout><Agenda /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Rota padrão */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
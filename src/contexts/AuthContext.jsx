import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

// Usuários de demonstração
const USERS = [
  {
    id: '1',
    email: 'admin@rtcom.com',
    password: 'admin123',
    nome: 'Administrador',
    role: 'admin',
    avatar: 'AD'
  },
  {
    id: '2',
    email: 'funcionario@rtcom.com',
    password: 'func123',
    nome: 'Funcionário',
    role: 'funcionario',
    avatar: 'FU'
  }
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('rtcom_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const foundUser = USERS.find(u => u.email === email && u.password === password)
    
    if (!foundUser) {
      throw new Error('E-mail ou senha inválidos')
    }

    const userData = {
      id: foundUser.id,
      email: foundUser.email,
      nome: foundUser.nome,
      role: foundUser.role,
      avatar: foundUser.avatar
    }

    setUser(userData)
    localStorage.setItem('rtcom_user', JSON.stringify(userData))
    navigate('/dashboard')
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('rtcom_user')
    navigate('/login')
  }

  function hasPermission(requiredRole) {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.role === requiredRole
  }

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    isAdmin: user?.role === 'admin',
    isFuncionario: user?.role === 'funcionario'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
import { useState } from 'react'
import { Building2, Mail, Lock, Eye, EyeOff, Shield, Users, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [tab, setTab] = useState('admin') // 'admin' ou 'funcionario'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Brand */}
        <div className="login-left">
          <div className="login-brand">
            <div className="logo">
              <Building2 size={50} />
            </div>
            <h1>Consultoria RTCOM</h1>
            <p>Sistema de Gestão Empresarial</p>
            
            <div className="login-features">
              <div className="login-feature">
                <div className="check"><Check size={12} /></div>
                <span>Gestão completa de clientes</span>
              </div>
              <div className="login-feature">
                <div className="check"><Check size={12} /></div>
                <span>Controle financeiro integrado</span>
              </div>
              <div className="login-feature">
                <div className="check"><Check size={12} /></div>
                <span>Agenda e compromissos</span>
              </div>
              <div className="login-feature">
                <div className="check"><Check size={12} /></div>
                <span>Dashboard analítico</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <h2>Bem-vindo de volta</h2>
            <p className="subtitle">Acesse sua conta para continuar</p>

            {/* Tabs - Apenas Admin e Funcionário */}
            <div className="login-tabs">
              <button 
                className={`login-tab ${tab === 'admin' ? 'active' : ''}`}
                onClick={() => { setTab('admin'); setError(''); }}
              >
                <Shield size={14} style={{ marginRight: 6 }} />
                Administrador
              </button>
              <button 
                className={`login-tab ${tab === 'funcionario' ? 'active' : ''}`}
                onClick={() => { setTab('funcionario'); setError(''); }}
              >
                <Users size={14} style={{ marginRight: 6 }} />
                Funcionário
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error">
                <Lock size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    className="form-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="input-action" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <a href="#">Esqueceu a senha?</a>
              </div>

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Entrando...
                  </>
                ) : (
                  'Acessar Sistema'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Building2, Mail, Lock, Eye, EyeOff, Shield, Users, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [tab, setTab] = useState('admin')
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
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e8ba3 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      padding: '20px'
    }}>
      <div className="login-container" style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1100px',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Left Side */}
        <div className="login-left" style={{
          flex: 1,
          padding: '60px 40px',
          background: 'linear-gradient(135deg, rgba(30, 60, 114, 0.95) 0%, rgba(42, 82, 152, 0.95) 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <div className="login-brand">
            <div className="logo" style={{
              width: '88px',
              height: '88px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Building2 size={50} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Consultoria RTCOM</h1>
            <p style={{ fontSize: '15px', opacity: 0.9 }}>Sistema de Gestão Empresarial</p>
            
            <div className="login-features" style={{
              marginTop: '40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left',
              maxWidth: '320px',
              margin: '40px auto 0'
            }}>
              {[
                'Gestão completa de clientes',
                'Controle financeiro integrado',
                'Agenda e compromissos',
                'Dashboard analítico'
              ].map((item, idx) => (
                <div key={idx} className="login-feature" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px'
                }}>
                  <div className="check" style={{
                    width: '24px',
                    height: '24px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={12} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="login-right" style={{
          flex: 1,
          padding: '60px 48px',
          background: 'white'
        }}>
          <div className="login-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>Bem-vindo de volta</h2>
            <p className="subtitle" style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '32px' }}>Acesse sua conta para continuar</p>

            {/* Tabs */}
            <div className="login-tabs" style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '32px',
              background: '#f1f5f9',
              padding: '6px',
              borderRadius: '12px'
            }}>
              <button 
                className={`login-tab ${tab === 'admin' ? 'active' : ''}`}
                onClick={() => { setTab('admin'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: tab === 'admin' ? 'white' : 'transparent',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: tab === 'admin' ? '#3b82f6' : '#64748b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Shield size={14} />
                Administrador
              </button>
              <button 
                className={`login-tab ${tab === 'funcionario' ? 'active' : ''}`}
                onClick={() => { setTab('funcionario'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: tab === 'funcionario' ? 'white' : 'transparent',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: tab === 'funcionario' ? '#3b82f6' : '#64748b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Users size={14} />
                Funcionário
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error" style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#dc2626'
              }}>
                <Lock size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>E-mail</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <Mail size={18} className="input-icon" style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }} />
                  <input
                    className="form-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      background: '#f8fafc',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '15px'
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Senha</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <Lock size={18} className="input-icon" style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }} />
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      background: '#f8fafc',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '15px'
                    }}
                  />
                  <button 
                    type="button" 
                    className="input-action" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={loading} style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                {loading ? (
                  <>
                    <span className="loading-spinner" style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '3px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      marginRight: '8px'
                    }} />
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

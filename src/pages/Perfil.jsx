import { useState } from 'react'
import { User, Lock, Upload, Save, X, Camera } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'

export default function Perfil() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  })

  async function handleSaveProfile(e) {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Atualizar perfil no Supabase
      const { error } = await supabase
        .from('users')
        .update({ nome: formData.nome })
        .eq('id', user.id)
      
      if (error) throw error
      
      addToast('Perfil atualizado com sucesso!', 'success')
    } catch (err) {
      addToast('Erro ao atualizar: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    
    if (formData.nova_senha !== formData.confirmar_senha) {
      addToast('As senhas não coincidem', 'error')
      return
    }
    
    if (formData.nova_senha.length < 6) {
      addToast('A nova senha deve ter pelo menos 6 caracteres', 'error')
      return
    }
    
    setLoading(true)
    
    try {
      // Atualizar senha no Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: formData.nova_senha
      })
      
      if (error) throw error
      
      setFormData({ ...formData, senha_atual: '', nova_senha: '', confirmar_senha: '' })
      addToast('Senha alterada com sucesso!', 'success')
    } catch (err) {
      addToast('Erro ao alterar senha: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Meu Perfil</h2>
          <p>Gerencie suas informações pessoais e preferências</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24, maxWidth: 800 }}>
        {/* Dados Pessoais */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <User size={16} className="icon" />
              Dados Pessoais
            </div>
          </div>
          
          <form onSubmit={handleSaveProfile}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Nome</label>
                <input
                  className="form-input"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">E-mail</label>
                <input
                  className="form-input"
                  value={formData.email}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input
                  className="form-input"
                  value={user?.role === 'admin' ? 'Administrador' : 'Funcionário'}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>
            </div>
            
            <div className="modal-footer" style={{ marginTop: 20, paddingTop: 20 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>

        {/* Alterar Senha */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Lock size={16} className="icon" />
              Segurança
            </div>
          </div>
          
          <form onSubmit={handleChangePassword}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Senha Atual</label>
                <input
                  className="form-input"
                  type="password"
                  value={formData.senha_atual}
                  onChange={(e) => setFormData({ ...formData, senha_atual: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input
                  className="form-input"
                  type="password"
                  value={formData.nova_senha}
                  onChange={(e) => setFormData({ ...formData, nova_senha: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input
                  className="form-input"
                  type="password"
                  value={formData.confirmar_senha}
                  onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
                />
              </div>
            </div>
            
            <div className="modal-footer" style={{ marginTop: 20, paddingTop: 20 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
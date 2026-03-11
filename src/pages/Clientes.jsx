import { useState, useEffect } from 'react'
import {
  UserPlus, Search, Pencil, Trash2, Eye, EyeOff,
  Phone, Mail, Users, X, ChevronRight, User
} from 'lucide-react'
import { clientesService } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const OPERADORAS = ['TIM', 'VIVO', 'CLARO', 'OI', 'OUTROS']
const STATUS_LIST = ['ativo', 'inativo', 'cancelado']

const emptyForm = {
  nome_completo: '',
  cpf: '',
  contato: '',
  email: '',
  nome_mae: '',
  operadora: '',
  senha: '',
  vendedor: '',
  consultor: '',
  observacoes: '',
  status: 'ativo',
}

function formatCPF(val) {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
    .slice(0, 14)
}

function formatPhone(val) {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2')
    .slice(0, 15)
}

export default function Clientes() {
  const { addToast } = useToast()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterOperadora, setFilterOperadora] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [viewCliente, setViewCliente] = useState(null)

  useEffect(() => { loadClientes() }, [])

  async function loadClientes() {
    setLoading(true)
    try {
      const data = await clientesService.getAll()
      setClientes(data)
    } catch (err) {
      addToast('Erro ao carregar clientes: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.nome_completo?.toLowerCase().includes(q) ||
      c.cpf?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.contato?.includes(q) ||
      c.consultor?.toLowerCase().includes(q) ||
      c.vendedor?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    const matchOp = !filterOperadora || c.operadora === filterOperadora
    return matchSearch && matchStatus && matchOp
  })

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setShowSenha(false)
    setShowModal(true)
  }

  function openEdit(c) {
    setForm({ ...emptyForm, ...c })
    setEditingId(c.id)
    setShowSenha(false)
    setShowModal(true)
  }

  function openDelete(c) {
    setDeleteTarget(c)
    setShowDeleteModal(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'cpf') {
      setForm(f => ({ ...f, cpf: formatCPF(value) }))
    } else if (name === 'contato') {
      setForm(f => ({ ...f, contato: formatPhone(value) }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSave() {
    if (!form.nome_completo || !form.cpf) {
      addToast('Nome completo e CPF são obrigatórios.', 'error')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const updated = await clientesService.update(editingId, form)
        setClientes(prev => prev.map(c => c.id === editingId ? updated : c))
        addToast('Cliente atualizado com sucesso!', 'success')
      } else {
        const created = await clientesService.create(form)
        setClientes(prev => [created, ...prev])
        addToast('Cliente cadastrado com sucesso!', 'success')
      }
      setShowModal(false)
    } catch (err) {
      addToast('Erro ao salvar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await clientesService.delete(deleteTarget.id)
      setClientes(prev => prev.filter(c => c.id !== deleteTarget.id))
      addToast('Cliente excluído.', 'success')
      setShowDeleteModal(false)
    } catch (err) {
      addToast('Erro ao excluir: ' + err.message, 'error')
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Clientes</h2>
          <p>{filtered.length} de {clientes.length} clientes</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <UserPlus size={15} />
          Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar" style={{ maxWidth: 320 }}>
          <Search size={14} className="search-icon" />
          <input
            placeholder="Buscar por nome, CPF, e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={filterOperadora} onChange={e => setFilterOperadora(e.target.value)}>
          <option value="">Todas as operadoras</option>
          {OPERADORAS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {(search || filterStatus || filterOperadora) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterOperadora('') }}>
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner lg" />
          <span>Carregando clientes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={28} /></div>
          <h3>Nenhum cliente encontrado</h3>
          <p>Tente ajustar os filtros ou cadastre um novo cliente.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="rtcom-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CPF</th>
                <th>Contato</th>
                <th>Operadora</th>
                <th>Vendedor</th>
                <th>Consultor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="primary-text">{c.nome_completo}</div>
                    <div className="sub-text">{c.email || '—'}</div>
                  </td>
                  <td><span className="text-mono">{c.cpf}</span></td>
                  <td>{c.contato || '—'}</td>
                  <td>{c.operadora ? <span className="badge badge-blue">{c.operadora}</span> : '—'}</td>
                  <td>{c.vendedor || '—'}</td>
                  <td>{c.consultor || '—'}</td>
                  <td>
                    <span className={`badge badge-${c.status}`}>
                      <span className={`status-dot ${c.status}`} />
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon" title="Visualizar" onClick={() => setViewCliente(c)}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary btn-icon" title="Editar" onClick={() => openEdit(c)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon" title="Excluir" onClick={() => openDelete(c)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">
                <div className="icon"><UserPlus size={16} /></div>
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="section-divider">Dados Pessoais</div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Nome Completo <span className="required">*</span></label>
                  <input className="form-input" name="nome_completo" placeholder="Nome completo do cliente" value={form.nome_completo} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF <span className="required">*</span></label>
                  <input className="form-input font-mono" name="cpf" placeholder="000.000.000-00" value={form.cpf} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contato</label>
                  <input className="form-input" name="contato" placeholder="(00) 00000-0000" value={form.contato} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-input" name="email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome da Mãe</label>
                  <input className="form-input" name="nome_mae" placeholder="Nome da mãe" value={form.nome_mae} onChange={handleChange} />
                </div>
              </div>

              <div className="section-divider" style={{ marginTop: 20 }}>Plano e Acesso</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Operadora</label>
                  <select className="form-select" name="operadora" value={form.operadora} onChange={handleChange}>
                    <option value="">Selecione a operadora</option>
                    {OPERADORAS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Senha</label>
                  <div className="input-wrapper">
                    <input
                      className="form-input"
                      name="senha"
                      type={showSenha ? 'text' : 'password'}
                      placeholder="Senha do cliente"
                      value={form.senha}
                      onChange={handleChange}
                    />
                    <button type="button" className="input-action" onClick={() => setShowSenha(v => !v)}>
                      {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Vendedor</label>
                  <input className="form-input" name="vendedor" placeholder="Nome do vendedor" value={form.vendedor} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultor</label>
                  <input className="form-input" name="consultor" placeholder="Nome do consultor" value={form.consultor} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="section-divider" style={{ marginTop: 20 }}>Observações</div>
              <div className="form-group">
                <label className="form-label">Anotações / Dados Adicionais</label>
                <textarea
                  className="form-textarea"
                  name="observacoes"
                  placeholder="Registre informações importantes sobre o cliente..."
                  value={form.observacoes}
                  onChange={handleChange}
                  style={{ minHeight: 110 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="loading-spinner" /> Salvando...</> : (editingId ? 'Salvar Alterações' : 'Cadastrar Cliente')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar */}
      {viewCliente && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewCliente(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="icon"><User size={16} /></div>
                Dados do Cliente
              </div>
              <button className="btn-close" onClick={() => setViewCliente(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Nome Completo', value: viewCliente.nome_completo },
                  { label: 'CPF', value: viewCliente.cpf, mono: true },
                  { label: 'Contato', value: viewCliente.contato },
                  { label: 'E-mail', value: viewCliente.email },
                  { label: 'Nome da Mãe', value: viewCliente.nome_mae },
                  { label: 'Operadora', value: viewCliente.operadora },
                  { label: 'Vendedor', value: viewCliente.vendedor },
                  { label: 'Consultor', value: viewCliente.consultor },
                  { label: 'Status', value: viewCliente.status },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, color: value ? 'var(--text-primary)' : 'var(--text-disabled)', fontFamily: mono ? 'JetBrains Mono, monospace' : undefined }}>
                      {value || '—'}
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Senha</div>
                  <ViewSenha senha={viewCliente.senha} />
                </div>
              </div>
              {viewCliente.observacoes && (
                <>
                  <div className="divider" />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Observações</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      {viewCliente.observacoes}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setViewCliente(null); openEdit(viewCliente) }}>
                <Pencil size={14} /> Editar
              </button>
              <button className="btn btn-primary" onClick={() => setViewCliente(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">
                <div className="icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}><Trash2 size={16} /></div>
                Excluir Cliente
              </div>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p>Tem certeza que deseja excluir o cliente<br /><strong>{deleteTarget.nome_completo}</strong>?</p>
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-red)' }}>
                  Esta ação também removerá todo o financeiro vinculado e não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Excluir Permanentemente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViewSenha({ senha }) {
  const [show, setShow] = useState(false)
  if (!senha) return <span style={{ color: 'var(--text-disabled)' }}>—</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-primary)' }}>
        {show ? senha : '••••••••'}
      </span>
      <button type="button" onClick={() => setShow(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

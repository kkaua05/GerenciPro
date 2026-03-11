import { useState, useEffect } from 'react'
import {
  DollarSign, Plus, Pencil, Trash2, X, Filter,
  CheckCircle, Clock, XCircle, Search, ChevronLeft, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { financeiroService, clientesService } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const MESES_NOMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

const FORMAS = ['PIX', 'BOLETO', 'ESPECIE']
const STATUS_FIN = ['pago', 'pendente', 'cancelado']

function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

const emptyForm = {
  cliente_id: '',
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  valor: '',
  forma_pagamento: 'PIX',
  status: 'pendente',
  data_vencimento: '',
  data_pagamento: '',
  descricao: '',
}

export default function Financeiro() {
  const { addToast } = useToast()
  const now = new Date()
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1)
  const [anoAtual, setAnoAtual] = useState(now.getFullYear())
  const [registros, setRegistros] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState({ total: 0, pago: 0, pendente: 0, cancelado: 0 })
  const [filterStatus, setFilterStatus] = useState('')
  const [filterForma, setFilterForma] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    clientesService.getAll().then(setClientes).catch(console.error)
  }, [])

  useEffect(() => { loadFinanceiro() }, [mesAtual, anoAtual])

  async function loadFinanceiro() {
    setLoading(true)
    try {
      const data = await financeiroService.getAll({ mes: mesAtual, ano: anoAtual })
      setRegistros(data)
      const pago = data.filter(d => d.status === 'pago').reduce((a, d) => a + Number(d.valor), 0)
      const pendente = data.filter(d => d.status === 'pendente').reduce((a, d) => a + Number(d.valor), 0)
      const cancelado = data.filter(d => d.status === 'cancelado').reduce((a, d) => a + Number(d.valor), 0)
      setResumo({ total: pago + pendente + cancelado, pago, pendente, cancelado })
    } catch (err) {
      addToast('Erro ao carregar financeiro: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function navMes(dir) {
    let m = mesAtual + dir
    let a = anoAtual
    if (m > 12) { m = 1; a++ }
    if (m < 1) { m = 12; a-- }
    setMesAtual(m)
    setAnoAtual(a)
  }

  const filtered = registros.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.clientes?.nome_completo?.toLowerCase().includes(q) || r.descricao?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || r.status === filterStatus
    const matchForma = !filterForma || r.forma_pagamento === filterForma
    return matchSearch && matchStatus && matchForma
  })

  function openNew() {
    setForm({ ...emptyForm, mes: mesAtual, ano: anoAtual })
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(r) {
    setForm({
      cliente_id: r.cliente_id || '',
      mes: r.mes,
      ano: r.ano,
      valor: r.valor,
      forma_pagamento: r.forma_pagamento,
      status: r.status,
      data_vencimento: r.data_vencimento || '',
      data_pagamento: r.data_pagamento || '',
      descricao: r.descricao || '',
    })
    setEditingId(r.id)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.cliente_id || !form.valor) {
      addToast('Cliente e valor são obrigatórios.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        valor: parseFloat(String(form.valor).replace(',', '.')),
        data_vencimento: form.data_vencimento || null,
        data_pagamento: form.data_pagamento || null,
      }
      if (editingId) {
        const updated = await financeiroService.update(editingId, payload)
        setRegistros(prev => prev.map(r => r.id === editingId ? updated : r))
        addToast('Registro atualizado!', 'success')
      } else {
        const created = await financeiroService.create(payload)
        setRegistros(prev => [created, ...prev])
        addToast('Pagamento registrado!', 'success')
      }
      setShowModal(false)
      await loadFinanceiro()
    } catch (err) {
      addToast('Erro ao salvar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await financeiroService.delete(deleteTarget.id)
      setRegistros(prev => prev.filter(r => r.id !== deleteTarget.id))
      addToast('Registro excluído.', 'success')
      setShowDeleteModal(false)
      await loadFinanceiro()
    } catch (err) {
      addToast('Erro: ' + err.message, 'error')
    }
  }

  async function quickStatus(id, newStatus) {
    try {
      const updated = await financeiroService.update(id, {
        status: newStatus,
        data_pagamento: newStatus === 'pago' ? format(new Date(), 'yyyy-MM-dd') : null
      })
      setRegistros(prev => prev.map(r => r.id === id ? updated : r))
      addToast(`Status atualizado para ${newStatus}.`, 'success')
      await loadFinanceiro()
    } catch (err) {
      addToast('Erro: ' + err.message, 'error')
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Financeiro</h2>
          <p>Controle de pagamentos mensais</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> Novo Registro
        </button>
      </div>

      {/* Navegação de mês */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-secondary btn-icon" onClick={() => navMes(-1)}>
          <ChevronLeft size={16} />
        </button>
        <div style={{
          padding: '8px 20px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 700,
          fontSize: 15,
          color: 'var(--text-primary)',
          minWidth: 160,
          textAlign: 'center'
        }}>
          {MESES_NOMES[mesAtual - 1]} {anoAtual}
        </div>
        <button className="btn btn-secondary btn-icon" onClick={() => navMes(1)}>
          <ChevronRight size={16} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setMesAtual(now.getMonth() + 1); setAnoAtual(now.getFullYear()) }}
          style={{ fontSize: 11 }}
        >
          Mês atual
        </button>
      </div>

      {/* Resumo financeiro */}
      <div className="financial-summary">
        <div className="fin-card total">
          <div className="fin-label">Total do Mês</div>
          <div className="fin-value">{formatBRL(resumo.total)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{registros.length} registros</div>
        </div>
        <div className="fin-card pago">
          <div className="fin-label">✓ Pago</div>
          <div className="fin-value">{formatBRL(resumo.pago)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {registros.filter(r => r.status === 'pago').length} pagamentos
          </div>
        </div>
        <div className="fin-card pendente">
          <div className="fin-label">◷ Pendente</div>
          <div className="fin-value">{formatBRL(resumo.pendente)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {registros.filter(r => r.status === 'pendente').length} pendentes
          </div>
        </div>
        <div className="fin-card cancelado">
          <div className="fin-label">✕ Cancelado</div>
          <div className="fin-value">{formatBRL(resumo.cancelado)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {registros.filter(r => r.status === 'cancelado').length} cancelados
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar" style={{ maxWidth: 280 }}>
          <Search size={14} className="search-icon" />
          <input placeholder="Buscar cliente ou descrição..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_FIN.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={filterForma} onChange={e => setFilterForma(e.target.value)}>
          <option value="">Todas as formas</option>
          {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        {(search || filterStatus || filterForma) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterForma('') }}>
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner lg" />
          <span>Carregando financeiro...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><DollarSign size={28} /></div>
          <h3>Nenhum registro encontrado</h3>
          <p>Adicione pagamentos para este período.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="rtcom-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Período</th>
                <th>Valor</th>
                <th>Forma</th>
                <th>Vencimento</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="primary-text">{r.clientes?.nome_completo || '—'}</div>
                    {r.descricao && <div className="sub-text">{r.descricao}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {MESES_NOMES[r.mes - 1].slice(0, 3)}/{r.ano}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                      {formatBRL(r.valor)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.forma_pagamento?.toLowerCase()}`}>
                      {r.forma_pagamento}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                      {r.data_vencimento ? format(new Date(r.data_vencimento + 'T12:00'), 'dd/MM/yyyy') : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: r.data_pagamento ? 'var(--accent-green)' : 'var(--text-disabled)' }}>
                      {r.data_pagamento ? format(new Date(r.data_pagamento + 'T12:00'), 'dd/MM/yyyy') : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>
                      <span className={`status-dot ${r.status}`} />
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {r.status !== 'pago' && (
                        <button className="btn btn-success btn-icon" title="Marcar como pago" onClick={() => quickStatus(r.id, 'pago')}>
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {r.status !== 'pendente' && r.status !== 'pago' && (
                        <button className="btn btn-secondary btn-icon" title="Marcar pendente" onClick={() => quickStatus(r.id, 'pendente')}>
                          <Clock size={14} />
                        </button>
                      )}
                      <button className="btn btn-secondary btn-icon" title="Editar" onClick={() => openEdit(r)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon" title="Excluir" onClick={() => { setDeleteTarget(r); setShowDeleteModal(true) }}>
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

      {/* Modal Registro */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="icon"><DollarSign size={16} /></div>
                {editingId ? 'Editar Registro' : 'Novo Registro Financeiro'}
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Cliente <span className="required">*</span></label>
                  <select className="form-select" name="cliente_id" value={form.cliente_id}
                    onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">Selecione o cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_completo} — {c.cpf}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mês</label>
                  <select className="form-select" value={form.mes}
                    onChange={e => setForm(f => ({ ...f, mes: parseInt(e.target.value) }))}>
                    {MESES_NOMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ano</label>
                  <select className="form-select" value={form.ano}
                    onChange={e => setForm(f => ({ ...f, ano: parseInt(e.target.value) }))}>
                    {[2023, 2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor <span className="required">*</span></label>
                  <input className="form-input font-mono" placeholder="0,00"
                    value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select className="form-select" value={form.forma_pagamento}
                    onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
                    {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_FIN.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Vencimento</label>
                  <input className="form-input" type="date" value={form.data_vencimento}
                    onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Pagamento</label>
                  <input className="form-input" type="date" value={form.data_pagamento}
                    onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Descrição</label>
                  <input className="form-input" placeholder="Ex: Mensalidade março, plano premium..." value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="loading-spinner" /> Salvando...</> : (editingId ? 'Atualizar' : 'Registrar Pagamento')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">
                <div className="icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}><Trash2 size={16} /></div>
                Excluir Registro
              </div>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p>Excluir o registro de <strong>{formatBRL(deleteTarget.valor)}</strong> de<br />
                  <strong>{deleteTarget.clientes?.nome_completo}</strong>?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

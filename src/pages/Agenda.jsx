import { useState, useEffect } from 'react'
import {
  CalendarDays, Plus, Trash2, CheckCircle, X,
  Clock, Phone, Users, Video, MoreHorizontal, Search
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendaService, clientesService } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const TIPOS = [
  { value: 'servico', label: 'Serviço', icon: '🔧' },
  { value: 'reuniao', label: 'Reunião', icon: '📋' },
  { value: 'ligacao', label: 'Ligação', icon: '📞' },
  { value: 'outro', label: 'Outro', icon: '📌' },
]

const emptyForm = {
  titulo: '',
  descricao: '',
  data_hora: '',
  cliente_id: '',
  tipo: 'servico',
}

export default function Agenda() {
  const { addToast } = useToast()
  const [eventos, setEventos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('')
  const [filterStatus, setFilterStatus] = useState('pendentes')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [ev, cl] = await Promise.all([
        agendaService.getAll(),
        clientesService.getAll(),
      ])
      setEventos(ev)
      setClientes(cl)
    } catch (err) {
      addToast('Erro ao carregar agenda: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = eventos.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.titulo.toLowerCase().includes(q) ||
      e.clientes?.nome_completo?.toLowerCase().includes(q) ||
      e.descricao?.toLowerCase().includes(q)
    const matchTipo = !filterTipo || e.tipo === filterTipo
    const matchStatus = filterStatus === '' ? true
      : filterStatus === 'pendentes' ? !e.concluido
        : e.concluido
    return matchSearch && matchTipo && matchStatus
  })

  // Group by date
  const grouped = filtered.reduce((acc, e) => {
    const dateKey = format(new Date(e.data_hora), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(e)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  function openNew() {
    setForm(emptyForm)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.titulo || !form.data_hora) {
      addToast('Título e data/hora são obrigatórios.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, cliente_id: form.cliente_id || null }
      const created = await agendaService.create(payload)
      setEventos(prev => [...prev, created].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)))
      addToast('Evento agendado!', 'success')
      setShowModal(false)
    } catch (err) {
      addToast('Erro ao salvar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleConcluir(id) {
    try {
      const updated = await agendaService.concluir(id)
      setEventos(prev => prev.map(e => e.id === id ? updated : e))
      addToast('Marcado como concluído!', 'success')
    } catch (err) {
      addToast('Erro: ' + err.message, 'error')
    }
  }

  async function handleDelete() {
    try {
      await agendaService.delete(deleteTarget.id)
      setEventos(prev => prev.filter(e => e.id !== deleteTarget.id))
      addToast('Evento removido.', 'success')
      setShowDeleteModal(false)
    } catch (err) {
      addToast('Erro: ' + err.message, 'error')
    }
  }

  function getTipoInfo(tipo) {
    return TIPOS.find(t => t.value === tipo) || TIPOS[3]
  }

  const stats = {
    total: eventos.length,
    pendentes: eventos.filter(e => !e.concluido).length,
    concluidos: eventos.filter(e => e.concluido).length,
    hoje: eventos.filter(e => isToday(new Date(e.data_hora)) && !e.concluido).length,
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Agenda</h2>
          <p>Serviços, reuniões e compromissos</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> Novo Evento
        </button>
      </div>

      {/* Stats */}
      <div className="stat-cards" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><CalendarDays size={20} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total de Eventos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Clock size={20} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendentes}</div>
            <div className="stat-label">Pendentes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={20} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.concluidos}</div>
            <div className="stat-label">Concluídos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><CalendarDays size={20} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.hoje}</div>
            <div className="stat-label">Hoje</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar" style={{ maxWidth: 260 }}>
          <Search size={14} className="search-icon" />
          <input placeholder="Buscar evento..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="pendentes">Pendentes</option>
          <option value="concluidos">Concluídos</option>
          <option value="">Todos</option>
        </select>
        <select className="filter-select" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
        {(search || filterTipo) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterTipo('') }}>
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Event List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner lg" />
          <span>Carregando agenda...</span>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CalendarDays size={28} /></div>
          <h3>Nenhum evento encontrado</h3>
          <p>Crie eventos para organizar seus compromissos.</p>
        </div>
      ) : (
        <div>
          {sortedDates.map(dateKey => {
            const date = new Date(dateKey + 'T12:00')
            const isHoje = isToday(date)
            const passou = isPast(date) && !isHoje

            return (
              <div key={dateKey} style={{ marginBottom: 20 }}>
                {/* Date Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    background: isHoje ? 'var(--blue-500)' : 'var(--surface-2)',
                    border: `1px solid ${isHoje ? 'var(--blue-400)' : 'var(--border-default)'}`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: isHoje ? 'white' : passou ? 'var(--text-muted)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {isHoje && <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: 4, letterSpacing: 1 }}>HOJE</span>}
                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {grouped[dateKey].length} evento{grouped[dateKey].length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Events */}
                {grouped[dateKey].map(evento => {
                  const tipo = getTipoInfo(evento.tipo)
                  return (
                    <div key={evento.id} className={`agenda-item ${evento.concluido ? 'concluido' : ''}`}>
                      {/* Time */}
                      <div className="agenda-datetime">
                        <div className="day">{format(new Date(evento.data_hora), 'dd')}</div>
                        <div className="month">{format(new Date(evento.data_hora), 'MMM', { locale: ptBR })}</div>
                        <div className="time">{format(new Date(evento.data_hora), 'HH:mm')}</div>
                      </div>

                      {/* Content */}
                      <div className="agenda-content">
                        <div className="agenda-titulo">{evento.titulo}</div>
                        {evento.descricao && (
                          <div className="agenda-descricao">{evento.descricao}</div>
                        )}
                        <div className="agenda-meta">
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>
                            {tipo.icon} {tipo.label}
                          </span>
                          {evento.clientes && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Users size={10} />
                              {evento.clientes.nome_completo}
                            </span>
                          )}
                          {evento.concluido && (
                            <span className="badge badge-pago" style={{ fontSize: 10 }}>
                              <CheckCircle size={10} /> Concluído
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {!evento.concluido && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleConcluir(evento.id)}
                            title="Marcar como concluído"
                          >
                            <CheckCircle size={13} /> Concluir
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => { setDeleteTarget(evento); setShowDeleteModal(true) }}
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Novo Evento */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="icon"><CalendarDays size={16} /></div>
                Novo Evento
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Título <span className="required">*</span></label>
                  <input className="form-input" placeholder="Descreva o evento ou serviço..."
                    value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data e Hora <span className="required">*</span></label>
                  <input className="form-input" type="datetime-local"
                    value={form.data_hora} onChange={e => setForm(f => ({ ...f, data_hora: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Cliente (opcional)</label>
                  <select className="form-select" value={form.cliente_id}
                    onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">Sem cliente vinculado</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" placeholder="Detalhes adicionais sobre o evento..."
                    value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    style={{ minHeight: 80 }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="loading-spinner" /> Salvando...</> : 'Agendar Evento'}
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
                <div className="icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>
                  <Trash2 size={16} />
                </div>
                Excluir Evento
              </div>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p>Deseja excluir o evento<br /><strong>"{deleteTarget.titulo}"</strong>?</p>
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

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, FileText, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { financeiroService, agendaService } from '../lib/supabase'

export default function ClienteHistorico({ cliente, onClose }) {
  const [activeTab, setActiveTab] = useState('timeline')
  const [pagamentos, setPagamentos] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cliente) {
      loadHistorico()
    }
  }, [cliente])

  async function loadHistorico() {
    setLoading(true)
    try {
      const [pag, agg] = await Promise.all([
        financeiroService.getAll().then(d => d.filter(r => r.cliente_id === cliente.id)),
        agendaService.getAll().then(d => d.filter(e => e.cliente_id === cliente.id))
      ])
      
      setPagamentos(pag.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      setAgendamentos(agg.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)))
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatBRL(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'pagamentos', label: 'Pagamentos', icon: DollarSign },
    { id: 'agendamentos', label: 'Agendamentos', icon: Calendar },
  ]

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <div className="modal-title">
            <div className="icon">
              <FileText size={16} />
            </div>
            Histórico - {cliente?.nome_completo}
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ 
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          display: 'flex',
          gap: 8
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary-500)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary-500)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: -1
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ padding: 24 }}>
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner lg" />
            </div>
          ) : (
            <>
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Timeline unificada */}
                  {[...pagamentos.map(p => ({ ...p, type: 'pagamento' })), 
                    ...agendamentos.map(a => ({ ...a, type: 'agendamento' }))]
                    .sort((a, b) => new Date(b.created_at || b.data_hora) - new Date(a.created_at || a.data_hora))
                    .map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        gap: 16,
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: item.type === 'pagamento' ? 'var(--success-100)' : 'var(--blue-100)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.type === 'pagamento' ? 'var(--success-500)' : 'var(--primary-600)',
                          flexShrink: 0
                        }}>
                          {item.type === 'pagamento' ? <DollarSign size={18} /> : <Calendar size={18} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {item.type === 'pagamento' 
                              ? `Pagamento de ${formatBRL(item.valor)}`
                              : `Agendamento: ${item.titulo}`
                            }
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {format(new Date(item.created_at || item.data_hora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </div>
                          {item.type === 'pagamento' && (
                            <span className={`badge badge-${item.status}`} style={{ marginTop: 6, display: 'inline-block' }}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  
                  {pagamentos.length === 0 && agendamentos.length === 0 && (
                    <div className="empty-state">
                      <p>Nenhuma atividade registrada</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pagamentos' && (
                <div className="table-container">
                  <table className="rtcom-table">
                    <thead>
                      <tr>
                        <th>Mês/Ano</th>
                        <th>Valor</th>
                        <th>Forma</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos.map(p => (
                        <tr key={p.id}>
                          <td>{p.mes}/{p.ano}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                            {formatBRL(p.valor)}
                          </td>
                          <td><span className="badge badge-blue">{p.forma_pagamento}</span></td>
                          <td>{p.data_vencimento ? format(new Date(p.data_vencimento), 'dd/MM/yyyy') : '-'}</td>
                          <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'agendamentos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {agendamentos.map(a => (
                    <div key={a.id} className="agenda-item">
                      <div className="agenda-datetime">
                        <div className="day">{format(new Date(a.data_hora), 'dd')}</div>
                        <div className="month">{format(new Date(a.data_hora), 'MMM', { locale: ptBR })}</div>
                        <div className="time">{format(new Date(a.data_hora), 'HH:mm')}</div>
                      </div>
                      <div className="agenda-content">
                        <div className="agenda-titulo">{a.titulo}</div>
                        {a.descricao && <div className="agenda-descricao">{a.descricao}</div>}
                      </div>
                      {a.concluido && (
                        <span className="badge badge-pago">Concluído</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
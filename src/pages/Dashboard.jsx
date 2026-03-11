import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, DollarSign, CheckCircle, Clock, AlertCircle,
  CalendarDays, TrendingUp, UserCheck, UserX, ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clientesService, financeiroService, agendaService } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesCancelados: 0,
    receitaMes: 0,
    receitaPaga: 0,
    receitaPendente: 0,
    agendaHoje: 0,
  })
  const [agendaProxima, setAgendaProxima] = useState([])
  const [grafico, setGrafico] = useState([])
  const [recentes, setRecentes] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const now = new Date()
      const mes = now.getMonth() + 1
      const ano = now.getFullYear()

      const [clientes, resumo, agenda] = await Promise.all([
        clientesService.getAll(),
        financeiroService.getResumoMensal(mes, ano),
        agendaService.getUpcoming(),
      ])

      const hoje = format(now, 'yyyy-MM-dd')
      const agendaHoje = agenda.filter(a =>
        format(new Date(a.data_hora), 'yyyy-MM-dd') === hoje
      ).length

      setStats({
        totalClientes: clientes.length,
        clientesAtivos: clientes.filter(c => c.status === 'ativo').length,
        clientesCancelados: clientes.filter(c => c.status === 'cancelado').length,
        receitaMes: resumo.total,
        receitaPaga: resumo.pago,
        receitaPendente: resumo.pendente,
        agendaHoje,
      })

      setAgendaProxima(agenda.slice(0, 5))
      setRecentes(clientes.slice(0, 5))

      // Gráfico dos últimos 6 meses
      const graficoData = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(ano, mes - 1 - i, 1)
        const m = d.getMonth() + 1
        const a = d.getFullYear()
        try {
          const r = await financeiroService.getResumoMensal(m, a)
          graficoData.push({ mes: MESES[m - 1], pago: r.pago, pendente: r.pendente })
        } catch {
          graficoData.push({ mes: MESES[m - 1], pago: 0, pendente: 0 })
        }
      }
      setGrafico(graficoData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner lg" />
        <span>Carregando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Stats */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalClientes}</div>
            <div className="stat-label">Total de Clientes</div>
            <div className="stat-sub">{stats.clientesAtivos} ativos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-content">
            <div className="stat-value" style={{ fontSize: 16 }}>{formatBRL(stats.receitaMes)}</div>
            <div className="stat-label">Receita do Mês</div>
            <div className="stat-sub">{formatBRL(stats.receitaPaga)} recebido</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Clock size={22} /></div>
          <div className="stat-content">
            <div className="stat-value" style={{ fontSize: 16 }}>{formatBRL(stats.receitaPendente)}</div>
            <div className="stat-label">A Receber</div>
            <div className="stat-sub">pendente de pagamento</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><CalendarDays size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.agendaHoje}</div>
            <div className="stat-label">Agenda Hoje</div>
            <div className="stat-sub">compromissos agendados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertCircle size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.clientesCancelados}</div>
            <div className="stat-label">Cancelados</div>
            <div className="stat-sub">clientes inativos</div>
          </div>
        </div>
      </div>

      {/* Charts & Data Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>
        {/* Area Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={16} className="icon" />
              Receita — Últimos 6 Meses
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={grafico} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradPago" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPendente" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill: '#5B7E9C', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5B7E9C', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip
                contentStyle={{ background: '#0C2240', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => formatBRL(v)}
                labelStyle={{ color: '#94B8D8' }}
              />
              <Area type="monotone" dataKey="pago" stroke="#3B82F6" strokeWidth={2} fill="url(#gradPago)" name="Pago" />
              <Area type="monotone" dataKey="pendente" stroke="#F59E0B" strokeWidth={2} fill="url(#gradPendente)" name="Pendente" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#3B82F6' }} />
              Pago
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B' }} />
              Pendente
            </div>
          </div>
        </div>

        {/* Próximos agendamentos */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CalendarDays size={16} className="icon" />
              Próximos Serviços
            </div>
            <Link to="/agenda" style={{ fontSize: 11, color: 'var(--blue-300)', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {agendaProxima.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 16px' }}>
              <CalendarDays size={28} color="var(--text-disabled)" />
              <p style={{ fontSize: 12 }}>Nenhum compromisso próximo</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agendaProxima.map(item => (
                <div key={item.id} style={{
                  display: 'flex', gap: 10, padding: '10px 12px',
                  borderRadius: 8, border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-glass)'
                }}>
                  <div style={{
                    minWidth: 38, textAlign: 'center',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: 6, padding: '4px 2px'
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue-200)', fontFamily: 'JetBrains Mono' }}>
                      {format(new Date(item.data_hora), 'dd')}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {format(new Date(item.data_hora), 'MMM', { locale: ptBR })}
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.titulo}
                    </div>
                    {item.clientes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {item.clientes.nome_completo}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
                      {format(new Date(item.data_hora), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clientes Recentes */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Users size={16} className="icon" />
            Clientes Recentes
          </div>
          <Link to="/clientes" style={{ fontSize: 11, color: 'var(--blue-300)', display: 'flex', alignItems: 'center', gap: 3 }}>
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        {recentes.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px' }}>
            <p>Nenhum cliente cadastrado ainda.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="rtcom-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Contato</th>
                  <th>Operadora</th>
                  <th>Consultor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentes.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="primary-text">{c.nome_completo}</div>
                      <div className="sub-text">{c.email}</div>
                    </td>
                    <td><span className="text-mono">{c.cpf}</span></td>
                    <td>{c.contato}</td>
                    <td>
                      {c.operadora && (
                        <span className="badge badge-blue">{c.operadora}</span>
                      )}
                    </td>
                    <td>{c.consultor || '—'}</td>
                    <td>
                      <span className={`badge badge-${c.status}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

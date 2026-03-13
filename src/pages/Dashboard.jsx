import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, DollarSign, CheckCircle, Clock, AlertCircle,
  CalendarDays, TrendingUp, ArrowRight, Activity,
  UserCheck, UserX, CreditCard, Calendar
} from 'lucide-react'
import { format, isToday, isFuture, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clientesService, financeiroService, agendaService } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { useAuth } from '../contexts/AuthContext'

function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const CORES_GRAFICO = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6']

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    clientesCancelados: 0,
    receitaMes: 0,
    receitaPaga: 0,
    receitaPendente: 0,
    receitaCancelada: 0,
    agendaHoje: 0,
    agendaPendentes: 0,
    agendaConcluidos: 0,
  })
  const [agendaHojeItems, setAgendaHojeItems] = useState([])
  const [agendaProxima, setAgendaProxima] = useState([])
  const [graficoReceita, setGraficoReceita] = useState([])
  const [graficoOperadoras, setGraficoOperadoras] = useState([])
  const [recentes, setRecentes] = useState([])
  const [financeiroRecente, setFinanceiroRecente] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const now = new Date()
      const mes = now.getMonth() + 1
      const ano = now.getFullYear()
      const hojeStr = format(now, 'yyyy-MM-dd')

      // Carrega todos os dados em paralelo
      const [clientes, financeiro, agenda] = await Promise.all([
        clientesService.getAll(),
        financeiroService.getAll(),
        agendaService.getAll(),
      ])

      // ===== CLIENTES =====
      const clientesAtivos = clientes.filter(c => c.status === 'ativo')
      const clientesInativos = clientes.filter(c => c.status === 'inativo')
      const clientesCancelados = clientes.filter(c => c.status === 'cancelado')

      // Operadoras
      const operadorasCount = {}
      clientes.forEach(c => {
        const op = c.operadora || 'Outros'
        operadorasCount[op] = (operadorasCount[op] || 0) + 1
      })
      const graficoOp = Object.entries(operadorasCount).map(([name, value], idx) => ({
        name,
        value,
        color: CORES_GRAFICO[idx % CORES_GRAFICO.length]
      }))

      // ===== FINANCEIRO =====
      const financeiroMes = financeiro.filter(f => f.mes === mes && f.ano === ano)
      const receitaPaga = financeiroMes
        .filter(f => f.status === 'pago')
        .reduce((acc, f) => acc + Number(f.valor || 0), 0)
      const receitaPendente = financeiroMes
        .filter(f => f.status === 'pendente')
        .reduce((acc, f) => acc + Number(f.valor || 0), 0)
      const receitaCancelada = financeiroMes
        .filter(f => f.status === 'cancelado')
        .reduce((acc, f) => acc + Number(f.valor || 0), 0)

      // ===== AGENDA =====
      const agendaHoje = agenda.filter(a => {
        if (!a.data_hora || a.concluido) return false
        const dataEvento = format(new Date(a.data_hora), 'yyyy-MM-dd')
        return dataEvento === hojeStr
      })

      const agendaPendentes = agenda.filter(a => !a.concluido && isFuture(new Date(a.data_hora)))
      const agendaConcluidos = agenda.filter(a => a.concluido)

      // Próximos eventos (ordenados por data)
      const proximosEventos = agenda
        .filter(a => {
          if (!a.data_hora || a.concluido) return false
          const dataEvento = new Date(a.data_hora)
          return isFuture(dataEvento) || isToday(dataEvento)
        })
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
        .slice(0, 5)

      // Financeiro recente
      const financeiroOrdenado = [...financeiro]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5)

      // ===== GRÁFICO DE RECEITA (6 MESES) =====
      const graficoData = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(ano, mes - 1 - i, 1)
        const m = d.getMonth() + 1
        const a = d.getFullYear()
        const finMes = financeiro.filter(f => f.mes === m && f.ano === a)
        const pago = finMes.filter(f => f.status === 'pago').reduce((acc, f) => acc + Number(f.valor || 0), 0)
        const pendente = finMes.filter(f => f.status === 'pendente').reduce((acc, f) => acc + Number(f.valor || 0), 0)
        graficoData.push({ mes: MESES[m - 1], pago, pendente })
      }

      // ===== ATUALIZA ESTADOS =====
      setStats({
        totalClientes: clientes.length,
        clientesAtivos: clientesAtivos.length,
        clientesInativos: clientesInativos.length,
        clientesCancelados: clientesCancelados.length,
        receitaMes: receitaPaga + receitaPendente,
        receitaPaga,
        receitaPendente,
        receitaCancelada,
        agendaHoje: agendaHoje.length,
        agendaPendentes: agendaPendentes.length,
        agendaConcluidos: agendaConcluidos.length,
      })

      setAgendaHojeItems(agendaHoje)
      setAgendaProxima(proximosEventos)
      setGraficoReceita(graficoData)
      setGraficoOperadoras(graficoOp)
      setRecentes(clientes.slice(0, 5))
      setFinanceiroRecente(financeiroOrdenado)

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner lg" />
        <span>Carregando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Dashboard</h2>
          <p>{format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={loadData}>
            <Activity size={14} /> Atualizar
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="stat-cards">
        {/* Total Clientes */}
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalClientes}</div>
            <div className="stat-label">Total de Clientes</div>
            <div className="stat-sub" style={{ color: 'var(--accent-green)' }}>
              {stats.clientesAtivos} ativos
            </div>
          </div>
        </div>

        {/* Receita do Mês */}
        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ fontSize: 16 }}>{formatBRL(stats.receitaMes)}</div>
            <div className="stat-label">Receita do Mês</div>
            <div className="stat-sub">{formatBRL(stats.receitaPaga)} recebido</div>
          </div>
        </div>

        {/* A Receber */}
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ fontSize: 16 }}>{formatBRL(stats.receitaPendente)}</div>
            <div className="stat-label">A Receber</div>
            <div className="stat-sub">pendente de pagamento</div>
          </div>
        </div>

        {/* Agenda Hoje */}
        <div className="stat-card">
          <div className="stat-icon cyan">
            <CalendarDays size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.agendaHoje}</div>
            <div className="stat-label">Agenda Hoje</div>
            <div className="stat-sub">{stats.agendaPendentes} pendentes</div>
          </div>
        </div>

        {/* Cancelados */}
        <div className="stat-card">
          <div className="stat-icon red">
            <AlertCircle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.clientesCancelados}</div>
            <div className="stat-label">Cancelados</div>
            <div className="stat-sub">clientes inativos</div>
          </div>
        </div>
      </div>

      {/* ===== GRÁFICOS E AGENDA ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 16 }}>
        
        {/* Gráfico de Receita */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={16} className="icon" />
              Receita — Últimos 6 Meses
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={graficoReceita} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradPago" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPendente" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="mes" 
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
              />
              <Tooltip
                contentStyle={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border-default)', 
                  borderRadius: 8, 
                  fontSize: 12 
                }}
                formatter={(v) => formatBRL(v)}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Area 
                type="monotone" 
                dataKey="pago" 
                stroke="#10B981" 
                strokeWidth={2} 
                fill="url(#gradPago)" 
                name="Pago" 
              />
              <Area 
                type="monotone" 
                dataKey="pendente" 
                stroke="#F59E0B" 
                strokeWidth={2} 
                fill="url(#gradPendente)" 
                name="Pendente" 
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981' }} />
              Pago
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B' }} />
              Pendente
            </div>
          </div>
        </div>

        {/* Próximos Serviços */}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agendaProxima.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex', 
                    gap: 12, 
                    padding: '12px',
                    borderRadius: 8, 
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-glass)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-glass)'}
                >
                  <div style={{
                    minWidth: 42, 
                    textAlign: 'center',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: 6, 
                    padding: '6px 4px',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 800, 
                      color: 'var(--blue-200)', 
                      fontFamily: 'JetBrains Mono',
                      lineHeight: 1
                    }}>
                      {format(new Date(item.data_hora), 'dd')}
                    </div>
                    <div style={{ 
                      fontSize: 8, 
                      color: 'var(--text-muted)', 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.5,
                      marginTop: 2
                    }}>
                      {format(new Date(item.data_hora), 'MMM', { locale: ptBR })}
                    </div>
                    <div style={{ 
                      fontSize: 9, 
                      color: 'var(--accent-cyan)', 
                      fontFamily: 'JetBrains Mono',
                      marginTop: 2
                    }}>
                      {format(new Date(item.data_hora), 'HH:mm')}
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ 
                      fontSize: 13, 
                      fontWeight: 600, 
                      color: 'var(--text-primary)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      marginBottom: 2
                    }}>
                      {item.titulo}
                    </div>
                    {item.clientes && (
                      <div style={{ 
                        fontSize: 11, 
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <Users size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                        {item.clientes.nome_completo}
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-blue" style={{ fontSize: 9, padding: '2px 6px' }}>
                        {item.tipo || 'Serviço'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== AGENDA DE HOJE E FINANCEIRO ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        
        {/* Agenda de Hoje */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={16} className="icon" />
              Agenda de Hoje
            </div>
            <Link to="/agenda" style={{ fontSize: 11, color: 'var(--blue-300)' }}>
              Ver agenda completa →
            </Link>
          </div>
          {agendaHojeItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 16px' }}>
              <Calendar size={28} color="var(--text-disabled)" />
              <p style={{ fontSize: 12 }}>Nenhum compromisso para hoje</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agendaHojeItems.map(item => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-glass)'
                  }}
                >
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: item.concluido ? 'var(--accent-green)' : 'var(--accent-yellow)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.titulo}
                    </div>
                    {item.clientes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.clientes.nome_completo}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
                    {format(new Date(item.data_hora), 'HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financeiro Recente */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={16} className="icon" />
              Pagamentos Recentes
            </div>
            <Link to="/financeiro" style={{ fontSize: 11, color: 'var(--blue-300)' }}>
              Ver financeiro →
            </Link>
          </div>
          {financeiroRecente.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 16px' }}>
              <DollarSign size={28} color="var(--text-disabled)" />
              <p style={{ fontSize: 12 }}>Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {financeiroRecente.map(item => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-glass)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: item.status === 'pago' ? 'var(--accent-green-dim)' : 
                                 item.status === 'pendente' ? 'var(--accent-yellow-dim)' : 'var(--accent-red-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.status === 'pago' ? 'var(--accent-green)' : 
                             item.status === 'pendente' ? 'var(--accent-yellow)' : 'var(--accent-red)'
                    }}>
                      <DollarSign size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.clientes?.nome_completo || 'Cliente'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {MESES[item.mes - 1]}/{item.ano}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                      {formatBRL(item.valor)}
                    </div>
                    <span className={`badge badge-${item.status}`} style={{ fontSize: 9, padding: '2px 6px', marginTop: 2 }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== CLIENTES RECENTES ===== */}
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
            <Users size={28} color="var(--text-disabled)" />
            <p style={{ fontSize: 13, marginTop: 8 }}>Nenhum cliente cadastrado ainda</p>
            <Link to="/clientes" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Cadastrar Primeiro Cliente
            </Link>
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
                      <div className="sub-text">{c.email || '—'}</div>
                    </td>
                    <td><span className="text-mono">{c.cpf}</span></td>
                    <td>{c.contato || '—'}</td>
                    <td>
                      {c.operadora ? (
                        <span className="badge badge-blue">{c.operadora}</span>
                      ) : '—'}
                    </td>
                    <td>{c.consultor || '—'}</td>
                    <td>
                      <span className={`badge badge-${c.status}`}>
                        <span className={`status-dot ${c.status}`} />
                        {c.status}
                      </span>
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

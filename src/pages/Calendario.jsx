import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendaService } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

export default function Calendario() {
  const { addToast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    loadEventos()
  }, [currentMonth])

  async function loadEventos() {
    setLoading(true)
    try {
      const data = await agendaService.getAll()
      setEventos(data)
    } catch (err) {
      addToast('Erro ao carregar eventos: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { locale: ptBR })
  const endDate = endOfWeek(monthEnd, { locale: ptBR })

  const eventoDoDia = (date) => {
    return eventos.filter(e => isSameDay(new Date(e.data_hora), date))
  }

  const rows = []
  let days = []
  let day = startDate

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day
      const eventosDia = eventoDoDia(day)
      
      days.push(
        <div
          key={day.toString()}
          onClick={() => setSelectedDate(cloneDay)}
          style={{
            border: '1px solid var(--border-subtle)',
            height: 100,
            padding: 8,
            background: isSameMonth(day, monthStart) ? 'var(--surface-card)' : 'var(--surface-1)',
            opacity: isSameMonth(day, monthStart) ? 1 : 0.5,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = isSameMonth(day, monthStart) ? 'var(--surface-card)' : 'var(--surface-1)'}
        >
          <div style={{ 
            fontSize: 12, 
            fontWeight: isSameDay(day, new Date()) ? 800 : 600,
            color: isSameDay(day, new Date()) ? 'var(--primary-500)' : 'var(--text-primary)',
            marginBottom: 4
          }}>
            {format(day, 'd')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {eventosDia.slice(0, 3).map((ev, idx) => (
              <div 
                key={idx}
                style={{
                  fontSize: 9,
                  padding: '2px 4px',
                  borderRadius: 3,
                  background: ev.tipo === 'servico' ? 'var(--blue-500)' : 
                             ev.tipo === 'reuniao' ? 'var(--accent-green)' : 'var(--accent-yellow)',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {ev.titulo}
              </div>
            ))}
            {eventosDia.length > 3 && (
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                +{eventosDia.length - 3} mais
              </div>
            )}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div className="calendar-row" key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days}
      </div>
    )
    days = []
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Calendário</h2>
          <p>Visualização mensal de eventos e compromissos</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={15} /> Novo Evento
        </button>
      </div>

      <div className="card">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0,
          marginBottom: 8
        }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
            <div key={dia} style={{
              padding: 8,
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>
              {dia}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="loading-container" style={{ padding: 60 }}>
            <div className="loading-spinner lg" />
          </div>
        ) : (
          <div>{rows}</div>
        )}
      </div>
    </div>
  )
}
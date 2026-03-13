import { useState } from 'react'
import { Bell, Check, CheckCheck, X, AlertCircle, Info, Calendar, Users } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  function getIcon(type) {
    switch(type) {
      case 'vencimento': return <AlertCircle size={16} />
      case 'cliente': return <Users size={16} />
      case 'agenda': return <Calendar size={16} />
      default: return <Info size={16} />
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-ghost btn-icon"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: 'var(--accent-red)',
            color: 'white',
            fontSize: 9,
            fontWeight: 700,
            width: 16,
            height: 16,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              zIndex: 998 
            }} 
            onClick={() => setIsOpen(false)} 
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 400,
            maxHeight: 500,
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Notificações</h3>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={markAllAsRead}
                  style={{ fontSize: 11 }}
                >
                  <CheckCheck size={12} /> Marcar todas
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ 
              overflowY: 'auto', 
              flex: 1,
              maxHeight: 400
            }}>
              {notifications.length === 0 ? (
                <div style={{ 
                  padding: 40, 
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Bell size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: notif.read ? 'transparent' : 'var(--surface-hover)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => markAsRead(notif.id)}
                    onMouseEnter={(e) => {
                      if (!notif.read) e.currentTarget.style.background = 'var(--surface-active)'
                    }}
                    onMouseLeave={(e) => {
                      if (!notif.read) e.currentTarget.style.background = 'var(--surface-hover)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        color: notif.type === 'vencimento' ? 'var(--accent-yellow)' : 
                               notif.type === 'cliente' ? 'var(--blue-300)' : 'var(--accent-cyan)'
                      }}>
                        {getIcon(notif.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4 }}>
                          {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                      {!notif.read && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--primary-500)'
                        }} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
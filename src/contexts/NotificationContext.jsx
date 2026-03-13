import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotifications()
      // Verificar a cada 5 minutos
      const interval = setInterval(loadNotifications, 300000)
      return () => clearInterval(interval)
    }
  }, [user])

  async function loadNotifications() {
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(50)
      
      setNotifications(data || [])
      setUnreadCount(data?.length || 0)
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
    }
  }

  async function markAsRead(id) {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      
      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Erro ao marcar como lida:', err)
    }
  }

  async function markAllAsRead() {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
      
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Erro ao marcar todas:', err)
    }
  }

  async function createNotification(title, message, type = 'info') {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title,
          message,
          type,
          read: false
        })
        .select()
      
      if (data) {
        setNotifications(prev => [data[0], ...prev])
        setUnreadCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Erro ao criar notificação:', err)
    }
  }

  const value = {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider')
  }
  return context
}
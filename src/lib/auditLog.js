import { supabase } from './supabase'

export const auditLogService = {
  async log(action, table, recordId, details, userId) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action, // 'CREATE', 'UPDATE', 'DELETE'
          table_name: table,
          record_id: recordId,
          details,
          ip_address: '', // Preencher se tiver acesso
          created_at: new Date().toISOString()
        })
        .select()
      
      return data
    } catch (err) {
      console.error('Erro ao criar audit log:', err)
      return null
    }
  },

  async getLogs(filters = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users:user_id (nome, email)
        `)
        .order('created_at', { ascending: false })

      if (filters.table) {
        query = query.eq('table_name', filters.table)
      }
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      const { data, error } = await query.limit(100)
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erro ao buscar logs:', err)
      return []
    }
  },

  async exportToCSV() {
    const logs = await this.getLogs()
    
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Tabela', 'Registro', 'Detalhes'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.users?.email || 'Unknown',
        log.action,
        log.table_name,
        log.record_id,
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }
}
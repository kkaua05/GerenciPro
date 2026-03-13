import { useState, useEffect } from 'react'
import { FileText, Download, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { auditLogService } from '../lib/auditLog'
import { useAuth } from '../contexts/AuthContext'

export default function AuditLog() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTable, setFilterTable] = useState('')

  useEffect(() => {
    loadLogs()
  }, [filterTable])

  async function loadLogs() {
    setLoading(true)
    const data = await auditLogService.getLogs({ table: filterTable })
    setLogs(data)
    setLoading(false)
  }

  function handleExport() {
    auditLogService.exportToCSV()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Audit Log</h2>
          <p>Rastreamento de todas as ações no sistema</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      <div className="filters-bar">
        <select 
          className="filter-select" 
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
        >
          <option value="">Todas as tabelas</option>
          <option value="clientes">Clientes</option>
          <option value="financeiro">Financeiro</option>
          <option value="agenda">Agenda</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner lg" />
        </div>
      ) : (
        <div className="table-container">
          <table className="rtcom-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Tabela</th>
                <th>Registro ID</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</td>
                  <td>{log.users?.nome || log.users?.email || 'Sistema'}</td>
                  <td>
                    <span className={`badge badge-${
                      log.action === 'CREATE' ? 'success' : 
                      log.action === 'UPDATE' ? 'pendente' : 'cancelado'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.table_name}</td>
                  <td className="text-mono">{log.record_id}</td>
                  <td>
                    <pre style={{ 
                      fontSize: 10, 
                      background: 'var(--surface-2)', 
                      padding: 8, 
                      borderRadius: 4,
                      maxWidth: 300,
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
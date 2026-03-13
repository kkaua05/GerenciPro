import { clientesService } from './supabase'

export const exportImportService = {
  // Exportar clientes para CSV
  async exportClientesToCSV() {
    try {
      const clientes = await clientesService.getAll()
      
      const csvContent = [
        ['ID', 'Nome', 'CPF', 'Contato', 'E-mail', 'Operadora', 'Status', 'Vendedor', 'Consultor'].join(','),
        ...clientes.map(c => [
          c.id,
          `"${c.nome_completo.replace(/"/g, '""')}"`,
          c.cpf,
          c.contato,
          c.email,
          c.operadora,
          c.status,
          c.vendedor,
          c.consultor
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      return true
    } catch (err) {
      console.error('Erro ao exportar:', err)
      return false
    }
  },

  // Importar clientes de CSV
  async importClientesFromCSV(file, onProgress) {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n')
          const headers = lines[0].split(',')
          
          const clientes = []
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue
            
            const values = lines[i].split(',')
            const cliente = {}
            
            headers.forEach((header, idx) => {
              cliente[header.trim().toLowerCase().replace(/ /g, '_')] = values[idx]?.replace(/"/g, '').trim()
            })
            
            if (cliente.nome_completo && cliente.cpf) {
              clientes.push(cliente)
            }
            
            if (onProgress) {
              onProgress(Math.round((i / lines.length) * 100))
            }
          }

          // Criar clientes em lote
          const results = []
          for (const cliente of clientes) {
            try {
              const created = await clientesService.create(cliente)
              results.push({ success: true, data: created })
            } catch (err) {
              results.push({ success: false, error: err.message, data: cliente })
            }
          }

          resolve(results)
        } catch (err) {
          reject(err)
        }
      }
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsText(file)
    })
  },

  // Gerar relatório PDF simples
  generateRelatorioPDF(cliente, pagamentos, agendamentos) {
    const content = `
      RELATÓRIO DO CLIENTE
      ====================
      
      Nome: ${cliente.nome_completo}
      CPF: ${cliente.cpf}
      Contato: ${cliente.contato}
      E-mail: ${cliente.email}
      
      HISTÓRICO DE PAGAMENTOS
      =======================
      ${pagamentos.map(p => 
        `${p.mes}/${p.ano}: R$ ${p.valor} - ${p.status}`
      ).join('\n')}
      
      AGENDAMENTOS
      ============
      ${agendamentos.map(a => 
        `${new Date(a.data_hora).toLocaleString('pt-BR')}: ${a.titulo}`
      ).join('\n')}
      
      Gerado em: ${new Date().toLocaleString('pt-BR')}
    `

    const blob = new Blob([content], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${cliente.nome_completo.replace(/\s+/g, '_')}.txt`
    link.click()
  }
}
import { createClient } from '@supabase/supabase-js'

// CONFIGURE SUAS CREDENCIAIS DO SUPABASE AQUI
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://SEU_PROJECT_ID.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'SUA_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// =======================================
// CLIENTES
// =======================================
export const clientesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, financeiro(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(cliente) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, cliente) {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async search(query) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nome_completo.ilike.%${query}%,cpf.ilike.%${query}%,email.ilike.%${query}%,contato.ilike.%${query}%`)
      .order('nome_completo')
    if (error) throw error
    return data
  }
}

// =======================================
// FINANCEIRO
// =======================================
export const financeiroService = {
  async getAll(filtros = {}) {
    let query = supabase
      .from('financeiro')
      .select('*, clientes(nome_completo, cpf)')
      .order('created_at', { ascending: false })

    if (filtros.mes) query = query.eq('mes', filtros.mes)
    if (filtros.ano) query = query.eq('ano', filtros.ano)
    if (filtros.status) query = query.eq('status', filtros.status)
    if (filtros.cliente_id) query = query.eq('cliente_id', filtros.cliente_id)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getByCliente(clienteId) {
    const { data, error } = await supabase
      .from('financeiro')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
    if (error) throw error
    return data
  },

  async getResumoMensal(mes, ano) {
    const { data, error } = await supabase
      .from('financeiro')
      .select('*')
      .eq('mes', mes)
      .eq('ano', ano)
    if (error) throw error

    const total = data.reduce((acc, item) => acc + Number(item.valor), 0)
    const pago = data.filter(i => i.status === 'pago').reduce((acc, i) => acc + Number(i.valor), 0)
    const pendente = data.filter(i => i.status === 'pendente').reduce((acc, i) => acc + Number(i.valor), 0)
    const cancelado = data.filter(i => i.status === 'cancelado').reduce((acc, i) => acc + Number(i.valor), 0)

    return { total, pago, pendente, cancelado, registros: data }
  },

  async create(financeiro) {
    const { data, error } = await supabase
      .from('financeiro')
      .insert([financeiro])
      .select('*, clientes(nome_completo)')
      .single()
    if (error) throw error
    return data
  },

  async update(id, financeiro) {
    const { data, error } = await supabase
      .from('financeiro')
      .update(financeiro)
      .eq('id', id)
      .select('*, clientes(nome_completo)')
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('financeiro')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// =======================================
// AGENDA
// =======================================
export const agendaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('agenda')
      .select('*, clientes(nome_completo)')
      .order('data_hora', { ascending: true })
    if (error) throw error
    return data
  },

  async getUpcoming() {
    const { data, error } = await supabase
      .from('agenda')
      .select('*, clientes(nome_completo)')
      .gte('data_hora', new Date().toISOString())
      .eq('concluido', false)
      .order('data_hora', { ascending: true })
      .limit(10)
    if (error) throw error
    return data
  },

  async create(evento) {
    const { data, error } = await supabase
      .from('agenda')
      .insert([evento])
      .select('*, clientes(nome_completo)')
      .single()
    if (error) throw error
    return data
  },

  async update(id, evento) {
    const { data, error } = await supabase
      .from('agenda')
      .update(evento)
      .eq('id', id)
      .select('*, clientes(nome_completo)')
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('agenda')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async concluir(id) {
    const { data, error } = await supabase
      .from('agenda')
      .update({ concluido: true })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

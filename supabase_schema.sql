-- =============================================
-- CONSULTORIA RTCOM - SUPABASE SCHEMA
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  contato TEXT,
  email TEXT,
  nome_mae TEXT,
  operadora TEXT CHECK (operadora IN ('TIM', 'VIVO', 'CLARO', 'OI', 'OUTROS')),
  senha TEXT,
  vendedor TEXT,
  consultor TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA FINANCEIRO
CREATE TABLE IF NOT EXISTS financeiro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('PIX', 'BOLETO', 'ESPECIE')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'cancelado')),
  data_vencimento DATE,
  data_pagamento DATE,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA AGENDA
CREATE TABLE IF NOT EXISTS agenda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMPTZ NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  tipo TEXT DEFAULT 'servico' CHECK (tipo IN ('servico', 'reuniao', 'ligacao', 'outro')),
  concluido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_financeiro_cliente ON financeiro(cliente_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_mes_ano ON financeiro(mes, ano);
CREATE INDEX IF NOT EXISTS idx_agenda_data ON agenda(data_hora);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);

-- ROW LEVEL SECURITY (RLS) - desabilita para uso simples
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenda DISABLE ROW LEVEL SECURITY;

-- TRIGGER para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_financeiro_updated_at
  BEFORE UPDATE ON financeiro
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

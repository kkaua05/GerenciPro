import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const routeInfo = {
  '/': { title: 'Dashboard', breadcrumb: 'Visão geral do sistema' },
  '/clientes': { title: 'Clientes', breadcrumb: 'Gestão de clientes' },
  '/clientes/novo': { title: 'Novo Cliente', breadcrumb: 'Clientes / Cadastrar' },
  '/financeiro': { title: 'Financeiro', breadcrumb: 'Controle financeiro mensal' },
  '/agenda': { title: 'Agenda', breadcrumb: 'Serviços e compromissos' },
}

export default function Topbar() {
  const { pathname } = useLocation()

  const matchedKey = Object.keys(routeInfo)
    .filter(k => pathname === k || (k !== '/' && pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0] || '/'

  const info = routeInfo[matchedKey] || routeInfo['/']
  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">{info.title}</div>
        <div className="page-breadcrumb">{info.breadcrumb}</div>
      </div>
      <div className="topbar-right">
        <div className="topbar-badge">
          <span className="dot" />
          <span style={{ textTransform: 'capitalize', fontSize: 11 }}>{hoje}</span>
        </div>
      </div>
    </header>
  )
}

import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CalendarDays,
  Settings,
  Activity,
  Building2
} from 'lucide-react'

const navItems = [
  {
    section: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/clientes', icon: Users, label: 'Clientes' },
      { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
      { to: '/agenda', icon: CalendarDays, label: 'Agenda' },
    ]
  }
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">
          <div className="brand-icon">RT</div>
          <div className="brand-text">
            <div className="name">Consultoria RTCOM</div>
            <div className="subtitle">Sistema de Gestão</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(({ to, icon: Icon, label }) => {
              const isActive = to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={17} className="nav-icon" />
                  {label}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">AD</div>
          <div className="user-info">
            <div className="user-name">Administrador</div>
            <div className="user-role">RTCOM</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

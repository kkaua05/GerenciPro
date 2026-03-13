import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, DollarSign, CalendarDays, 
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AppLayout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'funcionario'] },
    { path: '/clientes', label: 'Clientes', icon: Users, roles: ['admin', 'funcionario'] },
    { path: '/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin'] },
    { path: '/agenda', label: 'Agenda', icon: CalendarDays, roles: ['admin', 'funcionario'] },
  ]

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role))

  const getPageTitle = () => {
    const currentItem = filteredNavItems.find(item => location.pathname === item.path)
    return currentItem?.label || 'Dashboard'
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="brand">
            <div className="brand-icon">RT</div>
            <div className="brand-text">
              <div className="name">Consultoria RTCOM</div>
              <div className="subtitle">SISTEMA DE GESTÃO</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">PRINCIPAL</div>
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={18} className="nav-icon" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user.avatar}</div>
            <div className="user-info">
              <div className="user-name">{user.nome}</div>
              <div className="user-role">
                <span className="badge badge-blue" style={{ padding: '2px 6px', fontSize: 9 }}>
                  {isAdmin ? 'ADMIN' : 'FUNCIONÁRIO'}
                </span>
              </div>
            </div>
            <button className="logout-btn" onClick={logout} title="Sair" style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              marginLeft: 'auto'
            }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{getPageTitle()}</h1>
            <span className="page-breadcrumb">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="topbar-right">
            <div className="topbar-badge">
              <span className="dot" />
              Sistema Online
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  )
}

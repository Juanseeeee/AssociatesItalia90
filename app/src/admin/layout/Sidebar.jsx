import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  Newspaper, 
  LogOut,
  UserPlus,
  Moon,
  Sun
} from 'lucide-react';
import { toast } from 'sonner';

const Sidebar = ({ isOpen, onClose, theme, toggleTheme }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Sesión cerrada');
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/members', icon: Users, label: 'Socios' },
    { to: '/admin/requests', icon: UserPlus, label: 'Solicitudes' },
    { to: '/admin/payments', icon: CreditCard, label: 'Pagos' },
    { to: '/admin/activities', icon: Calendar, label: 'Actividades' },
    { to: '/admin/news', icon: Newspaper, label: 'Noticias' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="mobile-overlay"
          onClick={onClose}
        />
      )}
      
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img 
              src="/logo-italia90.png" 
              alt="Logo Italia 90" 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback if image fails or for better branding */}
            <span>
              Panel de Administración
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item, index) => (
              <li key={item.to} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up">
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={toggleTheme}
            className="nav-link w-full mb-2 cursor-pointer border-none bg-transparent"
            style={{ justifyContent: 'flex-start' }}
          >
            <div className="theme-icon-wrapper" style={{ position: 'relative', width: 20, height: 20 }}>
              <Moon size={20} className={`theme-icon ${theme === 'dark' ? 'visible' : ''}`} style={{ position: 'absolute', inset: 0 }} />
              <Sun size={20} className={`theme-icon ${theme === 'light' ? 'visible' : ''}`} style={{ position: 'absolute', inset: 0 }} />
            </div>
            <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="btn-logout"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

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
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback if image fails or for better branding */}
            <span className="mt-2 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
                  className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} className="group-hover:scale-110 transition-transform duration-200" />
                  <span>{item.label}</span>
                  {/* Active Indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] opacity-0 transition-opacity duration-200 group-[.active]:opacity-100 rounded-r-full" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={toggleTheme}
            className="nav-link w-full mb-2 cursor-pointer border-none bg-transparent hover:bg-[var(--background)] group"
            style={{ justifyContent: 'flex-start' }}
          >
            <div className="relative w-5 h-5">
              <Moon size={20} className={`absolute inset-0 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`} />
              <Sun size={20} className={`absolute inset-0 transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
            </div>
            <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="btn-logout group hover:border-[var(--destructive)]"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

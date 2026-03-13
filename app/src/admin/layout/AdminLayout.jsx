import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar';
import '../admin.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('admin_theme') || 'light');

  useEffect(() => {
    localStorage.setItem('admin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="admin-wrapper" data-theme={theme}>
      <Toaster position="top-right" richColors closeButton theme={theme} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="admin-main">
        <div className="mobile-header">
            <div className="flex items-center gap-3">
                <img src="/logo-italia90.png" alt="Logo" className="h-8 w-auto" />
                <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Admin Panel</span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleTheme}
                    className="btn-icon"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="btn-icon"
                >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
        </div>

        <div className="animate-in">
            <Outlet context={{ theme }} />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

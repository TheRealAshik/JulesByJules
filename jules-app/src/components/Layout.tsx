import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings, Menu, X } from 'lucide-react';
import { getApiKey } from '@/lib/jules-client';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey && location.pathname !== '/settings') {
      navigate('/settings');
    }
  }, [location.pathname, navigate]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card flex items-center justify-between px-6 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          JulesApp
        </h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop and Mobile Overlay */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            JulesApp
          </h1>
        </div>

        <div className="p-6 md:pt-0 mt-16 md:mt-0 bg-card h-full">
          <nav className="space-y-2">
            <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} onClick={closeMenu} />
            <NavLink to="/create" icon={<PlusCircle size={20} />} label="New Session" active={location.pathname === '/create'} onClick={closeMenu} />
            <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" active={location.pathname === '/settings'} onClick={closeMenu} />
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavLink({ to, icon, label, active, onClick }: { to: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

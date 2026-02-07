import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings } from 'lucide-react';
import { getApiKey } from '@/lib/jules-client';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey && location.pathname !== '/settings') {
      navigate('/settings');
    }
  }, [location]);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            JulesApp
          </h1>
        </div>
        <nav className="px-4 space-y-2">
          <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} />
          <NavLink to="/create" icon={<PlusCircle size={20} />} label="New Session" active={location.pathname === '/create'} />
          <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" active={location.pathname === '/settings'} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
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

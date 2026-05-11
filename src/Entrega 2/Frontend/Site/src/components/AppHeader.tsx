import { Thermometer, Activity } from 'lucide-react';
import { NavLink } from './NavLink';
import { dispositivos } from '@/data/mockData';

const AppHeader = () => {
  const alertas = dispositivos.filter(d => d.status === 'alerta').length;
  const todosNormais = alertas === 0;

  return (
    <header className="bg-header text-header-foreground shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20">
              <Thermometer className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Flex<span className="text-accent">Health</span>
              </h1>
              <p className="text-xs text-header-foreground/60">Monitoramento IoT de Cadeia de Frio</p>
            </div>
          </div>

          {/* Navegação */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/alertas">Alertas</NavLink>
            <NavLink to="/relatorios">Relatórios</NavLink>
          </nav>

          {/* Status Geral */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {todosNormais ? (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-success/20 text-success">
                Sistema Normal
              </span>
            ) : (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-destructive/20 text-destructive animate-pulse-alert">
                {alertas} Alerta{alertas > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Nav mobile */}
        <nav className="flex md:hidden items-center gap-1 mt-3 border-t border-header-foreground/10 pt-3">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/alertas">Alertas</NavLink>
          <NavLink to="/relatorios">Relatórios</NavLink>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;

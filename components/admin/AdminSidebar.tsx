"use client";
import React from 'react';
import {
  Users, FileText, Settings, LogOut, LayoutDashboard, ChevronDown,
  ShieldCheck, UserCheck, Building, PanelLeftClose, PanelLeftOpen,
  X, Info, ClipboardList, Sun, Moon, Monitor,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAdmin } from './AdminContext';
import type { Tab } from './types';

const NAV_PRINCIPAL: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'companies', label: 'Empresas', icon: Building },
  { id: 'employees', label: 'Funcionários', icon: Users },
  { id: 'users', label: 'Acessos', icon: UserCheck },
];
const NAV_SISTEMA: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'audit', label: 'Auditoria', icon: ClipboardList },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'about', label: 'Sobre', icon: Info },
];

export function AdminSidebar() {
  const {
    session, theme, setTheme,
    activeTab, setActiveTab,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isMobileMenuOpen, setIsMobileMenuOpen,
    navGroupOpen, setNavGroupOpen,
  } = useAdmin();

  const collapsed = isSidebarCollapsed && !isMobileMenuOpen;

  return (
    <aside className={`shrink-0 bg-card flex flex-col rounded-2xl border border-border/50 shadow-sm overflow-hidden relative transition-all duration-300 ease-in-out
      ${isSidebarCollapsed && !isMobileMenuOpen ? 'w-[60px] px-2 py-4' : 'w-56 px-3 py-4'}
      ${isMobileMenuOpen ? 'fixed left-2 top-2 bottom-2 z-50 lg:relative lg:left-0 lg:top-0 lg:bottom-0' : 'hidden lg:flex'}
    `}>
      {/* Close — mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(false)}
        className="lg:hidden absolute top-3 right-3 w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-50"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Collapse toggle — desktop */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden lg:flex absolute -right-3 top-14 bg-card border border-border/50 shadow-sm w-6 h-6 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-50"
        title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
      >
        {isSidebarCollapsed ? <PanelLeftOpen className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
      </button>

      {/* User profile */}
      <div className={`mb-3 ${collapsed ? 'flex justify-center' : ''}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {collapsed ? (
              <button className="focus:outline-none rounded-xl" title={session?.user?.name || 'Usuário'}>
                <Avatar className="h-9 w-9 rounded-xl">
                  {session?.user?.image
                    ? <AvatarImage src={session.user.image} alt={session.user.name || ''} referrerPolicy="no-referrer" />
                    : <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-xl">{session?.user?.name?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
                  }
                </Avatar>
              </button>
            ) : (
              <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/50 transition-colors text-left focus:outline-none group">
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  {session?.user?.image
                    ? <AvatarImage src={session.user.image} alt={session.user.name || ''} referrerPolicy="no-referrer" />
                    : <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg">{session?.user?.name?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
                  }
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate leading-tight">{session?.user?.name || 'Administrador'}</p>
                  <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">{session?.user?.email || ''}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <div className="px-3 py-2.5">
              <p className="text-xs font-semibold truncate">{session?.user?.name || 'Administrador'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email || ''}</p>
              <Badge variant="outline" className="mt-1.5 text-[9px] font-semibold px-1.5 h-4 border-primary/30 text-primary">
                {session?.user?.role || 'admin'}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className="cursor-pointer">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" /> Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                {theme === 'dark' ? <Moon className="w-4 h-4 mr-2" /> : theme === 'light' ? <Sun className="w-4 h-4 mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
                Tema
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer"><Sun className="w-4 h-4 mr-2" /> Claro</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer"><Moon className="w-4 h-4 mr-2" /> Escuro</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer"><Monitor className="w-4 h-4 mr-2" /> Sistema</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border-t border-border/40 mb-3" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        <div>
          {!collapsed && (
            <button onClick={() => setNavGroupOpen(s => ({ ...s, principal: !s.principal }))}
              className="w-full flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-medium text-muted-foreground/50 tracking-wider">Principal</span>
              <ChevronDown className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${navGroupOpen.principal ? '' : '-rotate-90'}`} />
            </button>
          )}
          {(navGroupOpen.principal || collapsed) && (
            <div className="space-y-0.5">
              {NAV_PRINCIPAL.map(item => (
                <NavBtn key={item.id} item={item} active={activeTab === item.id} collapsed={collapsed}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} />
              ))}
            </div>
          )}
        </div>

        <div>
          {!collapsed ? (
            <button onClick={() => setNavGroupOpen(s => ({ ...s, sistema: !s.sistema }))}
              className="w-full flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-medium text-muted-foreground/50 tracking-wider">Sistema</span>
              <ChevronDown className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${navGroupOpen.sistema ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="border-t border-border/30 mb-1.5" />
          )}
          {(navGroupOpen.sistema || collapsed) && (
            <div className="space-y-0.5">
              {NAV_SISTEMA.map(item => (
                <NavBtn key={item.id} item={item} active={activeTab === item.id} collapsed={collapsed}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} />
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

function NavBtn({ item, active, collapsed, onClick }: {
  item: { id: Tab; label: string; icon: React.ElementType };
  active: boolean; collapsed: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-150
        ${active ? 'bg-primary/10 text-primary font-semibold' : 'font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
        ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? item.label : ''}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
    </button>
  );
}

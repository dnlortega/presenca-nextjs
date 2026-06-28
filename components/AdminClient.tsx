// github.com/dnlortega
// linkedin.com/in/daniel-op
"use client";
import React from 'react';
import { Menu } from 'lucide-react';
import { TooltipProvider } from './ui/tooltip';
import { AdminProvider, useAdmin } from './admin/AdminContext';
import { AdminSidebar } from './admin/AdminSidebar';
import { Modals } from './admin/Modals';
import { TabOverview } from './admin/tabs/TabOverview';
import { TabCompanies } from './admin/tabs/TabCompanies';
import { TabSectors } from './admin/tabs/TabSectors';
import { TabEmployees } from './admin/tabs/TabEmployees';
import { TabUsers } from './admin/tabs/TabUsers';
import { TabReports } from './admin/tabs/TabReports';
import { TabAudit } from './admin/tabs/TabAudit';
import { TabSettings } from './admin/tabs/TabSettings';
import { TabAbout } from './admin/tabs/TabAbout';

const TAB_TITLES: Record<string, string> = {
  overview: 'Dashboard',
  companies: 'Empresas',
  sectors: 'Setores',
  employees: 'Funcionários',
  users: 'Controle de acessos',
  reports: 'Histórico de presença',
  audit: 'Auditoria',
  settings: 'Configurações',
  about: 'Sobre o sistema',
};

function AdminLayout() {
  const { activeTab, isMobileMenuOpen, setIsMobileMenuOpen } = useAdmin();

  return (
    <div className="min-h-screen bg-muted/30 lg:flex p-2 gap-2 overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <AdminSidebar />

      <main className="flex-1 min-w-0 bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col relative transition-all duration-500">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
            <header className="mb-6 lg:mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 animate-slide-up">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center text-foreground transition-all shrink-0"
                  aria-label="Abrir menu">
                  <Menu className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-black wrap-break-word">
                    {TAB_TITLES[activeTab] ?? activeTab}
                  </h1>
                  <p className="text-muted-foreground text-xs font-medium mt-1 hidden sm:block">
                    Gerenciamento inteligente de presença e frequência.
                  </p>
                </div>
              </div>
            </header>

            {activeTab === 'overview' && <TabOverview />}
            {activeTab === 'companies' && <TabCompanies />}
            {activeTab === 'sectors' && <TabSectors />}
            {activeTab === 'employees' && <TabEmployees />}
            {activeTab === 'users' && <TabUsers />}
            {activeTab === 'reports' && <TabReports />}
            {activeTab === 'audit' && <TabAudit />}
            {activeTab === 'settings' && <TabSettings />}
            {activeTab === 'about' && <TabAbout />}
          </div>
        </div>
      </main>

      <Modals />
    </div>
  );
}

export default function AdminClient() {
  return (
    <AdminProvider>
      <TooltipProvider delayDuration={300}>
        <AdminLayout />
      </TooltipProvider>
    </AdminProvider>
  );
}

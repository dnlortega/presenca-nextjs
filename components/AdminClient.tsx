"use client";
import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Card from './ui/Card';
import AttendanceChart from './AttendanceChart';
import { LucideUsers, LucideBarChart, LucideFileText, LucideSettings, LucideLogOut, LucideLayoutDashboard, LucidePlus, LucideEdit, LucideTrash } from 'lucide-react';

type Tab = 'overview' | 'employees' | 'reports' | 'settings';

type DashboardData = {
  totalToday: number;
  sectorsActive: number;
  trend: { date: string; present: number; absent: number }[];
};

type Employee = {
  id: number;
  nome: string;
  empresa: string;
  setor: string;
};

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Dashboard State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({ nome: '', empresa: '', setor: '' });

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'employees') loadEmployees();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (res.ok) setDashboardData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEmp ? `/api/admin/employees/${editingEmp.id}` : '/api/admin/employees';
      const method = editingEmp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empForm),
      });

      if (res.ok) {
        setIsEmpModalOpen(false);
        setEditingEmp(null);
        setEmpForm({ nome: '', empresa: '', setor: '' });
        loadEmployees();
      } else {
        alert('Erro ao salvar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      if (res.ok) loadEmployees();
      else alert('Erro ao excluir');
    } catch (err) {
      console.error(err);
    }
  };

  const openEmpModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setEmpForm({ nome: emp.nome, empresa: emp.empresa, setor: emp.setor });
    } else {
      setEditingEmp(null);
      setEmpForm({ nome: '', empresa: '', setor: '' });
    }
    setIsEmpModalOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="flex items-center gap-4">
                <LucideUsers className="w-8 h-8 text-cyan-500" />
                <div>
                  <div className="text-sm text-gray-500">Total Hoje</div>
                  <div className="text-2xl font-bold">{dashboardData?.totalToday || 0}</div>
                </div>
              </Card>
              <Card className="flex items-center gap-4">
                <LucideBarChart className="w-8 h-8 text-pink-500" />
                <div>
                  <div className="text-sm text-gray-500">Setores Ativos</div>
                  <div className="text-2xl font-bold">{dashboardData?.sectorsActive || 0}</div>
                </div>
              </Card>
              <Card className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-pink-400" />
                <div>
                  <div className="text-sm text-gray-500">Exportados Hoje</div>
                  <div className="text-2xl font-bold">0</div>
                </div>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h2 className="text-lg font-bold mb-3">Tendência Semanal</h2>
                {dashboardData?.trend ? (
                  <AttendanceChart data={dashboardData.trend} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">Carregando...</div>
                )}
              </Card>

              <Card>
                <h2 className="text-lg font-bold mb-3">Atividade Recente</h2>
                <div className="text-sm text-gray-600">
                  <p>Nenhuma atividade recente registrada.</p>
                </div>
              </Card>
            </section>
          </>
        );
      case 'employees':
        return (
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Gerenciar Funcionários</h2>
              <button onClick={() => openEmpModal()} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition">
                <LucidePlus className="w-4 h-4" />
                Novo Funcionário
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="p-3">Nome</th>
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Setor</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-slate-800">{emp.nome}</td>
                      <td className="p-3 text-gray-600">{emp.empresa}</td>
                      <td className="p-3 text-gray-600">{emp.setor}</td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <button onClick={() => openEmpModal(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <LucideEdit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <LucideTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">Nenhum funcionário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {isEmpModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-bold mb-4">{editingEmp ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                  <form onSubmit={handleSaveEmployee} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <input
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        value={empForm.nome}
                        onChange={e => setEmpForm({ ...empForm, nome: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                      <input
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        value={empForm.empresa}
                        onChange={e => setEmpForm({ ...empForm, empresa: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                      <input
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        value={empForm.setor}
                        onChange={e => setEmpForm({ ...empForm, setor: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button type="button" onClick={() => setIsEmpModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </Card>
        );
      case 'reports':
        return (
          <Card>
            <h2 className="text-lg font-bold mb-4">Relatórios</h2>
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500">
              Módulo de Relatórios em desenvolvimento.
              <br />
              Aqui será possível exportar dados de presença.
            </div>
          </Card>
        );
      case 'settings':
        return (
          <Card>
            <h2 className="text-lg font-bold mb-4">Configurações</h2>
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500">
              Configurações do sistema.
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  const NavItem = ({ tab, label, icon: Icon }: { tab: Tab; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab
          ? 'text-cyan-600 font-bold bg-cyan-50/50'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50/30 p-6 lg:flex lg:gap-8">
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6">
          <div className="mb-8 px-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Administrador</div>
            <div className="font-extrabold text-xl text-slate-800">Conta Admin</div>
          </div>

          <nav className="space-y-1">
            <NavItem tab="overview" label="Visão Geral" icon={LucideLayoutDashboard} />
            <NavItem tab="employees" label="Funcionários" icon={LucideUsers} />
            <NavItem tab="reports" label="Relatórios" icon={LucideFileText} />
            <NavItem tab="settings" label="Configurações" icon={LucideSettings} />

            <div className="pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LucideLogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <main className="flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {activeTab === 'overview' && 'Painel Admin'}
            {activeTab === 'employees' && 'Funcionários'}
            {activeTab === 'reports' && 'Relatórios'}
            {activeTab === 'settings' && 'Configurações'}
          </h1>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

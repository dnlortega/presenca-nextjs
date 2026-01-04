"use client";
import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
  LucideUsers,
  LucideBarChart,
  LucideFileText,
  LucideSettings,
  LucideLogOut,
  LucideLayoutDashboard,
  LucidePlus,
  LucideEdit,
  LucideTrash,
  LucideChevronRight,
  LucideSearch,
  LucideShieldCheck,
  LucideUserCheck,
  LucideClock,
  LucideMail
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "./ModeToggle";
import AttendanceChart from './AttendanceChart';

type Tab = 'overview' | 'employees' | 'users' | 'reports' | 'settings';

type RecentActivity = {
  id: number;
  funcionario: string;
  setor: string;
  empresa: string;
  data_hora: string;
};

type DashboardData = {
  totalToday: number;
  sectorsActive: number;
  trend: { date: string; present: number; absent: number }[];
  recentActivities: RecentActivity[];
};

type Employee = {
  id: number;
  nome: string;
  empresa: string;
  setor: string;
};

type User = {
  id: number;
  username: string;
  email: string | null;
  role: string | null;
  created_at: string;
};

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({ nome: '', empresa: '', setor: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'employees') loadEmployees();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (res.ok) setDashboardData(data);
    } catch (e) { console.error(e); }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (e) { console.error(e); }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) { console.error(e); }
    setLoadingUsers(false);
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) loadUsers();
      else alert('Erro ao atualizar cargo');
    } catch (e) { console.error(e); }
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
    } catch (err) { console.error(err); }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      if (res.ok) loadEmployees();
      else alert('Erro ao excluir');
    } catch (err) { console.error(err); }
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

  const filteredEmployees = employees.filter(emp =>
    emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.setor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 page-transition">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Hoje</CardTitle>
                  <LucideUsers className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{dashboardData?.totalToday || 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">+12% em relação a ontem</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Setores Ativos</CardTitle>
                  <LucideBarChart className="w-4 h-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{dashboardData?.sectorsActive || 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">4 setores pendentes</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Relatórios</CardTitle>
                  <LucideFileText className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">12</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Gerados este mês</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Tendência Semanal</CardTitle>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> PRESENTES
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-muted" /> FALTAS
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData?.trend ? (
                    <AttendanceChart data={dashboardData.trend} />
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
                    dashboardData.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 group">
                        <div className="w-1 bg-primary/20 rounded-full group-hover:bg-primary transition-colors" />
                        <div className="flex-1">
                          <div className="text-xs font-bold">
                            {activity.funcionario}
                          </div>
                          <div className="text-[10px] font-medium text-muted-foreground">
                            {activity.setor} • {activity.empresa}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-xs italic">
                      Nenhuma atividade.
                    </div>
                  )}
                  <Button variant="ghost" className="w-full text-xs font-bold text-primary">
                    Ver histórico <LucideChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        );
      case 'employees':
        return (
          <div className="page-transition space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Funcionários</CardTitle>
                  <CardDescription>{employees.length} registros ativos</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary w-48 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={() => openEmpModal()} className="font-bold rounded-lg px-4">
                    <LucidePlus className="w-4 h-4 mr-1" /> Novo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-muted/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Empresa</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Setor</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => (
                      <TableRow key={emp.id} className="border-muted/30 group">
                        <TableCell className="py-3 font-bold">{emp.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{emp.empresa}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-bold rounded-md bg-muted/60">
                            {emp.setor}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEmpModal(emp)}>
                            <LucideEdit className="w-3 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteEmployee(emp.id)}>
                            <LucideTrash className="w-3 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case 'users':
        return (
          <div className="page-transition space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Gestão de Acessos</CardTitle>
                <CardDescription>Gerencie quem pode acessar o sistema e os cargos correspondentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identificação</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status / Cargo</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="border-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg border border-border">
                              <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                                {u.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs">{u.username}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <LucideMail className="w-3 h-3" /> {u.email || '-'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.role === 'pendente' ? (
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-orange-500/30 text-orange-500 bg-orange-500/5">
                              <LucideClock className="w-3 h-3 mr-1" /> Pendente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                              }`}>
                              <LucideUserCheck className="w-3 h-3 mr-1" /> {u.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-0 h-7 rounded-md border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => updateUserRole(u.id, 'educador')}>
                            EDUCADOR
                          </Button>
                          <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-0 h-7 rounded-md border-primary/20 text-primary hover:bg-primary/5" onClick={() => updateUserRole(u.id, 'admin')}>
                            ADMIN
                          </Button>
                          {u.role !== 'pendente' && (
                            <Button size="sm" variant="ghost" className="text-[10px] font-black px-3 py-0 h-7 rounded-md text-muted-foreground hover:text-destructive" onClick={() => updateUserRole(u.id, 'pendente')}>
                              BLOQUEAR
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <Card className="border-none bg-card/40 flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <LucideClock className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-black italic opacity-50">Sessão em construção</h2>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card/30 backdrop-blur-xl hidden lg:block p-6">
        <div className="sticky top-6 flex flex-col h-[calc(100vh-48px)]">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <LucideShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-tighter uppercase">Presença<span className="text-primary">.Pro</span></span>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {[
              { id: 'overview', label: 'Dashboard', icon: LucideLayoutDashboard },
              { id: 'employees', label: 'Funcionários', icon: LucideUsers },
              { id: 'users', label: 'Acessos', icon: LucideUserCheck },
              { id: 'reports', label: 'Relatórios', icon: LucideFileText },
              { id: 'settings', label: 'Configurações', icon: LucideSettings }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tema</span>
              <ModeToggle />
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LucideLogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-background/50">
        <div className="max-w-6xl mx-auto p-6 lg:p-10">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="flex items-center gap-2 uppercase tracking-tighter">
                {activeTab === 'overview' && 'Dashboard Central'}
                {activeTab === 'employees' && 'Base de Colaboradores'}
                {activeTab === 'users' && 'Controle de Acessos'}
                {activeTab === 'reports' && 'Inteligência de Dados'}
                {activeTab === 'settings' && 'Ajustes do Sistema'}
              </h1>
              <p className="text-muted-foreground text-xs font-medium mt-1">Gerenciamento inteligente de presença e frequência.</p>
            </div>
          </header>

          {renderContent()}
        </div>
      </main>

      {/* Employee Modal (Briefly styled for now) */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-border">
            <CardHeader>
              <CardTitle className="text-lg">{editingEmp ? 'Editar Funcionário' : 'Novo Registro'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveEmployee} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome</label>
                  <input
                    required
                    className="w-full bg-muted/30 border-none rounded-lg px-4 py-2 text-xs focus:ring-1 focus:ring-primary"
                    value={empForm.nome}
                    onChange={e => setEmpForm({ ...empForm, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Empresa</label>
                  <input
                    required
                    className="w-full bg-muted/30 border-none rounded-lg px-4 py-2 text-xs focus:ring-1 focus:ring-primary"
                    value={empForm.empresa}
                    onChange={e => setEmpForm({ ...empForm, empresa: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Setor</label>
                  <input
                    required
                    className="w-full bg-muted/30 border-none rounded-lg px-4 py-2 text-xs focus:ring-1 focus:ring-primary"
                    value={empForm.setor}
                    onChange={e => setEmpForm({ ...empForm, setor: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="ghost" type="button" onClick={() => setIsEmpModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Confirmar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

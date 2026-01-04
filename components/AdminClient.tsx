"use client";
import React, { useState, useEffect } from 'react';
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
  LucideMail,
  LucideBuilding,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucideUser,
  LucideLayers,
  LucideAlertCircle,
  LucideX
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ModeToggle } from "./ModeToggle";
import AttendanceChart from "./AttendanceChart";

type Tab = 'overview' | 'companies' | 'sectors' | 'employees' | 'users' | 'reports' | 'settings';

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
  sectorStats?: { setor: string; empresa: string; count: number }[];
  trend: { date: string; present: number; absent: number }[];
  recentActivities: RecentActivity[];
};

type Employee = {
  id: number;
  nome: string;
  valor?: string | number;
  empresa_id: number;
  setor_id: number;
  empresa?: { nome: string };
  setor?: { nome: string };
};

type Sector = {
  id: number;
  nome: string;
  valor?: string | number;
  empresa_id: number;
  empresa?: { nome: string };
};

type User = {
  id: number;
  username: string;
  email: string | null;
  role: string | null;
  created_at: string;
  empresas?: string[];
};

type Company = {
  id: number;
  nome: string;
};

type ReportRecord = {
  id: number;
  funcionario: string;
  setor: string;
  empresa: string;
  data_hora: string;
};

export default function AdminClient() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isUserCompModalOpen, setIsUserCompModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editingComp, setEditingComp] = useState<Company | null>(null);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCompForm, setUserCompForm] = useState<string[]>([]);
  const [empForm, setEmpForm] = useState({ nome: '', empresa_id: '', setor_id: '', valor: '' });
  const [compForm, setCompForm] = useState({ nome: '' });
  const [sectorForm, setSectorForm] = useState({ nome: '', empresa_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'employees') { loadEmployees(); loadCompanies(); loadSectors(); }
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'companies') loadCompanies();
    if (activeTab === 'sectors') { loadSectors(); loadCompanies(); }
    if (activeTab === 'reports') loadReports();
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

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      const data = await res.json();
      if (Array.isArray(data)) setCompanies(data);
    } catch (e) { console.error(e); }
  };

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (res.ok) setReports(data);
    } catch (e) { console.error(e); }
    setIsLoadingReports(false);
  };

  const loadSectors = async () => {
    setIsLoadingSectors(true);
    try {
      const res = await fetch('/api/admin/sectors');
      const data = await res.json();
      if (Array.isArray(data)) setSectors(data);
    } catch (e) { console.error(e); }
    setIsLoadingSectors(false);
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

  const updateUserCompanies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresas: userCompForm }),
      });
      if (res.ok) {
        setIsUserCompModalOpen(false);
        loadUsers();
      } else alert('Erro ao atualizar empresas');
    } catch (e) { console.error(e); }
  };

  const openUserCompModal = (user: User) => {
    setSelectedUser(user);
    setUserCompForm(user.empresas || []);
    setIsUserCompModalOpen(true);
  };

  const toggleUserCompany = (companyName: string) => {
    setUserCompForm(prev =>
      prev.includes(companyName)
        ? prev.filter(c => c !== companyName)
        : [...prev, companyName]
    );
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEmp ? `/api/admin/employees/${editingEmp.id}` : '/api/admin/employees';
      const method = editingEmp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: empForm.nome,
          empresa_id: Number(empForm.empresa_id),
          setor_id: Number(empForm.setor_id),
          valor: empForm.valor ? Number(empForm.valor) : null
        }),
      });

      if (res.ok) {
        setIsEmpModalOpen(false);
        setEditingEmp(null);
        setEmpForm({ nome: '', empresa_id: '', setor_id: '', valor: '' });
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

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingComp ? `/api/admin/companies/${editingComp.id}` : '/api/admin/companies';
      const method = editingComp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compForm),
      });

      if (res.ok) {
        setIsCompModalOpen(false);
        setEditingComp(null);
        setCompForm({ nome: '' });
        loadCompanies();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao salvar');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
      if (res.ok) loadCompanies();
      else alert('Erro ao excluir');
    } catch (err) { console.error(err); }
  };

  const openCompModal = (comp?: Company) => {
    if (comp) {
      setEditingComp(comp);
      setCompForm({ nome: comp.nome });
    } else {
      setEditingComp(null);
      setCompForm({ nome: '' });
    }
    setIsCompModalOpen(true);
  };

  const openEmpModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setEmpForm({
        nome: emp.nome,
        empresa_id: String(emp.empresa_id),
        setor_id: String(emp.setor_id),
        valor: emp.valor ? String(emp.valor) : ''
      });
    } else {
      setEditingEmp(null);
      setEmpForm({ nome: '', empresa_id: '', setor_id: '', valor: '' });
    }
    setIsEmpModalOpen(true);
  };

  const openSectorModal = (sec?: Sector) => {
    if (sec) {
      setEditingSector(sec);
      setSectorForm({
        nome: sec.nome,
        empresa_id: String(sec.empresa_id),
      });
    } else {
      setEditingSector(null);
      setSectorForm({ nome: '', empresa_id: '' });
    }
    setIsSectorModalOpen(true);
  };

  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validação de duplicidade local
      const isDuplicate = sectors.some(s =>
        s.nome.toLowerCase() === sectorForm.nome.toLowerCase() &&
        s.empresa_id === Number(sectorForm.empresa_id) &&
        s.id !== editingSector?.id
      );

      if (isDuplicate) {
        alert('Já existe um setor com este nome nesta empresa!');
        return;
      }

      const url = editingSector ? `/api/admin/sectors/${editingSector.id}` : '/api/admin/sectors';
      const method = editingSector ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: sectorForm.nome,
          empresa_id: Number(sectorForm.empresa_id)
        }),
      });

      if (res.ok) {
        setIsSectorModalOpen(false);
        setEditingSector(null);
        setSectorForm({ nome: '', empresa_id: '' });
        loadSectors();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao salvar setor');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar setor. Tente novamente.');
    }
  };

  const handleDeleteSector = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return;
    try {
      const res = await fetch(`/api/admin/sectors/${id}`, { method: 'DELETE' });
      if (res.ok) loadSectors();
      else alert('Erro ao excluir');
    } catch (err) { console.error(err); }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.empresa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.setor?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companies.filter(comp =>
    (comp.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSectors = sectors.filter(sec =>
    (sec.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sec.empresa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-scale-in">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm hover-lift cursor-default transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Hoje</CardTitle>
                  <LucideUsers className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{dashboardData?.totalToday ?? (
                    <div className="h-8 w-16 bg-muted/20 animate-shimmer rounded" />
                  )}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">+12% em relação a ontem</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm hover-lift cursor-default transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Setores Ativos</CardTitle>
                  <LucideBarChart className="w-4 h-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{dashboardData?.sectorsActive ?? (
                    <div className="h-8 w-12 bg-muted/20 animate-shimmer rounded" />
                  )}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">4 setores pendentes</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm hover-lift cursor-default transition-all">
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
                    <div className="h-64 w-full bg-muted/20 rounded-xl animate-shimmer relative overflow-hidden flex items-center justify-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Carregando métricas...</div>
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

              <Card className="border-none shadow-sm lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">Setores com Presença (Hoje)</CardTitle>
                  <CardDescription>Acompanhamento por setor e quantidade de registros.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dashboardData?.sectorStats && dashboardData.sectorStats.length > 0 ? (
                      dashboardData.sectorStats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col p-4 rounded-2xl bg-muted/30 border border-border/50 hover-lift transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary bg-primary/5">
                              {stat.empresa}
                            </Badge>
                            <span className="text-lg font-black text-primary">{stat.count}</span>
                          </div>
                          <span className="text-sm font-bold truncate">{stat.setor}</span>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min((stat.count / (dashboardData.totalToday || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-10 text-center text-muted-foreground text-xs italic bg-muted/10 rounded-2xl border border-dashed">
                        Nenhuma presença registrada hoje.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        );
      case 'companies':
        return (
          <div className="page-transition space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestão de Empresas</CardTitle>
                  <CardDescription>{companies.length} empresas integradas ao ecossistema</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar Empresa..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary w-48 transition-all font-bold"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={() => openCompModal()} className="font-black uppercase tracking-widest text-[10px] rounded-xl px-4 shadow-lg shadow-primary/20">
                    <LucidePlus className="w-4 h-4 mr-1" /> Nova Empresa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-muted/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Empresa</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Setores Vinculados</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((comp) => {
                      const companySectors = sectors.filter(s => s.empresa_id === comp.id);
                      return (
                        <TableRow key={comp.id} className="border-muted/30 group hover:bg-muted/10 transition-colors">
                          <TableCell className="py-4 font-black text-xs">{comp.nome}</TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                  {companySectors.length} {companySectors.length === 1 ? 'Setor' : 'Setores'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary transition-all rounded-lg px-2"
                                  onClick={() => {
                                    setEditingSector(null);
                                    setSectorForm({ nome: '', empresa_id: String(comp.id) });
                                    setIsSectorModalOpen(true);
                                  }}
                                >
                                  <LucidePlus className="w-3 h-3 mr-1" /> Novo
                                </Button>
                              </div>

                              {companySectors.length > 0 ? (
                                <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/20">
                                  <table className="w-full text-xs">
                                    <thead className="bg-muted/40">
                                      <tr className="border-b border-border/50">
                                        <th className="text-left py-1.5 px-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Setor</th>
                                        <th className="text-right py-1.5 px-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground w-20">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {companySectors.map((s, idx) => (
                                        <tr key={s.id} className={`group/row hover:bg-primary/5 transition-colors ${idx !== companySectors.length - 1 ? 'border-b border-border/30' : ''}`}>
                                          <td className="py-2 px-3 font-bold text-[10px]">{s.nome}</td>
                                          <td className="py-2 px-3 text-right">
                                            <div className="flex justify-end gap-0.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                              <button
                                                onClick={() => openSectorModal(s)}
                                                className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center"
                                                title="Editar Setor"
                                              >
                                                <LucideEdit className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteSector(s.id)}
                                                className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center"
                                                title="Excluir Setor"
                                              >
                                                <LucideTrash className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="py-6 text-center border border-dashed border-border/50 rounded-lg bg-muted/10">
                                  <LucideLayers className="w-6 h-6 mx-auto mb-1 opacity-20" />
                                  <span className="text-[9px] text-muted-foreground italic font-medium block">Nenhum setor cadastrado</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg" onClick={() => openCompModal(comp)}>
                                <LucideEdit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg" onClick={() => handleDeleteCompany(comp.id)}>
                                <LucideTrash className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredCompanies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                            <LucideBuilding className="w-10 h-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma empresa encontrada</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case 'sectors':
        return (
          <div className="page-transition space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Setores</CardTitle>
                  <CardDescription>{sectors.length} setores configurados</CardDescription>
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
                  <Button size="sm" onClick={() => openSectorModal()} className="font-bold rounded-lg px-4" disabled={companies.length === 0}>
                    <LucidePlus className="w-4 h-4 mr-1" /> Novo Setor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <div className="py-20 text-center space-y-4 font-black uppercase tracking-widest opacity-50 text-[10px]">
                    <LucideBuilding className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    Cadastre uma empresa primeiro
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-muted/50">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome do Setor</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Empresa</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSectors.map((sec) => (
                        <TableRow key={sec.id} className="border-muted/30 group">
                          <TableCell className="py-3 font-bold">{sec.nome}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sec.empresa?.nome}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openSectorModal(sec)}>
                              <LucideEdit className="w-3 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSector(sec.id)}>
                              <LucideTrash className="w-3 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'employees':
        if (companies.length === 0) {
          return (
            <div className="py-20 text-center space-y-6 animate-scale-in">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto border border-primary/10 shadow-inner">
                <LucideBuilding className="w-10 h-10 text-primary opacity-40" />
              </div>
              <div className="max-w-sm mx-auto space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Acesso Bloqueado</h3>
                <p className="text-xs text-muted-foreground font-medium">A base de colaboradores só é liberada após o cadastro de pelo menos uma empresa no sistema.</p>
              </div>
              <Button onClick={() => setActiveTab('companies')} className="font-black uppercase tracking-widest text-[10px] px-8 py-6 rounded-2xl shadow-lg shadow-primary/20">
                Cadastrar Empresa Agora
              </Button>
            </div>
          );
        }
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
                  <Button size="sm" onClick={() => openEmpModal()} className="font-bold rounded-lg px-4" disabled={sectors.length === 0}>
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
                        <TableCell className="py-3 font-bold">{emp.nome || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{emp.empresa?.nome || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-bold rounded-md bg-muted/60">
                            {emp.setor?.nome || '-'}
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
                          <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-0 h-7 rounded-md border-primary/20 text-primary hover:bg-primary/5" onClick={() => openUserCompModal(u)}>
                            EMPRESAS
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
      case 'reports':
        return (
          <div className="page-transition space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Histórico de Presença</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Dados detalhados dos registros efetuados.</p>
              </div>
              <Button onClick={loadReports} size="sm" variant="outline" className="h-10 rounded-xl font-black uppercase tracking-widest gap-2">
                <LucideClock className="w-4 h-4" /> Atualizar Dados
              </Button>
            </header>

            <Card className="border-none shadow-sm overflow-hidden bg-card/40 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-muted/50 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-6 py-4">Data</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Colaborador</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Empresa / Setor</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground pr-6 py-4">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingReports ? (
                        [1, 2, 3, 4, 5].map(i => (
                          <TableRow key={i} className="border-muted/20">
                            <TableCell colSpan={4} className="py-6"><div className="h-4 w-full bg-muted/20 animate-shimmer rounded" /></TableCell>
                          </TableRow>
                        ))
                      ) : reports.length > 0 ? (
                        reports.map((r) => (
                          <TableRow key={r.id} className="border-muted/20 group hover:bg-primary/5 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <span className="text-xs font-black text-muted-foreground uppercase">
                                {new Date(r.data_hora).toLocaleDateString('pt-BR')}
                              </span>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                                  {r.funcionario.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold">{r.funcionario}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-tight">{r.empresa}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">{r.setor}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6 py-4 transition-all">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={async () => {
                                  if (!confirm('Deseja excluir este registro?')) return;
                                  const res = await fetch(`/api/attendance?id=${r.id}`, { method: 'DELETE' });
                                  if (res.ok) loadReports();
                                }}
                              >
                                <LucideTrash className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="py-20 text-center">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50">Nenhum registro encontrado</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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
    <div className="min-h-screen bg-muted/30 lg:flex p-2 gap-2 overflow-hidden">
      {/* Sidebar - Shadcn Inset Style */}
      <aside className={`shrink-0 bg-background/60 backdrop-blur-xl hidden lg:flex flex-col rounded-2xl border border-border/50 shadow-sm overflow-hidden relative transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[80px] p-4' : 'w-64 p-6'}`}>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-0 top-12 bg-primary text-primary-foreground w-5 h-10 rounded-l-md flex items-center justify-center shadow-lg hover:w-6 transition-all z-50"
        >
          {isSidebarCollapsed ? <LucidePanelLeftOpen className="w-3 h-3" /> : <LucidePanelLeftClose className="w-3 h-3" />}
        </button>

        {/* Logo Section */}
        <div className={`mb-8 flex items-center gap-2.5 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-primary rounded-lg shrink-0 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 animate-float">
            <LucideShieldCheck className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <span className="font-black text-lg tracking-tighter uppercase whitespace-nowrap animate-in fade-in slide-in-from-left-2">
              Presença<span className="text-primary italic">.Pro</span>
            </span>
          )}
        </div>

        {/* User Profile Section */}
        <div className={`mb-6 p-2 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3 overflow-hidden transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-primary/20">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session.user.name || ''} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                {session?.user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </AvatarFallback>
            )}
          </Avatar>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] font-black truncate leading-tight uppercase">{session?.user?.name || 'Administrador'}</span>
              <span className="text-[9px] text-muted-foreground truncate leading-tight">{session?.user?.email || 'admin@presenca.pro'}</span>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-1 custom-scrollbar overflow-x-hidden">
          <div className="space-y-1">
            <h3 className={`text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 ml-2 opacity-50 transition-all ${isSidebarCollapsed ? 'text-center ml-0' : ''}`}>
              {isSidebarCollapsed ? '•' : 'Principal'}
            </h3>
            {[
              { id: 'overview', label: 'Dashboard', icon: LucideLayoutDashboard },
              { id: 'companies', label: 'Empresas', icon: LucideBuilding },
              { id: 'employees', label: 'Funcionários', icon: LucideUsers },
              { id: 'users', label: 'Acessos', icon: LucideUserCheck },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 whitespace-nowrap">{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Secondary Navigation */}
          <div className="space-y-1">
            <h3 className={`text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 ml-2 opacity-50 transition-all ${isSidebarCollapsed ? 'text-center ml-0' : ''}`}>
              {isSidebarCollapsed ? '•' : 'Sistema'}
            </h3>
            {[
              { id: 'reports', label: 'Relatórios', icon: LucideFileText },
              { id: 'settings', label: 'Configurações', icon: LucideSettings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 whitespace-nowrap">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 mt-6 border-t border-border/50 space-y-4 shrink-0">
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-2 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-[8px]">Dark Mode</span>
              <ModeToggle />
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title={isSidebarCollapsed ? 'Sair' : ''}
          >
            <LucideLogOut className="w-4 h-4 shrink-0 group-hover:rotate-180 transition-transform duration-500" />
            {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content (Inset) */}
      <main className="flex-1 min-w-0 bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col relative transition-all duration-500">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-6 lg:p-10">
            <header className="mb-8 flex justify-between items-end animate-slide-up">
              <div>
                <h1 className="flex items-center gap-2 uppercase tracking-tighter text-2xl font-black">
                  {activeTab === 'overview' && 'Dashboard Central'}
                  {activeTab === 'companies' && 'Gestão de Empresas'}
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
        </div>
      </main>

      {/* Employee Modal (Briefly styled for now) */}
      {/* Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LucideUser className="w-5 h-5 text-primary" />
                {editingEmp ? 'Editar Funcionário' : 'Novo Registro'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveEmployee} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome Completo</label>
                  <input
                    required
                    className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={empForm.nome}
                    onChange={e => setEmpForm({ ...empForm, nome: e.target.value })}
                    placeholder="Nome do colaborador"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Empresa</label>
                    <select
                      required
                      className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer font-bold"
                      value={empForm.empresa_id}
                      onChange={e => setEmpForm({ ...empForm, empresa_id: e.target.value, setor_id: '' })}
                    >
                      <option value="" disabled>Selecione a empresa</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Setor</label>
                    <select
                      required
                      className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      value={empForm.setor_id}
                      onChange={e => setEmpForm({ ...empForm, setor_id: e.target.value })}
                      disabled={!empForm.empresa_id}
                    >
                      <option value="" disabled>
                        {!empForm.empresa_id ? 'Selecione a empresa primeiro' : 'Selecione o setor'}
                      </option>
                      {sectors
                        .filter(s => s.empresa_id === Number(empForm.empresa_id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Valor da Diária (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                      value={empForm.valor}
                      onChange={e => setEmpForm({ ...empForm, valor: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-6">
                  <Button variant="ghost" type="button" onClick={() => setIsEmpModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                  <Button type="submit" className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">Confirmar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sector Modal */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LucideLayers className="w-5 h-5 text-primary" />
                {editingSector ? 'Editar Setor' : 'Novo Setor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSector} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome do Setor</label>
                  <input
                    required
                    className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={sectorForm.nome}
                    onChange={e => setSectorForm({ ...sectorForm, nome: e.target.value })}
                    placeholder="Ex: Recursos Humanos"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Vincular à Empresa</label>
                  <select
                    required
                    className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer font-bold"
                    value={sectorForm.empresa_id}
                    onChange={e => setSectorForm({ ...sectorForm, empresa_id: e.target.value })}
                  >
                    <option value="" disabled>Selecione a empresa</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-6">
                  <Button variant="ghost" type="button" onClick={() => setIsSectorModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                  <Button type="submit" className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">Salvar Setor</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Modal */}
      {isCompModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LucideBuilding className="w-5 h-5 text-primary" />
                {editingComp ? 'Editar Empresa' : 'Nova Empresa'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome da Empresa</label>
                  <input
                    required
                    className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={compForm.nome}
                    onChange={e => setCompForm({ nome: e.target.value })}
                    placeholder="Ex: Minha Empresa LTDA"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-6">
                  <Button variant="ghost" type="button" onClick={() => setIsCompModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                  <Button type="submit" className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">Confirmar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Companies Modal */}
      {isUserCompModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LucideShieldCheck className="w-5 h-5 text-primary" />
                Controle de Acessos
              </CardTitle>
              <CardDescription className="text-xs font-medium">Permissões de empresa para <b>{selectedUser?.username}</b>.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {companies.map(comp => (
                  <label key={comp.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all group active:scale-95">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-md border-muted text-primary focus:ring-primary transition-all cursor-pointer"
                      checked={userCompForm.includes(comp.nome)}
                      onChange={() => toggleUserCompany(comp.nome)}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold group-hover:text-primary transition-colors">{comp.nome}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-black opacity-50">ID: {comp.id}</span>
                    </div>
                  </label>
                ))}
                {companies.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-xs italic bg-muted/20 rounded-xl border border-dashed">
                    Nenhuma empresa disponível.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-6 border-t border-border mt-4">
                <Button variant="ghost" type="button" onClick={() => setIsUserCompModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                <Button onClick={updateUserCompanies} className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">Salvar Acessos</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

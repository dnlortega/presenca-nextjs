"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  LucideChevronDown,
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
  LucideX,
  LucideMenu,
  LucideInfo,
  LucideCode2,
  LucideZap,
  LucideTrash2,
  LucideTrendingUp,
  LucideClipboardList,
  LucideFilter,
  LucidePercent,
  LucideSun,
  LucideMoon,
  LucideMonitor
} from 'lucide-react';
import { toast } from "sonner";
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { fetchNoCache } from "../lib/fetch-helpers";
import CompanyDistributionChart from "./CompanyDistributionChart";

type Tab = 'overview' | 'companies' | 'sectors' | 'employees' | 'users' | 'reports' | 'audit' | 'settings' | 'about';

type RecentActivity = {
  id: number;
  funcionario: string;
  setor: string;
  empresa: string;
  data_hora: string;
};

type DashboardData = {
  totalToday: number;
  totalEmployees: number;
  sectorsActive: number;
  sectorStats?: { setor: string; empresa: string; count: number }[];
  companyDistribution?: { name: string; value: number }[];
  weeklyTrend?: { date: string; count: number }[];
  recentActivities: RecentActivity[];
};

type AuditEntry = {
  id: number;
  username: string;
  action: string;
  entity: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
};

type Employee = {
  id: number;
  nome: string;
  valor?: string | number;
  empresa_id: number;
  setor_id: number;
  empresa?: string | { nome: string };
  setor?: string | { nome: string };
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
  can_register?: boolean;
  can_edit?: boolean;
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

// Reusable Confirmation Popover
function ConfirmAction({
  onConfirm,
  title = "Confirmar ação?",
  description = "Esta ação não pode ser desfeita.",
  children,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  buttonVariant = "destructive"
}: {
  onConfirm: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 shadow-xl border-border bg-card/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-tighter text-sm flex items-center gap-2">
              <LucideAlertCircle className="w-4 h-4 text-destructive" />
              {title}
            </h4>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] font-black uppercase tracking-widest h-8"
              onClick={() => setOpen(false)}
            >
              {cancelText}
            </Button>
            <Button
              size="sm"
              variant={buttonVariant}
              className="text-[10px] font-black uppercase tracking-widest h-8 px-4"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function AdminClient() {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({}); // State for toggle
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [reportsTotal, setReportsTotal] = useState(0);
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
  const [empForm, setEmpForm] = useState({ nome: '', empresa_id: '', setor_id: '' });
  const [compForm, setCompForm] = useState({ nome: '' });
  const [sectorForm, setSectorForm] = useState({ nome: '', empresa_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [isSeedingEmployees, setIsSeedingEmployees] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessForm, setAccessForm] = useState({ can_register: false, can_edit: false });
  const [navGroupOpen, setNavGroupOpen] = useState({ principal: true, sistema: true });
  const [reportPage, setReportPage] = useState(1);
  const [reportFilter, setReportFilter] = useState({ startDate: '', endDate: '', empresa: '', setor: '' });
  const REPORTS_PER_PAGE = 20;
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const AUDIT_PER_PAGE = 20;

  useEffect(() => {
    setSearchTerm('');
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'employees') { loadEmployees(); loadCompanies(); loadSectors(); }
    if (activeTab === 'users') { loadUsers(); loadCompanies(); }
    if (activeTab === 'companies') { loadCompanies(); loadSectors(); }
    if (activeTab === 'sectors') { loadSectors(); loadCompanies(); }
    if (activeTab === 'reports') loadReports(1);
    if (activeTab === 'audit') loadAuditLogs(1);
  }, [activeTab]);

  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    try {
      const res = await fetchNoCache('/api/admin/dashboard');
      const data = await res.json();
      if (res.ok) {
        setDashboardData(data);
      } else {
        setDashboardError(data.error || 'Erro ao carregar dashboard');
        console.error('Dashboard error:', data);
      }
    } catch (e) {
      setDashboardError('Erro ao conectar com o servidor');
      console.error('Dashboard fetch error:', e);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetchNoCache('/api/admin/employees');
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (e) { console.error(e); }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetchNoCache('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) { console.error(e); }
    setLoadingUsers(false);
  };

  const loadCompanies = async () => {
    try {
      const res = await fetchNoCache('/api/admin/companies');
      const data = await res.json();
      if (Array.isArray(data)) setCompanies(data);
    } catch (e) { console.error('Error loading companies:', e); }
  };

  const loadReports = async (page = 1, filter = reportFilter) => {
    setIsLoadingReports(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(REPORTS_PER_PAGE) });
      if (filter.startDate) params.set('startDate', filter.startDate);
      if (filter.endDate) params.set('endDate', filter.endDate);
      if (filter.empresa) params.set('empresa', filter.empresa);
      if (filter.setor) params.set('setor', filter.setor);
      const res = await fetchNoCache(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.data);
        setReportsTotal(data.total);
        setReportPage(page);
      }
    } catch (e) { console.error(e); }
    setIsLoadingReports(false);
  };

  const loadAuditLogs = async (page = 1) => {
    setIsLoadingAudit(true);
    try {
      const res = await fetchNoCache(`/api/admin/audit-log?page=${page}&limit=${AUDIT_PER_PAGE}`);
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data.data);
        setAuditTotal(data.total);
        setAuditPage(page);
      }
    } catch (e) { console.error(e); }
    setIsLoadingAudit(false);
  };

  const loadSectors = async () => {
    setIsLoadingSectors(true);
    try {
      const res = await fetchNoCache('/api/admin/sectors');
      const data = await res.json();
      if (Array.isArray(data)) setSectors(data);
    } catch (e) { console.error(e); }
    setIsLoadingSectors(false);
  };

  const seedEmployees = async () => {
    setIsSeedingEmployees(true);
    try {
      const res = await fetchNoCache('/api/admin/seed-employees', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        alert(`✅ Sucesso!\n\nTotal criado: ${data.totalCriados} funcionários\nSetores processados: ${data.totalSetores}\n\nRecarregando lista...`);
        loadEmployees();
      } else {
        alert(`❌ Erro: ${data.error || 'Erro ao criar funcionários'}`);
      }
    } catch (e) {
      console.error(e);
      alert('❌ Erro ao conectar com o servidor');
    } finally {
      setIsSeedingEmployees(false);
    }
  };

  // Force logout detection: if admin terminates our own session somehow
  useEffect(() => {
    if (session?.user?.forceLogout) {
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  const forceUserLogout = async (userId: number, username: string) => {
    try {
      const res = await fetchNoCache('/api/admin/users/force-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast.success(`Sessão de ${username} encerrada`);
      } else {
        const data = await res.json() as { error?: string };
        toast.error(data.error || 'Erro ao encerrar sessão');
      }
    } catch (e) { console.error(e); }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) loadUsers();
      else alert('Erro ao atualizar cargo');
    } catch (e) { console.error(e); }
  };

  const updateUserCanRegister = async (userId: number, canRegister: boolean) => {
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_register: canRegister }),
      });
      if (res.ok) loadUsers();
      else alert('Erro ao atualizar permissão de cadastro');
    } catch (e) { console.error(e); }
  };

  const updateUserCanEdit = async (userId: number, canEdit: boolean) => {
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_edit: canEdit }),
      });
      if (res.ok) loadUsers();
      else alert('Erro ao atualizar permissão de edição');
    } catch (e) { console.error(e); }
  };

  const updateUserCompanies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetchNoCache(`/api/admin/users/${selectedUser.id}`, {
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
    loadCompanies(); // Extra assurance
    setIsUserCompModalOpen(true);
  };

  const openAccessModal = (user: User) => {
    setSelectedUser(user);
    setAccessForm({
      can_register: user.can_register || false,
      can_edit: user.can_edit || false
    });
    setIsAccessModalOpen(true);
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      // Parallel update
      await Promise.all([
        fetchNoCache(`/api/admin/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ can_register: accessForm.can_register }),
        }),
        fetchNoCache(`/api/admin/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ can_edit: accessForm.can_edit }),
        })
      ]);

      setIsAccessModalOpen(false);
      loadUsers();
    } catch (e) { console.error(e); }
  };

  const toggleCompany = (companyName: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
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

      const res = await fetchNoCache(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: empForm.nome,
          empresa_id: Number(empForm.empresa_id),
          setor_id: Number(empForm.setor_id)
        }),
      });

      if (res.ok) {
        setIsEmpModalOpen(false);
        setEditingEmp(null);
        setEmpForm({ nome: '', empresa_id: '', setor_id: '' });
        loadEmployees();
      } else {
        alert('Erro ao salvar');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
      const res = await fetchNoCache(`/api/admin/employees/${id}`, { method: 'DELETE' });
      if (res.ok) loadEmployees();
      else alert('Erro ao excluir');
    } catch (err) { console.error(err); }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingComp ? `/api/admin/companies/${editingComp.id}` : '/api/admin/companies';
      const method = editingComp ? 'PUT' : 'POST';

      const res = await fetchNoCache(url, {
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
    try {
      const res = await fetchNoCache(`/api/admin/companies/${id}`, { method: 'DELETE' });
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
        setor_id: String(emp.setor_id)
      });
    } else {
      setEditingEmp(null);
      setEmpForm({ nome: '', empresa_id: '', setor_id: '' });
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
      if (editingSector) {
        // Validação de duplicidade local para edição
        const isDuplicate = sectors.some(s =>
          s.nome.toLowerCase() === sectorForm.nome.toLowerCase() &&
          s.empresa_id === Number(sectorForm.empresa_id) &&
          s.id !== editingSector.id
        );

        if (isDuplicate) {
          alert('Já existe um setor com este nome nesta empresa!');
          return;
        }

        const res = await fetchNoCache(`/api/admin/sectors/${editingSector.id}`, {
          method: 'PUT',
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
          alert(errorData.error || 'Erro ao editar setor');
        }
      } else {
        // Bulk Creation Logic
        const nomes = sectorForm.nome.split('\n').map(n => n.trim()).filter(n => n.length > 0);

        if (nomes.length === 0) {
          alert('Digite pelo menos um nome de setor.');
          return;
        }

        const res = await fetchNoCache('/api/admin/sectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomes,
            empresa_id: Number(sectorForm.empresa_id)
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setIsSectorModalOpen(false);
          setEditingSector(null);
          setSectorForm({ nome: '', empresa_id: '' });
          loadSectors();
          if (data.message) alert(data.message);
        } else {
          alert(data.error || 'Erro ao criar setores');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar setor. Tente novamente.');
    }
  };

  const handleDeleteSector = async (id: number) => {
    try {
      const res = await fetchNoCache(`/api/admin/sectors/${id}`, { method: 'DELETE' });
      if (res.ok) loadSectors();
      else alert('Erro ao excluir');
    } catch (err) { console.error(err); }
  };

  const term = searchTerm.toLowerCase();

  const filteredEmployees = useMemo(() => employees.filter(emp => {
    const empresaNome = typeof emp.empresa === 'string' ? emp.empresa : emp.empresa?.nome || '';
    const setorNome = typeof emp.setor === 'string' ? emp.setor : emp.setor?.nome || '';
    return (
      (emp.nome || '').toLowerCase().includes(term) ||
      empresaNome.toLowerCase().includes(term) ||
      setorNome.toLowerCase().includes(term)
    );
  }), [employees, term]);

  const filteredCompanies = useMemo(() =>
    companies.filter(comp => (comp.nome || '').toLowerCase().includes(term)),
    [companies, term]
  );

  const filteredSectors = useMemo(() =>
    sectors.filter(sec =>
      (sec.nome || '').toLowerCase().includes(term) ||
      (sec.empresa?.nome || '').toLowerCase().includes(term)
    ),
    [sectors, term]
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-scale-in">
            {dashboardError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <LucideAlertCircle className="w-4 h-4" />
                    <span>{dashboardError}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={loadDashboard}
                      className="ml-auto text-xs"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm hover-lift cursor-default transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black text-muted-foreground">Presenças hoje</CardTitle>
                  <LucideUsers className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">
                    {isLoadingDashboard ? <div className="h-8 w-16 bg-muted/20 animate-shimmer rounded" /> : dashboardData?.totalToday ?? 0}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Registradas hoje</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm hover-lift cursor-default transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black text-muted-foreground">Taxa de presença</CardTitle>
                  <LucidePercent className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">
                    {isLoadingDashboard ? <div className="h-8 w-12 bg-muted/20 animate-shimmer rounded" /> : (
                      dashboardData && dashboardData.totalEmployees > 0
                        ? `${Math.round((dashboardData.totalToday / dashboardData.totalEmployees) * 100)}%`
                        : '—'
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isLoadingDashboard ? '' : `${dashboardData?.totalToday ?? 0} de ${dashboardData?.totalEmployees ?? 0} funcionários`}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm hover-lift cursor-default transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black text-muted-foreground">Setores ativos</CardTitle>
                  <LucideBarChart className="w-4 h-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">
                    {isLoadingDashboard ? <div className="h-8 w-12 bg-muted/20 animate-shimmer rounded" /> : dashboardData?.sectorsActive ?? 0}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Com presença hoje</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm hover-lift cursor-default transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black text-muted-foreground">Total de funcionários</CardTitle>
                  <LucideUsers className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">
                    {isLoadingDashboard ? <div className="h-8 w-12 bg-muted/20 animate-shimmer rounded" /> : dashboardData?.totalEmployees ?? 0}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Cadastrados no sistema</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Distribuição por Empresa</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData?.companyDistribution ? (
                    <div className="w-full h-[300px]">
                      <CompanyDistributionChart data={dashboardData.companyDistribution} />
                    </div>
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
                  <Button variant="ghost" className="w-full text-xs font-bold text-primary" onClick={() => setActiveTab('reports')}>
                    Ver histórico <LucideChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <LucideTrendingUp className="w-4 h-4 text-primary" /> Tendência semanal
                    </CardTitle>
                    <CardDescription className="text-xs">Presenças registradas nos últimos 7 dias.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData?.weeklyTrend ? (
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.weeklyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                            labelStyle={{ fontWeight: 900, textTransform: 'capitalize' }}
                            formatter={(v) => [typeof v === 'number' ? v : 0, 'Presenças']}
                          />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[180px] w-full bg-muted/20 rounded-xl animate-shimmer" />
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base font-black">Setores com presença hoje</CardTitle>
                  <CardDescription className="text-xs">Acompanhamento por setor e quantidade de registros.</CardDescription>
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Gestão de Empresas</CardTitle>
                  <CardDescription className="text-xs">{companies.length} empresas integradas ao ecossistema</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar Empresa..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all font-bold"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={() => openCompModal()} className="font-black uppercase tracking-widest text-[10px] rounded-xl px-4 shadow-lg shadow-primary/20 w-full sm:w-auto">
                    <LucidePlus className="w-4 h-4 mr-1" /> Nova Empresa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
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
                                                <ConfirmAction onConfirm={() => handleDeleteSector(s.id)} title="Excluir Setor?">
                                                  <button
                                                    className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center"
                                                    title="Excluir Setor"
                                                  >
                                                    <LucideTrash className="w-3 h-3" />
                                                  </button>
                                                </ConfirmAction>
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
                                <ConfirmAction onConfirm={() => handleDeleteCompany(comp.id)} title="Excluir Empresa?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg">
                                    <LucideTrash className="w-3.5 h-3.5" />
                                  </Button>
                                </ConfirmAction>
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
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredCompanies.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <LucideBuilding className="w-10 h-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma empresa encontrada</span>
                      </div>
                    </div>
                  ) : (
                    filteredCompanies.map((comp) => {
                      const companySectors = sectors.filter(s => s.empresa_id === comp.id);
                      return (
                        <Card key={comp.id} className="border border-border/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm font-black truncate">{comp.nome}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {companySectors.length} {companySectors.length === 1 ? 'Setor' : 'Setores'}
                                </CardDescription>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openCompModal(comp)}>
                                  <LucideEdit className="w-4 h-4" />
                                </Button>
                                <ConfirmAction onConfirm={() => handleDeleteCompany(comp.id)} title="Excluir Empresa?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <LucideTrash className="w-4 h-4" />
                                  </Button>
                                </ConfirmAction>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-muted-foreground uppercase">Setores</span>
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
                              <div className="space-y-2">
                                {companySectors.map((s) => (
                                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                                    <span className="text-xs font-bold">{s.nome}</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => openSectorModal(s)}
                                        className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center"
                                        title="Editar Setor"
                                      >
                                        <LucideEdit className="w-3 h-3" />
                                      </button>
                                      <ConfirmAction onConfirm={() => handleDeleteSector(s.id)} title="Excluir Setor?">
                                        <button
                                          className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center"
                                          title="Excluir Setor"
                                        >
                                          <LucideTrash className="w-3 h-3" />
                                        </button>
                                      </ConfirmAction>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-4 text-center border border-dashed border-border/50 rounded-lg bg-muted/10">
                                <LucideLayers className="w-5 h-5 mx-auto mb-1 opacity-20" />
                                <span className="text-[9px] text-muted-foreground italic font-medium block">Nenhum setor cadastrado</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'sectors':
        return (
          <div className="page-transition space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Setores</CardTitle>
                  <CardDescription className="text-xs">{sectors.length} setores configurados</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={() => openSectorModal()} className="font-bold rounded-lg px-4 w-full sm:w-auto" disabled={companies.length === 0}>
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
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
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
                                <ConfirmAction onConfirm={() => handleDeleteSector(sec.id)} title="Excluir Setor?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <LucideTrash className="w-3 h-4" />
                                  </Button>
                                </ConfirmAction>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {filteredSectors.map((sec) => (
                        <Card key={sec.id} className="border border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm font-bold mb-1">{sec.nome}</CardTitle>
                                <CardDescription className="text-xs">{sec.empresa?.nome}</CardDescription>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openSectorModal(sec)}>
                                  <LucideEdit className="w-4 h-4" />
                                </Button>
                                <ConfirmAction onConfirm={() => handleDeleteSector(sec.id)} title="Excluir Setor?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <LucideTrash className="w-4 h-4" />
                                  </Button>
                                </ConfirmAction>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'employees':
        if (companies.length === 0 && employees.length === 0) {
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

        // Group Filtering Logic
        const groupedEmployees: Record<string, Record<string, Employee[]>> = {};

        filteredEmployees.forEach(emp => {
          const companyName = typeof emp.empresa === 'string' ? emp.empresa : (emp.empresa?.nome || 'Sem Empresa');
          const sectorName = typeof emp.setor === 'string' ? emp.setor : (emp.setor?.nome || 'Sem Setor');

          if (!groupedEmployees[companyName]) {
            groupedEmployees[companyName] = {};
          }
          if (!groupedEmployees[companyName][sectorName]) {
            groupedEmployees[companyName][sectorName] = [];
          }
          groupedEmployees[companyName][sectorName].push(emp);
        });

        // Sort keys for consistent display
        const companyNames = Object.keys(groupedEmployees).sort();

        return (
          <div className="page-transition space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Funcionários</CardTitle>
                  <CardDescription className="text-xs">{employees.length} registros ativos - Agrupados por Empresa e Setor</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, setor ou empresa..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <ConfirmAction
                    onConfirm={seedEmployees}
                    title="Popular Base?"
                    description="Deseja criar 15 funcionários em cada setor? Esta ação pode demorar alguns segundos."
                    confirmText="Criar"
                    buttonVariant="default"
                  >
                    <Button
                      size="sm"
                      className="font-bold rounded-lg px-4 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={isSeedingEmployees || sectors.length === 0}
                    >
                      {isSeedingEmployees ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full mr-1" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <LucideUsers className="w-4 h-4 mr-1" /> Popular (15 por setor)
                        </>
                      )}
                    </Button>
                  </ConfirmAction>
                  <Button size="sm" onClick={() => openEmpModal()} className="font-bold rounded-lg px-4 w-full sm:w-auto" disabled={sectors.length === 0}>
                    <LucidePlus className="w-4 h-4 mr-1" /> Novo
                  </Button>
                  {employees.some(e => !e.setor_id || !e.empresa_id) && (
                    <ConfirmAction
                      onConfirm={async () => {
                        const orphans = employees.filter(e => !e.setor_id || !e.empresa_id);
                        for (const orphan of orphans) {
                          await fetchNoCache(`/api/admin/employees/${orphan.id}`, { method: 'DELETE' });
                        }
                        loadEmployees();
                        toast.success('Órfãos removidos com sucesso');
                      }}
                      title="Excluir Órfãos?"
                      description="Isto removerá permanentemente todos os funcionários sem vínculo de empresa ou setor."
                    >
                      <Button size="sm" variant="outline" className="font-bold rounded-lg px-4 w-full sm:w-auto border-destructive/30 text-destructive hover:bg-destructive/5">
                        <LucideTrash2 className="w-4 h-4 mr-1" /> Limpar Órfãos
                      </Button>
                    </ConfirmAction>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {companyNames.map(compName => {
                  const sectorsInCompany = groupedEmployees[compName];
                  const sectorNames = Object.keys(sectorsInCompany).sort();
                  const isExpanded = expandedCompanies[compName];

                  return (
                    <div key={compName} className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-500">
                      <div
                        className="flex items-center gap-2 pb-2 border-b border-border/50 cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
                        onClick={() => toggleCompany(compName)}
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary transition-transform duration-200">
                          {isExpanded ? <LucideChevronDown className="w-4 h-4" /> : <LucideChevronRight className="w-4 h-4" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <LucideBuilding className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">{compName}</h3>
                        </div>
                        <Badge variant="secondary" className="ml-auto text-[10px] font-bold">
                          {Object.values(sectorsInCompany).reduce((acc, list) => acc + list.length, 0)} Funcionários
                        </Badge>
                      </div>

                      {isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-2 md:pl-4 animate-in slide-in-from-top-2 duration-300">
                          {sectorNames.map(secName => (
                            <div key={secName} className="flex flex-col border border-border/40 bg-card/50 rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                              <div className="bg-muted/30 px-4 py-2 flex justify-between items-center border-b border-border/30">
                                <span className="text-xs font-bold text-foreground">{secName}</span>
                                <Badge variant="outline" className="text-[9px] h-5 px-1.5 bg-background/50 border-border/50">{sectorsInCompany[secName].length}</Badge>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar space-y-1">
                                {sectorsInCompany[secName].map(emp => (
                                  <div key={emp.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 transition-all text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase shrink-0">
                                        {emp.nome.substring(0, 2)}
                                      </div>
                                      <span className="truncate text-xs font-medium group-hover:text-primary transition-colors cursor-default" title={emp.nome}>{emp.nome}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                                        onClick={() => openEmpModal(emp)}
                                        title="Editar"
                                      >
                                        <LucideEdit className="w-3 h-3" />
                                      </Button>
                                      <ConfirmAction onConfirm={() => handleDeleteEmployee(emp.id)} title="Excluir Funcionário?">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                          title="Excluir"
                                        >
                                          <LucideTrash className="w-3 h-3" />
                                        </Button>
                                      </ConfirmAction>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {companyNames.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50">Nenhum registro encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'users':
        return (
          <div className="page-transition space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Gestão de Acessos</CardTitle>
                <CardDescription className="text-xs">Gerencie quem pode acessar o sistema e os cargos correspondentes.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
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
                              <div className="flex flex-col gap-1 items-start">
                                <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                                  }`}>
                                  <LucideUserCheck className="w-3 h-3 mr-1" /> {u.role}
                                </Badge>
                                {u.role === 'educador' && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(u.can_register || u.can_edit) ? (
                                      <>
                                        {u.can_register && <Badge variant="secondary" className="text-[9px] h-4 px-1">Registrar</Badge>}
                                        {u.can_edit && <Badge variant="secondary" className="text-[9px] h-4 px-1">Editar</Badge>}
                                      </>
                                    ) : (
                                      <span className="text-[9px] text-muted-foreground opacity-70">Sem permissões extras</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {u.role === 'educador' && (
                              <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-0 h-7 rounded-md border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => openAccessModal(u)}>
                                ACESSOS
                              </Button>
                            )}
                            {u.role !== 'educador' && (
                              <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-0 h-7 rounded-md border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => updateUserRole(u.id, 'educador')}>
                                EDUCADOR
                              </Button>
                            )}

                            <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-0 h-7 rounded-md border-primary/20 text-primary hover:bg-primary/5" onClick={() => updateUserRole(u.id, 'admin')}>
                              ADMIN
                            </Button>
                            {u.role === 'educador' && (
                              <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-0 h-7 rounded-md border-primary/20 text-primary hover:bg-primary/5" onClick={() => openUserCompModal(u)}>
                                EMPRESAS
                              </Button>
                            )}
                            {u.role !== 'pendente' && (
                              <Button size="sm" variant="ghost" className="text-[10px] font-black px-3 py-0 h-7 rounded-md text-muted-foreground hover:text-destructive" onClick={() => updateUserRole(u.id, 'pendente')}>
                                BLOQUEAR
                              </Button>
                            )}
                            {u.role !== 'admin' && (
                              <Button size="sm" variant="ghost" className="text-[10px] font-black px-3 py-0 h-7 rounded-md text-muted-foreground hover:text-destructive" onClick={() => forceUserLogout(u.id, u.username)}>
                                <LucideLogOut className="w-3 h-3 mr-1" /> SESSÃO
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {users.map((u) => (
                    <Card key={u.id} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 rounded-lg border border-border shrink-0">
                              <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                                {u.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-bold mb-1">{u.username}</CardTitle>
                              <CardDescription className="text-xs flex items-center gap-1">
                                <LucideMail className="w-3 h-3" /> {u.email || '-'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                            <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-1.5 h-auto rounded-md border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex-1 min-w-[100px]" onClick={() => updateUserRole(u.id, 'educador')}>
                              EDUCADOR
                            </Button>
                            <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-1.5 h-auto rounded-md border-primary/20 text-primary hover:bg-primary/5 flex-1 min-w-[100px]" onClick={() => updateUserRole(u.id, 'admin')}>
                              ADMIN
                            </Button>
                            {u.role === 'educador' && (
                              <>
                                <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-1.5 h-auto rounded-md border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex-1 min-w-[100px]" onClick={() => openAccessModal(u)}>
                                  ACESSOS
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] font-black px-3 py-1.5 h-auto rounded-md border-primary/20 text-primary hover:bg-primary/5 flex-1 min-w-[100px]" onClick={() => openUserCompModal(u)}>
                                  EMPRESAS
                                </Button>
                              </>
                            )}
                            {u.role !== 'pendente' && (
                              <Button size="sm" variant="ghost" className="text-[10px] font-black px-3 py-1.5 h-auto rounded-md text-muted-foreground hover:text-destructive w-full" onClick={() => updateUserRole(u.id, 'pendente')}>
                                BLOQUEAR
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'reports':
        return (
          <div className="page-transition space-y-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Histórico de presença</h2>
                <p className="text-xs text-muted-foreground font-medium mt-1">Dados detalhados dos registros efetuados.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => loadReports(1)} size="sm" variant="outline" className="h-9 rounded-xl font-bold gap-2">
                  <LucideClock className="w-4 h-4" /> Atualizar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl font-bold gap-2 border-green-500/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = '/api/admin/reports/export';
                    a.download = '';
                    a.click();
                  }}
                >
                  <LucideFileText className="w-4 h-4" /> Exportar CSV
                </Button>
              </div>
            </header>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-card/40">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                    <label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">De</label>
                    <input
                      type="date"
                      className="flex-1 bg-muted/30 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                      value={reportFilter.startDate}
                      onChange={e => setReportFilter(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                    <label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">Até</label>
                    <input
                      type="date"
                      className="flex-1 bg-muted/30 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                      value={reportFilter.endDate}
                      onChange={e => setReportFilter(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="relative flex-1 min-w-[140px]">
                    <LucideBuilding className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Empresa..."
                      className="w-full bg-muted/30 border-none rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                      value={reportFilter.empresa}
                      onChange={e => setReportFilter(f => ({ ...f, empresa: e.target.value }))}
                    />
                  </div>
                  <div className="relative flex-1 min-w-[140px]">
                    <LucideLayers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Setor..."
                      className="w-full bg-muted/30 border-none rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                      value={reportFilter.setor}
                      onChange={e => setReportFilter(f => ({ ...f, setor: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 rounded-lg font-bold text-xs gap-1.5 px-4"
                      onClick={() => loadReports(1, reportFilter)}>
                      <LucideFilter className="w-3 h-3" /> Filtrar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg font-bold text-xs"
                      onClick={() => {
                        const empty = { startDate: '', endDate: '', empresa: '', setor: '' };
                        setReportFilter(empty);
                        loadReports(1, empty);
                      }}>
                      Limpar
                    </Button>
                  </div>
                </div>
                {reportsTotal > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-3 font-bold">{reportsTotal} registros encontrados</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-card/40 backdrop-blur-sm">
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
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
                                  const res = await fetchNoCache(`/api/attendance?id=${r.id}`, { method: 'DELETE' });
                                  if (res.ok) loadReports(reportPage);
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

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-3">
                  {isLoadingReports ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-24 bg-muted/20 animate-shimmer rounded-lg" />
                    ))
                  ) : reports.length > 0 ? (
                    reports.map((r) => (
                      <Card key={r.id} className="border border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                {r.funcionario.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm font-bold mb-1">{r.funcionario}</CardTitle>
                                <CardDescription className="text-xs">
                                  {new Date(r.data_hora).toLocaleDateString('pt-BR')}
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={async () => {
                                if (!confirm('Deseja excluir este registro?')) return;
                                const res = await fetchNoCache(`/api/attendance?id=${r.id}`, { method: 'DELETE' });
                                if (res.ok) loadReports(reportPage);
                              }}
                            >
                              <LucideTrash className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="pt-3 border-t border-border/50 space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-tight">{r.empresa}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">{r.setor}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50">Nenhum registro encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {reportsTotal > REPORTS_PER_PAGE && (
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Página {reportPage} de {Math.ceil(reportsTotal / REPORTS_PER_PAGE)} — {reportsTotal} registros
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 rounded-lg font-black text-[10px] uppercase"
                    disabled={reportPage === 1 || isLoadingReports}
                    onClick={() => loadReports(reportPage - 1)}>
                    <LucideChevronRight className="w-3 h-3 rotate-180" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg font-black text-[10px] uppercase"
                    disabled={reportPage >= Math.ceil(reportsTotal / REPORTS_PER_PAGE) || isLoadingReports}
                    onClick={() => loadReports(reportPage + 1)}>
                    <LucideChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6 animate-scale-in max-w-5xl mx-auto">
            <Card className="border-none shadow-sm bg-gradient-to-br from-primary/8 via-background to-background">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-primary/15 rounded-xl shrink-0">
                    <LucideInfo className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold tracking-tight mb-0.5">Presença<span className="text-primary">.Pro</span></h2>
                    <p className="text-xs text-muted-foreground mb-3">Sistema de gestão de frequência corporativo multi-tenancy</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="font-semibold">v2.0.0</Badge>
                      <Badge variant="outline" className="border-primary/40 text-primary font-semibold">Next.js 16</Badge>
                      <Badge variant="outline" className="font-semibold">Audit Log</Badge>
                      <Badge variant="outline" className="font-semibold">LGPD</Badge>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 font-semibold">Produção</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tech Stack */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <LucideCode2 className="w-4 h-4 text-blue-500" /> Stack tecnológico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {[
                    { label: 'Framework', value: 'Next.js 16.2', color: 'text-foreground' },
                    { label: 'Linguagem', value: 'TypeScript 5.9', color: 'text-blue-600' },
                    { label: 'UI', value: 'TailwindCSS 4 + shadcn/ui', color: 'text-cyan-600' },
                    { label: 'ORM', value: 'Prisma 6 + PostgreSQL (Neon)', color: 'text-emerald-600' },
                    { label: 'Auth', value: 'NextAuth.js 4 + Google OAuth', color: 'text-orange-600' },
                    { label: 'Gráficos', value: 'Recharts 3', color: 'text-purple-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={`text-xs font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Segurança & Arquitetura */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <LucideShieldCheck className="w-4 h-4 text-emerald-500" /> Segurança & arquitetura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {[
                    { title: 'RBAC granular', desc: 'Roles: admin, educador, suporte, pendente. Permissões por endpoint.' },
                    { title: 'Sessão com timeout', desc: 'JWT com expiração de 20 min de inatividade. Força logout remoto.' },
                    { title: 'Rate limiting', desc: 'Proteção por IP contra brute-force no login.' },
                    { title: 'Audit log', desc: 'Registro imutável de todas as ações sensíveis com usuário e timestamp.' },
                    { title: 'Validação Zod', desc: 'Todos os inputs de API validados com schema tipado.' },
                    { title: 'No-cache API', desc: 'Headers personalizados garantem dados sempre frescos.' },
                  ].map(({ title, desc }) => (
                    <div key={title} className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">{title}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-primary/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LucideShieldCheck className="w-4 h-4 text-primary" /> Painel administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {[
                      'Dashboard com métricas em tempo real e tendência semanal',
                      'CRUD completo: Empresas, Setores, Funcionários e Usuários',
                      'Relatórios com filtros por data, empresa e setor',
                      'Auditoria — histórico completo de ações com badges por tipo',
                      'Encerramento remoto de sessão de outros usuários',
                      'Atribuição de empresas e permissões granulares por usuário',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LucideUserCheck className="w-4 h-4 text-emerald-500" /> Portal do educador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {[
                      'Fluxo guiado: Empresa → Setor → Chamada em 3 cliques',
                      'Detecção automática de duplicidade de presença',
                      'Edição rápida: remover ou corrigir presenças lançadas',
                      'Cadastro de novos funcionários (se permitido pelo admin)',
                      'Dark mode e fonte ajustável para acessibilidade',
                      'Funcionamento otimizado em tablets e dispositivos móveis',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-4 pb-2">
              <p className="text-[11px] text-muted-foreground/50">Presença.Pro © 2026 — Desenvolvido com código limpo</p>
            </div>
          </div>
        );
      case 'audit':
        return (
          <div className="page-transition space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Registro de auditoria</h2>
                <p className="text-xs text-muted-foreground mt-1">Histórico de ações sensíveis realizadas no sistema.</p>
              </div>
              <Button onClick={() => loadAuditLogs(1)} size="sm" variant="outline" className="h-9 rounded-xl font-bold gap-2 w-full sm:w-auto">
                <LucideClock className="w-4 h-4" /> Atualizar
              </Button>
            </header>

            {(() => {
              const actionLabel: Record<string, string> = {
                CREATE: 'Criou', UPDATE: 'Editou', DELETE: 'Excluiu',
                UPDATE_ROLE: 'Alterou cargo', UPDATE_PERMISSION: 'Alterou permissão',
              };
              const entityLabel: Record<string, string> = {
                funcionarios: 'Funcionário', empresas: 'Empresa', setores: 'Setor',
                usuarios: 'Usuário', presenca: 'Presença',
              };
              const actionColor: Record<string, string> = {
                CREATE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
                UPDATE: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
                DELETE: 'text-red-600 bg-red-50 dark:bg-red-950/30',
                UPDATE_ROLE: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
                UPDATE_PERMISSION: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
              };
              return (
                <Card className="border-none shadow-sm overflow-hidden bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-muted/50 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black text-muted-foreground pl-6 py-4">Data / Hora</TableHead>
                            <TableHead className="text-[10px] font-black text-muted-foreground py-4">Usuário</TableHead>
                            <TableHead className="text-[10px] font-black text-muted-foreground py-4">Ação</TableHead>
                            <TableHead className="text-[10px] font-black text-muted-foreground py-4">Entidade</TableHead>
                            <TableHead className="text-[10px] font-black text-muted-foreground pr-6 py-4">Detalhe</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingAudit ? (
                            [1,2,3,4,5].map(i => (
                              <TableRow key={i}><TableCell colSpan={5} className="py-6"><div className="h-4 w-full bg-muted/20 animate-shimmer rounded" /></TableCell></TableRow>
                            ))
                          ) : auditLogs.length > 0 ? auditLogs.map(log => (
                            <TableRow key={log.id} className="border-muted/20 hover:bg-primary/5 transition-colors">
                              <TableCell className="pl-6 py-3 text-xs text-muted-foreground font-bold whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary">
                                    {log.username.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold">{log.username}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${actionColor[log.action] ?? 'text-muted-foreground bg-muted/30'}`}>
                                  {actionLabel[log.action] ?? log.action}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 text-xs font-bold">
                                {entityLabel[log.entity] ?? log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}
                              </TableCell>
                              <TableCell className="py-3 pr-6 text-xs text-muted-foreground max-w-[200px] truncate">
                                {log.details ?? '—'}
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow><TableCell colSpan={5} className="py-20 text-center text-xs text-muted-foreground">Nenhum registro de auditoria</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden p-4 space-y-3">
                      {isLoadingAudit ? [1,2,3].map(i => <div key={i} className="h-20 bg-muted/20 animate-shimmer rounded-lg" />) :
                        auditLogs.map(log => (
                          <Card key={log.id} className="border border-border/50">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{log.username}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${actionColor[log.action] ?? 'text-muted-foreground bg-muted/30'}`}>
                                  {actionLabel[log.action] ?? log.action}
                                </span>
                                <span className="text-xs text-muted-foreground">{entityLabel[log.entity] ?? log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}</span>
                              </div>
                              {log.details && <p className="text-[10px] text-muted-foreground truncate">{log.details}</p>}
                            </CardContent>
                          </Card>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {auditTotal > AUDIT_PER_PAGE && (
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold text-muted-foreground">
                  Página {auditPage} de {Math.ceil(auditTotal / AUDIT_PER_PAGE)} — {auditTotal} registros
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 rounded-lg font-bold text-[10px]"
                    disabled={auditPage === 1 || isLoadingAudit}
                    onClick={() => loadAuditLogs(auditPage - 1)}>
                    <LucideChevronRight className="w-3 h-3 rotate-180" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg font-bold text-[10px]"
                    disabled={auditPage >= Math.ceil(auditTotal / AUDIT_PER_PAGE) || isLoadingAudit}
                    onClick={() => loadAuditLogs(auditPage + 1)}>
                    <LucideChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="page-transition space-y-6 max-w-2xl">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                  <LucideUser className="w-4 h-4 text-primary" /> Sessão Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Usuário</span>
                  <span className="text-xs font-bold">{session?.user?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">E-mail</span>
                  <span className="text-xs font-bold">{session?.user?.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cargo</span>
                  <Badge className="text-[10px] font-black uppercase">{session?.user?.role || '—'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                  <LucideSettings className="w-4 h-4 text-primary" /> Aparência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs text-muted-foreground">Tema</span>
                  <div className="flex items-center gap-1">
                    {[
                      { value: 'light', label: 'Claro', icon: LucideSun },
                      { value: 'dark', label: 'Escuro', icon: LucideMoon },
                      { value: 'system', label: 'Sistema', icon: LucideMonitor },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        title={label}
                        className={`p-1.5 rounded-lg transition-all ${theme === value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60'}`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2 text-destructive">
                  <LucideLogOut className="w-4 h-4" /> Encerrar Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">Você será redirecionado para a tela de login.</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="font-black uppercase tracking-widest text-[10px] rounded-xl"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LucideLogOut className="w-4 h-4 mr-2" /> Sair do Sistema
                </Button>
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
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`shrink-0 bg-card flex flex-col rounded-2xl border border-border/50 shadow-sm overflow-hidden relative transition-all duration-300 ease-in-out
        ${isSidebarCollapsed && !isMobileMenuOpen ? 'w-[60px] px-2 py-4' : 'w-56 px-3 py-4'}
        ${isMobileMenuOpen ? 'fixed left-2 top-2 bottom-2 z-50 lg:relative lg:left-0 lg:top-0 lg:bottom-0' : 'hidden lg:flex'}
      `}>

        {/* Close button — mobile only */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-3 right-3 w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-50"
        >
          <LucideX className="w-3.5 h-3.5" />
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-14 bg-card border border-border/50 shadow-sm w-6 h-6 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-50"
          title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
        >
          {isSidebarCollapsed ? <LucidePanelLeftOpen className="w-3 h-3" /> : <LucidePanelLeftClose className="w-3 h-3" />}
        </button>

        {/* User profile */}
        <div className={`mb-3 ${isSidebarCollapsed && !isMobileMenuOpen ? 'flex justify-center' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isSidebarCollapsed && !isMobileMenuOpen ? (
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
                  <LucideChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />
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
              <DropdownMenuItem
                onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                className="cursor-pointer"
              >
                <LucideLayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                className="cursor-pointer"
              >
                <LucideSettings className="w-4 h-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  {theme === 'dark' ? <LucideMoon className="w-4 h-4 mr-2" /> : theme === 'light' ? <LucideSun className="w-4 h-4 mr-2" /> : <LucideMonitor className="w-4 h-4 mr-2" />}
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                    <LucideSun className="w-4 h-4 mr-2" /> Claro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                    <LucideMoon className="w-4 h-4 mr-2" /> Escuro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                    <LucideMonitor className="w-4 h-4 mr-2" /> Sistema
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LucideLogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="border-t border-border/40 mb-3" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
          {/* Grupo Principal */}
          <div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <button
                onClick={() => setNavGroupOpen(s => ({ ...s, principal: !s.principal }))}
                className="w-full flex items-center justify-between px-2 mb-1"
              >
                <span className="text-[10px] font-medium text-muted-foreground/50 tracking-wider">Principal</span>
                <LucideChevronDown className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${navGroupOpen.principal ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(navGroupOpen.principal || isSidebarCollapsed) && (
              <div className="space-y-0.5">
                {[
                  { id: 'overview', label: 'Dashboard', icon: LucideLayoutDashboard },
                  { id: 'companies', label: 'Empresas', icon: LucideBuilding },
                  { id: 'employees', label: 'Funcionários', icon: LucideUsers },
                  { id: 'users', label: 'Acessos', icon: LucideUserCheck },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as Tab); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-150
                      ${activeTab === item.id ? 'bg-primary/10 text-primary font-semibold' : 'font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
                      ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed && !isMobileMenuOpen ? item.label : ''}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grupo Sistema */}
          <div>
            {(!isSidebarCollapsed || isMobileMenuOpen) ? (
              <button
                onClick={() => setNavGroupOpen(s => ({ ...s, sistema: !s.sistema }))}
                className="w-full flex items-center justify-between px-2 mb-1"
              >
                <span className="text-[10px] font-medium text-muted-foreground/50 tracking-wider">Sistema</span>
                <LucideChevronDown className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${navGroupOpen.sistema ? '' : '-rotate-90'}`} />
              </button>
            ) : (
              <div className="border-t border-border/30 mb-1.5" />
            )}
            {(navGroupOpen.sistema || isSidebarCollapsed) && (
              <div className="space-y-0.5">
                {[
                  { id: 'reports', label: 'Relatórios', icon: LucideFileText },
                  { id: 'audit', label: 'Auditoria', icon: LucideClipboardList },
                  { id: 'settings', label: 'Configurações', icon: LucideSettings },
                  { id: 'about', label: 'Sobre', icon: LucideInfo },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as Tab); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-150
                      ${activeTab === item.id ? 'bg-primary/10 text-primary font-semibold' : 'font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
                      ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed && !isMobileMenuOpen ? item.label : ''}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

      </aside>

      {/* Main Content (Inset) */}
      <main className="flex-1 min-w-0 bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col relative transition-all duration-500">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
            <header className="mb-6 lg:mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 animate-slide-up">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center text-foreground transition-all shrink-0"
                  aria-label="Abrir menu"
                >
                  <LucideMenu className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-black wrap-break-word">
                    {activeTab === 'overview' && 'Dashboard'}
                    {activeTab === 'companies' && 'Empresas'}
                    {activeTab === 'employees' && 'Funcionários'}
                    {activeTab === 'users' && 'Controle de acessos'}
                    {activeTab === 'reports' && 'Histórico de presença'}
                    {activeTab === 'audit' && 'Auditoria'}
                    {activeTab === 'settings' && 'Configurações'}
                    {activeTab === 'about' && 'Sobre o sistema'}
                  </h1>
                  <p className="text-muted-foreground text-xs font-medium mt-1 hidden sm:block">Gerenciamento inteligente de presença e frequência.</p>
                </div>
              </div>
            </header>

            {renderContent()}
          </div>
        </div>
      </main>

      {/* Employee Modal (Briefly styled for now) */}
      {/* Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in my-auto">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in my-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LucideLayers className="w-5 h-5 text-primary" />
                {editingSector ? 'Editar Setor' : 'Novo Setor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSector} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    {editingSector ? 'Nome do Setor' : 'Nomes dos Setores (um por linha)'}
                  </label>
                  {editingSector ? (
                    <input
                      required
                      className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                      value={sectorForm.nome}
                      onChange={e => setSectorForm({ ...sectorForm, nome: e.target.value })}
                      placeholder="Ex: Recursos Humanos"
                    />
                  ) : (
                    <textarea
                      required
                      rows={5}
                      className="w-full bg-muted/30 border-none rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 transition-all font-bold resize-none"
                      value={sectorForm.nome}
                      onChange={e => setSectorForm({ ...sectorForm, nome: e.target.value })}
                      placeholder={"Ex:\nRecursos Humanos\nTI\nFinanceiro\nOperacional"}
                    />
                  )}
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in my-auto">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in my-auto">
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

      {/* Access Management Modal */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-border animate-scale-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LucideShieldCheck className="w-5 h-5 text-emerald-500" />
                Permissões de Educador
              </CardTitle>
              <CardDescription>
                Configure o que <b>{selectedUser?.username}</b> pode fazer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAccess} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="space-y-0.5">
                      <label className="text-sm font-bold block">Cadastrar Funcionários</label>
                      <span className="text-xs text-muted-foreground">Adicionar novos nomes aos setores</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                      checked={accessForm.can_register}
                      onChange={e => setAccessForm({ ...accessForm, can_register: e.target.checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="space-y-0.5">
                      <label className="text-sm font-bold block">Editar Nomes</label>
                      <span className="text-xs text-muted-foreground">Corrigir nomes de funcionários</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                      checked={accessForm.can_edit}
                      onChange={e => setAccessForm({ ...accessForm, can_edit: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAccessModalOpen(false)} className="flex-1 font-bold rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 font-bold rounded-xl shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
                    Salvar Acessos
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// github.com/dnlortega
// linkedin.com/in/daniel-op
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  BarChart as BarChartIcon,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  Plus,
  Edit,
  Trash,
  ChevronRight,
  ChevronDown,
  Search,
  ShieldCheck,
  UserCheck,
  Clock,
  Mail,
  Building,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Layers,
  AlertCircle,
  X,
  Menu,
  Info,
  Code2,
  Zap,
  Trash2,
  TrendingUp,
  ClipboardList,
  Filter,
  Percent,
  Sun,
  Moon,
  Monitor,
  Key,
  UserX,
  UserPlus,
  Building2
} from 'lucide-react';
import { toast } from "sonner";
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
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
  companyMonthly?: { name: string; count: number }[];
  sectorDonut?: { name: string; value: number }[];
  heatmapData?: { date: string; count: number }[];
  hourlyDistribution?: { hour: string; count: number }[];
  topAbsent?: { id: number; nome: string; empresa: string; setor: string; presencas: number }[];
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
              <AlertCircle className="w-4 h-4 text-destructive" />
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
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [renamingUser, setRenamingUser] = useState<{ id: number; value: string } | null>(null);
  const [isSavingEmp, setIsSavingEmp] = useState(false);
  const [isSavingComp, setIsSavingComp] = useState(false);
  const [isSavingSector, setIsSavingSector] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [isSavingUserComp, setIsSavingUserComp] = useState(false);
  const [empFormErrors, setEmpFormErrors] = useState<Record<string, string>>({});
  const [compFormErrors, setCompFormErrors] = useState<Record<string, string>>({});
  const [sectorFormErrors, setSectorFormErrors] = useState<Record<string, string>>({});
  const [auditFilter, setAuditFilter] = useState({ action: '', user: '', startDate: '', endDate: '' });
  const [companySearch, setCompanySearch] = useState('');

  const isSuperAdmin = session?.user?.email === 'dnlortega@gmail.com';

  const loadDemoMode = async () => {
    const res = await fetchNoCache('/api/admin/demo-mode');
    if (res.ok) { const d = await res.json(); setDemoMode(d.enabled); }
  };

  const toggleDemoMode = async () => {
    setTogglingDemo(true);
    const res = await fetchNoCache('/api/admin/demo-mode', { method: 'POST' });
    if (res.ok) {
      const d = await res.json();
      setDemoMode(d.enabled);
      toast.success(d.enabled ? 'Demo mode ativado — novos usuários Google podem escolher o papel' : 'Demo mode desativado');
    }
    setTogglingDemo(false);
  };

  useEffect(() => {
    setSearchTerm('');
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'employees') { loadEmployees(); loadCompanies(); loadSectors(); }
    if (activeTab === 'users') { loadUsers(); loadCompanies(); }
    if (activeTab === 'companies') { loadCompanies(); loadSectors(); }
    if (activeTab === 'sectors') { loadSectors(); loadCompanies(); }
    if (activeTab === 'reports') loadReports(1);
    if (activeTab === 'audit') loadAuditLogs(1);
    if (activeTab === 'settings' && isSuperAdmin) loadDemoMode();
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

  const loadAuditLogs = async (page = 1, filter = auditFilter) => {
    setIsLoadingAudit(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(AUDIT_PER_PAGE) });
      if (filter.action) params.set('action', filter.action);
      if (filter.user) params.set('user', filter.user);
      if (filter.startDate) params.set('startDate', filter.startDate);
      if (filter.endDate) params.set('endDate', filter.endDate);
      const res = await fetchNoCache(`/api/admin/audit-log?${params}`);
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

  const deleteUser = async (userId: number, username: string) => {
    const prev = users;
    setUsers(users.filter(u => u.id !== userId));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Usuário ${username} excluído`);
      } else {
        setUsers(prev);
        const data = await res.json() as { error?: string };
        toast.error(data.error || 'Erro ao excluir usuário');
      }
    } catch (e) { setUsers(prev); console.error(e); }
  };

  const renameUser = async () => {
    if (!renamingUser) return;
    const { id, value } = renamingUser;
    if (!value.trim() || value.trim().length < 2) { toast.error('Nome muito curto'); return; }
    const prev = users;
    setUsers(users.map(u => u.id === id ? { ...u, username: value.trim() } : u));
    setRenamingUser(null);
    try {
      const res = await fetchNoCache(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value.trim() }),
      });
      if (res.ok) { toast.success('Nome alterado'); }
      else {
        setUsers(prev);
        const d = await res.json() as { error?: string };
        toast.error(d.error || 'Erro ao renomear');
      }
    } catch { setUsers(prev); toast.error('Erro de conexão'); }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    const prev = users;
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) { setUsers(prev); toast.error('Erro ao atualizar cargo'); }
    } catch (e) { setUsers(prev); console.error(e); }
  };

  const updateUserCanRegister = async (userId: number, canRegister: boolean) => {
    const prev = users;
    setUsers(users.map(u => u.id === userId ? { ...u, can_register: canRegister } : u));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_register: canRegister }),
      });
      if (!res.ok) { setUsers(prev); toast.error('Erro ao atualizar permissão'); }
    } catch (e) { setUsers(prev); console.error(e); }
  };

  const updateUserCanEdit = async (userId: number, canEdit: boolean) => {
    const prev = users;
    setUsers(users.map(u => u.id === userId ? { ...u, can_edit: canEdit } : u));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_edit: canEdit }),
      });
      if (!res.ok) { setUsers(prev); toast.error('Erro ao atualizar permissão'); }
    } catch (e) { setUsers(prev); console.error(e); }
  };

  const updateUserCompanies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const prev = users;
    setIsSavingUserComp(true);
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, empresas: userCompForm } : u));
    setIsUserCompModalOpen(false);
    try {
      const res = await fetchNoCache(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresas: userCompForm }),
      });
      if (res.ok) { toast.success('Acessos atualizados'); }
      else { setUsers(prev); toast.error('Erro ao atualizar empresas'); }
    } catch (e) { setUsers(prev); console.error(e); }
    setIsSavingUserComp(false);
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
    const prev = users;
    setIsSavingAccess(true);
    setUsers(users.map(u => u.id === selectedUser.id
      ? { ...u, can_register: accessForm.can_register, can_edit: accessForm.can_edit }
      : u));
    setIsAccessModalOpen(false);
    try {
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
      toast.success('Permissões salvas');
    } catch (e) { setUsers(prev); console.error(e); }
    setIsSavingAccess(false);
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
    const errors: Record<string, string> = {};
    if (!empForm.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!empForm.empresa_id) errors.empresa_id = 'Selecione a empresa';
    if (!empForm.setor_id) errors.setor_id = 'Selecione o setor';
    if (Object.keys(errors).length > 0) { setEmpFormErrors(errors); return; }
    setEmpFormErrors({});
    setIsSavingEmp(true);
    try {
      const url = editingEmp ? `/api/admin/employees/${editingEmp.id}` : '/api/admin/employees';
      const method = editingEmp ? 'PUT' : 'POST';
      const res = await fetchNoCache(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: empForm.nome, empresa_id: Number(empForm.empresa_id), setor_id: Number(empForm.setor_id) }),
      });
      if (res.ok) {
        setIsEmpModalOpen(false);
        setEditingEmp(null);
        setEmpForm({ nome: '', empresa_id: '', setor_id: '' });
        loadEmployees();
        toast.success(editingEmp ? 'Funcionário atualizado' : 'Funcionário cadastrado');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Erro ao salvar');
      }
    } catch (err) { console.error(err); toast.error('Erro de conexão'); }
    setIsSavingEmp(false);
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
    const errors: Record<string, string> = {};
    if (!compForm.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (Object.keys(errors).length > 0) { setCompFormErrors(errors); return; }
    setCompFormErrors({});
    setIsSavingComp(true);
    try {
      const url = editingComp ? `/api/admin/companies/${editingComp.id}` : '/api/admin/companies';
      const method = editingComp ? 'PUT' : 'POST';
      const res = await fetchNoCache(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compForm) });
      if (res.ok) {
        setIsCompModalOpen(false);
        setEditingComp(null);
        setCompForm({ nome: '' });
        loadCompanies();
        toast.success(editingComp ? 'Empresa atualizada' : 'Empresa cadastrada');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Erro ao salvar');
      }
    } catch (err) { console.error(err); toast.error('Erro de conexão'); }
    setIsSavingComp(false);
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
    const errors: Record<string, string> = {};
    if (!sectorForm.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!sectorForm.empresa_id) errors.empresa_id = 'Selecione a empresa';
    if (Object.keys(errors).length > 0) { setSectorFormErrors(errors); return; }
    setSectorFormErrors({});
    setIsSavingSector(true);
    try {
      if (editingSector) {
        const isDuplicate = sectors.some(s =>
          s.nome.toLowerCase() === sectorForm.nome.toLowerCase() &&
          s.empresa_id === Number(sectorForm.empresa_id) &&
          s.id !== editingSector.id
        );
        if (isDuplicate) { toast.error('Já existe um setor com este nome nesta empresa!'); setIsSavingSector(false); return; }
        const res = await fetchNoCache(`/api/admin/sectors/${editingSector.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: sectorForm.nome, empresa_id: Number(sectorForm.empresa_id) }),
        });
        if (res.ok) {
          setIsSectorModalOpen(false);
          setEditingSector(null);
          setSectorForm({ nome: '', empresa_id: '' });
          loadSectors();
          toast.success('Setor atualizado');
        } else {
          const d = await res.json();
          toast.error(d.error || 'Erro ao editar setor');
        }
      } else {
        const nomes = sectorForm.nome.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        if (nomes.length === 0) { toast.error('Digite pelo menos um nome de setor.'); setIsSavingSector(false); return; }
        const res = await fetchNoCache('/api/admin/sectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nomes, empresa_id: Number(sectorForm.empresa_id) }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsSectorModalOpen(false);
          setEditingSector(null);
          setSectorForm({ nome: '', empresa_id: '' });
          loadSectors();
          toast.success(data.message || 'Setores criados');
        } else {
          toast.error(data.error || 'Erro ao criar setores');
        }
      }
    } catch (err) { console.error(err); toast.error('Erro ao salvar setor. Tente novamente.'); }
    setIsSavingSector(false);
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
      case 'overview': {
        const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ec4899','#14b8a6','#8b5cf6','#f97316','#06b6d4'];
        const shimmer = <div className="h-full w-full bg-muted/20 rounded-xl animate-shimmer" />;
        const maxToday = Math.max(1, dashboardData?.totalToday ?? 1);
        const attendanceRate = dashboardData && dashboardData.totalEmployees > 0
          ? Math.round((dashboardData.totalToday / dashboardData.totalEmployees) * 100) : 0;

        return (
          <div className="flex flex-col gap-4 animate-scale-in h-full">
            {dashboardError && (
              <Card className="border-destructive/50 bg-destructive/10 shrink-0">
                <CardContent className="p-3 flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{dashboardError}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={loadDashboard} className="ml-auto h-7 w-7">
                        <Clock className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tentar novamente</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            )}

            {/* KPI Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
              {[
                { label: 'Presenças hoje', value: dashboardData?.totalToday ?? 0, sub: 'registradas hoje', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Taxa de presença', value: isLoadingDashboard ? '—' : `${attendanceRate}%`, sub: `${dashboardData?.totalToday ?? 0} de ${dashboardData?.totalEmployees ?? 0}`, icon: Percent, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Setores ativos', value: dashboardData?.sectorsActive ?? 0, sub: 'com presença hoje', icon: BarChart, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { label: 'Funcionários', value: dashboardData?.totalEmployees ?? 0, sub: 'cadastrados', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                <Card key={label} className="border-none shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
                      <div className={`p-1 rounded-lg ${bg} shrink-0`}><Icon className={`w-3 h-3 ${color}`} /></div>
                    </div>
                    <div className="text-xl font-bold tracking-tight">
                      {isLoadingDashboard ? <div className="h-6 w-12 bg-muted/20 animate-shimmer rounded" /> : value}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            {/* Abas de análise */}
            <Tabs defaultValue="hoje" className="flex-1 flex flex-col min-h-0">
              <TabsList className="shrink-0 w-fit mb-3 h-8">
                <TabsTrigger value="hoje" className="text-xs px-4 h-7">Hoje</TabsTrigger>
                <TabsTrigger value="tendencia" className="text-xs px-4 h-7">7 dias</TabsTrigger>
                <TabsTrigger value="mensal" className="text-xs px-4 h-7">30 dias</TabsTrigger>
              </TabsList>

              {/* Aba: Hoje */}
              <TabsContent value="hoje" className="mt-0 flex-1 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Horário de pico */}
                  <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Horário de pico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="h-[180px]">
                        {dashboardData?.hourlyDistribution ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.hourlyDistribution} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                              <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                              <ChartTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [v, 'Presenças']} />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.85} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="h-[180px]">{shimmer}</div>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Setores hoje + Recente */}
                  <div className="flex flex-col gap-3">
                    <Card className="border-none shadow-sm flex-1">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-xs font-semibold">Setores hoje</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 space-y-2 overflow-y-auto max-h-[160px] custom-scrollbar">
                        {dashboardData?.sectorStats?.length ? dashboardData.sectorStats.map((stat, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="font-medium truncate">{stat.setor}</span>
                                <span className="font-bold text-primary ml-1 shrink-0">{stat.count}</span>
                              </div>
                              <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((stat.count / maxToday) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[10px] text-muted-foreground italic py-4 text-center">Nenhuma presença hoje.</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm flex-1">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-xs font-semibold">Recente</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 space-y-2 overflow-y-auto max-h-[140px] custom-scrollbar">
                        {dashboardData?.recentActivities?.length ? dashboardData.recentActivities.map((a) => (
                          <div key={a.id} className="flex gap-2">
                            <div className="w-0.5 bg-primary/30 rounded-full shrink-0" />
                            <div>
                              <p className="text-[10px] font-semibold leading-tight">{a.funcionario}</p>
                              <p className="text-[9px] text-muted-foreground">{a.setor}</p>
                            </div>
                          </div>
                        )) : <p className="text-[10px] text-muted-foreground italic text-center py-2">Sem atividade.</p>}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Aba: 7 dias */}
              <TabsContent value="tendencia" className="mt-0 flex-1 min-h-0">
                <Card className="border-none shadow-sm h-full">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" /> Tendência dos últimos 7 dias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="h-[300px]">
                      {dashboardData?.weeklyTrend ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dashboardData.weeklyTrend} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [typeof v === 'number' ? v : 0, 'Presenças']} />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : <div className="h-[300px]">{shimmer}</div>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba: 30 dias */}
              <TabsContent value="mensal" className="mt-0 flex-1 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Barras por empresa */}
                  <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-indigo-500" /> Por empresa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="h-[160px]">
                        {dashboardData?.companyMonthly?.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.companyMonthly} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                              <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                              <ChartTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [v, 'Presenças']} />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} opacity={0.85} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <p className="text-xs text-muted-foreground italic text-center pt-12">Sem dados</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Coluna direita: donut + ausências + heatmap */}
                  <div className="flex flex-col gap-3">
                    <Card className="border-none shadow-sm flex-1">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-rose-500" /> Setores
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="h-[130px]">
                          {dashboardData?.sectorDonut?.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={dashboardData.sectorDonut} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="value" paddingAngle={2}>
                                  {dashboardData.sectorDonut.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.9} />)}
                                </Pie>
                                <ChartTooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [v, 'Presenças']} />
                                <Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <p className="text-xs text-muted-foreground italic text-center pt-8">Sem dados</p>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm flex-1">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Menos presenças
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 space-y-1.5">
                        {dashboardData?.topAbsent?.length ? dashboardData.topAbsent.map((e, i) => (
                          <div key={e.id} className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-muted-foreground w-3">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold truncate leading-tight">{e.nome}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{e.setor}</p>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-bold h-4 px-1 shrink-0">{e.presencas}d</Badge>
                          </div>
                        )) : <p className="text-[10px] text-muted-foreground italic text-center py-2">Sem dados</p>}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Heat map — linha inteira */}
                  <Card className="lg:col-span-3 border-none shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <BarChartIcon className="w-3.5 h-3.5 text-teal-500" /> Mapa de presença
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {dashboardData?.heatmapData ? (() => {
                        const max = Math.max(1, ...dashboardData.heatmapData.map(d => d.count));
                        return (
                          <div className="flex flex-wrap gap-1 items-center">
                            {dashboardData.heatmapData.map(({ date, count }) => {
                              const d = new Date(date + 'T12:00:00');
                              const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
                              const intensity = count === 0 ? 0 : Math.max(0.15, count / max);
                              return (
                                <div key={date} title={`${label}: ${count} presenças`}
                                  className="w-6 h-6 rounded cursor-default border border-border/20"
                                  style={{ backgroundColor: count === 0 ? 'hsl(var(--muted))' : `hsl(var(--primary) / ${intensity})` }}
                                />
                              );
                            })}
                            <div className="w-full flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground">
                              <span>Menos</span>
                              {[0.1, 0.3, 0.55, 0.8, 1].map(v => (
                                <div key={v} className="w-3.5 h-3.5 rounded" style={{ backgroundColor: v < 0.1 ? 'hsl(var(--muted))' : `hsl(var(--primary) / ${v})` }} />
                              ))}
                              <span>Mais</span>
                            </div>
                          </div>
                        );
                      })() : shimmer}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      }
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
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar Empresa..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all font-bold"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" onClick={() => openCompModal()} className="rounded-xl shadow-lg shadow-primary/20 shrink-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Nova Empresa</TooltipContent>
                  </Tooltip>
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
                                    <Plus className="w-3 h-3" />
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
                                                  <Edit className="w-3 h-3" />
                                                </button>
                                                <ConfirmAction onConfirm={() => handleDeleteSector(s.id)} title="Excluir Setor?">
                                                  <button
                                                    className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center"
                                                    title="Excluir Setor"
                                                  >
                                                    <Trash className="w-3 h-3" />
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
                                    <Layers className="w-6 h-6 mx-auto mb-1 opacity-20" />
                                    <span className="text-[9px] text-muted-foreground italic font-medium block">Nenhum setor cadastrado</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg" onClick={() => openCompModal(comp)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <ConfirmAction onConfirm={() => handleDeleteCompany(comp.id)} title="Excluir Empresa?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg">
                                    <Trash className="w-3.5 h-3.5" />
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
                              <Building className="w-10 h-10" />
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
                        <Building className="w-10 h-10" />
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
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <ConfirmAction onConfirm={() => handleDeleteCompany(comp.id)} title="Excluir Empresa?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash className="w-4 h-4" />
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
                                <Plus className="w-3 h-3 mr-1" /> Novo
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
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <ConfirmAction onConfirm={() => handleDeleteSector(s.id)} title="Excluir Setor?">
                                        <button
                                          className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center"
                                          title="Excluir Setor"
                                        >
                                          <Trash className="w-3 h-3" />
                                        </button>
                                      </ConfirmAction>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-4 text-center border border-dashed border-border/50 rounded-lg bg-muted/10">
                                <Layers className="w-5 h-5 mx-auto mb-1 opacity-20" />
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
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" onClick={() => openSectorModal()} className="rounded-xl shrink-0" disabled={companies.length === 0}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Novo Setor</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <div className="py-20 text-center space-y-4 font-black uppercase tracking-widest opacity-50 text-[10px]">
                    <Building className="w-10 h-10 mx-auto mb-2 opacity-20" />
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
                                  <Edit className="w-3 h-4" />
                                </Button>
                                <ConfirmAction onConfirm={() => handleDeleteSector(sec.id)} title="Excluir Setor?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash className="w-3 h-4" />
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
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <ConfirmAction onConfirm={() => handleDeleteSector(sec.id)} title="Excluir Setor?">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash className="w-4 h-4" />
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
                <Building className="w-10 h-10 text-primary opacity-40" />
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
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, setor ou empresa..."
                      className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <ConfirmAction
                          onConfirm={seedEmployees}
                          title="Popular Base?"
                          description="Deseja criar 15 funcionários em cada setor? Esta ação pode demorar alguns segundos."
                          confirmText="Criar"
                          buttonVariant="default"
                        >
                          <Button
                            size="icon"
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={isSeedingEmployees || sectors.length === 0}
                          >
                            {isSeedingEmployees
                              ? <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                              : <Users className="w-4 h-4" />}
                          </Button>
                        </ConfirmAction>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Popular (15 por setor)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" onClick={() => openEmpModal()} className="rounded-xl shrink-0" disabled={sectors.length === 0}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Novo Funcionário</TooltipContent>
                  </Tooltip>
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
                      <Button size="icon" variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0">
                        <Trash2 className="w-4 h-4" />
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
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
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
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <ConfirmAction onConfirm={() => handleDeleteEmployee(emp.id)} title="Excluir Funcionário?">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                          title="Excluir"
                                        >
                                          <Trash className="w-3 h-3" />
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
                                {renamingUser?.id === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      autoFocus
                                      className="text-xs font-bold bg-muted/50 border border-primary/40 rounded px-1.5 py-0.5 w-32 outline-none"
                                      value={renamingUser.value}
                                      onChange={e => setRenamingUser({ id: u.id, value: e.target.value })}
                                      onKeyDown={e => { if (e.key === 'Enter') renameUser(); if (e.key === 'Escape') setRenamingUser(null); }}
                                    />
                                    <button onClick={renameUser} className="text-primary hover:text-primary/70 text-[10px] font-black">OK</button>
                                    <button onClick={() => setRenamingUser(null)} className="text-muted-foreground hover:text-foreground text-[10px]">✕</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 group/name">
                                    <span className="font-bold text-xs">{u.username}</span>
                                    <button
                                      onClick={() => setRenamingUser({ id: u.id, value: u.username })}
                                      className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {u.email || '-'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.role === 'pendente' ? (
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-orange-500/30 text-orange-500 bg-orange-500/5">
                                <Clock className="w-3 h-3 mr-1" /> Pendente
                              </Badge>
                            ) : (
                              <div className="flex flex-col gap-1 items-start">
                                <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                                  }`}>
                                  <UserCheck className="w-3 h-3 mr-1" /> {u.role}
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
                          <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                {u.role === 'educador' ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => openAccessModal(u)}>
                                        <Key className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Configurar acessos</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => updateUserRole(u.id, 'educador')}>
                                        <UserPlus className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Promover a educador</TooltipContent>
                                  </Tooltip>
                                )}
                                {u.role !== 'admin' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => updateUserRole(u.id, 'admin')}>
                                        <ShieldCheck className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Promover a admin</TooltipContent>
                                  </Tooltip>
                                )}
                                {u.role === 'educador' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => openUserCompModal(u)}>
                                        <Building2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Gerenciar empresas</TooltipContent>
                                  </Tooltip>
                                )}
                                {u.role !== 'pendente' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-amber-500" onClick={() => updateUserRole(u.id, 'pendente')}>
                                        <UserX className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Bloquear usuário</TooltipContent>
                                  </Tooltip>
                                )}
                                {u.role !== 'admin' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => forceUserLogout(u.id, u.username)}>
                                        <LogOut className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Encerrar sessão</TooltipContent>
                                  </Tooltip>
                                )}
                                {u.role !== 'admin' && (
                                  <Popover>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </PopoverTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>Excluir usuário</TooltipContent>
                                    </Tooltip>
                                    <PopoverContent className="w-56 p-3" side="left">
                                      <p className="text-sm font-semibold mb-1">Excluir <span className="text-primary">{u.username}</span>?</p>
                                      <p className="text-xs text-muted-foreground mb-3">Esta ação não pode ser desfeita.</p>
                                      <Button size="sm" variant="destructive" className="w-full" onClick={() => deleteUser(u.id, u.username)}>
                                        Confirmar exclusão
                                      </Button>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
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
                                <Mail className="w-3 h-3" /> {u.email || '-'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {u.role === 'pendente' ? (
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-orange-500/30 text-orange-500 bg-orange-500/5">
                                <Clock className="w-3 h-3 mr-1" /> Pendente
                              </Badge>
                            ) : (
                              <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                                }`}>
                                <UserCheck className="w-3 h-3 mr-1" /> {u.role}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                            {u.role === 'educador' ? (
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600" title="Configurar acessos" onClick={() => openAccessModal(u)}>
                                <Key className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600" title="Promover a educador" onClick={() => updateUserRole(u.id, 'educador')}>
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            )}
                            {u.role !== 'admin' && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-primary" title="Promover a admin" onClick={() => updateUserRole(u.id, 'admin')}>
                                <ShieldCheck className="w-4 h-4" />
                              </Button>
                            )}
                            {u.role === 'educador' && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-primary" title="Gerenciar empresas" onClick={() => openUserCompModal(u)}>
                                <Building2 className="w-4 h-4" />
                              </Button>
                            )}
                            {u.role !== 'pendente' && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-amber-500" title="Bloquear usuário" onClick={() => updateUserRole(u.id, 'pendente')}>
                                <UserX className="w-4 h-4" />
                              </Button>
                            )}
                            {u.role !== 'admin' && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" title="Encerrar sessão" onClick={() => forceUserLogout(u.id, u.username)}>
                                <LogOut className="w-4 h-4" />
                              </Button>
                            )}
                            {u.role !== 'admin' && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" title="Excluir usuário">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3" side="top">
                                  <p className="text-sm font-semibold mb-1">Excluir <span className="text-primary">{u.username}</span>?</p>
                                  <p className="text-xs text-muted-foreground mb-3">Esta ação não pode ser desfeita.</p>
                                  <Button size="sm" variant="destructive" className="w-full" onClick={() => deleteUser(u.id, u.username)}>
                                    Confirmar exclusão
                                  </Button>
                                </PopoverContent>
                              </Popover>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => loadReports(1)} size="icon" variant="outline" className="h-9 w-9 rounded-xl">
                      <Clock className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 rounded-xl font-bold gap-2 border-green-500/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = '/api/admin/reports/export';
                    a.download = '';
                    a.click();
                  }}
                >
                  <FileText className="w-4 h-4" />
                </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar CSV</TooltipContent>
                </Tooltip>
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
                    <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Empresa..."
                      className="w-full bg-muted/30 border-none rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                      value={reportFilter.empresa}
                      onChange={e => setReportFilter(f => ({ ...f, empresa: e.target.value }))}
                    />
                  </div>
                  <div className="relative flex-1 min-w-[140px]">
                    <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Setor..."
                      className="w-full bg-muted/30 border-none rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                      value={reportFilter.setor}
                      onChange={e => setReportFilter(f => ({ ...f, setor: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" className="h-8 w-8 rounded-lg" onClick={() => loadReports(1, reportFilter)}>
                          <Filter className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Filtrar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"
                          onClick={() => {
                            const empty = { startDate: '', endDate: '', empresa: '', setor: '' };
                            setReportFilter(empty);
                            loadReports(1, empty);
                          }}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Limpar filtros</TooltipContent>
                    </Tooltip>
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
                                <Trash className="w-4 h-4" />
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
                              <Trash className="w-4 h-4" />
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
                    <ChevronRight className="w-3 h-3 rotate-180" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg font-black text-[10px] uppercase"
                    disabled={reportPage >= Math.ceil(reportsTotal / REPORTS_PER_PAGE) || isLoadingReports}
                    onClick={() => loadReports(reportPage + 1)}>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'about':
        return (
          <div className="space-y-5 animate-scale-in max-w-5xl mx-auto">

            {/* Hero */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-primary/8 via-background to-background overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/15 rounded-xl shrink-0">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black tracking-tight mb-0.5">Presença<span className="text-primary">.Pro</span></h2>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">Sistema de gestão de frequência corporativo · multi-empresa · multi-setor</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="font-bold">v2.1.0</Badge>
                      <Badge variant="outline" className="border-primary/40 text-primary font-semibold">Next.js 16.1</Badge>
                      <Badge variant="outline" className="border-blue-500/40 text-blue-600 font-semibold">React 19</Badge>
                      <Badge variant="outline" className="border-violet-500/40 text-violet-600 font-semibold">shadcn/ui</Badge>
                      <Badge variant="outline" className="font-semibold">Audit Log</Badge>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 font-semibold">Produção</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Números do sistema */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: '7', label: 'Modelos no banco', color: 'text-primary', bg: 'bg-primary/10' },
                { value: '22', label: 'Rotas de API', color: 'text-blue-600', bg: 'bg-blue-500/10' },
                { value: '17', label: 'Componentes shadcn', color: 'text-violet-600', bg: 'bg-violet-500/10' },
                { value: '4', label: 'Níveis de acesso', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
              ].map(({ value, label, color, bg }) => (
                <Card key={label} className="border-none shadow-sm text-center">
                  <CardContent className="pt-4 pb-4">
                    <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stack */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Code2 className="w-4 h-4 text-blue-500" /> Stack tecnológico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {[
                    { label: 'Framework', value: 'Next.js 16.1 (App Router)', color: 'text-foreground' },
                    { label: 'Runtime', value: 'React 19 + TypeScript 5.7', color: 'text-blue-600' },
                    { label: 'UI', value: 'Tailwind CSS v3 + shadcn/ui', color: 'text-cyan-600' },
                    { label: 'ORM', value: 'Prisma 6.19 + PostgreSQL (Neon)', color: 'text-emerald-600' },
                    { label: 'Auth', value: 'NextAuth.js 4.24 · Google + Credentials', color: 'text-orange-600' },
                    { label: 'Gráficos', value: 'Recharts 3.6', color: 'text-purple-600' },
                    { label: 'Validação', value: 'Zod 4.4 em todos os endpoints', color: 'text-rose-600' },
                    { label: 'Toasts', value: 'Sonner 2.0', color: 'text-amber-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                      <span className={`text-xs font-semibold ${color} text-right ml-3`}>{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Segurança & arquitetura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {[
                    { title: 'RBAC granular', desc: '4 roles: admin, educador, suporte, pendente. Permissões can_register e can_edit por usuário.' },
                    { title: 'JWT + força logout', desc: 'Sessão JWT com flag force_logout. Admin pode encerrar sessão de qualquer usuário remotamente.' },
                    { title: 'Rate limiting por IP', desc: 'Auth: 10 req/15 min · Login: 20 req/15 min · Attendance: 60 req/min · Admin API: 200 req/min.' },
                    { title: 'Audit log filtrado', desc: 'Histórico de todas as ações sensíveis com filtro por ação, usuário e data. Limpeza manual.' },
                    { title: 'Validação Zod', desc: 'Todos os inputs de API validados com schemas tipados antes de tocar o banco.' },
                    { title: 'Demo mode', desc: 'Controle pelo superadmin para liberar ou bloquear o auto-cadastro de novos usuários Google.' },
                  ].map(({ title, desc }) => (
                    <div key={title} className="space-y-0.5 pb-2 border-b border-border/40 last:border-0 last:pb-0">
                      <p className="text-xs font-semibold text-foreground">{title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Banco de dados */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Building className="w-4 h-4 text-indigo-500" /> Modelos do banco de dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { model: 'funcionarios', desc: 'Colaboradores vinculados a empresa e setor' },
                    { model: 'presenca', desc: 'Registros de frequência com data e hora' },
                    { model: 'setores', desc: 'Setores únicos por empresa' },
                    { model: 'empresas', desc: 'Empresas do sistema (multi-tenant)' },
                    { model: 'usuarios', desc: 'Usuários com roles e permissões' },
                    { model: 'usuario_empresas', desc: 'Vínculo many-to-many usuário ↔ empresa' },
                    { model: 'audit_log', desc: 'Log imutável de ações sensíveis' },
                    { model: 'configuracoes', desc: 'Configurações globais (ex: demo mode)' },
                  ].map(({ model, desc }) => (
                    <div key={model} className="p-2.5 rounded-lg bg-muted/30 space-y-0.5">
                      <p className="text-[10px] font-black text-primary font-mono">{model}</p>
                      <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Admin */}
              <Card className="border-l-4 border-l-primary/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Painel administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {[
                      'Dashboard: KPIs, horário de pico, tendência 7 dias, barras 30 dias, heatmap e mapa de calor',
                      'CRUD completo com Dialog shadcn: Empresas, Setores (bulk), Funcionários e Usuários',
                      'Relatórios paginados com filtros por data, empresa e setor + exportação CSV',
                      'Auditoria com filtros por ação, usuário e período + limpar tudo',
                      'Gerenciamento de acessos: role, can_register, can_edit, empresas vinculadas',
                      'Encerramento remoto de sessão · exclusão de usuário · demo mode',
                      'Renomeação inline de usuário · validação visual nos modais · loading em botões',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 shrink-0">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Educador */}
              <Card className="border-l-4 border-l-emerald-500/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" /> Portal do educador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {[
                      'Fluxo guiado em 3 etapas: Empresa → Setor → Lista de chamada',
                      'Detecção automática de duplicidade de presença no mesmo dia',
                      'Remoção individual de presenças já lançadas com confirmação',
                      'Cadastro de funcionários em lote (quando permitido pelo admin)',
                      'Edição inline do nome de funcionários (quando permitido)',
                      'Interface responsiva otimizada para tablets e celulares',
                      'Dark mode + ajuste de tamanho de fonte para acessibilidade',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-2 pb-1">
              <p className="text-[10px] text-muted-foreground/40 tracking-wider">Presença.Pro © 2026 · github.com/dnlortega</p>
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
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => loadAuditLogs(1, auditFilter)} size="icon" variant="outline" className="h-9 w-9 rounded-xl shrink-0">
                      <Clock className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <ConfirmAction
                        onConfirm={async () => {
                          const res = await fetchNoCache('/api/admin/audit-log', { method: 'DELETE' });
                          if (res.ok) {
                            setAuditLogs([]);
                            setAuditTotal(0);
                            setAuditPage(1);
                            toast.success('Registros de auditoria apagados');
                          } else {
                            toast.error('Erro ao limpar auditoria');
                          }
                        }}
                        title="Limpar auditoria?"
                        description="Todos os registros de auditoria serão excluídos permanentemente."
                        confirmText="Limpar tudo"
                      >
                        <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl shrink-0 border-destructive/30 text-destructive hover:bg-destructive/5">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ConfirmAction>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Limpar registros</TooltipContent>
                </Tooltip>
              </div>
            </header>

            {/* Filtros de auditoria */}
            <Card className="border-none shadow-sm bg-card/40">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                    <Label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">Ação</Label>
                    <Select value={auditFilter.action} onValueChange={v => setAuditFilter(f => ({ ...f, action: v === '_all' ? '' : v }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todas</SelectItem>
                        <SelectItem value="CREATE">Criou</SelectItem>
                        <SelectItem value="UPDATE">Editou</SelectItem>
                        <SelectItem value="DELETE">Excluiu</SelectItem>
                        <SelectItem value="UPDATE_ROLE">Alterou cargo</SelectItem>
                        <SelectItem value="UPDATE_PERMISSION">Alterou permissão</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                        <SelectItem value="FORCE_LOGOUT">Sessão encerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                    <Label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">Usuário</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Filtrar usuário..."
                      value={auditFilter.user}
                      onChange={e => setAuditFilter(f => ({ ...f, user: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                    <Label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">De</Label>
                    <Input type="date" className="h-8 text-xs" value={auditFilter.startDate} onChange={e => setAuditFilter(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                    <Label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">Até</Label>
                    <Input type="date" className="h-8 text-xs" value={auditFilter.endDate} onChange={e => setAuditFilter(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" className="h-8 w-8 rounded-lg" onClick={() => loadAuditLogs(1, auditFilter)}>
                          <Filter className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Filtrar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => {
                          const empty = { action: '', user: '', startDate: '', endDate: '' };
                          setAuditFilter(empty);
                          loadAuditLogs(1, empty);
                        }}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Limpar filtros</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {auditTotal > 0 && <p className="text-[10px] text-muted-foreground mt-3 font-bold">{auditTotal} registros encontrados</p>}
              </CardContent>
            </Card>

            {(() => {
              const actionLabel: Record<string, string> = {
                CREATE: 'Criou', UPDATE: 'Editou', DELETE: 'Excluiu',
                UPDATE_ROLE: 'Alterou cargo', UPDATE_PERMISSION: 'Alterou permissão',
                LOGIN: 'Login', LOGOUT: 'Logout', FORCE_LOGOUT: 'Sessão encerrada',
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
                LOGIN: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
                LOGOUT: 'text-slate-600 bg-slate-100 dark:bg-slate-800/30',
                FORCE_LOGOUT: 'text-red-700 bg-red-50 dark:bg-red-950/30',
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
                    <ChevronRight className="w-3 h-3 rotate-180" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg font-bold text-[10px]"
                    disabled={auditPage >= Math.ceil(auditTotal / AUDIT_PER_PAGE) || isLoadingAudit}
                    onClick={() => loadAuditLogs(auditPage + 1)}>
                    <ChevronRight className="w-3 h-3" />
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
                  <User className="w-4 h-4 text-primary" /> Sessão Atual
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
                  <Settings className="w-4 h-4 text-primary" /> Aparência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs text-muted-foreground">Tema</span>
                  <div className="flex items-center gap-1">
                    {[
                      { value: 'light', label: 'Claro', icon: Sun },
                      { value: 'dark', label: 'Escuro', icon: Moon },
                      { value: 'system', label: 'Sistema', icon: Monitor },
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

            {isSuperAdmin && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Demo Mode
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Quando ativo, novos usuários que entram pelo Google podem escolher o papel (admin ou educador) sem precisar de aprovação.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">Status</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {demoMode === null ? 'Carregando...' : demoMode ? 'Ativo — usuários podem escolher papel' : 'Inativo — aprovação manual necessária'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={demoMode ? 'destructive' : 'default'}
                      disabled={togglingDemo || demoMode === null}
                      onClick={toggleDemoMode}
                      className="font-black uppercase tracking-widest text-[10px] rounded-xl min-w-24"
                    >
                      {togglingDemo ? '...' : demoMode ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-destructive/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2 text-destructive">
                  <LogOut className="w-4 h-4" /> Encerrar Sessão
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
                  <LogOut className="w-4 h-4 mr-2" /> Sair do Sistema
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card className="border-none bg-card/40 flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-black italic opacity-50">Sessão em construção</h2>
          </Card>
        );
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
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
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-14 bg-card border border-border/50 shadow-sm w-6 h-6 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-50"
          title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
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
              <DropdownMenuItem
                onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                className="cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  {theme === 'dark' ? <Moon className="w-4 h-4 mr-2" /> : theme === 'light' ? <Sun className="w-4 h-4 mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                    <Sun className="w-4 h-4 mr-2" /> Claro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                    <Moon className="w-4 h-4 mr-2" /> Escuro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                    <Monitor className="w-4 h-4 mr-2" /> Sistema
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
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
                <ChevronDown className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${navGroupOpen.principal ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(navGroupOpen.principal || isSidebarCollapsed) && (
              <div className="space-y-0.5">
                {[
                  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'companies', label: 'Empresas', icon: Building },
                  { id: 'employees', label: 'Funcionários', icon: Users },
                  { id: 'users', label: 'Acessos', icon: UserCheck },
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
                <ChevronDown className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${navGroupOpen.sistema ? '' : '-rotate-90'}`} />
              </button>
            ) : (
              <div className="border-t border-border/30 mb-1.5" />
            )}
            {(navGroupOpen.sistema || isSidebarCollapsed) && (
              <div className="space-y-0.5">
                {[
                  { id: 'reports', label: 'Relatórios', icon: FileText },
                  { id: 'audit', label: 'Auditoria', icon: ClipboardList },
                  { id: 'settings', label: 'Configurações', icon: Settings },
                  { id: 'about', label: 'Sobre', icon: Info },
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
                  <Menu className="w-5 h-5" />
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

      {/* Employee Modal */}
      <Dialog open={isEmpModalOpen} onOpenChange={open => { if (!open) { setIsEmpModalOpen(false); setEmpFormErrors({}); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {editingEmp ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEmployee} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Nome Completo</Label>
              <Input
                value={empForm.nome}
                onChange={e => { setEmpForm({ ...empForm, nome: e.target.value }); if (empFormErrors.nome) setEmpFormErrors(p => ({ ...p, nome: '' })); }}
                placeholder="Nome do colaborador"
                className={empFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {empFormErrors.nome && <p className="text-[11px] text-destructive">{empFormErrors.nome}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Empresa</Label>
              <Select value={empForm.empresa_id} onValueChange={v => { setEmpForm({ ...empForm, empresa_id: v, setor_id: '' }); if (empFormErrors.empresa_id) setEmpFormErrors(p => ({ ...p, empresa_id: '' })); }}>
                <SelectTrigger className={empFormErrors.empresa_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {empFormErrors.empresa_id && <p className="text-[11px] text-destructive">{empFormErrors.empresa_id}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Setor</Label>
              <Select value={empForm.setor_id} onValueChange={v => { setEmpForm({ ...empForm, setor_id: v }); if (empFormErrors.setor_id) setEmpFormErrors(p => ({ ...p, setor_id: '' })); }} disabled={!empForm.empresa_id}>
                <SelectTrigger className={empFormErrors.setor_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder={!empForm.empresa_id ? 'Selecione a empresa primeiro' : 'Selecione o setor'} />
                </SelectTrigger>
                <SelectContent>
                  {sectors.filter(s => s.empresa_id === Number(empForm.empresa_id)).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {empFormErrors.setor_id && <p className="text-[11px] text-destructive">{empFormErrors.setor_id}</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button variant="ghost" type="button" onClick={() => { setIsEmpModalOpen(false); setEmpFormErrors({}); }}>Cancelar</Button>
              <Button type="submit" disabled={isSavingEmp} className="shadow-lg shadow-primary/20">
                {isSavingEmp ? <div className="animate-spin w-4 h-4 border-2 border-background/30 border-t-background rounded-full" /> : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sector Modal */}
      <Dialog open={isSectorModalOpen} onOpenChange={open => { if (!open) { setIsSectorModalOpen(false); setSectorFormErrors({}); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {editingSector ? 'Editar Setor' : 'Novo Setor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSector} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                {editingSector ? 'Nome do Setor' : 'Nomes dos Setores (um por linha)'}
              </Label>
              {editingSector ? (
                <Input
                  value={sectorForm.nome}
                  onChange={e => { setSectorForm({ ...sectorForm, nome: e.target.value }); if (sectorFormErrors.nome) setSectorFormErrors(p => ({ ...p, nome: '' })); }}
                  placeholder="Ex: Recursos Humanos"
                  className={sectorFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              ) : (
                <Textarea
                  rows={5}
                  value={sectorForm.nome}
                  onChange={e => { setSectorForm({ ...sectorForm, nome: e.target.value }); if (sectorFormErrors.nome) setSectorFormErrors(p => ({ ...p, nome: '' })); }}
                  placeholder={"Ex:\nRecursos Humanos\nTI\nFinanceiro\nOperacional"}
                  className={`resize-none ${sectorFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
              )}
              {sectorFormErrors.nome && <p className="text-[11px] text-destructive">{sectorFormErrors.nome}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Vincular à Empresa</Label>
              <Select value={sectorForm.empresa_id} onValueChange={v => { setSectorForm({ ...sectorForm, empresa_id: v }); if (sectorFormErrors.empresa_id) setSectorFormErrors(p => ({ ...p, empresa_id: '' })); }}>
                <SelectTrigger className={sectorFormErrors.empresa_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {sectorFormErrors.empresa_id && <p className="text-[11px] text-destructive">{sectorFormErrors.empresa_id}</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button variant="ghost" type="button" onClick={() => { setIsSectorModalOpen(false); setSectorFormErrors({}); }}>Cancelar</Button>
              <Button type="submit" disabled={isSavingSector} className="shadow-lg shadow-primary/20">
                {isSavingSector ? <div className="animate-spin w-4 h-4 border-2 border-background/30 border-t-background rounded-full" /> : 'Salvar Setor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Company Modal */}
      <Dialog open={isCompModalOpen} onOpenChange={open => { if (!open) { setIsCompModalOpen(false); setCompFormErrors({}); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              {editingComp ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCompany} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Nome da Empresa</Label>
              <Input
                value={compForm.nome}
                onChange={e => { setCompForm({ nome: e.target.value }); if (compFormErrors.nome) setCompFormErrors(p => ({ ...p, nome: '' })); }}
                placeholder="Ex: Minha Empresa LTDA"
                className={compFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {compFormErrors.nome && <p className="text-[11px] text-destructive">{compFormErrors.nome}</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button variant="ghost" type="button" onClick={() => { setIsCompModalOpen(false); setCompFormErrors({}); }}>Cancelar</Button>
              <Button type="submit" disabled={isSavingComp} className="shadow-lg shadow-primary/20">
                {isSavingComp ? <div className="animate-spin w-4 h-4 border-2 border-background/30 border-t-background rounded-full" /> : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Companies Modal */}
      <Dialog open={isUserCompModalOpen} onOpenChange={open => { if (!open) { setIsUserCompModalOpen(false); setCompanySearch(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Controle de Acessos
            </DialogTitle>
            <DialogDescription>Permissões de empresa para <b>{selectedUser?.username}</b>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs"
                placeholder="Buscar empresa..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {companies.filter(c => c.nome.toLowerCase().includes(companySearch.toLowerCase())).map(comp => (
                <label key={comp.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all group active:scale-95">
                  <Checkbox
                    checked={userCompForm.includes(comp.nome)}
                    onCheckedChange={() => toggleUserCompany(comp.nome)}
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
          </div>
          <DialogFooter className="pt-2 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => { setIsUserCompModalOpen(false); setCompanySearch(''); }}>Cancelar</Button>
            <Button onClick={updateUserCompanies} disabled={isSavingUserComp} className="shadow-lg shadow-primary/20">
              {isSavingUserComp ? <div className="animate-spin w-4 h-4 border-2 border-background/30 border-t-background rounded-full" /> : 'Salvar Acessos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Management Modal */}
      <Dialog open={isAccessModalOpen} onOpenChange={open => { if (!open) setIsAccessModalOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Permissões de Educador
            </DialogTitle>
            <DialogDescription>Configure o que <b>{selectedUser?.username}</b> pode fazer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAccess} className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Cadastrar Funcionários</Label>
                  <p className="text-xs text-muted-foreground">Adicionar novos nomes aos setores</p>
                </div>
                <Checkbox
                  checked={accessForm.can_register}
                  onCheckedChange={v => setAccessForm({ ...accessForm, can_register: !!v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Editar Nomes</Label>
                  <p className="text-xs text-muted-foreground">Corrigir nomes de funcionários</p>
                </div>
                <Checkbox
                  checked={accessForm.can_edit}
                  onCheckedChange={v => setAccessForm({ ...accessForm, can_edit: !!v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAccessModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingAccess} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                {isSavingAccess ? <div className="animate-spin w-4 h-4 border-2 border-background/30 border-t-background rounded-full" /> : 'Salvar Acessos'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

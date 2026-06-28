"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { fetchNoCache } from '../../lib/fetch-helpers';
import type { Session } from 'next-auth';
import type {
  Tab, DashboardData, AuditEntry, Employee, Sector, User,
  Company, ReportRecord, EmpHistory,
} from './types';

const REPORTS_PER_PAGE = 20;
const AUDIT_PER_PAGE = 20;

type AdminContextType = {
  session: Session | null;
  theme: string | undefined;
  setTheme: (t: string) => void;
  isSuperAdmin: boolean;

  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navGroupOpen: { principal: boolean; sistema: boolean };
  setNavGroupOpen: React.Dispatch<React.SetStateAction<{ principal: boolean; sistema: boolean }>>;

  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;

  // Dashboard
  dashboardData: DashboardData | null;
  isLoadingDashboard: boolean;
  dashboardError: string | null;
  loadDashboard: () => Promise<void>;

  // Companies
  companies: Company[];
  filteredCompanies: Company[];
  loadCompanies: () => Promise<void>;
  isCompModalOpen: boolean;
  setIsCompModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingComp: Company | null;
  compForm: { nome: string };
  setCompForm: React.Dispatch<React.SetStateAction<{ nome: string }>>;
  compFormErrors: Record<string, string>;
  isSavingComp: boolean;
  openCompModal: (comp?: Company) => void;
  handleSaveCompany: (e: React.FormEvent) => Promise<void>;
  handleDeleteCompany: (id: number) => Promise<void>;
  expandedCompanies: Record<string, boolean>;
  toggleCompany: (name: string) => void;

  // Sectors
  sectors: Sector[];
  filteredSectors: Sector[];
  isLoadingSectors: boolean;
  loadSectors: () => Promise<void>;
  isSectorModalOpen: boolean;
  setIsSectorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingSector: Sector | null;
  setEditingSector: React.Dispatch<React.SetStateAction<Sector | null>>;
  sectorForm: { nome: string; empresa_id: string };
  setSectorForm: React.Dispatch<React.SetStateAction<{ nome: string; empresa_id: string }>>;
  sectorFormErrors: Record<string, string>;
  isSavingSector: boolean;
  openSectorModal: (sec?: Sector) => void;
  handleSaveSector: (e: React.FormEvent) => Promise<void>;
  handleDeleteSector: (id: number) => Promise<void>;

  // Employees
  employees: Employee[];
  filteredEmployees: Employee[];
  loadEmployees: () => Promise<void>;
  isEmpModalOpen: boolean;
  setIsEmpModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingEmp: Employee | null;
  empForm: { nome: string; empresa_id: string; setor_id: string };
  setEmpForm: React.Dispatch<React.SetStateAction<{ nome: string; empresa_id: string; setor_id: string }>>;
  empFormErrors: Record<string, string>;
  isSavingEmp: boolean;
  openEmpModal: (emp?: Employee) => void;
  handleSaveEmployee: (e: React.FormEvent) => Promise<void>;
  handleDeleteEmployee: (id: number) => Promise<void>;
  isSeedingEmployees: boolean;
  seedEmployees: () => Promise<void>;
  empHistoryOpen: boolean;
  setEmpHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  empHistory: EmpHistory | null;
  setEmpHistory: React.Dispatch<React.SetStateAction<EmpHistory | null>>;
  isLoadingHistory: boolean;
  historyFilter: { startDate: string; endDate: string };
  setHistoryFilter: React.Dispatch<React.SetStateAction<{ startDate: string; endDate: string }>>;
  loadEmpHistory: (empId: number, filter?: { startDate: string; endDate: string }) => Promise<void>;
  openEmpHistory: (emp: Employee) => void;

  // Users
  users: User[];
  currentUser: User | undefined;
  pendingUsersCount: number;
  loadingUsers: boolean;
  loadUsers: () => Promise<void>;
  isAccessModalOpen: boolean;
  setIsAccessModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUserCompModalOpen: boolean;
  setIsUserCompModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedUser: User | null;
  accessForm: { can_register: boolean; can_edit: boolean };
  setAccessForm: React.Dispatch<React.SetStateAction<{ can_register: boolean; can_edit: boolean }>>;
  userCompForm: string[];
  companySearch: string;
  setCompanySearch: React.Dispatch<React.SetStateAction<string>>;
  isSavingAccess: boolean;
  isSavingUserComp: boolean;
  renamingUser: { id: number; value: string } | null;
  setRenamingUser: React.Dispatch<React.SetStateAction<{ id: number; value: string } | null>>;
  forceUserLogout: (userId: number, username: string) => Promise<void>;
  deleteUser: (userId: number, username: string) => Promise<void>;
  renameUser: () => Promise<void>;
  updateUserRole: (userId: number, newRole: string) => Promise<void>;
  updateUserCanRegister: (userId: number, value: boolean) => Promise<void>;
  updateUserCanEdit: (userId: number, value: boolean) => Promise<void>;
  openAccessModal: (user: User) => void;
  openUserCompModal: (user: User) => void;
  handleSaveAccess: (e: React.FormEvent) => Promise<void>;
  updateUserCompanies: (e: React.FormEvent) => Promise<void>;
  toggleUserCompany: (name: string) => void;

  // Reports
  reports: ReportRecord[];
  reportsTotal: number;
  isLoadingReports: boolean;
  reportPage: number;
  reportFilter: { startDate: string; endDate: string; empresa: string; setor: string };
  setReportFilter: React.Dispatch<React.SetStateAction<{ startDate: string; endDate: string; empresa: string; setor: string }>>;
  loadReports: (page?: number, filter?: { startDate: string; endDate: string; empresa: string; setor: string }) => Promise<void>;
  REPORTS_PER_PAGE: number;

  // Audit
  auditLogs: AuditEntry[];
  auditTotal: number;
  auditPage: number;
  isLoadingAudit: boolean;
  auditFilter: { action: string; user: string; startDate: string; endDate: string };
  setAuditFilter: React.Dispatch<React.SetStateAction<{ action: string; user: string; startDate: string; endDate: string }>>;
  loadAuditLogs: (page?: number, filter?: { action: string; user: string; startDate: string; endDate: string }) => Promise<void>;
  AUDIT_PER_PAGE: number;

  // Settings
  demoMode: boolean | null;
  togglingDemo: boolean;
  toggleDemoMode: () => Promise<void>;

  // Retroactive attendance
  isRetroModalOpen: boolean;
  setIsRetroModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  retroDate: string;
  setRetroDate: React.Dispatch<React.SetStateAction<string>>;
  retroSelectedIds: number[];
  setRetroSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  submitRetroAttendance: () => Promise<void>;
  isSubmittingRetro: boolean;

  // Password change
  isPasswordModalOpen: boolean;
  passwordTargetUser: User | null;
  openPasswordModal: (user: User) => void;
  closePasswordModal: () => void;
  changeUserPassword: (userId: number, newPassword: string) => Promise<void>;
  isChangingPassword: boolean;
};

const AdminContext = createContext<AdminContextType>({} as AdminContextType);

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
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
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [renamingUser, setRenamingUser] = useState<{ id: number; value: string } | null>(null);
  const [isSavingEmp, setIsSavingEmp] = useState(false);
  const [isSavingComp, setIsSavingComp] = useState(false);
  const [isSavingSector, setIsSavingSector] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [isSavingUserComp, setIsSavingUserComp] = useState(false);
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [retroDate, setRetroDate] = useState('');
  const [retroSelectedIds, setRetroSelectedIds] = useState<number[]>([]);
  const [isSubmittingRetro, setIsSubmittingRetro] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [empFormErrors, setEmpFormErrors] = useState<Record<string, string>>({});
  const [compFormErrors, setCompFormErrors] = useState<Record<string, string>>({});
  const [sectorFormErrors, setSectorFormErrors] = useState<Record<string, string>>({});
  const [auditFilter, setAuditFilter] = useState({ action: '', user: '', startDate: '', endDate: '' });
  const [companySearch, setCompanySearch] = useState('');
  const [empHistoryOpen, setEmpHistoryOpen] = useState(false);
  const [empHistory, setEmpHistory] = useState<EmpHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ startDate: '', endDate: '' });

  const isSuperAdmin = session?.user?.email === 'dnlortega@gmail.com';

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

  useEffect(() => {
    setSearchTerm('');
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'employees') { loadEmployees(); loadCompanies(); loadSectors(); }
    if (activeTab === 'users') { loadUsers(); loadCompanies(); }
    if (activeTab === 'companies') { loadCompanies(); loadSectors(); }
    if (activeTab === 'sectors') { loadSectors(); loadCompanies(); }
    if (activeTab === 'reports') loadReports(1);
    if (activeTab === 'audit') loadAuditLogs(1);
    if (activeTab === 'settings') { loadUsers(); if (isSuperAdmin) loadDemoMode(); }
  }, [activeTab]);

  useEffect(() => {
    if (session?.user?.forceLogout) signOut({ callbackUrl: '/login' });
  }, [session]);

  const loadDashboard = useCallback(async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    try {
      const res = await fetchNoCache('/api/admin/dashboard');
      const data = await res.json();
      if (res.ok) setDashboardData(data);
      else setDashboardError(data.error || 'Erro ao carregar dashboard');
    } catch { setDashboardError('Erro ao conectar com o servidor'); }
    finally { setIsLoadingDashboard(false); }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetchNoCache('/api/admin/employees');
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetchNoCache('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) { console.error(e); }
    setLoadingUsers(false);
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const res = await fetchNoCache('/api/admin/companies');
      const data = await res.json();
      if (Array.isArray(data)) setCompanies(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadReports = useCallback(async (page = 1, filter = reportFilter) => {
    setIsLoadingReports(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(REPORTS_PER_PAGE) });
      if (filter.startDate) params.set('startDate', filter.startDate);
      if (filter.endDate) params.set('endDate', filter.endDate);
      if (filter.empresa) params.set('empresa', filter.empresa);
      if (filter.setor) params.set('setor', filter.setor);
      const res = await fetchNoCache(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (res.ok) { setReports(data.data); setReportsTotal(data.total); setReportPage(page); }
    } catch (e) { console.error(e); }
    setIsLoadingReports(false);
  }, [reportFilter]);

  const loadAuditLogs = useCallback(async (page = 1, filter = auditFilter) => {
    setIsLoadingAudit(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(AUDIT_PER_PAGE) });
      if (filter.action) params.set('action', filter.action);
      if (filter.user) params.set('user', filter.user);
      if (filter.startDate) params.set('startDate', filter.startDate);
      if (filter.endDate) params.set('endDate', filter.endDate);
      const res = await fetchNoCache(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      if (res.ok) { setAuditLogs(data.data); setAuditTotal(data.total); setAuditPage(page); }
    } catch (e) { console.error(e); }
    setIsLoadingAudit(false);
  }, [auditFilter]);

  const loadSectors = useCallback(async () => {
    setIsLoadingSectors(true);
    try {
      const res = await fetchNoCache('/api/admin/sectors');
      const data = await res.json();
      if (Array.isArray(data)) setSectors(data);
    } catch (e) { console.error(e); }
    setIsLoadingSectors(false);
  }, []);

  const loadDemoMode = useCallback(async () => {
    const res = await fetchNoCache('/api/admin/demo-mode');
    if (res.ok) { const d = await res.json(); setDemoMode(d.enabled); }
  }, []);

  const toggleDemoMode = useCallback(async () => {
    setTogglingDemo(true);
    const res = await fetchNoCache('/api/admin/demo-mode', { method: 'POST' });
    if (res.ok) {
      const d = await res.json();
      setDemoMode(d.enabled);
      toast.success(d.enabled ? 'Demo mode ativado' : 'Demo mode desativado');
    }
    setTogglingDemo(false);
  }, []);

  const submitRetroAttendance = useCallback(async () => {
    if (!retroDate || retroSelectedIds.length === 0) return;
    setIsSubmittingRetro(true);
    try {
      const res = await fetchNoCache('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: retroSelectedIds, retroDate }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.count} presen${data.count === 1 ? 'ça' : 'ças'} retroativas registradas`);
        setIsRetroModalOpen(false);
        setRetroSelectedIds([]);
        setRetroDate('');
      } else {
        toast.error(data.error || 'Erro ao registrar presenças retroativas');
      }
    } catch { toast.error('Erro de conexão'); }
    setIsSubmittingRetro(false);
  }, [retroDate, retroSelectedIds]);

  const loadEmpHistory = useCallback(async (empId: number, filter = historyFilter) => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (filter.startDate) params.set('startDate', filter.startDate);
      if (filter.endDate) params.set('endDate', filter.endDate);
      const res = await fetchNoCache(`/api/admin/employees/${empId}/history?${params}`);
      const data = await res.json();
      if (res.ok) setEmpHistory(data);
    } catch (e) { console.error(e); }
    setIsLoadingHistory(false);
  }, [historyFilter]);

  const openEmpHistory = useCallback((emp: Employee) => {
    const empty = { startDate: '', endDate: '' };
    setHistoryFilter(empty);
    setEmpHistory(null);
    setEmpHistoryOpen(true);
    loadEmpHistory(emp.id, empty);
  }, [loadEmpHistory]);

  const seedEmployees = useCallback(async () => {
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
    } catch { alert('❌ Erro ao conectar com o servidor'); }
    finally { setIsSeedingEmployees(false); }
  }, [loadEmployees]);

  const forceUserLogout = useCallback(async (userId: number, username: string) => {
    try {
      const res = await fetchNoCache('/api/admin/users/force-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) toast.success(`Sessão de ${username} encerrada`);
      else {
        const data = await res.json() as { error?: string };
        toast.error(data.error || 'Erro ao encerrar sessão');
      }
    } catch (e) { console.error(e); }
  }, []);

  const deleteUser = useCallback(async (userId: number, username: string) => {
    const prev = users;
    setUsers(u => u.filter(x => x.id !== userId));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) toast.success(`Usuário ${username} excluído`);
      else { setUsers(prev); const d = await res.json() as { error?: string }; toast.error(d.error || 'Erro ao excluir usuário'); }
    } catch (e) { setUsers(prev); console.error(e); }
  }, [users]);

  const renameUser = useCallback(async () => {
    if (!renamingUser) return;
    const { id, value } = renamingUser;
    if (!value.trim() || value.trim().length < 2) { toast.error('Nome muito curto'); return; }
    const prev = users;
    setUsers(u => u.map(x => x.id === id ? { ...x, username: value.trim() } : x));
    setRenamingUser(null);
    try {
      const res = await fetchNoCache(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value.trim() }),
      });
      if (res.ok) toast.success('Nome alterado');
      else { setUsers(prev); const d = await res.json() as { error?: string }; toast.error(d.error || 'Erro ao renomear'); }
    } catch { setUsers(prev); toast.error('Erro de conexão'); }
  }, [renamingUser, users]);

  const updateUserRole = useCallback(async (userId: number, newRole: string) => {
    const prev = users;
    setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) { setUsers(prev); toast.error('Erro ao atualizar cargo'); }
    } catch (e) { setUsers(prev); console.error(e); }
  }, [users]);

  const updateUserCanRegister = useCallback(async (userId: number, canRegister: boolean) => {
    const prev = users;
    setUsers(u => u.map(x => x.id === userId ? { ...x, can_register: canRegister } : x));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_register: canRegister }),
      });
      if (!res.ok) { setUsers(prev); toast.error('Erro ao atualizar permissão'); }
    } catch (e) { setUsers(prev); console.error(e); }
  }, [users]);

  const updateUserCanEdit = useCallback(async (userId: number, canEdit: boolean) => {
    const prev = users;
    setUsers(u => u.map(x => x.id === userId ? { ...x, can_edit: canEdit } : x));
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_edit: canEdit }),
      });
      if (!res.ok) { setUsers(prev); toast.error('Erro ao atualizar permissão'); }
    } catch (e) { setUsers(prev); console.error(e); }
  }, [users]);

  const updateUserCompanies = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const prev = users;
    setIsSavingUserComp(true);
    setUsers(u => u.map(x => x.id === selectedUser.id ? { ...x, empresas: userCompForm } : x));
    setIsUserCompModalOpen(false);
    try {
      const res = await fetchNoCache(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresas: userCompForm }),
      });
      if (res.ok) toast.success('Acessos atualizados');
      else { setUsers(prev); toast.error('Erro ao atualizar empresas'); }
    } catch (e) { setUsers(prev); console.error(e); }
    setIsSavingUserComp(false);
  }, [selectedUser, userCompForm, users]);

  const openUserCompModal = useCallback((user: User) => {
    setSelectedUser(user);
    setUserCompForm(user.empresas || []);
    loadCompanies();
    setIsUserCompModalOpen(true);
  }, [loadCompanies]);

  const openAccessModal = useCallback((user: User) => {
    setSelectedUser(user);
    setAccessForm({ can_register: user.can_register || false, can_edit: user.can_edit || false });
    setIsAccessModalOpen(true);
  }, []);

  const handleSaveAccess = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const prev = users;
    setIsSavingAccess(true);
    setUsers(u => u.map(x => x.id === selectedUser.id
      ? { ...x, can_register: accessForm.can_register, can_edit: accessForm.can_edit } : x));
    setIsAccessModalOpen(false);
    try {
      await Promise.all([
        fetchNoCache(`/api/admin/users/${selectedUser.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ can_register: accessForm.can_register }),
        }),
        fetchNoCache(`/api/admin/users/${selectedUser.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ can_edit: accessForm.can_edit }),
        }),
      ]);
      toast.success('Permissões salvas');
    } catch (e) { setUsers(prev); console.error(e); }
    setIsSavingAccess(false);
  }, [selectedUser, accessForm, users]);

  const toggleCompany = useCallback((companyName: string) => {
    setExpandedCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
  }, []);

  const toggleUserCompany = useCallback((companyName: string) => {
    setUserCompForm(prev =>
      prev.includes(companyName) ? prev.filter(c => c !== companyName) : [...prev, companyName]
    );
  }, []);

  const handleSaveEmployee = useCallback(async (e: React.FormEvent) => {
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
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: empForm.nome, empresa_id: Number(empForm.empresa_id), setor_id: Number(empForm.setor_id) }),
      });
      if (res.ok) {
        setIsEmpModalOpen(false); setEditingEmp(null);
        setEmpForm({ nome: '', empresa_id: '', setor_id: '' }); loadEmployees();
        toast.success(editingEmp ? 'Funcionário atualizado' : 'Funcionário cadastrado');
      } else { const d = await res.json(); toast.error(d.error || 'Erro ao salvar'); }
    } catch { toast.error('Erro de conexão'); }
    setIsSavingEmp(false);
  }, [empForm, editingEmp, loadEmployees]);

  const handleDeleteEmployee = useCallback(async (id: number) => {
    try {
      const res = await fetchNoCache(`/api/admin/employees/${id}`, { method: 'DELETE' });
      if (res.ok) loadEmployees();
      else alert('Erro ao excluir');
    } catch (e) { console.error(e); }
  }, [loadEmployees]);

  const handleSaveCompany = useCallback(async (e: React.FormEvent) => {
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
        setIsCompModalOpen(false); setEditingComp(null); setCompForm({ nome: '' }); loadCompanies();
        toast.success(editingComp ? 'Empresa atualizada' : 'Empresa cadastrada');
      } else { const d = await res.json(); toast.error(d.error || 'Erro ao salvar'); }
    } catch { toast.error('Erro de conexão'); }
    setIsSavingComp(false);
  }, [compForm, editingComp, loadCompanies]);

  const handleDeleteCompany = useCallback(async (id: number) => {
    try {
      const res = await fetchNoCache(`/api/admin/companies/${id}`, { method: 'DELETE' });
      if (res.ok) loadCompanies();
      else alert('Erro ao excluir');
    } catch (e) { console.error(e); }
  }, [loadCompanies]);

  const openCompModal = useCallback((comp?: Company) => {
    setCompFormErrors({});
    if (comp) { setEditingComp(comp); setCompForm({ nome: comp.nome }); }
    else { setEditingComp(null); setCompForm({ nome: '' }); }
    setIsCompModalOpen(true);
  }, []);

  const openEmpModal = useCallback((emp?: Employee) => {
    setEmpFormErrors({});
    if (emp) { setEditingEmp(emp); setEmpForm({ nome: emp.nome, empresa_id: String(emp.empresa_id), setor_id: String(emp.setor_id) }); }
    else { setEditingEmp(null); setEmpForm({ nome: '', empresa_id: '', setor_id: '' }); }
    setIsEmpModalOpen(true);
  }, []);

  const openSectorModal = useCallback((sec?: Sector) => {
    setSectorFormErrors({});
    if (sec) { setEditingSector(sec); setSectorForm({ nome: sec.nome, empresa_id: String(sec.empresa_id) }); }
    else { setEditingSector(null); setSectorForm({ nome: '', empresa_id: '' }); }
    setIsSectorModalOpen(true);
  }, []);

  const handleSaveSector = useCallback(async (e: React.FormEvent) => {
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
          s.empresa_id === Number(sectorForm.empresa_id) && s.id !== editingSector.id
        );
        if (isDuplicate) { toast.error('Já existe um setor com este nome nesta empresa!'); setIsSavingSector(false); return; }
        const res = await fetchNoCache(`/api/admin/sectors/${editingSector.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: sectorForm.nome, empresa_id: Number(sectorForm.empresa_id) }),
        });
        if (res.ok) {
          setIsSectorModalOpen(false); setEditingSector(null); setSectorForm({ nome: '', empresa_id: '' }); loadSectors();
          toast.success('Setor atualizado');
        } else { const d = await res.json(); toast.error(d.error || 'Erro ao editar setor'); }
      } else {
        const nomes = sectorForm.nome.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        if (nomes.length === 0) { toast.error('Digite pelo menos um nome de setor.'); setIsSavingSector(false); return; }
        const res = await fetchNoCache('/api/admin/sectors', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nomes, empresa_id: Number(sectorForm.empresa_id) }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsSectorModalOpen(false); setEditingSector(null); setSectorForm({ nome: '', empresa_id: '' }); loadSectors();
          toast.success(data.message || 'Setores criados');
        } else { toast.error(data.error || 'Erro ao criar setores'); }
      }
    } catch { toast.error('Erro ao salvar setor. Tente novamente.'); }
    setIsSavingSector(false);
  }, [sectorForm, editingSector, sectors, loadSectors]);

  const openPasswordModal = useCallback((user: User) => {
    setPasswordTargetUser(user);
    setIsPasswordModalOpen(true);
  }, []);

  const closePasswordModal = useCallback(() => {
    setIsPasswordModalOpen(false);
    setPasswordTargetUser(null);
  }, []);

  const changeUserPassword = useCallback(async (userId: number, newPassword: string) => {
    setIsChangingPassword(true);
    try {
      const res = await fetchNoCache(`/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Senha alterada com sucesso');
        setIsPasswordModalOpen(false);
        setPasswordTargetUser(null);
      } else {
        toast.error(data.error || 'Erro ao alterar senha');
      }
    } catch { toast.error('Erro de conexão'); }
    setIsChangingPassword(false);
  }, []);

  const handleDeleteSector = useCallback(async (id: number) => {
    try {
      const res = await fetchNoCache(`/api/admin/sectors/${id}`, { method: 'DELETE' });
      if (res.ok) loadSectors();
      else alert('Erro ao excluir');
    } catch (e) { console.error(e); }
  }, [loadSectors]);

  const value: AdminContextType = {
    session, theme, setTheme, isSuperAdmin,
    activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed,
    isMobileMenuOpen, setIsMobileMenuOpen, navGroupOpen, setNavGroupOpen,
    searchTerm, setSearchTerm,
    dashboardData, isLoadingDashboard, dashboardError, loadDashboard,
    companies, filteredCompanies, loadCompanies,
    isCompModalOpen, setIsCompModalOpen, editingComp, compForm, setCompForm,
    compFormErrors, isSavingComp, openCompModal, handleSaveCompany, handleDeleteCompany,
    expandedCompanies, toggleCompany,
    sectors, filteredSectors, isLoadingSectors, loadSectors,
    isSectorModalOpen, setIsSectorModalOpen, editingSector, setEditingSector,
    sectorForm, setSectorForm, sectorFormErrors, isSavingSector,
    openSectorModal, handleSaveSector, handleDeleteSector,
    employees, filteredEmployees, loadEmployees,
    isEmpModalOpen, setIsEmpModalOpen, editingEmp, empForm, setEmpForm,
    empFormErrors, isSavingEmp, openEmpModal, handleSaveEmployee, handleDeleteEmployee,
    isSeedingEmployees, seedEmployees,
    empHistoryOpen, setEmpHistoryOpen, empHistory, setEmpHistory,
    isLoadingHistory, historyFilter, setHistoryFilter, loadEmpHistory, openEmpHistory,
    users,
    currentUser: users.find(u => session?.user?.email ? u.email === session.user.email : u.id === Number(session?.user?.id)),
    pendingUsersCount: users.filter(u => u.role === 'pendente').length, loadingUsers, loadUsers,
    isAccessModalOpen, setIsAccessModalOpen, isUserCompModalOpen, setIsUserCompModalOpen,
    selectedUser, accessForm, setAccessForm, userCompForm, companySearch, setCompanySearch,
    isSavingAccess, isSavingUserComp, renamingUser, setRenamingUser,
    forceUserLogout, deleteUser, renameUser, updateUserRole,
    updateUserCanRegister, updateUserCanEdit, openAccessModal, openUserCompModal,
    handleSaveAccess, updateUserCompanies, toggleUserCompany,
    reports, reportsTotal, isLoadingReports, reportPage, reportFilter, setReportFilter,
    loadReports, REPORTS_PER_PAGE,
    auditLogs, auditTotal, auditPage, isLoadingAudit, auditFilter, setAuditFilter,
    loadAuditLogs, AUDIT_PER_PAGE,
    demoMode, togglingDemo, toggleDemoMode,
    isRetroModalOpen, setIsRetroModalOpen, retroDate, setRetroDate,
    retroSelectedIds, setRetroSelectedIds, submitRetroAttendance, isSubmittingRetro,
    isPasswordModalOpen, passwordTargetUser, openPasswordModal, closePasswordModal,
    changeUserPassword, isChangingPassword,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

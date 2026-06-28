export type Tab = 'overview' | 'companies' | 'sectors' | 'employees' | 'users' | 'reports' | 'audit' | 'settings' | 'about';

export type RecentActivity = {
  id: number;
  funcionario: string;
  setor: string;
  empresa: string;
  data_hora: string;
};

export type DashboardData = {
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

export type AuditEntry = {
  id: number;
  username: string;
  action: string;
  entity: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
};

export type Employee = {
  id: number;
  nome: string;
  valor?: string | number;
  empresa_id: number;
  setor_id: number;
  empresa?: string | { nome: string };
  setor?: string | { nome: string };
};

export type Sector = {
  id: number;
  nome: string;
  valor?: string | number;
  empresa_id: number;
  empresa?: { nome: string };
};

export type User = {
  id: number;
  username: string;
  email: string | null;
  role: string | null;
  can_register?: boolean;
  can_edit?: boolean;
  has_password?: boolean;
  created_at: string;
  empresas?: string[];
};

export type Company = {
  id: number;
  nome: string;
};

export type ReportRecord = {
  id: number;
  funcionario: string;
  setor: string;
  empresa: string;
  data_hora: string;
};

export type EmpHistory = {
  employee: { id: number; nome: string; setor: { nome: string }; empresa: { nome: string } };
  records: { id: number; data_hora: string }[];
  total: number;
  total30: number;
};

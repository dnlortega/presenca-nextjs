"use client";
import React from 'react';
import {
  User, Settings, Zap, LogOut, Sun, Moon, Monitor,
  Edit2, Check, X, KeyRound, Users, Building, Layers,
  ClipboardList, Trash2, ShieldAlert, Activity,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { toast } from 'sonner';
import { fetchNoCache } from '../../../lib/fetch-helpers';
import { useAdmin } from '../AdminContext';

export function TabSettings() {
  const {
    session, theme, setTheme, isSuperAdmin,
    demoMode, togglingDemo, toggleDemoMode,
    currentUser, renamingUser, setRenamingUser, renameUser,
    openPasswordModal,
    employees, companies, sectors,
    dashboardData, loadDashboard, isLoadingDashboard,
    auditLogs, loadAuditLogs,
  } = useAdmin();

  const [purgingAudit, setPurgingAudit] = React.useState(false);
  const [purgeDays, setPurgeDays] = React.useState('30');

  const handlePurgeAudit = async () => {
    const days = Number(purgeDays);
    if (isNaN(days) || days < 1) { toast.error('Número de dias inválido'); return; }
    if (!window.confirm(`Excluir logs com mais de ${days} dias? Esta ação não pode ser desfeita.`)) return;
    setPurgingAudit(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const res = await fetchNoCache(`/api/admin/audit-log?before=${cutoff.toISOString()}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.deleted} registro${data.deleted !== 1 ? 's' : ''} excluído${data.deleted !== 1 ? 's' : ''}`);
        loadAuditLogs(1);
      } else {
        toast.error(data.error || 'Erro ao limpar logs');
      }
    } catch { toast.error('Erro de conexão'); }
    setPurgingAudit(false);
  };

  const stats = [
    { label: 'Funcionários', value: employees.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Empresas', value: companies.length, icon: Building, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Setores', value: sectors.length, icon: Layers, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Presenças hoje', value: dashboardData?.totalToday ?? '—', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="page-transition space-y-6 max-w-2xl">

      {/* Sessão Atual */}
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

      {/* Minha Conta */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-primary" /> Minha Conta
          </CardTitle>
          <CardDescription className="text-xs">Altere seu nome de exibição ou senha.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome de usuário</span>
            {currentUser && renamingUser?.id === currentUser.id ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  className="h-7 text-xs w-36 px-2"
                  value={renamingUser.value}
                  onChange={e => setRenamingUser({ id: currentUser.id, value: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') renameUser(); if (e.key === 'Escape') setRenamingUser(null); }}
                />
                <button onClick={renameUser} className="text-primary hover:opacity-70 transition-opacity">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setRenamingUser(null)} className="text-muted-foreground hover:opacity-70 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{currentUser?.username || session?.user?.name || '—'}</span>
                {currentUser && (
                  <button
                    onClick={() => setRenamingUser({ id: currentUser.id, value: currentUser.username })}
                    className="text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {currentUser?.has_password && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Senha</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Defina uma nova senha para sua conta</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-1.5"
                onClick={() => currentUser && openPasswordModal(currentUser)}>
                <KeyRound className="w-3.5 h-3.5" /> Alterar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aparência */}
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
                <button key={value} onClick={() => setTheme(value)} title={label}
                  className={`p-1.5 rounded-lg transition-all ${theme === value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Sistema */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Resumo do Sistema
          </CardTitle>
          {!dashboardData && (
            <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest h-7 rounded-lg"
              disabled={isLoadingDashboard} onClick={loadDashboard}>
              {isLoadingDashboard ? 'Carregando...' : 'Carregar'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-lg font-black leading-none">{value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode (superadmin only) */}
      {isSuperAdmin && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Demo Mode
            </CardTitle>
            <CardDescription className="text-xs">
              Quando ativo, novos usuários que entram pelo Google podem escolher o papel sem aprovação.
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
              <Button size="sm" variant={demoMode ? 'destructive' : 'default'}
                disabled={togglingDemo || demoMode === null} onClick={toggleDemoMode}
                className="font-black uppercase tracking-widest text-[10px] rounded-xl min-w-24">
                {togglingDemo ? '...' : demoMode ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manutenção (superadmin only) */}
      {isSuperAdmin && (
        <Card className="border-amber-500/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2 text-amber-600">
              <ShieldAlert className="w-4 h-4" /> Manutenção
            </CardTitle>
            <CardDescription className="text-xs">Operações de limpeza e manutenção do banco de dados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/30 space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Limpar Registro de Auditoria</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Remove logs mais antigos que o número de dias especificado.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number" min="1" max="365"
                    value={purgeDays}
                    onChange={e => setPurgeDays(e.target.value)}
                    className="h-8 w-20 text-xs text-center"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">dias atrás</span>
                </div>
                <Button size="sm" variant="outline"
                  className="rounded-xl text-[10px] font-black uppercase tracking-widest border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-1.5 ml-auto"
                  disabled={purgingAudit} onClick={handlePurgeAudit}>
                  <Trash2 className="w-3.5 h-3.5" />
                  {purgingAudit ? 'Limpando...' : 'Limpar'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Limpar Todos os Logs</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Remove todo o histórico de auditoria permanentemente.</p>
              </div>
              <Button size="sm" variant="outline"
                className="rounded-xl text-[10px] font-black uppercase tracking-widest border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5 shrink-0"
                onClick={async () => {
                  if (!window.confirm('Excluir TODOS os logs de auditoria? Esta ação não pode ser desfeita.')) return;
                  const res = await fetchNoCache('/api/admin/audit-log', { method: 'DELETE' });
                  const data = await res.json();
                  if (res.ok) toast.success(`${data.deleted} logs excluídos`);
                  else toast.error(data.error || 'Erro ao limpar logs');
                }}>
                <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encerrar Sessão */}
      <Card className="border-destructive/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2 text-destructive">
            <LogOut className="w-4 h-4" /> Encerrar Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">Você será redirecionado para a tela de login.</p>
          <Button variant="destructive" size="sm" className="font-black uppercase tracking-widest text-[10px] rounded-xl"
            onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="w-4 h-4 mr-2" /> Sair do Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

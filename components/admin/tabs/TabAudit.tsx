"use client";
import React from 'react';
import { Clock, Trash2, Filter, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { fetchNoCache } from '../../../lib/fetch-helpers';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { EmptyState } from '../../ui/empty-state';
import { ConfirmAction } from '../ConfirmAction';
import { useAdmin } from '../AdminContext';

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Criação', UPDATE: 'Atualização', DELETE: 'Exclusão',
  UPDATE_ROLE: 'Mudança de Cargo', UPDATE_PERMISSION: 'Permissão', UPDATE_EMPRESAS: 'Empresas',
  LOGIN: 'Login', LOGOUT: 'Logout', FORCE_LOGOUT: 'Logout Forçado',
};
const ENTITY_LABEL: Record<string, string> = {
  funcionarios: 'Funcionário', setores: 'Setor', empresas: 'Empresa',
  usuarios: 'Usuário', presenca: 'Presença',
};
const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  UPDATE: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  DELETE: 'text-red-600 bg-red-50 dark:bg-red-950/30',
  UPDATE_ROLE: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
  UPDATE_PERMISSION: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
  LOGIN: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
  LOGOUT: 'text-slate-600 bg-slate-100 dark:bg-slate-800/30',
  FORCE_LOGOUT: 'text-red-700 bg-red-50 dark:bg-red-950/30',
};

export function TabAudit() {
  const {
    auditLogs, auditTotal, auditPage, isLoadingAudit, AUDIT_PER_PAGE,
    auditFilter, setAuditFilter, loadAuditLogs,
  } = useAdmin();

  const [localFilter, setLocalFilter] = React.useState(auditFilter);

  const deleteLog = async (id: number) => {
    const res = await fetchNoCache(`/api/admin/audit-log?id=${id}`, { method: 'DELETE' });
    if (res.ok) { loadAuditLogs(auditPage, auditFilter); toast.success('Registro excluído'); }
    else toast.error('Erro ao excluir registro');
  };

  const applyFilter = () => {
    setAuditFilter(localFilter);
    loadAuditLogs(1, localFilter);
  };

  const clearFilter = () => {
    const empty = { action: '', user: '', startDate: '', endDate: '' };
    setLocalFilter(empty);
    setAuditFilter(empty);
    loadAuditLogs(1, empty);
  };

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
                    if (res.ok) { loadAuditLogs(1, { action: '', user: '', startDate: '', endDate: '' }); toast.success('Registros de auditoria apagados'); }
                    else toast.error('Erro ao limpar auditoria');
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

      {/* Filters */}
      <Card className="border-none shadow-sm bg-card/40">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[140px]">
              <Select value={localFilter.action} onValueChange={v => setLocalFilter(f => ({ ...f, action: v === '__all__' ? '' : v }))}>
                <SelectTrigger className="h-8 text-xs bg-muted/30 border-none">
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as ações</SelectItem>
                  {Object.entries(ACTION_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Input className="h-8 text-xs bg-muted/30 border-none" placeholder="Filtrar por usuário..."
                value={localFilter.user} onChange={e => setLocalFilter(f => ({ ...f, user: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">De</label>
              <input type="date" className="flex-1 bg-muted/30 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                value={localFilter.startDate} onChange={e => setLocalFilter(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">Até</label>
              <input type="date" className="flex-1 bg-muted/30 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                value={localFilter.endDate} onChange={e => setLocalFilter(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button size="icon" className="h-8 w-8 rounded-lg" onClick={applyFilter}><Filter className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={clearFilter}><X className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
                  <TableHead className="text-[10px] font-black text-muted-foreground py-4">Detalhe</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground pr-6 py-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAudit ? (
                  [1,2,3,4,5].map(i => (
                    <TableRow key={i}><TableCell colSpan={6} className="py-6"><div className="h-4 w-full bg-muted/20 animate-shimmer rounded" /></TableCell></TableRow>
                  ))
                ) : auditLogs.length > 0 ? auditLogs.map(log => (
                  <TableRow key={log.id} className="border-muted/20 hover:bg-primary/5 transition-colors group">
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
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ACTION_COLOR[log.action] ?? 'text-muted-foreground bg-muted/30'}`}>
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-bold">
                      {ENTITY_LABEL[log.entity] ?? log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.details ?? '—'}
                    </TableCell>
                    <TableCell className="py-3 pr-6 text-right">
                      <ConfirmAction onConfirm={() => deleteLog(log.id)} title="Excluir registro?">
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </ConfirmAction>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState icon={Trash2} title="Nenhum registro de auditoria" description="As ações sensíveis aparecerão aqui." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden p-4 space-y-3">
            {isLoadingAudit ? [1,2,3].map(i => <div key={i} className="h-20 bg-muted/20 animate-shimmer rounded-lg" />) :
              auditLogs.length === 0 ? <EmptyState icon={Trash2} title="Nenhum registro de auditoria" /> :
              auditLogs.map(log => (
                <Card key={log.id} className="border border-border/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{log.username}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <ConfirmAction onConfirm={() => deleteLog(log.id)} title="Excluir registro?">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </ConfirmAction>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ACTION_COLOR[log.action] ?? 'text-muted-foreground bg-muted/30'}`}>
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                      <span className="text-xs text-muted-foreground">{ENTITY_LABEL[log.entity] ?? log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}</span>
                    </div>
                    {log.details && <p className="text-[10px] text-muted-foreground truncate">{log.details}</p>}
                  </CardContent>
                </Card>
              ))
            }
          </div>
        </CardContent>
      </Card>

      {auditTotal > AUDIT_PER_PAGE && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold text-muted-foreground">
            Página {auditPage} de {Math.ceil(auditTotal / AUDIT_PER_PAGE)} — {auditTotal} registros
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 rounded-lg font-bold text-[10px]"
              disabled={auditPage === 1 || isLoadingAudit} onClick={() => loadAuditLogs(auditPage - 1, auditFilter)}>
              <ChevronRight className="w-3 h-3 rotate-180" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-lg font-bold text-[10px]"
              disabled={auditPage >= Math.ceil(auditTotal / AUDIT_PER_PAGE) || isLoadingAudit} onClick={() => loadAuditLogs(auditPage + 1, auditFilter)}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React from 'react';
import { Clock, FileText, Building, Layers, Filter, X, Trash, ChevronRight } from 'lucide-react';
import { fetchNoCache } from '../../../lib/fetch-helpers';
import { Card, CardContent, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { EmptyState } from '../../ui/empty-state';
import { useAdmin } from '../AdminContext';

export function TabReports() {
  const {
    reports, reportsTotal, isLoadingReports, reportPage, REPORTS_PER_PAGE,
    reportFilter, setReportFilter, loadReports,
  } = useAdmin();

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
              <Button size="icon" variant="outline"
                className="h-9 rounded-xl font-bold gap-2 border-green-500/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (reportFilter.startDate) params.set('startDate', reportFilter.startDate);
                  if (reportFilter.endDate) params.set('endDate', reportFilter.endDate);
                  if (reportFilter.empresa) params.set('empresa', reportFilter.empresa);
                  if (reportFilter.setor) params.set('setor', reportFilter.setor);
                  const a = document.createElement('a');
                  a.href = `/api/admin/reports/export?${params}`;
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
              <input type="date" className="flex-1 bg-muted/30 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                value={reportFilter.startDate} onChange={e => setReportFilter(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <label className="text-[10px] font-black text-muted-foreground whitespace-nowrap">Até</label>
              <input type="date" className="flex-1 bg-muted/30 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                value={reportFilter.endDate} onChange={e => setReportFilter(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="relative flex-1 min-w-[140px]">
              <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input type="text" placeholder="Empresa..." className="w-full bg-muted/30 border-none rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                value={reportFilter.empresa} onChange={e => setReportFilter(f => ({ ...f, empresa: e.target.value }))} />
            </div>
            <div className="relative flex-1 min-w-[140px]">
              <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input type="text" placeholder="Setor..." className="w-full bg-muted/30 border-none rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary"
                value={reportFilter.setor} onChange={e => setReportFilter(f => ({ ...f, setor: e.target.value }))} />
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
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black text-muted-foreground pl-6 py-4">Funcionário</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground py-4">Setor</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground py-4">Empresa</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground py-4">Data</TableHead>
                  <TableHead className="text-right text-[10px] font-black text-muted-foreground pr-6 py-4">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingReports ? (
                  [1,2,3,4,5].map(i => (
                    <TableRow key={i}><TableCell colSpan={5} className="py-6"><div className="h-4 w-full bg-muted/20 animate-shimmer rounded" /></TableCell></TableRow>
                  ))
                ) : reports.length > 0 ? reports.map(r => (
                  <TableRow key={r.id} className="border-muted/30 hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 py-3 font-bold text-xs">{r.funcionario}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{r.setor}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{r.empresa}</TableCell>
                    <TableCell className="py-3 text-xs font-bold">{new Date(r.data_hora).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="py-3 pr-6 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          if (!confirm('Deseja excluir este registro?')) return;
                          const res = await fetchNoCache(`/api/attendance?id=${r.id}`, { method: 'DELETE' });
                          if (res.ok) loadReports(reportPage);
                        }}>
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState icon={FileText} title="Nenhum registro encontrado" description="Ajuste os filtros para ver resultados." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden p-4 space-y-3">
            {isLoadingReports ? [1,2,3].map(i => <div key={i} className="h-24 bg-muted/20 animate-shimmer rounded-lg" />) :
              reports.length === 0 ? <EmptyState icon={FileText} title="Nenhum registro encontrado" /> :
              reports.map(r => (
                <Card key={r.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                          {r.funcionario.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-bold mb-1">{r.funcionario}</CardTitle>
                          <p className="text-xs text-muted-foreground">{new Date(r.data_hora).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={async () => {
                          if (!confirm('Deseja excluir este registro?')) return;
                          const res = await fetchNoCache(`/api/attendance?id=${r.id}`, { method: 'DELETE' });
                          if (res.ok) loadReports(reportPage);
                        }}>
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
            }
          </div>
        </CardContent>
      </Card>

      {reportsTotal > REPORTS_PER_PAGE && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Página {reportPage} de {Math.ceil(reportsTotal / REPORTS_PER_PAGE)} — {reportsTotal} registros
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 rounded-lg font-black text-[10px] uppercase"
              disabled={reportPage === 1 || isLoadingReports} onClick={() => loadReports(reportPage - 1)}>
              <ChevronRight className="w-3 h-3 rotate-180" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-lg font-black text-[10px] uppercase"
              disabled={reportPage >= Math.ceil(reportsTotal / REPORTS_PER_PAGE) || isLoadingReports} onClick={() => loadReports(reportPage + 1)}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

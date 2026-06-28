"use client";
import React from 'react';
import { Search, Plus, Edit, Trash, Trash2, Users, Building, ChevronRight, ChevronDown, ClipboardList } from 'lucide-react';
import { fetchNoCache } from '../../../lib/fetch-helpers';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { EmptyState } from '../../ui/empty-state';
import { ConfirmAction } from '../ConfirmAction';
import { useAdmin } from '../AdminContext';

export function TabEmployees() {
  const {
    employees, filteredEmployees, companies, sectors,
    searchTerm, setSearchTerm,
    expandedCompanies, toggleCompany,
    openEmpModal, handleDeleteEmployee, openEmpHistory,
    isSeedingEmployees, seedEmployees, loadEmployees,
    setActiveTab,
  } = useAdmin();

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

  const groupedEmployees: Record<string, Record<string, typeof filteredEmployees>> = {};
  filteredEmployees.forEach(emp => {
    const companyName = typeof emp.empresa === 'string' ? emp.empresa : (emp.empresa?.nome || 'Sem Empresa');
    const sectorName = typeof emp.setor === 'string' ? emp.setor : (emp.setor?.nome || 'Sem Setor');
    if (!groupedEmployees[companyName]) groupedEmployees[companyName] = {};
    if (!groupedEmployees[companyName][sectorName]) groupedEmployees[companyName][sectorName] = [];
    groupedEmployees[companyName][sectorName].push(emp);
  });
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
              <input type="text" placeholder="Buscar por nome, setor ou empresa..."
                className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <ConfirmAction onConfirm={seedEmployees} title="Popular Base?"
                    description="Deseja criar 15 funcionários em cada setor? Esta ação pode demorar alguns segundos."
                    confirmText="Criar" buttonVariant="default">
                    <Button size="icon" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={isSeedingEmployees || sectors.length === 0}>
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
              <ConfirmAction onConfirm={async () => {
                const orphans = employees.filter(e => !e.setor_id || !e.empresa_id);
                for (const orphan of orphans) {
                  await fetchNoCache(`/api/admin/employees/${orphan.id}`, { method: 'DELETE' });
                }
                loadEmployees();
                toast.success('Órfãos removidos com sucesso');
              }} title="Excluir Órfãos?"
                description="Isto removerá permanentemente todos os funcionários sem vínculo de empresa ou setor.">
                <Button size="icon" variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ConfirmAction>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {companyNames.length === 0 ? (
            <EmptyState icon={Search} title="Nenhum registro encontrado" description="Tente buscar por outro termo." />
          ) : (
            companyNames.map(compName => {
              const sectorsInCompany = groupedEmployees[compName];
              const sectorNames = Object.keys(sectorsInCompany).sort();
              const isExpanded = expandedCompanies[compName];

              return (
                <div key={compName} className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-500">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50 cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
                    onClick={() => toggleCompany(compName)}>
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
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-indigo-500"
                                    onClick={() => openEmpHistory(emp)} title="Ver histórico">
                                    <ClipboardList className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary"
                                    onClick={() => openEmpModal(emp)} title="Editar">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <ConfirmAction onConfirm={() => handleDeleteEmployee(emp.id)} title="Excluir Funcionário?">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Excluir">
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
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

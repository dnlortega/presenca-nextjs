"use client";
import React from 'react';
import { Search, Plus, Edit, Trash, Building, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { EmptyState } from '../../ui/empty-state';
import { ConfirmAction } from '../ConfirmAction';
import { useAdmin } from '../AdminContext';

export function TabCompanies() {
  const {
    companies, filteredCompanies, sectors,
    searchTerm, setSearchTerm,
    openCompModal, handleDeleteCompany,
    openSectorModal, handleDeleteSector,
    setEditingSector, setSectorForm, setIsSectorModalOpen,
  } = useAdmin();

  const addSectorForCompany = (compId: number) => {
    setEditingSector(null);
    setSectorForm({ nome: '', empresa_id: String(compId) });
    setIsSectorModalOpen(true);
  };

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
                type="text" placeholder="Buscar Empresa..."
                className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all font-bold"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
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
          {/* Desktop */}
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
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <EmptyState icon={Building} title="Nenhuma empresa encontrada" />
                    </TableCell>
                  </TableRow>
                ) : filteredCompanies.map((comp) => {
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
                            <Button variant="ghost" size="sm"
                              className="h-6 text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary transition-all rounded-lg px-2"
                              onClick={() => addSectorForCompany(comp.id)}>
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
                                          <button onClick={() => openSectorModal(s)}
                                            className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center" title="Editar Setor">
                                            <Edit className="w-3 h-3" />
                                          </button>
                                          <ConfirmAction onConfirm={() => handleDeleteSector(s.id)} title="Excluir Setor?">
                                            <button className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center" title="Excluir Setor">
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
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {filteredCompanies.length === 0 ? (
              <EmptyState icon={Building} title="Nenhuma empresa encontrada" />
            ) : filteredCompanies.map((comp) => {
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
                      <Button variant="ghost" size="sm"
                        className="h-6 text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary transition-all rounded-lg px-2"
                        onClick={() => addSectorForCompany(comp.id)}>
                        <Plus className="w-3 h-3 mr-1" /> Novo
                      </Button>
                    </div>
                    {companySectors.length > 0 ? (
                      <div className="space-y-2">
                        {companySectors.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                            <span className="text-xs font-bold">{s.nome}</span>
                            <div className="flex gap-1">
                              <button onClick={() => openSectorModal(s)}
                                className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center" title="Editar Setor">
                                <Edit className="w-3 h-3" />
                              </button>
                              <ConfirmAction onConfirm={() => handleDeleteSector(s.id)} title="Excluir Setor?">
                                <button className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center" title="Excluir Setor">
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
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

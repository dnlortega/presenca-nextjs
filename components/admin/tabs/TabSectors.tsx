"use client";
import React from 'react';
import { Search, Plus, Edit, Trash, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { EmptyState } from '../../ui/empty-state';
import { ConfirmAction } from '../ConfirmAction';
import { useAdmin } from '../AdminContext';

export function TabSectors() {
  const {
    sectors, filteredSectors, companies,
    searchTerm, setSearchTerm,
    openSectorModal, handleDeleteSector,
  } = useAdmin();

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
                type="text" placeholder="Buscar..."
                className="bg-muted/50 border-none rounded-lg pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary w-full sm:w-48 transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
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
            <EmptyState icon={Building} title="Cadastre uma empresa primeiro" description="Os setores são vinculados a uma empresa." />
          ) : (
            <>
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
                    {filteredSectors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <EmptyState icon={Search} title="Nenhum setor encontrado" />
                        </TableCell>
                      </TableRow>
                    ) : filteredSectors.map(sec => (
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

              <div className="md:hidden space-y-3">
                {filteredSectors.length === 0 ? (
                  <EmptyState icon={Search} title="Nenhum setor encontrado" />
                ) : filteredSectors.map(sec => (
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
}

"use client";
import React from 'react';
import { User, Layers, Building, ShieldCheck, Search, Filter, X, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useAdmin } from './AdminContext';

export function Modals() {
  const {
    companies, sectors,
    // Employee history
    empHistoryOpen, setEmpHistoryOpen, empHistory, setEmpHistory,
    isLoadingHistory, historyFilter, setHistoryFilter, loadEmpHistory,
    // Employee CRUD
    isEmpModalOpen, setIsEmpModalOpen, editingEmp,
    empForm, setEmpForm, empFormErrors, isSavingEmp, handleSaveEmployee,
    // Sector CRUD
    isSectorModalOpen, setIsSectorModalOpen, editingSector,
    sectorForm, setSectorForm, sectorFormErrors, isSavingSector, handleSaveSector,
    // Company CRUD
    isCompModalOpen, setIsCompModalOpen, editingComp,
    compForm, setCompForm, compFormErrors, isSavingComp, handleSaveCompany,
    // User company
    isUserCompModalOpen, setIsUserCompModalOpen,
    selectedUser, userCompForm, companySearch, setCompanySearch,
    isSavingUserComp, updateUserCompanies, toggleUserCompany,
    // Access
    isAccessModalOpen, setIsAccessModalOpen,
    accessForm, setAccessForm, isSavingAccess, handleSaveAccess,
  } = useAdmin();

  const spinner = <div className="animate-spin w-4 h-4 border-2 border-background/30 border-t-background rounded-full" />;

  return (
    <>
      {/* Employee History */}
      <Dialog open={empHistoryOpen} onOpenChange={open => { if (!open) { setEmpHistoryOpen(false); setEmpHistory(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              {empHistory ? empHistory.employee.nome : 'Histórico de Presença'}
            </DialogTitle>
            {empHistory && (
              <p className="text-xs text-muted-foreground">
                {empHistory.employee.setor.nome} · {empHistory.employee.empresa.nome}
              </p>
            )}
          </DialogHeader>

          {empHistory && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-primary">{empHistory.total30}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Últimos 30 dias</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">{empHistory.total}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Total exibido</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest">De</Label>
              <Input type="date" className="h-8 text-xs" value={historyFilter.startDate}
                onChange={e => setHistoryFilter(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest">Até</Label>
              <Input type="date" className="h-8 text-xs" value={historyFilter.endDate}
                onChange={e => setHistoryFilter(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <Button size="sm" className="h-8 px-3 shrink-0"
              onClick={() => empHistory && loadEmpHistory(empHistory.employee.id, historyFilter)}>
              <Filter className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0"
              onClick={() => {
                const empty = { startDate: '', endDate: '' };
                setHistoryFilter(empty);
                empHistory && loadEmpHistory(empHistory.employee.id, empty);
              }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar rounded-xl border border-border/40 p-2">
            {isLoadingHistory ? (
              [1,2,3,4,5].map(i => <div key={i} className="h-8 bg-muted/20 animate-shimmer rounded-lg" />)
            ) : empHistory?.records.length ? (
              empHistory.records.map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                  <span className="text-xs font-bold">
                    {new Date(r.data_hora + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/30 text-emerald-600">✓ Presente</Badge>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground italic">
                Nenhuma presença no período selecionado.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEmpHistoryOpen(false); setEmpHistory(null); }}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Modal */}
      <Dialog open={isEmpModalOpen} onOpenChange={open => { if (!open) setIsEmpModalOpen(false); }}>
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
                onChange={e => setEmpForm({ ...empForm, nome: e.target.value })}
                placeholder="Nome do colaborador"
                className={empFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {empFormErrors.nome && <p className="text-[11px] text-destructive">{empFormErrors.nome}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Empresa</Label>
              <Select value={empForm.empresa_id} onValueChange={v => setEmpForm({ ...empForm, empresa_id: v, setor_id: '' })}>
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
              <Select value={empForm.setor_id} onValueChange={v => setEmpForm({ ...empForm, setor_id: v })} disabled={!empForm.empresa_id}>
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
              <Button variant="ghost" type="button" onClick={() => setIsEmpModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingEmp} className="shadow-lg shadow-primary/20">
                {isSavingEmp ? spinner : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sector Modal */}
      <Dialog open={isSectorModalOpen} onOpenChange={open => { if (!open) setIsSectorModalOpen(false); }}>
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
                  onChange={e => setSectorForm({ ...sectorForm, nome: e.target.value })}
                  placeholder="Ex: Recursos Humanos"
                  className={sectorFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              ) : (
                <Textarea
                  rows={5}
                  value={sectorForm.nome}
                  onChange={e => setSectorForm({ ...sectorForm, nome: e.target.value })}
                  placeholder={"Ex:\nRecursos Humanos\nTI\nFinanceiro\nOperacional"}
                  className={`resize-none ${sectorFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
              )}
              {sectorFormErrors.nome && <p className="text-[11px] text-destructive">{sectorFormErrors.nome}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Vincular à Empresa</Label>
              <Select value={sectorForm.empresa_id} onValueChange={v => setSectorForm({ ...sectorForm, empresa_id: v })}>
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
              <Button variant="ghost" type="button" onClick={() => setIsSectorModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingSector} className="shadow-lg shadow-primary/20">
                {isSavingSector ? spinner : 'Salvar Setor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Company Modal */}
      <Dialog open={isCompModalOpen} onOpenChange={open => { if (!open) setIsCompModalOpen(false); }}>
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
                onChange={e => setCompForm({ nome: e.target.value })}
                placeholder="Ex: Minha Empresa LTDA"
                className={compFormErrors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {compFormErrors.nome && <p className="text-[11px] text-destructive">{compFormErrors.nome}</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsCompModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingComp} className="shadow-lg shadow-primary/20">
                {isSavingComp ? spinner : 'Confirmar'}
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
              <Input className="pl-8 h-8 text-xs" placeholder="Buscar empresa..."
                value={companySearch} onChange={e => setCompanySearch(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {companies.filter(c => c.nome.toLowerCase().includes(companySearch.toLowerCase())).map(comp => (
                <label key={comp.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all group active:scale-95">
                  <Checkbox checked={userCompForm.includes(comp.nome)} onCheckedChange={() => toggleUserCompany(comp.nome)} />
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
              {isSavingUserComp ? spinner : 'Salvar Acessos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Modal */}
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
                <Checkbox checked={accessForm.can_register} onCheckedChange={v => setAccessForm({ ...accessForm, can_register: !!v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Editar Nomes</Label>
                  <p className="text-xs text-muted-foreground">Corrigir nomes de funcionários</p>
                </div>
                <Checkbox checked={accessForm.can_edit} onCheckedChange={v => setAccessForm({ ...accessForm, can_edit: !!v })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAccessModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingAccess} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                {isSavingAccess ? spinner : 'Salvar Acessos'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

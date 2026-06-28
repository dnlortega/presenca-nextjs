"use client";
import React from 'react';
import { Mail, Clock, UserCheck, ShieldCheck, UserPlus, UserX, LogOut, Trash2, Edit, Key, Building2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { useAdmin } from '../AdminContext';

export function TabUsers() {
  const {
    users,
    renamingUser, setRenamingUser, renameUser,
    updateUserRole, forceUserLogout, deleteUser,
    openAccessModal, openUserCompModal, openPasswordModal,
  } = useAdmin();

  return (
    <div className="page-transition space-y-4">
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Identificação</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Status / Cargo</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-muted/30">
                    <TableCell className="pl-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-lg border border-border">
                          <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                            {u.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          {renamingUser?.id === u.id ? (
                            <div className="flex items-center gap-1">
                              <input autoFocus
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
                              <button onClick={() => setRenamingUser({ id: u.id, value: u.username })}
                                className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
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
                    <TableCell className="py-3">
                      {u.role === 'pendente' ? (
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-orange-500/30 text-orange-500 bg-orange-500/5">
                          <Clock className="w-3 h-3 mr-1" /> Pendente
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>
                            <UserCheck className="w-3 h-3 mr-1" /> {u.role}
                          </Badge>
                          {u.role === 'educador' && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(u.can_register || u.can_edit) ? (
                                <>
                                  {u.can_register && <Badge variant="secondary" className="text-[9px] h-4 px-1">Registrar</Badge>}
                                  {u.can_edit && <Badge variant="secondary" className="text-[9px] h-4 px-1">Editar</Badge>}
                                </>
                              ) : <span className="text-[9px] text-muted-foreground opacity-70">Sem permissões extras</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 pr-6 text-right">
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
                        {u.has_password && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950" onClick={() => openPasswordModal(u)}>
                                <KeyRound className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Alterar senha</TooltipContent>
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

          {/* Mobile */}
          <div className="md:hidden p-4 space-y-3">
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
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>
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
                      {u.has_password && (
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-amber-600" title="Alterar senha" onClick={() => openPasswordModal(u)}>
                          <KeyRound className="w-4 h-4" />
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
}

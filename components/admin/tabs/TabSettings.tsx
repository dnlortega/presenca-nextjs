"use client";
import React from 'react';
import { User, Settings, Zap, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAdmin } from '../AdminContext';

export function TabSettings() {
  const { session, theme, setTheme, isSuperAdmin, demoMode, togglingDemo, toggleDemoMode } = useAdmin();

  return (
    <div className="page-transition space-y-6 max-w-2xl">
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

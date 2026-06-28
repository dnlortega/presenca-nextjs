"use client";
import React from 'react';
import { ShieldCheck, Code2, Building, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

export function TabAbout() {
  return (
    <div className="space-y-5 animate-scale-in max-w-5xl mx-auto">
      <Card className="border-none shadow-sm bg-gradient-to-br from-primary/8 via-background to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/15 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black tracking-tight mb-0.5">Presença<span className="text-primary">.Pro</span></h2>
              <p className="text-xs text-muted-foreground mb-3 font-medium">Sistema de gestão de frequência corporativo · multi-empresa · multi-setor</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="font-bold">v2.1.0</Badge>
                <Badge variant="outline" className="border-primary/40 text-primary font-semibold">Next.js 16.2</Badge>
                <Badge variant="outline" className="border-blue-500/40 text-blue-600 font-semibold">React 19</Badge>
                <Badge variant="outline" className="border-violet-500/40 text-violet-600 font-semibold">shadcn/ui</Badge>
                <Badge variant="outline" className="font-semibold">Audit Log</Badge>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 font-semibold">Produção</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: '7', label: 'Modelos no banco', color: 'text-primary', bg: 'bg-primary/10' },
          { value: '23', label: 'Rotas de API', color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { value: '18', label: 'Componentes shadcn', color: 'text-violet-600', bg: 'bg-violet-500/10' },
          { value: '4', label: 'Níveis de acesso', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        ].map(({ value, label, color }) => (
          <Card key={label} className="border-none shadow-sm text-center">
            <CardContent className="pt-4 pb-4">
              <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Code2 className="w-4 h-4 text-blue-500" /> Stack tecnológico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { label: 'Framework', value: 'Next.js 16.2 (App Router)', color: 'text-foreground' },
              { label: 'Runtime', value: 'React 19 + TypeScript 5.7', color: 'text-blue-600' },
              { label: 'UI', value: 'Tailwind CSS v3 + shadcn/ui', color: 'text-cyan-600' },
              { label: 'ORM', value: 'Prisma 6.19 + PostgreSQL (Neon)', color: 'text-emerald-600' },
              { label: 'Auth', value: 'NextAuth.js 4.24 · Google + Credentials', color: 'text-orange-600' },
              { label: 'Gráficos', value: 'Recharts 3.6', color: 'text-purple-600' },
              { label: 'Validação', value: 'Zod 4.4 em todos os endpoints', color: 'text-rose-600' },
              { label: 'Toasts', value: 'Sonner 2.0', color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                <span className={`text-xs font-semibold ${color} text-right ml-3`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Segurança & arquitetura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { title: 'RBAC granular', desc: '4 roles: admin, educador, suporte, pendente. Permissões can_register e can_edit por usuário.' },
              { title: 'JWT + força logout', desc: 'Sessão JWT com flag force_logout. Admin pode encerrar sessão de qualquer usuário remotamente.' },
              { title: 'Rate limiting por IP', desc: 'Auth: 10 req/15 min · Login: 20 req/15 min · Attendance: 60 req/min · Admin API: 200 req/min.' },
              { title: 'Audit log filtrado', desc: 'Histórico de todas as ações sensíveis com filtro por ação, usuário e data. Limpeza manual.' },
              { title: 'Validação Zod', desc: 'Todos os inputs de API validados com schemas tipados antes de tocar o banco.' },
              { title: 'Demo mode', desc: 'Controle pelo superadmin para liberar ou bloquear o auto-cadastro de novos usuários Google.' },
            ].map(({ title, desc }) => (
              <div key={title} className="space-y-0.5 pb-2 border-b border-border/40 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Building className="w-4 h-4 text-indigo-500" /> Modelos do banco de dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { model: 'funcionarios', desc: 'Colaboradores vinculados a empresa e setor' },
              { model: 'presenca', desc: 'Registros de frequência com data e hora' },
              { model: 'setores', desc: 'Setores únicos por empresa' },
              { model: 'empresas', desc: 'Empresas do sistema (multi-tenant)' },
              { model: 'usuarios', desc: 'Usuários com roles e permissões' },
              { model: 'usuario_empresas', desc: 'Vínculo many-to-many usuário ↔ empresa' },
              { model: 'audit_log', desc: 'Log imutável de ações sensíveis' },
              { model: 'configuracoes', desc: 'Configurações globais (ex: demo mode)' },
            ].map(({ model, desc }) => (
              <div key={model} className="p-2.5 rounded-lg bg-muted/30 space-y-0.5">
                <p className="text-[10px] font-black text-primary font-mono">{model}</p>
                <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-primary/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Painel administrativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {[
                'Dashboard: KPIs, horário de pico, tendência 7 dias, barras 30 dias, heatmap e mapa de calor',
                'CRUD completo com Dialog shadcn: Empresas, Setores (bulk), Funcionários e Usuários',
                'Relatórios paginados com filtros por data, empresa e setor + exportação CSV filtrada',
                'Auditoria com filtros por ação, usuário e período + limpar tudo',
                'Gerenciamento de acessos: role, can_register, can_edit, empresas vinculadas',
                'Histórico individual de presença por funcionário com filtro de datas',
                'Encerramento remoto de sessão · exclusão de usuário · demo mode',
              ].map(item => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5 shrink-0">•</span> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" /> Portal do educador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {[
                'Fluxo guiado em 3 etapas: Empresa → Setor → Lista de chamada',
                'Detecção automática de duplicidade de presença no mesmo dia',
                'Remoção individual de presenças já lançadas com confirmação',
                'Cadastro de funcionários em lote (quando permitido pelo admin)',
                'Edição inline do nome de funcionários (quando permitido)',
                'Interface responsiva otimizada para tablets e celulares',
                'Dark mode + ajuste de tamanho de fonte para acessibilidade',
              ].map(item => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-2 pb-1">
        <p className="text-[10px] text-muted-foreground/40 tracking-wider">Presença.Pro © 2026 · github.com/dnlortega</p>
      </div>
    </div>
  );
}

"use client";
import React from 'react';
import { Clock, AlertCircle, TrendingUp, Building, Layers, Users, Percent, BarChart as BarChartIcon } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { useAdmin } from '../AdminContext';

const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ec4899','#14b8a6','#8b5cf6','#f97316','#06b6d4'];

export function TabOverview() {
  const { dashboardData, isLoadingDashboard, dashboardError, loadDashboard } = useAdmin();

  const shimmer = <div className="h-full w-full bg-muted/20 rounded-xl animate-shimmer" />;
  const maxToday = Math.max(1, dashboardData?.totalToday ?? 1);
  const attendanceRate = dashboardData && dashboardData.totalEmployees > 0
    ? Math.round((dashboardData.totalToday / dashboardData.totalEmployees) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 animate-scale-in h-full">
      {dashboardError && (
        <Card className="border-destructive/50 bg-destructive/10 shrink-0">
          <CardContent className="p-3 flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{dashboardError}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={loadDashboard} className="ml-auto h-7 w-7">
                  <Clock className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tentar novamente</TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {[
          { label: 'Presenças hoje', value: dashboardData?.totalToday ?? 0, sub: 'registradas hoje', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Taxa de presença', value: isLoadingDashboard ? '—' : `${attendanceRate}%`, sub: `${dashboardData?.totalToday ?? 0} de ${dashboardData?.totalEmployees ?? 0}`, icon: Percent, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Setores ativos', value: dashboardData?.sectorsActive ?? 0, sub: 'com presença hoje', icon: BarChartIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: 'Funcionários', value: dashboardData?.totalEmployees ?? 0, sub: 'cadastrados', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
                <div className={`p-1 rounded-lg ${bg} shrink-0`}><Icon className={`w-3 h-3 ${color}`} /></div>
              </div>
              <div className="text-xl font-bold tracking-tight">
                {isLoadingDashboard ? <div className="h-6 w-12 bg-muted/20 animate-shimmer rounded" /> : value}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Abas de análise */}
      <Tabs defaultValue="hoje" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 w-fit mb-3 h-8">
          <TabsTrigger value="hoje" className="text-xs px-4 h-7">Hoje</TabsTrigger>
          <TabsTrigger value="tendencia" className="text-xs px-4 h-7">7 dias</TabsTrigger>
          <TabsTrigger value="mensal" className="text-xs px-4 h-7">30 dias</TabsTrigger>
        </TabsList>

        {/* Hoje */}
        <TabsContent value="hoje" className="mt-0 flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Horário de pico
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[180px]">
                  {dashboardData?.hourlyDistribution ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.hourlyDistribution} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <ChartTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [v, 'Presenças']} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.85} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[180px]">{shimmer}</div>}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Card className="border-none shadow-sm flex-1">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-semibold">Setores hoje</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2 overflow-y-auto max-h-[160px] custom-scrollbar">
                  {dashboardData?.sectorStats?.length ? dashboardData.sectorStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="font-medium truncate">{stat.setor}</span>
                          <span className="font-bold text-primary ml-1 shrink-0">{stat.count}</span>
                        </div>
                        <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((stat.count / maxToday) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-[10px] text-muted-foreground italic py-4 text-center">Nenhuma presença hoje.</p>}
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm flex-1">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-semibold">Recente</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2 overflow-y-auto max-h-[140px] custom-scrollbar">
                  {dashboardData?.recentActivities?.length ? dashboardData.recentActivities.map((a) => (
                    <div key={a.id} className="flex gap-2">
                      <div className="w-0.5 bg-primary/30 rounded-full shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold leading-tight">{a.funcionario}</p>
                        <p className="text-[9px] text-muted-foreground">{a.setor}</p>
                      </div>
                    </div>
                  )) : <p className="text-[10px] text-muted-foreground italic text-center py-2">Sem atividade.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 7 dias */}
        <TabsContent value="tendencia" className="mt-0 flex-1 min-h-0">
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Tendência dos últimos 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-[300px]">
                {dashboardData?.weeklyTrend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.weeklyTrend} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [typeof v === 'number' ? v : 0, 'Presenças']} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-[300px]">{shimmer}</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 30 dias */}
        <TabsContent value="mensal" className="mt-0 flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-indigo-500" /> Por empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[160px]">
                  {dashboardData?.companyMonthly?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.companyMonthly} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                        <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                        <ChartTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [v, 'Presenças']} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} opacity={0.85} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-xs text-muted-foreground italic text-center pt-12">Sem dados</p>}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Card className="border-none shadow-sm flex-1">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-rose-500" /> Setores
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="h-[130px]">
                    {dashboardData?.sectorDonut?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dashboardData.sectorDonut} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="value" paddingAngle={2}>
                            {dashboardData.sectorDonut.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.9} />)}
                          </Pie>
                          <ChartTooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(v) => [v, 'Presenças']} />
                          <Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-xs text-muted-foreground italic text-center pt-8">Sem dados</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm flex-1">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Menos presenças
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1.5">
                  {dashboardData?.topAbsent?.length ? dashboardData.topAbsent.map((e, i) => (
                    <div key={e.id} className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground w-3">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold truncate leading-tight">{e.nome}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{e.setor}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-bold h-4 px-1 shrink-0">{e.presencas}d</Badge>
                    </div>
                  )) : <p className="text-[10px] text-muted-foreground italic text-center py-2">Sem dados</p>}
                </CardContent>
              </Card>
            </div>

            {/* Heatmap */}
            <Card className="lg:col-span-3 border-none shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <BarChartIcon className="w-3.5 h-3.5 text-teal-500" /> Mapa de presença
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {dashboardData?.heatmapData ? (() => {
                  const max = Math.max(1, ...dashboardData.heatmapData.map(d => d.count));
                  return (
                    <div className="flex flex-wrap gap-1 items-center">
                      {dashboardData.heatmapData.map(({ date, count }) => {
                        const d = new Date(date + 'T12:00:00');
                        const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
                        const intensity = count === 0 ? 0 : Math.max(0.15, count / max);
                        return (
                          <div key={date} title={`${label}: ${count} presenças`}
                            className="w-6 h-6 rounded cursor-default border border-border/20"
                            style={{ backgroundColor: count === 0 ? 'hsl(var(--muted))' : `hsl(var(--primary) / ${intensity})` }}
                          />
                        );
                      })}
                      <div className="w-full flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground">
                        <span>Menos</span>
                        {[0.1, 0.3, 0.55, 0.8, 1].map(v => (
                          <div key={v} className="w-3.5 h-3.5 rounded" style={{ backgroundColor: v < 0.1 ? 'hsl(var(--muted))' : `hsl(var(--primary) / ${v})` }} />
                        ))}
                        <span>Mais</span>
                      </div>
                    </div>
                  );
                })() : shimmer}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

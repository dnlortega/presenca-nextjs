"use client";
import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
  LucideBuilding,
  LucideLayers,
  LucideUsers,
  LucideCheckCircle2,
  LucideArrowLeft,
  LucideLogOut,
  LucideSend,
  LucideShieldCheck,
  LucideChevronRight,
  LucideCalendar,
  LucideTrash2,
  LucideUserX
} from 'lucide-react';

import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ModeToggle } from "./ModeToggle";
import { Avatar, AvatarFallback } from "./ui/avatar";

export default function EducatorClient() {
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [presentToday, setPresentToday] = useState<{ id: number, funcionario: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  useEffect(() => {
    loadMyCompanies();
  }, []);

  const loadMyCompanies = async () => {
    try {
      const res = await fetch('/api/my-companies');
      const data = await res.json();
      if (res.ok) setCompanies(data.companies);
    } catch (e) { console.error(e); }
  };

  const loadSectors = async (company: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sectors?company=${encodeURIComponent(company)}`);
      const data = await res.json();
      if (res.ok) setSectors(data);
      setStep(2);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadEmployees = async (sector: string) => {
    setLoading(true);
    try {
      // Load all employees of this sector
      const resEmp = await fetch(`/api/employees?company=${encodeURIComponent(selectedCompany)}&sector=${encodeURIComponent(sector)}`);
      const dataEmp = await resEmp.json();

      // Load who is already present today
      const resPres = await fetch(`/api/attendance?empresa=${encodeURIComponent(selectedCompany)}&setor=${encodeURIComponent(sector)}`);
      const dataPres = await resPres.json();

      if (resEmp.ok) setEmployees(dataEmp);
      if (resPres.ok) setPresentToday(dataPres);

      setStep(3);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const deleteAttendance = async (attendanceId: number) => {
    if (!confirm('Deseja remover esta presença?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?id=${attendanceId}`, { method: 'DELETE' });
      if (res.ok) {
        setPresentToday(prev => prev.filter(p => p.id !== attendanceId));
        setFeedback({ type: 'info', msg: 'Presença removida.' });
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleEmployee = (id: number) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const submitAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        setFeedback({
          type: 'success',
          msg: `${result.count} presenças registradas com sucesso!`
        });
        setTimeout(() => {
          setStep(1);
          setSelectedEmployees([]);
          setFeedback(null);
        }, 3000);
      } else {
        setFeedback({ type: 'error', msg: result.error || 'Erro ao registrar' });
      }
    } catch (e) {
      setFeedback({ type: 'error', msg: 'Falha na conexão' });
    }
    setLoading(false);
  };

  const ProgressHeader = () => (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
          <LucideShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span className="font-black text-[10px] sm:text-xs uppercase tracking-tighter">Educador<span className="text-primary">.Pro</span></span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ModeToggle />
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive px-2 sm:px-3">
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:p-6 max-w-lg mx-auto page-transition">
      <ProgressHeader />

      <header className="mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2 text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-widest mb-1 sm:mb-1.5">
          <LucideCalendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none">
          Registro de <span className="text-primary italic">Chamada</span>
        </h1>
      </header>

      {/* Steps indicator */}
      <div className="flex gap-1 sm:gap-1.5 mb-4 sm:mb-8 animate-slide-up [animation-delay:200ms]">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="space-y-3 sm:space-y-4 animate-scale-in [animation-delay:400ms]">
        {feedback && (
          <div className={`p-3 sm:p-4 rounded-xl text-[10px] sm:text-xs font-bold animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
            'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
            <LucideCheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {feedback.msg}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2 px-1 mb-2">
              <LucideBuilding className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selecione a Empresa</span>
            </div>
            {companies.map(c => (
              <Button
                key={c}
                variant="outline"
                onClick={() => { setSelectedCompany(c); loadSectors(c); }}
                className="w-full justify-between h-12 sm:h-14 rounded-xl sm:rounded-2xl border-muted-foreground/10 hover:border-primary/50 hover:bg-primary/5 hover-lift transition-all group"
              >
                <span className="font-bold text-xs sm:text-sm tracking-tight truncate">{c}</span>
                <LucideChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 flex-shrink-0" />
              </Button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2.5 sm:space-y-3">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary mb-3 sm:mb-4 transition-colors">
              <LucideArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Mudar Empresa</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-1 mb-2">
              <LucideLayers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qual o Setor?</span>
            </div>
            {sectors.map(s => (
              <Button
                key={s}
                variant="outline"
                onClick={() => { setSelectedSector(s); loadEmployees(s); }}
                className="w-full justify-between h-12 sm:h-14 rounded-xl sm:rounded-2xl border-muted-foreground/10 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <span className="font-bold text-xs sm:text-sm tracking-tight truncate">{s}</span>
                <LucideChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 flex-shrink-0" />
              </Button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <LucideArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[120px] sm:max-w-none">{selectedSector}</span>
              </button>
              <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black border-primary/20 text-primary">
                {selectedEmployees.length} Selecionados
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:gap-2.5 pb-28 sm:pb-24">
              {employees.length > 0 ? (
                employees.map(emp => {
                  const isAlreadyPresent = presentToday.find(p => p.id === emp.id);
                  const isSelected = selectedEmployees.includes(emp.id);

                  return (
                    <div key={emp.id} className="relative group">
                      <button
                        disabled={!!isAlreadyPresent}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all text-left ${isAlreadyPresent
                          ? 'bg-emerald-500/5 border-emerald-500/50 opacity-80 cursor-default'
                          : isSelected
                            ? 'bg-primary/5 border-primary shadow-sm'
                            : 'bg-card border-border hover:border-primary/30'
                          }`}
                      >
                        <Avatar className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg border transition-colors ${isAlreadyPresent ? 'border-emerald-500/50' : isSelected ? 'border-primary' : 'border-border'
                          }`}>
                          <AvatarFallback className={`text-[10px] sm:text-xs font-black ${isAlreadyPresent
                            ? 'bg-emerald-500 text-white'
                            : isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                            {emp.nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[11px] sm:text-xs font-black tracking-tight truncate ${isAlreadyPresent ? 'text-emerald-600' : isSelected ? 'text-primary' : ''
                            }`}>
                            {emp.nome}
                          </div>
                          {isAlreadyPresent && (
                            <div className="text-[8px] sm:text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Presente</div>
                          )}
                        </div>
                        {isSelected && !isAlreadyPresent && (
                          <LucideCheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-in zoom-in duration-300 flex-shrink-0" />
                        )}
                        {isAlreadyPresent && (
                          <LucideCheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                        )}
                      </button>

                      {isAlreadyPresent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); deleteAttendance(isAlreadyPresent.id); }}
                          className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover presença"
                        >
                          <LucideTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-10 sm:py-12 text-center animate-scale-in">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted/30 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <LucideUserX className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">Nenhum funcionário cadastrado</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">Verifique o setor selecionado no Admin.</p>
                </div>
              )}
            </div>

            {/* Floating Action Menu */}
            <div className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 max-w-lg mx-auto z-50">
              <Card className="glass border-primary/20 bg-background/95 backdrop-blur-lg px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-2xl">
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground">Total para Enviar</span>
                  <span className="text-base sm:text-lg font-black">{selectedEmployees.length}</span>
                </div>
                <Button
                  disabled={selectedEmployees.length === 0 || loading}
                  onClick={submitAttendance}
                  className="rounded-lg sm:rounded-xl px-4 sm:px-6 h-10 sm:h-12 text-xs sm:text-sm font-black shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/20 border-t-white rounded-full" />
                  ) : (
                    <>Confirmar <LucideSend className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" /></>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

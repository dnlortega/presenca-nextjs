"use client";
import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Card from './ui/Card';

type Func = { id: number; nome: string; empresa: string; setor: string };

export default function EducatorClient() {
  const [step, setStep] = useState<number>(1);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Func[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/my-companies')
      .then((r) => r.json())
      .then((data) => {
        if (data?.companies) setCompanies(data.companies);
      })
      .catch(console.error);
  }, []);

  // fetch employees for a company to derive sectors
  const loadEmployeesForCompany = async (company: string) => {
    const q = new URLSearchParams();
    q.set('company', company);
    const res = await fetch('/api/employees?' + q.toString());
    const data = await res.json();
    return Array.isArray(data) ? data as Func[] : [];
  };

  const onSelectCompany = async (c: string) => {
    setSelectedCompany(c);
    setStep(2);
    const emps = await loadEmployeesForCompany(c);
    setEmployees(emps);
    const uniq = Array.from(new Set(emps.map((e) => e.setor || 'Geral')));
    setSectors(uniq);
  };

  const onSelectSector = async (s: string) => {
    setSelectedSector(s);
    setStep(3);
    // employees already loaded for company; filter by sector
    const filtered = employees.filter((e) => (e.setor || 'Geral') === s);
    setEmployees(filtered);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sendSelected = async () => {
    if (!selectedCompany || !selectedSector) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return alert('Nenhum funcionário selecionado');
    setLoading(true);
    try {
      // 1. Fetch already present employees for today
      const q = new URLSearchParams();
      q.set('empresa', selectedCompany);
      q.set('setor', selectedSector);
      const checkRes = await fetch('/api/attendance?' + q.toString());
      const checkData = await checkRes.json();

      // Normalize names for comparison
      const presentNames = new Set<string>(
        (Array.isArray(checkData.present) ? checkData.present : []).map((n: string) => n.trim().toLowerCase())
      );

      const selectedEmployees = employees.filter((e) => ids.includes(e.id));

      // 2. Filter duplicates
      const toSend: Func[] = [];
      let dupCount = 0;
      const remaining = new Set(selectedIds);

      for (const emp of selectedEmployees) {
        if (presentNames.has(emp.nome.trim().toLowerCase())) {
          dupCount++;
          remaining.delete(emp.id); // Remove from selection as it's already done
        } else {
          toSend.push(emp);
        }
      }

      // 3. Send only new ones
      const promises = toSend.map((emp) =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ funcionario: emp.nome, empresa: selectedCompany, setor: selectedSector })
        })
      );
      const results = await Promise.all(promises);

      let okCount = 0;
      let errCount = 0;

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const emp = toSend[i];
        if (r.ok) {
          okCount++;
          remaining.delete(emp.id);
        } else if (r.status === 409) {
          dupCount++;
          remaining.delete(emp.id);
        } else {
          errCount++;
          // keep in selection so user can retry
        }
      }

      setSelectedIds(remaining);

      const parts = [] as string[];
      if (okCount) parts.push(`${okCount} registrados`);
      if (dupCount) parts.push(`${dupCount} duplicados pulados`);
      if (errCount) parts.push(`${errCount} erros`);
      alert(`Envio concluído: ${parts.join(', ') || 'nenhum registro'}.`);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar presenças');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-sky-900">Área do Educador</h1>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-gray-600 hover:underline">Sair</button>
      </header>

      <Card>
        <div className="flex flex-col gap-6">
          {step === 1 && (
            <section>
              <div className="text-sm text-sky-900 font-semibold mb-3">1. SELECIONE A EMPRESA</div>
              <div className="space-y-3">
                {companies.map((c) => (
                  <button key={c} onClick={() => onSelectCompany(c)} className="w-full text-left bg-white rounded-xl p-6 shadow-sm hover:shadow-md">
                    <div className="text-base font-medium text-slate-800">{c}</div>
                  </button>
                ))}
                {companies.length === 0 && <div className="text-sm text-gray-500">Nenhuma empresa encontrada.</div>}
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <div className="mb-4 flex items-center gap-4">
                <button className="text-sm text-gray-600" onClick={() => { setStep(1); setSelectedCompany(null); }}>← VOLTAR</button>
                <div className="text-sm text-sky-900 font-semibold">2. SETORES | {selectedCompany}</div>
              </div>

              <div className="space-y-3">
                {sectors.map((s) => (
                  <button key={s} onClick={() => onSelectSector(s)} className="w-full text-left bg-white rounded-xl p-6 shadow-sm hover:shadow-md">
                    <div className="text-base font-medium text-slate-800">{s}</div>
                  </button>
                ))}
                {sectors.length === 0 && <div className="text-sm text-gray-500">Nenhum setor encontrado para esta empresa.</div>}
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <div className="mb-4 flex items-center gap-4">
                <button className="text-sm text-gray-600" onClick={() => { setStep(2); setSelectedSector(null); }}>← SETORES</button>
                <div className="text-sm text-sky-900 font-semibold">3. FUNCIONÁRIOS | {selectedSector}</div>
              </div>

              <div className="text-xs text-gray-500 mb-3">CLIQUE PARA SELECIONAR/DESSELECIONAR.</div>

              <div className="space-y-3">
                {employees.map((e) => {
                  const isSelected = selectedIds.has(e.id);
                  return (
                    <button key={e.id} onClick={() => toggleSelect(e.id)} className={`w-full text-left rounded-xl p-6 shadow-sm flex items-center justify-between ${isSelected ? 'ring-2 ring-indigo-400 bg-indigo-50' : 'bg-white'} `}>
                      <div className="text-base font-medium text-slate-800">{e.nome}</div>
                      <div className="text-sm text-gray-500">{isSelected ? 'Selecionado' : ''}</div>
                    </button>
                  );
                })}
                {employees.length === 0 && <div className="text-sm text-gray-500">Nenhum funcionário encontrado.</div>}
              </div>

              <div className="mt-6 text-center">
                <button onClick={sendSelected} disabled={loading || selectedIds.size === 0} className="px-6 py-3 rounded-full bg-black text-white font-bold disabled:opacity-50">
                  {loading ? 'Enviando...' : `ENVIAR SELECIONADOS (${selectedIds.size})`}
                </button>
              </div>
            </section>
          )}
        </div>
      </Card>
    </main>
  );
}

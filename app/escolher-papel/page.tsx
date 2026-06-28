// github.com/dnlortega
// linkedin.com/in/daniel-op
"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LucideShieldCheck, LucideUserCheck, LucideLogOut, LucideShieldAlert, LucideLoader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export default function EscolherPapelPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<'admin' | 'educador' | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    if (status === 'authenticated') {
      const role = session?.user?.role;
      if (role && role !== 'pendente') {
        router.replace(role === 'admin' ? '/admin' : '/educator');
        return;
      }
      fetch('/api/admin/demo-mode')
        .then(r => r.json())
        .then(d => setDemoMode(d.enabled))
        .catch(() => setDemoMode(false));
    }
  }, [status, session, router]);

  const escolher = async (role: 'admin' | 'educador') => {
    setLoading(role);
    try {
      const res = await fetch('/api/escolher-papel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro ao definir papel'); return; }
      toast.success(`Bem-vindo como ${role === 'admin' ? 'Administrador' : 'Educador'}!`);
      await update();
      window.location.href = role === 'admin' ? '/admin' : '/educator';
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setLoading(null);
    }
  };

  if (status === 'loading' || demoMode === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LucideLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!demoMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
        <Card className="max-w-md w-full border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto ring-8 ring-orange-500/5">
              <LucideShieldAlert className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Acesso <span className="text-orange-500">Pendente</span>
              </h1>
              <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                Olá, <span className="text-primary font-bold">{session?.user?.email}</span>!<br />
                Aguarde o administrador liberar seu acesso ao{" "}
                <span className="font-black uppercase tracking-tighter">Presença.Pro</span>.
              </p>
            </div>
            <div className="bg-muted/50 border border-border rounded-2xl p-4 text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
              Assim que aprovado, você receberá acesso às ferramentas do sistema.
            </div>
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:bg-destructive/5 hover:text-destructive transition-all"
            >
              <LucideLogOut className="w-4 h-4" /> Sair do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
          Demo Mode
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          Como você quer explorar?
        </h1>
        <p className="text-muted-foreground text-sm">
          Escolha o perfil para acessar o <span className="font-black">Presença.Pro</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {/* Admin */}
        <button
          onClick={() => escolher('admin')}
          disabled={!!loading}
          className="group relative text-left rounded-3xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 p-6 space-y-4 disabled:opacity-60"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            {loading === 'admin'
              ? <LucideLoader2 className="w-7 h-7 animate-spin" />
              : <LucideShieldCheck className="w-7 h-7" />}
          </div>
          <div>
            <p className="font-black text-lg uppercase tracking-tight">Administrador</p>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              Acesso completo: dashboard, gestão de funcionários, relatórios e controle de usuários.
            </p>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-primary">
            Entrar como admin →
          </div>
        </button>

        {/* Educador */}
        <button
          onClick={() => escolher('educador')}
          disabled={!!loading}
          className="group relative text-left rounded-3xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 p-6 space-y-4 disabled:opacity-60"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            {loading === 'educador'
              ? <LucideLoader2 className="w-7 h-7 animate-spin" />
              : <LucideUserCheck className="w-7 h-7" />}
          </div>
          <div>
            <p className="font-black text-lg uppercase tracking-tight">Educador</p>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              Registre a chamada dos funcionários do seu setor de forma rápida e intuitiva.
            </p>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            Entrar como educador →
          </div>
        </button>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <LucideLogOut className="w-3.5 h-3.5" /> Usar outra conta
      </button>
    </div>
  );
}

// github.com/dnlortega
// linkedin.com/in/daniel-op
"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ModeToggle } from "../../components/ModeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', { username, password, redirect: false });
      if (res?.error) {
        setError('Usuário ou senha incorretos. Tente novamente.');
      } else {
        router.push('/');
      }
    } catch {
      setError('Erro ao conectar com o servidor.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Painel esquerdo — branding (desktop) */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Textura de fundo */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 0), radial-gradient(circle at 75% 75%, white 1px, transparent 0)', backgroundSize: '48px 48px' }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 text-center text-primary-foreground space-y-6 max-w-xs">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20 shadow-2xl animate-float">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">
              Presença<span className="italic opacity-80">.Pro</span>
            </h1>
            <p className="text-sm font-medium opacity-70 mt-2 tracking-wide">
              Controle Inteligente de Frequência
            </p>
          </div>
          <div className="space-y-3 text-left">
            {[
              'Gestão de presença em tempo real',
              'Relatórios por empresa e setor',
              'Acesso seguro com Google OAuth',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm opacity-80">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-6 text-[11px] text-primary-foreground/40">
          © 2026 Presença.Pro
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 page-transition relative">
        {/* Orbs de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

        <div className="absolute top-5 right-5">
          <ModeToggle />
        </div>

        <div className="w-full max-w-sm space-y-8 animate-scale-in">
          {/* Header mobile */}
          <div className="lg:hidden text-center space-y-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 mx-auto animate-float">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">
              Presença<span className="text-primary italic">.Pro</span>
            </h1>
          </div>

          {/* Header desktop */}
          <div className="hidden lg:block space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Faça login para acessar o painel.</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Usuário
              </Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  required
                  type="text"
                  placeholder="Seu usuário"
                  value={username}
                  onChange={e => { setUsername(e.target.value); if (error) setError(''); }}
                  className="pl-9 h-11 bg-muted/40 border-border/60 focus-visible:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Senha
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                  className="pl-9 pr-10 h-11 bg-muted/40 border-border/60 focus-visible:ring-primary/30 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/25 mt-1 transition-all hover:shadow-primary/40"
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
              ) : (
                <>Acessar Painel <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                ou continue com
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={googleLoading}
            onClick={() => { setGoogleLoading(true); signIn('google', { callbackUrl: '/' }); }}
            className="w-full h-11 border-border/60 bg-background hover:bg-muted/50 font-semibold text-sm gap-3 transition-all"
          >
            {googleLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 2.47 2.18 5.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Entrar com Google
          </Button>

          <p className="text-center text-[10px] text-muted-foreground/60">
            Ao entrar, você concorda com nossos Termos de Uso.
          </p>
        </div>
      </div>
    </div>
  );
}

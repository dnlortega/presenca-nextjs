"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  LucideShieldCheck,
  LucideUser,
  LucideLock,
  LucideArrowRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ModeToggle } from "../components/ModeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Acesso negado. Verifique suas credenciais.');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 page-transition relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      <div className="absolute top-6 right-6">
        <ModeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 mx-auto mb-4">
            <LucideShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Presença<span className="text-primary">.Pro</span></h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Controle Inteligente de Frequência</p>
        </div>

        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black tracking-tight">Entrar no Sistema</CardTitle>
            <CardDescription className="text-xs">Digite seus dados para acessar sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Usuário</label>
                <div className="relative group">
                  <LucideUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="text"
                    className="w-full bg-muted/30 border-none rounded-xl pl-11 pr-4 py-3 text-xs focus:ring-1 focus:ring-primary transition-all font-medium"
                    placeholder="Seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Senha</label>
                <div className="relative group">
                  <LucideLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="password"
                    className="w-full bg-muted/30 border-none rounded-xl pl-11 pr-4 py-3 text-xs focus:ring-1 focus:ring-primary transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 mt-2"
              >
                {loading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                  <>Acessar Painel <LucideArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">Ou continue com</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full h-12 rounded-xl border-border bg-transparent hover:bg-muted font-bold text-xs gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </CardContent>
          <CardFooter className="bg-muted/30 py-4 flex flex-col gap-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center w-full">Acesso de Demonstração</p>
            <div className="flex gap-2 w-full">
              <div onClick={() => { setUsername('admin'); setPassword('Admin#1234') }} className="flex-1 bg-card/50 p-2 rounded-lg border border-border cursor-pointer hover:border-primary transition-colors text-center">
                <span className="block text-[8px] font-bold text-muted-foreground">ADMIN</span>
                <span className="text-[9px] font-black">admin</span>
              </div>
              <div onClick={() => { setUsername('educador'); setPassword('Educador#123') }} className="flex-1 bg-card/50 p-2 rounded-lg border border-border cursor-pointer hover:border-primary transition-colors text-center">
                <span className="block text-[8px] font-bold text-muted-foreground">EDUCADOR</span>
                <span className="text-[9px] font-black">educador</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground font-medium">
          Ao entrar, você concorda com nossos Termos de Uso.
        </p>
      </div>
    </div>
  );
}

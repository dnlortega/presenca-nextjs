"use client";
import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', { redirect: false, username, password });
    setLoading(false);
    // @ts-ignore
    if (res?.ok) {
      const session = await getSession();
      // @ts-ignore
      const role = (session?.user as any)?.role;
      if (role === 'admin') router.push('/admin');
      else router.push('/educator');
    } else {
      // @ts-ignore
      setError(res?.error || 'Login falhou');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold text-center text-slate-900 tracking-tight mb-2">Sistema de Presença</h1>
        <p className="text-center text-gray-500 mb-6">Faça login para continuar</p>

        <hr className="my-4 border-t border-gray-100" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl p-4 bg-blue-50 text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-sm"
              placeholder="educador"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-xl p-4 bg-blue-50 text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-sm"
              placeholder=""
              required
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            type="submit"
            className="w-full bg-black text-white rounded-full py-4 font-bold tracking-widest hover:opacity-95 transition mt-2"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
        
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-lg">
          <div className="font-semibold text-gray-800 mb-1">Credenciais de teste</div>
          <div className="flex flex-col gap-1">
            <div><span className="font-medium">Admin:</span> <span className="text-black">admin</span> / <span className="text-black">Admin#1234</span></div>
            <div><span className="font-medium">Educador:</span> <span className="text-black">educador</span> / <span className="text-black">Educador#123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

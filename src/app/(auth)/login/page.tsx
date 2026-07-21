'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const err = new URLSearchParams(window.location.search).get('error');
      if (err === 'AccessDenied') {
        setError('Acceso denegado: Tu cuenta no pertenece al dominio @keranai.com o está desactivada.');
      } else if (err) {
        setError('Ocurrió un error al intentar iniciar sesión con Google.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError('Correo o contraseña incorrectos, o cuenta desactivada.');
      } else {
        // Redirigir a la página principal, donde el middleware o page.tsx se encargará de llevar al dashboard correcto.
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al intentar iniciar sesión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f] p-4 text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-600/20 blur-[130px]" />

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 font-bold text-white shadow-lg shadow-violet-600/30">
            V
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Sistema de Ventas Interno
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Ingresá tus credenciales para acceder al sistema
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-xl transition-all duration-200 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38C17.11,15.22,15.73,16.5,14,17.2l2.3,1.78c2.68-2.47,4.22-6.11,4.22-10.2A9.29,9.29,0,0,0,21.35,11.1Z" fill="#4285f4" />
                <path d="M12,20.4a8.21,8.21,0,0,0,5.7-2.08L15.4,16.54a5.27,5.27,0,0,1-8.15-2.8L4.85,15.54A9,9,0,0,0,12,20.4Z" fill="#34a853" />
                <path d="M7.25,13.74a5.3,5.3,0,0,1,0-3.48L4.85,8.46a9,9,0,0,0,0,7.08Z" fill="#fbbc05" />
                <path d="M12,7.08a4.91,4.91,0,0,1,3.48,1.37l2.6-2.6A8.77,8.77,0,0,0,12,3.6,9,9,0,0,0,4.85,8.46L7.25,10.26A5.27,5.27,0,0,1,12,7.08Z" fill="#ea4335" />
              </g>
            </svg>
            Acceso Administrador (Google)
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-xs uppercase font-medium">Acceso Vendedores (Correo)</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ventas.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition duration-200 focus:border-violet-500 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition duration-200 focus:border-violet-500 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative mt-2 flex w-full items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Iniciar Sesión (Vendedor)'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Uso interno. Reservado para personal autorizado.
        </div>
      </div>
    </main>
  );
}


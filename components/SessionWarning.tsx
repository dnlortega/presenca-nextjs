"use client";
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';

const WARN_AFTER = 18 * 60 * 1000; // warn at 18 min of inactivity
const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function SessionWarning() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef<string | number | null>(null);

  const scheduleWarn = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      toastId.current = toast.warning('Sua sessão expirará em 2 minutos por inatividade.', {
        duration: 120_000,
        action: {
          label: 'Manter sessão',
          onClick: () => {
            // Ping the session endpoint to reset the JWT maxAge
            fetch('/api/auth/session').catch(() => null);
            scheduleWarn();
          },
        },
        cancel: {
          label: 'Sair agora',
          onClick: () => signOut({ callbackUrl: '/login' }),
        },
      });
    }, WARN_AFTER);
  };

  const resetTimer = () => {
    if (toastId.current) {
      toast.dismiss(toastId.current);
      toastId.current = null;
    }
    scheduleWarn();
  };

  useEffect(() => {
    scheduleWarn();
    EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  return null;
}

import { NextResponse } from 'next/server';

/**
 * Headers para desabilitar completamente o cache
 * Garante que todas as respostas sejam sempre buscadas do banco de dados
 */
export const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

/**
 * Wrapper para NextResponse.json com headers de no-cache
 */
export function jsonResponse(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...noCacheHeaders,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}


/**
 * Fetch helper que sempre desabilita cache
 * Garante que todas as requisições busquem dados frescos do banco
 */
export async function fetchNoCache(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, {
    ...init,
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...init?.headers,
    },
  });
}


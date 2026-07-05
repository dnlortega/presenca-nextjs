# Presença Pro

Sistema de controle inteligente de frequência para empresas/setores, com autenticação por papel (admin, educador, suporte, pendente).

## Funcionalidades

- Login via Google (NextAuth) com fluxo de escolha de papel para novos usuários.
- **Admin**: empresas, setores, funcionários, usuários e permissões, relatórios com exportação CSV, log de auditoria, configurações do sistema.
- **Educador**: registro de presença dos funcionários do seu setor, histórico e presença retroativa.
- Exportação de relatórios filtrados por empresa/setor/período.
- PWA instalável (Android/iOS) com fallback offline.
- Rate limiting, CSP e hardening de autorização nas rotas da API.

## Stack

Next.js (App Router) · TypeScript · NextAuth · Prisma + PostgreSQL · Tailwind CSS · shadcn/ui · Recharts

## Rodando localmente

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Variáveis de ambiente necessárias (`.env`):

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SUPERADMIN_EMAIL=            # e-mail promovido automaticamente a admin
```

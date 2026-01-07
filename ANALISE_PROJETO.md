# Análise do Projeto Presença Pro

## 📋 Visão Geral

**Presença Pro** é um sistema de controle de frequência desenvolvido em Next.js 15 com TypeScript, utilizando Prisma ORM e PostgreSQL. O sistema gerencia presença de funcionários por empresa e setor, com diferentes níveis de acesso (admin, educador, suporte, pendente).

---

## 🏗️ Arquitetura

### Stack Tecnológica
- **Framework**: Next.js 15.1.6 (App Router)
- **Linguagem**: TypeScript 5.7.3
- **ORM**: Prisma 6.19.1
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js 4.24.13
- **UI**: React 19, Tailwind CSS 4.0, Radix UI
- **Gráficos**: Recharts 3.6.0

### Estrutura de Diretórios
```
presenca/
├── app/                    # Next.js App Router
│   ├── admin/             # Painel administrativo
│   ├── educator/          # Painel do educador
│   ├── login/             # Página de login
│   └── api/               # API Routes
│       ├── admin/         # Endpoints administrativos
│       ├── attendance/    # Controle de presença
│       ├── auth/          # Autenticação
│       └── ...
├── components/            # Componentes React
│   ├── ui/               # Componentes UI (shadcn/ui)
│   └── ...
├── lib/                   # Utilitários e configurações
│   ├── auth.ts           # Configuração NextAuth
│   ├── prisma.ts         # Cliente Prisma
│   └── utils.ts          # Funções utilitárias
└── prisma/               # Schema e migrations
    └── schema.prisma     # Modelo de dados
```

---

## 🗄️ Modelo de Dados

### Entidades Principais

1. **usuarios** - Usuários do sistema
   - Roles: `admin`, `educador`, `suporte`, `pendente`
   - Suporte a autenticação por credenciais e Google OAuth

2. **empresas** - Empresas cadastradas
   - Relacionamento N:N com usuários via `usuario_empresas`

3. **setores** - Setores dentro de empresas
   - Status: `ativo` (padrão)
   - Cascade delete com empresa

4. **funcionarios** - Funcionários
   - Vinculados a empresa e setor
   - Campo `valor` (Decimal) - possível uso para salário/valor

5. **presenca** - Registros de presença
   - Data/hora com timezone de São Paulo (UTC-3)
   - Cascade delete com funcionário

### Relacionamentos
- `usuarios` ↔ `empresas` (N:N via `usuario_empresas`)
- `empresas` → `setores` (1:N)
- `empresas` → `funcionarios` (1:N)
- `setores` → `funcionarios` (1:N)
- `funcionarios` → `presenca` (1:N)

---

## 🔐 Segurança

### ✅ Pontos Positivos

1. **Autenticação Robusta**
   - NextAuth.js com JWT
   - Suporte a múltiplos providers (Credentials + Google OAuth)
   - Hash de senhas com bcryptjs
   - Proteção de rotas por role

2. **Validação de Sessão**
   - Verificação de sessão em todas as rotas protegidas
   - Redirecionamento automático para login

3. **Sanitização de Inputs**
   - Trim de username e password no login
   - Validação de tipos em endpoints

### ⚠️ Vulnerabilidades Críticas

#### 1. **SQL Injection (CRÍTICO)**
**Localização**: `lib/auth.ts`, `app/api/admin/dashboard/route.ts`, `app/api/admin/users/[id]/route.ts`

**Problema**: Uso extensivo de `$queryRawUnsafe` e `$executeRawUnsafe` com interpolação direta.

**Exemplos**:
```typescript
// lib/auth.ts:23
const users = await prisma.$queryRawUnsafe<any[]>(
    'SELECT * FROM "usuarios" WHERE "username" = $1 LIMIT 1',
    cleanUsername
);
```

**Risco**: Embora use placeholders ($1, $2), o uso de `$queryRawUnsafe` é perigoso. Deve-se usar `$queryRaw` com template strings ou preferir queries do Prisma Client.

**Recomendação**:
```typescript
// Substituir por:
const user = await prisma.usuarios.findFirst({
    where: { username: cleanUsername }
});
```

#### 2. **Falta de Rate Limiting**
- Endpoints de autenticação e presença não possuem proteção contra brute force
- Recomendação: Implementar rate limiting (ex: `next-rate-limit`)

#### 3. **Exposição de Credenciais no Frontend**
**Localização**: `app/login/page.tsx:159-166`

```typescript
<div onClick={() => { setUsername('admin'); setPassword('Admin#1234') }}>
```

**Problema**: Credenciais de demonstração hardcoded no código frontend.

**Recomendação**: Remover ou mover para variáveis de ambiente (apenas para desenvolvimento).

#### 4. **Falta de Validação de CSRF**
- NextAuth protege contra CSRF, mas validações adicionais podem ser necessárias

#### 5. **Timezone Hardcoded**
**Localização**: `app/api/attendance/route.ts:9-18`

```typescript
function getSaoPauloDate() {
  const offset = -3 * 60 * 60 * 1000; // -3 hours
  // ...
}
```

**Problema**: Timezone fixo pode causar problemas em diferentes regiões.

**Recomendação**: Usar biblioteca como `date-fns-tz` ou `luxon` para timezone handling.

---

## 🐛 Problemas de Código

### 1. **Type Safety Fraco**

**Problema**: Uso excessivo de `any` e type assertions.

**Exemplos**:
```typescript
// lib/auth.ts:38
return { id: user.id.toString(), name: user.username, role: user.role };

// app/admin/page.tsx:10
const s: any = session;
```

**Recomendação**: Criar tipos/interfaces adequados e remover `any`.

### 2. **Queries SQL Raw Desnecessárias**

**Problema**: Muitas queries que poderiam usar Prisma Client são feitas com SQL raw.

**Exemplo**: `app/api/admin/dashboard/route.ts` usa `$queryRawUnsafe` para queries simples que o Prisma suporta nativamente.

**Recomendação**: Migrar para Prisma Client sempre que possível.

### 3. **Tratamento de Erros Inconsistente**

**Problema**: Alguns endpoints retornam apenas `{ error: 'Server error' }` sem logs detalhados.

**Recomendação**: Implementar logging estruturado e mensagens de erro mais específicas (sem expor detalhes sensíveis).

### 4. **Falta de Validação de Schema**

**Problema**: Validação de dados de entrada limitada.

**Recomendação**: Usar biblioteca de validação como `zod` ou `yup`.

### 5. **Duplicação de Código**

**Problema**: Funções de timezone (`getSaoPauloDate`, `getDayRange`) duplicadas em múltiplos arquivos.

**Recomendação**: Centralizar em utilitário compartilhado.

---

## 📊 Qualidade do Código

### Pontos Positivos ✅

1. **Estrutura Organizada**
   - Separação clara de responsabilidades
   - Uso do App Router do Next.js 15
   - Componentes reutilizáveis

2. **UI Moderna**
   - Design system com shadcn/ui
   - Suporte a dark mode
   - Animações e transições

3. **TypeScript**
   - Projeto tipado (embora com melhorias necessárias)

### Pontos de Melhoria ⚠️

1. **Testes Ausentes**
   - Nenhum teste unitário ou de integração
   - Recomendação: Adicionar Jest/Vitest + Testing Library

2. **Documentação**
   - README genérico do Next.js
   - Falta documentação de API e setup
   - Recomendação: Documentar endpoints e fluxos

3. **Linting**
   - ESLint configurado mas sem regras customizadas
   - Recomendação: Adicionar regras de qualidade (ex: `@typescript-eslint`)

4. **Performance**
   - Falta de cache em queries frequentes
   - N+1 queries potenciais
   - Recomendação: Implementar cache (Redis) e otimizar queries

---

## 🔄 Fluxos Principais

### 1. Autenticação
```
Login → NextAuth → JWT Token → Session → Role Check → Redirect
```

### 2. Registro de Presença (Educador)
```
Selecionar Empresa → Selecionar Setor → Selecionar Funcionários → POST /api/attendance
```

### 3. Dashboard Admin
```
GET /api/admin/dashboard → Agregações SQL → Retorna estatísticas
```

---

## 📈 Métricas e Estatísticas

### Complexidade
- **Arquivos TypeScript/TSX**: ~20
- **Componentes React**: ~10
- **API Routes**: ~15
- **Modelos Prisma**: 5

### Dependências
- **Produção**: 15 pacotes
- **Desenvolvimento**: 7 pacotes
- **Tamanho estimado**: ~50MB (node_modules)

---

## 🚀 Recomendações Prioritárias

### 🔴 Crítico (Fazer Imediatamente)

1. **Substituir `$queryRawUnsafe` por Prisma Client**
   - Refatorar `lib/auth.ts`
   - Refatorar `app/api/admin/dashboard/route.ts`
   - Refatorar outros endpoints com SQL raw

2. **Remover Credenciais do Frontend**
   - Remover hardcoded credentials de `app/login/page.tsx`

3. **Implementar Rate Limiting**
   - Proteger endpoints de autenticação
   - Proteger endpoints de presença

### 🟡 Importante (Próximas Sprints)

4. **Melhorar Type Safety**
   - Criar tipos/interfaces para todas as entidades
   - Remover `any` e type assertions desnecessárias

5. **Adicionar Validação de Schema**
   - Implementar Zod para validação de inputs
   - Validar todos os endpoints

6. **Centralizar Utilitários**
   - Criar `lib/date-utils.ts` para funções de timezone
   - Reutilizar código duplicado

### 🟢 Desejável (Backlog)

7. **Adicionar Testes**
   - Testes unitários para utilitários
   - Testes de integração para API routes
   - Testes E2E para fluxos principais

8. **Melhorar Documentação**
   - README detalhado
   - Documentação de API (Swagger/OpenAPI)
   - Guia de contribuição

9. **Otimizar Performance**
   - Implementar cache
   - Otimizar queries N+1
   - Adicionar paginação

10. **Monitoramento e Logging**
    - Implementar logging estruturado
    - Adicionar error tracking (Sentry)
    - Métricas de performance

---

## 📝 Checklist de Segurança

- [ ] Substituir SQL raw por Prisma Client
- [ ] Remover credenciais hardcoded
- [ ] Implementar rate limiting
- [ ] Adicionar validação de inputs (Zod)
- [ ] Implementar CORS adequado
- [ ] Adicionar headers de segurança (helmet)
- [ ] Revisar permissões de roles
- [ ] Implementar auditoria de ações críticas
- [ ] Adicionar 2FA (opcional, mas recomendado)
- [ ] Revisar variáveis de ambiente expostas

---

## 🎯 Conclusão

O projeto **Presença Pro** apresenta uma base sólida com arquitetura moderna e UI bem desenvolvida. No entanto, existem **vulnerabilidades críticas de segurança** que devem ser corrigidas imediatamente, principalmente relacionadas ao uso de SQL raw e exposição de credenciais.

**Prioridade**: Focar em segurança antes de adicionar novas funcionalidades.

**Score Geral**: 6.5/10
- Arquitetura: 8/10
- Segurança: 4/10 ⚠️
- Código: 7/10
- UI/UX: 8/10
- Documentação: 3/10
- Testes: 0/10

---

**Data da Análise**: 2025-01-27
**Versão Analisada**: Baseado em Next.js 15.1.6


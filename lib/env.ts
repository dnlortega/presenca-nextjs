// github.com/dnlortega
// linkedin.com/in/daniel-op
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL ausente'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET ausente'),
  NEXTAUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SUPERADMIN_EMAIL: z.string().email().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  result.error.issues.forEach(i =>
    console.error(`  - ${i.path.join('.')}: ${i.message}`)
  );
  process.exit(1);
}

export const env = result.data;

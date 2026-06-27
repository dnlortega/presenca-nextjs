import { z } from 'zod';

export const employeeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(255),
  empresa_id: z.coerce.number().int().positive(),
  setor_id: z.coerce.number().int().positive(),
  valor: z.coerce.number().optional().nullable(),
});

export const companySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
});

export const sectorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
  nomes: z.array(z.string().min(1).max(255)).optional(),
  empresa_id: z.coerce.number().int().positive(),
});

export const attendancePostSchema = z.object({
  employeeIds: z.array(z.number().int().positive()).min(1, 'Pelo menos um funcionário é obrigatório'),
});

export const userUpdateSchema = z.object({
  role: z.enum(['admin', 'educador', 'suporte', 'pendente']).optional(),
  empresas: z.array(z.string()).optional(),
  can_register: z.boolean().optional(),
  can_edit: z.boolean().optional(),
});

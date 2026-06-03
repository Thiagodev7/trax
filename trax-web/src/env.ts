import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_BASE_DOMAIN: z.string().default('traxsolucoes.com.br'),
  API_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Extrai do process.env e converte Next.js prefixos se necessário
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN,
  API_URL: process.env.API_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuração de ambiente inválida');
}

export const env = parsed.data;

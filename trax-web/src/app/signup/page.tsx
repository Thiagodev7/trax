'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Building, Globe } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  agencyName: z.string().min(3, 'Nome da agência é obrigatório'),
  slug: z.string().min(3, 'Slug precisa ter no mínimo 3 caracteres').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hifens'),
  adminName: z.string().min(3, 'Seu nome é obrigatório'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const slugValue = watch('slug');

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/v1/onboarding/agency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar agência');
      }

      toast.success('Agência criada com sucesso! Bem-vindo ao Trax.');
      
      // Redirecionar para o subdomínio ou para o login local
      const isLocalhost = window.location.hostname === 'localhost';
      if (isLocalhost) {
        router.push('/login');
      } else {
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'trax.app';
        window.location.href = `https://${data.slug}.${baseDomain}/login`;
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0F172A]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-30 blur-3xl bg-[#6366F1]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-30 blur-3xl bg-[#F59E0B]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
        <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-[#334155]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Crie sua Agência no Trax</h1>
            <p className="text-sm text-slate-400">
              14 dias de teste grátis. Não precisa de cartão.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Agency Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Agência</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('agencyName')}
                  placeholder="Minha Agência Digital"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {errors.agencyName && <p className="text-xs text-red-400 mt-1">{errors.agencyName.message}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Domínio da Plataforma</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('slug')}
                  placeholder="minha-agencia"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {slugValue && (
                <p className="text-xs text-slate-400 mt-1">Seu portal ficará em: <span className="font-semibold text-indigo-400">{slugValue}.trax.app</span></p>
              )}
              {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>}
            </div>

            <hr className="border-slate-700 my-6" />

            {/* Admin Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Seu Nome</label>
              <input
                {...register('adminName')}
                placeholder="João Silva"
                className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {errors.adminName && <p className="text-xs text-red-400 mt-1">{errors.adminName.message}</p>}
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Seu Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  {...register('adminEmail')}
                  placeholder="joao@minhaagencia.com.br"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {errors.adminEmail && <p className="text-xs text-red-400 mt-1">{errors.adminEmail.message}</p>}
            </div>

            {/* Admin Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Sua Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  {...register('adminPassword')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {errors.adminPassword && <p className="text-xs text-red-400 mt-1">{errors.adminPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Criando...</>
              ) : (
                'Criar minha conta grátis'
              )}
            </button>
            
            <p className="text-center text-sm text-slate-400 mt-4">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-indigo-400 hover:underline">
                Faça login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

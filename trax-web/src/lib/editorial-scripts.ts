export interface EditorialScript {
  format: string;
  color: string;
  produto: string;
  title: string;
  hook: string;
  structure: string[];
  tip: string;
}

export const DEFAULT_EDITORIAL_SCRIPTS: EditorialScript[] = [
  {
    format: 'REEL',
    color: '#dd2a7b',
    produto: 'TGC',
    title: 'Reel de Tutorial — NF-e',
    hook: 'Você sabia que dá pra emitir NF-e em menos de 1 minuto?',
    structure: [
      'Hook (0–3s): Mostre o problema — processo lento e manual',
      'Demonstração: passo a passo rápido no sistema TGC',
      'CTA: "Comente DEMO e te mandamos um acesso gratuito"',
    ],
    tip: 'Reels com demonstração de produto têm 40% mais alcance orgânico.',
  },
  {
    format: 'CARROSSEL',
    color: '#F59E0B',
    produto: 'DP',
    title: '5 Erros na Folha de Pagamento',
    hook: '5 erros que fazem empresas pagarem multa no eSocial todo mês',
    structure: [
      'Slide 1: Hook com número de autuações em 2025',
      'Slides 2–6: Um erro por slide com como evitar',
      'Último slide: "Quer folha sem erro? Link na bio"',
    ],
    tip: 'Carrosséis têm 3× mais saves — excelente para o algoritmo.',
  },
  {
    format: 'IMAGE',
    color: '#6366F1',
    produto: 'Ordix',
    title: 'Post de Dado Impactante',
    hook: '87% dos estoques brasileiros têm divergência. O seu está no controle?',
    structure: [
      'Visual: número grande em fundo escuro com destaque colorido',
      'Copy: contextualize o dado e conecte ao Ordix',
      'CTA: "Siga para mais dados do setor"',
    ],
    tip: 'Posts com estatísticas têm 2× mais compartilhamentos.',
  },
  {
    format: 'STORIES',
    color: '#8134af',
    produto: 'Box',
    title: 'Stories de Enquete',
    hook: 'Qual é o maior problema da sua empresa hoje?',
    structure: [
      'Story 1: Enquete — A: custo alto  B: falta de controle',
      'Story 2: Revele o resultado + "a maioria escolheu X — e nós resolvemos"',
      'Story 3: Link direto para formulário de demonstração',
    ],
    tip: 'Stories com enquetes têm 20% mais retenção e geram leads qualificados.',
  },
  {
    format: 'REEL',
    color: '#10B981',
    produto: 'QIAE',
    title: 'Antes e Depois — Qualidade',
    hook: 'Como reduzir retrabalho na produção em 30 dias',
    structure: [
      'Antes: caos na linha de produção',
      'Depois: dashboard QIAE com indicadores em tempo real',
      'CTA: agende uma demonstração',
    ],
    tip: 'Reels "antes/depois" convertem bem em B2B industrial.',
  },
  {
    format: 'CARROSSEL',
    color: '#3B82F6',
    produto: 'TGC',
    title: 'Checklist Fiscal do Mês',
    hook: '7 obrigações que sua contabilidade não pode esquecer este mês',
    structure: [
      'Um item por slide com prazo e multa',
      'Slide final: "Automatize com TGC"',
    ],
    tip: 'Conteúdo checklist gera alto save rate.',
  },
  {
    format: 'IMAGE',
    color: '#8B5CF6',
    produto: 'Institucional',
    title: 'Bastidores Tron',
    hook: 'Conheça o time por trás dos sistemas que movem o Brasil',
    structure: [
      'Foto do time ou escritório',
      'Copy humanizada sobre cultura e missão',
      'CTA: "Trabalhe conosco" ou "Conheça nossos produtos"',
    ],
    tip: 'Posts institucionais fortalecem confiança da marca.',
  },
  {
    format: 'REEL',
    color: '#F59E0B',
    produto: 'DP',
    title: 'Mito vs Verdade — eSocial',
    hook: '3 mitos sobre eSocial que custam caro',
    structure: [
      'Mito 1 → Verdade (15s cada)',
      'CTA: "Evite multas com Tron DP"',
    ],
    tip: 'Formato mito/verdade gera comentários e alcance.',
  },
];

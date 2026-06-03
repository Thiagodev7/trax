/**
 * Scripts editoriais padrão para seção de conteúdo orgânico.
 * Estes são exemplos genéricos — cada cliente pode ter seus próprios scripts
 * configurados na seção de Conteúdo do relatório.
 */

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
    produto: 'Produto Principal',
    title: 'Reel de Tutorial — Como usar em 1 minuto',
    hook: 'Você sabia que dá pra resolver isso em menos de 1 minuto?',
    structure: [
      'Hook (0–3s): Mostre o problema do cliente antes da solução',
      'Demonstração: passo a passo rápido no produto/serviço',
      'CTA: "Comente DEMO e te mandamos um acesso gratuito"',
    ],
    tip: 'Reels com demonstração de produto têm 40% mais alcance orgânico.',
  },
  {
    format: 'CARROSSEL',
    color: '#F59E0B',
    produto: 'Solução Principal',
    title: '5 Erros que custam caro — e como evitar',
    hook: '5 erros que fazem empresas perderem dinheiro todo mês',
    structure: [
      'Slide 1: Hook com dado ou estatística impactante',
      'Slides 2–6: Um erro por slide com como evitar',
      'Último slide: "Quer resolver? Link na bio"',
    ],
    tip: 'Carrosséis têm 3× mais saves — excelente para o algoritmo.',
  },
  {
    format: 'IMAGE',
    color: '#6366F1',
    produto: 'Produto / Segmento',
    title: 'Post de Dado Impactante',
    hook: '87% das empresas do setor têm este problema. A sua está no controle?',
    structure: [
      'Visual: número grande em fundo escuro com destaque colorido',
      'Copy: contextualize o dado e conecte ao produto/serviço',
      'CTA: "Siga para mais dados do setor"',
    ],
    tip: 'Posts com estatísticas têm 2× mais compartilhamentos.',
  },
  {
    format: 'STORIES',
    color: '#8134af',
    produto: 'Produto / Serviço',
    title: 'Stories de Enquete',
    hook: 'Qual é o maior problema da sua empresa hoje?',
    structure: [
      'Story 1: Enquete — A: Opção 1  B: Opção 2',
      'Story 2: Revele o resultado + "a maioria escolheu X — e nós resolvemos"',
      'Story 3: Link direto para formulário de demonstração',
    ],
    tip: 'Stories com enquetes têm 20% mais retenção e geram leads qualificados.',
  },
  {
    format: 'REEL',
    color: '#10B981',
    produto: 'Produto / Solução',
    title: 'Antes e Depois — Resultados Reais',
    hook: 'Como nosso cliente reduziu custos em 30 dias',
    structure: [
      'Antes: mostre o cenário do problema',
      'Depois: resultado concreto com números',
      'CTA: "Agende uma demonstração gratuita"',
    ],
    tip: 'Reels "antes/depois" convertem bem em B2B e B2C.',
  },
  {
    format: 'CARROSSEL',
    color: '#3B82F6',
    produto: 'Segmento do Cliente',
    title: 'Checklist do Mês',
    hook: '7 pontos que sua equipe não pode esquecer este mês',
    structure: [
      'Um item por slide com prazo e consequência',
      'Slide final: "Automatize — [produto/serviço]"',
    ],
    tip: 'Conteúdo checklist gera alto save rate.',
  },
  {
    format: 'IMAGE',
    color: '#8B5CF6',
    produto: 'Marca / Empresa',
    title: 'Bastidores da Equipe',
    hook: 'Conheça o time por trás dos resultados',
    structure: [
      'Foto do time, escritório ou processo',
      'Copy humanizada sobre cultura e missão',
      'CTA: "Trabalhe conosco" ou "Conheça nossos serviços"',
    ],
    tip: 'Posts institucionais fortalecem confiança da marca.',
  },
  {
    format: 'REEL',
    color: '#F59E0B',
    produto: 'Produto / Serviço',
    title: 'Mito vs Verdade',
    hook: '3 mitos sobre [área de atuação] que custam caro',
    structure: [
      'Mito → Verdade (15s cada)',
      'CTA: "Evite erros comuns — [produto/serviço]"',
    ],
    tip: 'Formato mito/verdade gera comentários e alcance orgânico.',
  },
];

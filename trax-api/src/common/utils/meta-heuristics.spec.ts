import {
  campaignCodeFromName,
  detectProduct,
  detectStates,
} from './meta-heuristics';
import { defaultMetaConfig, type MetaConfigShape } from '@/modules/company/meta-config/meta-config.template';

describe('meta-heuristics', () => {
  const config = defaultMetaConfig();

  const minimalProductConfig: MetaConfigShape = {
    ...defaultMetaConfig(),
    products: [
      { key: 'tgc', label: 'TGC', color: '#6366F1', monthlyBudgetTarget: 100, namePatterns: ['\\bTGC\\b'] },
      { key: 'ordix', label: 'Ordix', color: '#F59E0B', monthlyBudgetTarget: 100, namePatterns: ['ORDIX'] },
    ],
    states: config.states,
  };

  describe('detectProduct', () => {
    it('detects product key from isolated name patterns', () => {
      expect(detectProduct('Campanha TGC Conversão', minimalProductConfig)).toBe('tgc');
      expect(detectProduct('ORDIX Lead Gen', minimalProductConfig)).toBe('ordix');
    });
  });

  describe('detectStates', () => {
    it('detects state codes from campaign naming', () => {
      const states = detectStates('MR [GO] Produto X', config);
      expect(states).toContain('GO');
    });
  });

  describe('campaignCodeFromName', () => {
    it('maps MR prefix to MR code', () => {
      expect(campaignCodeFromName('MR Conversão')).toBe('MR');
    });

    it('maps Rio Verde patterns', () => {
      expect(campaignCodeFromName('CONT_RV Lead')).toBe('CONT_RV');
    });
  });
});

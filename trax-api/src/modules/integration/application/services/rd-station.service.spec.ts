import { classifyRdStage } from './rd-station.service';

describe('classifyRdStage', () => {
  it('maps customer lifecycle stages', () => {
    expect(classifyRdStage('Customer')).toBe('customer');
    expect(classifyRdStage('Client')).toBe('customer');
    expect(classifyRdStage('Cliente')).toBe('customer');
    expect(classifyRdStage('lifecycle_customer')).toBe('customer');
  });

  it('maps qualified lead stages', () => {
    expect(classifyRdStage('Qualified Lead')).toBe('qualifiedLead');
    expect(classifyRdStage('Lead Qualificado')).toBe('qualifiedLead');
    expect(classifyRdStage('qualified')).toBe('qualifiedLead');
  });

  it('defaults to lead when missing or unknown', () => {
    expect(classifyRdStage(undefined)).toBe('lead');
    expect(classifyRdStage('')).toBe('lead');
    expect(classifyRdStage('Lead')).toBe('lead');
  });
});

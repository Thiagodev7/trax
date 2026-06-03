import { extractLeads, META_LEAD_ACTION_TYPES } from './meta-ads.service';

describe('extractLeads', () => {
  it('sums lead action types from Meta insights', () => {
    const actions = [
      { action_type: 'lead', value: '3' },
      { action_type: 'onsite_conversion.lead_grouped', value: '2' },
      { action_type: 'link_click', value: '10' },
    ];
    expect(extractLeads(actions)).toBe(5);
  });

  it('includes offsite_conversion.fb_pixel_lead', () => {
    expect(
      extractLeads([{ action_type: 'offsite_conversion.fb_pixel_lead', value: '7' }]),
    ).toBe(7);
  });

  it('returns 0 when actions missing or empty', () => {
    expect(extractLeads(undefined)).toBe(0);
    expect(extractLeads([])).toBe(0);
  });

  it('covers all configured lead action types', () => {
    expect(META_LEAD_ACTION_TYPES).toContain('lead');
    expect(META_LEAD_ACTION_TYPES.length).toBeGreaterThanOrEqual(3);
  });
});

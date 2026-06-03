/**
 * Agregação de spend/leads por período (lógica espelhada do use case).
 */
function aggregateCampaignRows(
  rows: Array<{ date: string; spend: number; leads: number }>,
  start: string,
  end: string,
) {
  let spend = 0;
  let leads = 0;
  for (const row of rows) {
    if (row.date >= start && row.date <= end) {
      spend += row.spend;
      leads += row.leads;
    }
  }
  return { spend, leads };
}

describe('Meta ads period aggregation', () => {
  const rows = [
    { date: '2026-05-18', spend: 100, leads: 2 },
    { date: '2026-05-20', spend: 50, leads: 1 },
    { date: '2026-06-03', spend: 75, leads: 3 },
    { date: '2026-06-10', spend: 200, leads: 5 },
  ];

  it('sums only rows inside report period', () => {
    const result = aggregateCampaignRows(rows, '2026-05-20', '2026-06-03');
    expect(result.spend).toBe(125);
    expect(result.leads).toBe(4);
  });

  it('excludes dates outside range', () => {
    const result = aggregateCampaignRows(rows, '2026-06-01', '2026-06-03');
    expect(result.spend).toBe(75);
    expect(result.leads).toBe(3);
  });
});

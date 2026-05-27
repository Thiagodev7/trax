export function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function fmtNum(v: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(v))
}

export function fmtPct(v: number) {
  return `${v.toFixed(2)}%`
}

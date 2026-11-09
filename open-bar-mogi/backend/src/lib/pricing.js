// Mesma regra exibida no formulário da landing page.
// O valor é recalculado aqui para não confiar no que vem do navegador.
export const PRICING = {
  base: 1000,
  perGuest: 17,
  perExtra: 250,
  guestsPerBartender: 40,
}

export function estimateQuoteValue({ guests, extras }) {
  return PRICING.base + guests * PRICING.perGuest + extras.length * PRICING.perExtra
}

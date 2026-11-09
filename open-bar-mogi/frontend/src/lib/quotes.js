// Regras e formatações compartilhadas entre o formulário e o painel.

export const EXTRAS = ["Bar LED", "Drinks Premium", "Decoração do Bar", "Cardápio Personalizado"]

// Mesma regra usada pelo back-end (backend/src/lib/pricing.js).
export function estimateValue(guests, extrasCount) {
  return 1000 + (Number(guests) || 0) * 17 + extrasCount * 250
}

export function estimateBartenders(guests) {
  return Math.ceil((Number(guests) || 0) / 40) || 1
}

export const STATUS = {
  PENDENTE: {
    label: "Pendente",
    className: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
  },
  APROVADO: {
    label: "Aprovado",
    className: "text-green-500 bg-green-500/10 border-green-500/30",
  },
  RECUSADO: {
    label: "Recusado",
    className: "text-red-400 bg-red-400/10 border-red-400/30",
  },
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

// "2026-06-12" -> "12/06/2026" (sem passar por Date para não sofrer com fuso).
export function formatDate(isoDate) {
  if (!isoDate) return "—"
  const [year, month, day] = isoDate.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}

export function formatDateTime(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export function whatsappLink(phone) {
  let digits = String(phone || "").replace(/\D/g, "")
  if (digits.length <= 11) digits = `55${digits}`
  return `https://wa.me/${digits}`
}

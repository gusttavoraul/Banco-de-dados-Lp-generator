import { api, pick } from "./api"

// Público
export async function fetchPackages() {
  const { data } = await api.get("/packages")
  return pick(data, "packages", Array.isArray)
}

export async function createQuote(payload) {
  const { data } = await api.post("/quotes", payload)
  return pick(data, "quote")
}

// Admin (exige token)
export async function fetchQuotes(params = {}) {
  const { data } = await api.get("/quotes", { params })
  pick(data, "quotes", Array.isArray)
  return data // { quotes, stats }
}

export async function fetchQuote(id) {
  const { data } = await api.get(`/quotes/${id}`)
  return pick(data, "quote")
}

export async function updateQuoteStatus(id, payload) {
  const { data } = await api.put(`/quotes/${id}/status`, payload)
  return pick(data, "quote")
}

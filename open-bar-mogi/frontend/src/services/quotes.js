import { api } from "./api"

// Público
export async function fetchPackages() {
  const { data } = await api.get("/packages")
  return data.packages
}

export async function createQuote(payload) {
  const { data } = await api.post("/quotes", payload)
  return data.quote
}

// Admin (exige token)
export async function fetchQuotes(params = {}) {
  const { data } = await api.get("/quotes", { params })
  return data // { quotes, stats }
}

export async function fetchQuote(id) {
  const { data } = await api.get(`/quotes/${id}`)
  return data.quote
}

export async function updateQuoteStatus(id, payload) {
  const { data } = await api.put(`/quotes/${id}/status`, payload)
  return data.quote
}

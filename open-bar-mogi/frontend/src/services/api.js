import axios from "axios"

export const TOKEN_KEY = "obm_admin_token"
export const UNAUTHORIZED_EVENT = "auth:unauthorized"

export const api = axios.create({
  // Ordem: public/config.js (editável após a build) > VITE_API_URL > "/api" (proxy do Vite em dev).
  baseURL: window.OBM_API_URL || import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
})

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage indisponível (ex.: aba anônima bloqueada) — segue só em memória.
  }
}

// Envia o token JWT em toda requisição.
api.interceptors.request.use((request) => {
  const token = readToken()
  if (token) request.headers.Authorization = `Bearer ${token}`
  return request
})

// Token expirado/inválido: avisa o AuthContext para deslogar.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login")
    if (error.response?.status === 401 && !isLoginRequest) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

// Quando o endereço da API está errado, o servidor do site devolve o index.html
// (texto) em vez de JSON. Isso evita que a tela quebre e mostra um erro claro.
export class BadApiResponseError extends Error {}

export function pick(data, key, isValid = (value) => value != null) {
  if (data && typeof data === "object" && isValid(data[key])) return data[key]
  throw new BadApiResponseError(
    "A API respondeu algo inesperado. Confira o endereço da API (config.js ou VITE_API_URL).",
  )
}

export function getErrorMessage(error, fallback = "Algo deu errado. Tente novamente.") {
  if (error instanceof BadApiResponseError) return error.message
  if (error?.response?.data?.error) return error.response.data.error
  if (error?.code === "ECONNABORTED" || !error?.response) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão."
  }
  return fallback
}

export function getFieldErrors(error) {
  return error?.response?.data?.fields ?? {}
}

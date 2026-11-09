import { useCallback, useEffect, useMemo, useState } from "react"
import { AuthContext } from "./auth-context"
import { readToken, saveToken, UNAUTHORIZED_EVENT } from "../services/api"
import { fetchCurrentAdmin, loginRequest } from "../services/auth"

// status: "checking" (validando token salvo) | "authenticated" | "anonymous"
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [status, setStatus] = useState(() => (readToken() ? "checking" : "anonymous"))

  const logout = useCallback(() => {
    saveToken(null)
    setAdmin(null)
    setStatus("anonymous")
  }, [])

  // Ao abrir o site com um token salvo, confirma com a API se ele ainda vale.
  useEffect(() => {
    if (!readToken()) return

    let active = true
    fetchCurrentAdmin()
      .then((currentAdmin) => {
        if (!active) return
        setAdmin(currentAdmin)
        setStatus("authenticated")
      })
      .catch(() => {
        if (active) logout()
      })

    return () => {
      active = false
    }
  }, [logout])

  // Qualquer resposta 401 da API derruba a sessão.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const login = useCallback(async (email, password) => {
    const { token, admin: loggedAdmin } = await loginRequest(email, password)
    saveToken(token)
    setAdmin(loggedAdmin)
    setStatus("authenticated")
    return loggedAdmin
  }, [])

  const value = useMemo(
    () => ({
      admin,
      status,
      isAuthenticated: status === "authenticated",
      login,
      logout,
    }),
    [admin, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

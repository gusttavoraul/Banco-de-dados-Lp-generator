import { api } from "./api"

export async function loginRequest(email, password) {
  const { data } = await api.post("/auth/login", { email, password })
  return data // { token, admin }
}

export async function fetchCurrentAdmin() {
  const { data } = await api.get("/auth/me")
  return data.admin
}

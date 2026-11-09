import { api, pick } from "./api"

export async function loginRequest(email, password) {
  const { data } = await api.post("/auth/login", { email, password })
  pick(data, "token")
  return data // { token, admin }
}

export async function fetchCurrentAdmin() {
  const { data } = await api.get("/auth/me")
  return pick(data, "admin")
}

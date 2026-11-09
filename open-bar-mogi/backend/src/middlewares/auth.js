import jwt from "jsonwebtoken"
import { config } from "../config.js"
import { HttpError } from "../lib/http-error.js"

// Exige um header "Authorization: Bearer <token>" válido.
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || ""
  const [scheme, token] = header.split(" ")

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Faça login para continuar."))
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.admin = { id: payload.sub, email: payload.email, name: payload.name }
    return next()
  } catch {
    return next(new HttpError(401, "Sessão expirada. Faça login novamente."))
  }
}

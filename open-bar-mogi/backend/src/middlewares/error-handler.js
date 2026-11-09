import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import { HttpError } from "../lib/http-error.js"

export function notFound(_req, _res, next) {
  next(new HttpError(404, "Rota não encontrada."))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos.",
      fields: Object.fromEntries(err.issues.map((issue) => [issue.path.join("."), issue.message])),
    })
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado." })
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido." })
  }

  console.error(err)
  return res.status(500).json({ error: "Erro interno. Tente novamente em instantes." })
}

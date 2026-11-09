import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { config } from "../config.js"
import { prisma } from "../lib/prisma.js"
import { HttpError } from "../lib/http-error.js"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
})

// Hash usado quando o e-mail não existe, para a resposta levar o mesmo tempo
// e não revelar quais e-mails estão cadastrados.
const DUMMY_HASH = bcrypt.hashSync("senha-inexistente", 10)

function publicAdmin(admin) {
  return { id: admin.id, name: admin.name, email: admin.email }
}

export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body)

  const admin = await prisma.admin.findUnique({ where: { email } })
  const passwordOk = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH)

  if (!admin || !passwordOk) {
    throw new HttpError(401, "E-mail ou senha inválidos.")
  }

  const token = jwt.sign({ email: admin.email, name: admin.name }, config.jwtSecret, {
    subject: admin.id,
    expiresIn: config.jwtExpiresIn,
  })

  res.json({ token, admin: publicAdmin(admin) })
}

export async function me(req, res) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } })
  if (!admin) throw new HttpError(401, "Usuário não encontrado. Faça login novamente.")
  res.json({ admin: publicAdmin(admin) })
}

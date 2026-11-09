import "dotenv/config"

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não definida. Copie .env.example para .env e preencha.`)
  }
  return value
}

const isProduction = process.env.NODE_ENV === "production"

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 3333,
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Número de proxies na frente da API (Render, Railway etc. usam 1).
  // Necessário para o rate limit enxergar o IP real do visitante.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
}

required("DATABASE_URL")

if (isProduction && (config.jwtSecret.length < 32 || config.jwtSecret.startsWith("troque"))) {
  throw new Error("Em produção, JWT_SECRET precisa ser um valor aleatório com 32+ caracteres.")
}

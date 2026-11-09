import { Router } from "express"
import rateLimit from "express-rate-limit"
import { requireAuth } from "../middlewares/auth.js"
import { login, me } from "../controllers/auth.controller.js"
import { listPackages } from "../controllers/packages.controller.js"
import {
  createQuote,
  getQuote,
  listQuotes,
  updateQuoteStatus,
} from "../controllers/quotes.controller.js"

const limiter = (limit, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: message },
  })

const loginLimiter = limiter(10, 15, "Muitas tentativas de login. Aguarde 15 minutos.")
const quoteLimiter = limiter(20, 60, "Muitas solicitações enviadas. Tente novamente mais tarde.")

export const router = Router()

router.get("/health", (_req, res) => res.json({ ok: true }))

// Autenticação
router.post("/auth/login", loginLimiter, login)
router.get("/auth/me", requireAuth, me)

// Público
router.get("/packages", listPackages)
router.post("/quotes", quoteLimiter, createQuote)

// Protegido (painel admin)
router.get("/quotes", requireAuth, listQuotes)
router.get("/quotes/:id", requireAuth, getQuote)
router.put("/quotes/:id/status", requireAuth, updateQuoteStatus)

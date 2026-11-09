import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { HttpError } from "../lib/http-error.js"
import { estimateQuoteValue } from "../lib/pricing.js"
import { serializeQuote } from "../lib/serializers.js"

const STATUSES = ["PENDENTE", "APROVADO", "RECUSADO"]
const EXTRAS = ["Bar LED", "Drinks Premium", "Decoração do Bar", "Cardápio Personalizado"]

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null)

const createQuoteSchema = z.object({
  eventType: z.string().trim().min(2, "Informe o tipo de evento.").max(80),
  guests: z.coerce
    .number({ message: "Informe a quantidade de convidados." })
    .int("Use um número inteiro.")
    .min(1, "Mínimo de 1 convidado.")
    .max(5000, "Para mais de 5000 convidados, fale direto com a equipe."),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
    .refine((value) => {
      // Aceita a partir de ontem (UTC) para não barrar "hoje" por causa do fuso.
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      return value >= yesterday
    }, "A data do evento já passou."),
  duration: optionalText(40),
  location: optionalText(160),
  packageSlug: z.string().trim().min(1, "Escolha um pacote."),
  extras: z
    .array(z.enum(EXTRAS, { message: "Extra inválido." }))
    .max(EXTRAS.length)
    .default([])
    .transform((list) => [...new Set(list)]),
  name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(160),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Telefone inválido. Inclua o DDD."),
  notes: optionalText(1000),
})

const updateStatusSchema = z.object({
  status: z.enum(STATUSES, { message: `Status deve ser um de: ${STATUSES.join(", ")}.` }),
  adminNotes: z.string().trim().max(2000).optional(),
})

const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  search: z.string().trim().max(120).optional(),
})

const idSchema = z.string().uuid("ID inválido.")

const include = { client: true, package: true }

// POST /api/quotes (público) — recebe o formulário da landing page.
export async function createQuote(req, res) {
  const data = createQuoteSchema.parse(req.body)

  const pkg = await prisma.package.findFirst({ where: { slug: data.packageSlug, active: true } })
  if (!pkg) throw new HttpError(400, "Pacote inválido.")

  const quote = await prisma.$transaction(async (tx) => {
    const client = await tx.client.upsert({
      where: { email: data.email },
      update: { name: data.name, phone: data.phone },
      create: { name: data.name, email: data.email, phone: data.phone },
    })

    return tx.quote.create({
      data: {
        eventType: data.eventType,
        eventDate: new Date(`${data.eventDate}T00:00:00.000Z`),
        guests: data.guests,
        duration: data.duration,
        location: data.location,
        extras: data.extras,
        notes: data.notes,
        estimatedValue: estimateQuoteValue(data),
        clientId: client.id,
        packageId: pkg.id,
      },
      include,
    })
  })

  // O cliente só recebe o essencial: id, status e valor estimado.
  res.status(201).json({
    quote: { id: quote.id, status: quote.status, estimatedValue: Number(quote.estimatedValue) },
  })
}

// GET /api/quotes (admin) — lista + contadores para o dashboard.
export async function listQuotes(req, res) {
  const { status, search } = listQuerySchema.parse(req.query)

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { email: { contains: search, mode: "insensitive" } } },
        { eventType: { contains: search, mode: "insensitive" } },
      ],
    }),
  }

  const [quotes, grouped] = await Promise.all([
    prisma.quote.findMany({ where, include, orderBy: { createdAt: "desc" } }),
    prisma.quote.groupBy({ by: ["status"], _count: { _all: true }, _sum: { estimatedValue: true } }),
  ])

  const stats = { total: 0, PENDENTE: 0, APROVADO: 0, RECUSADO: 0, approvedRevenue: 0 }
  for (const row of grouped) {
    stats[row.status] = row._count._all
    stats.total += row._count._all
    if (row.status === "APROVADO") stats.approvedRevenue = Number(row._sum.estimatedValue ?? 0)
  }

  res.json({ quotes: quotes.map(serializeQuote), stats })
}

// GET /api/quotes/:id (admin)
export async function getQuote(req, res) {
  const id = idSchema.parse(req.params.id)
  const quote = await prisma.quote.findUnique({ where: { id }, include })
  if (!quote) throw new HttpError(404, "Orçamento não encontrado.")
  res.json({ quote: serializeQuote(quote) })
}

// PUT /api/quotes/:id/status (admin)
export async function updateQuoteStatus(req, res) {
  const id = idSchema.parse(req.params.id)
  const { status, adminNotes } = updateStatusSchema.parse(req.body)

  const quote = await prisma.quote.update({
    where: { id },
    data: { status, ...(adminNotes !== undefined && { adminNotes: adminNotes || null }) },
    include,
  })

  res.json({ quote: serializeQuote(quote) })
}

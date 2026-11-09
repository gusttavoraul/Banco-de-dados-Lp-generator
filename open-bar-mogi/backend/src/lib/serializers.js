// Converte registros do Prisma para o formato JSON devolvido pela API.
export function serializeQuote(quote) {
  return {
    id: quote.id,
    eventType: quote.eventType,
    eventDate: quote.eventDate.toISOString().slice(0, 10), // "AAAA-MM-DD"
    guests: quote.guests,
    duration: quote.duration,
    location: quote.location,
    extras: quote.extras,
    estimatedValue: Number(quote.estimatedValue),
    status: quote.status,
    notes: quote.notes,
    adminNotes: quote.adminNotes,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    client: quote.client && {
      id: quote.client.id,
      name: quote.client.name,
      email: quote.client.email,
      phone: quote.client.phone,
    },
    package: quote.package && {
      id: quote.package.id,
      slug: quote.package.slug,
      name: quote.package.name,
    },
  }
}

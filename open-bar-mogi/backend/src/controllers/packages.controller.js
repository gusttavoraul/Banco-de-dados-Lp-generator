import { prisma } from "../lib/prisma.js"

export async function listPackages(_req, res) {
  const packages = await prisma.package.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, description: true },
    orderBy: { createdAt: "asc" },
  })
  res.json({ packages })
}

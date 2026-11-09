// Popula o banco com os pacotes e com o primeiro administrador.
// Rode com: npm run db:seed
import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const packages = [
  {
    slug: "sem-alcool",
    name: "Sem álcool",
    description: "Drinks refrescantes sem álcool, frutas, sucos e combinações especiais.",
  },
  {
    slug: "alcoolico",
    name: "Alcoólico",
    description: "Caipirinhas de vodka, saquê e cachaça para eventos completos.",
  },
  {
    slug: "misto",
    name: "Misto",
    description: "Combinação de drinks alcoólicos e não alcoólicos para todos os convidados.",
  },
]

async function main() {
  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: { name: pkg.name, description: pkg.description },
      create: pkg,
    })
  }
  console.log(`✔ ${packages.length} pacotes prontos`)

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || "Administrador"

  if (!email || !password) {
    console.warn("⚠ ADMIN_EMAIL/ADMIN_PASSWORD não definidos no .env — nenhum admin criado.")
    return
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.")
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.admin.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash },
  })
  console.log(`✔ Admin pronto: ${email}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

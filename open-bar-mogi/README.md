# Open Bar Mogi — MVP

Landing page onde clientes pedem orçamento + painel `/admin` onde a equipe gerencia os pedidos.

```
open-bar-mogi/
├── backend/    API Node.js + Express + Prisma (PostgreSQL) + JWT
├── frontend/   React + Vite + Tailwind + React Router + Axios
└── docker-compose.yml   PostgreSQL local
```

## Rodando localmente

Pré-requisitos: Node.js 20+ e Docker (ou um PostgreSQL já instalado).

```bash
cd open-bar-mogi

# 1. Instala as dependências do back e do front
npm run setup

# 2. Sobe o PostgreSQL
npm run db:up

# 3. Configura as variáveis do back-end
cp backend/.env.example backend/.env
#    -> edite backend/.env: troque JWT_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD

# 4. Cria as tabelas e o primeiro admin (usa ADMIN_EMAIL / ADMIN_PASSWORD do .env)
npm run db:setup

# 5. Em dois terminais:
npm run dev:api   # http://localhost:3333/api
npm run dev:web   # http://localhost:5173
```

### Entrando no painel admin

1. Abra **http://localhost:5173/admin** (ou clique em "Área da equipe" no rodapé do site).
2. Sem login você é levado para `/admin/login`.
3. Entre com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` que você colocou no `backend/.env`.
4. A sessão dura `JWT_EXPIRES_IN` (padrão 8h). Depois disso, é só entrar de novo.

Para trocar a senha ou criar outro admin: altere `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env` e rode `npm run db:seed --prefix backend` de novo (ele atualiza se o e-mail já existir).

Para ver/editar os dados direto no banco: `npm run db:studio --prefix backend`.

## API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET  | `/api/health` | público | Verifica se a API está no ar |
| GET  | `/api/packages` | público | Lista os pacotes ativos |
| POST | `/api/quotes` | público | Recebe o formulário da landing page |
| POST | `/api/auth/login` | público | `{ email, password }` → `{ token, admin }` |
| GET  | `/api/auth/me` | admin | Dados do admin logado |
| GET  | `/api/quotes?status=&search=` | admin | Lista orçamentos + contadores |
| GET  | `/api/quotes/:id` | admin | Detalhe de um orçamento |
| PUT  | `/api/quotes/:id/status` | admin | `{ status, adminNotes? }` — status: `PENDENTE`, `APROVADO`, `RECUSADO` |

Rotas de admin exigem o header `Authorization: Bearer <token>`.

Exemplo de envio de orçamento:

```json
POST /api/quotes
{
  "eventType": "Casamento",
  "guests": 120,
  "eventDate": "2027-06-12",
  "duration": "4 horas",
  "location": "Mogi das Cruzes - SP",
  "packageSlug": "misto",
  "extras": ["Bar LED", "Drinks Premium"],
  "name": "Mariana Souza",
  "email": "mariana@email.com",
  "phone": "(11) 99999-9999",
  "notes": "Festa ao ar livre"
}
```

O valor estimado é recalculado no servidor (`backend/src/lib/pricing.js`): R$ 1.000 + R$ 17 por convidado + R$ 250 por extra.

## Banco de dados

Definido em `backend/prisma/schema.prisma`:

- **Admin**: membros da equipe que acessam o painel (senha guardada com bcrypt).
- **Client**: quem pediu orçamento (nome, e-mail único, telefone). Se a mesma pessoa pedir de novo, o registro é reaproveitado.
- **Package**: pacotes oferecidos (Sem álcool, Alcoólico, Misto).
- **Quote**: o orçamento — tipo de evento, data, convidados, duração, local, extras, valor estimado, status, observações do cliente e observações internas. Ligado a um Client e a um Package.

Mudou o schema? Rode `npm run db:migrate --prefix backend` para gerar uma nova migração.

## Segurança já incluída

- Senhas com bcrypt; mensagem de erro de login genérica.
- JWT assinado com `JWT_SECRET` (a API se recusa a subir em produção com segredo fraco).
- Limite de tentativas: 10 logins / 15 min e 20 orçamentos / hora por IP.
- Validação de todos os dados com Zod; valor do orçamento calculado no servidor.
- Helmet + CORS restrito a `CORS_ORIGIN`.

## Publicando (produção)

**Banco**: crie um PostgreSQL gerenciado (Neon, Supabase, Render ou Railway) e copie a connection string.

**Back-end** (ex.: Render → Web Service):
- Root directory: `open-bar-mogi/backend`
- Build command: `npm install && npx prisma migrate deploy`
- Start command: `npm start`
- Variáveis: `DATABASE_URL`, `JWT_SECRET` (aleatório, 32+ caracteres), `CORS_ORIGIN` (URL do front, ex.: `https://openbarmogi.vercel.app`), `NODE_ENV=production`, `TRUST_PROXY=1`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Depois do primeiro deploy, rode uma vez `npm run db:seed` (pelo Shell do Render, ou localmente com `DATABASE_URL` apontando para o banco de produção) para criar os pacotes e o admin.

**Front-end** (Vercel, já tem `vercel.json`):
- Root directory: `open-bar-mogi/frontend`
- Variável: `VITE_API_URL=https://<sua-api>/api`

# Open Bar Mogi — Descrição técnica

Documento de referência sobre **como** o sistema foi implementado. Para rodar ou publicar, veja o [README](README.md) e o [DEPLOY](DEPLOY.md).

---

## 1. Visão geral

```
 Navegador
    │
    ▼
 Front-end (React SPA)  ──── hospedado na Netlify
    │  HTTPS + JSON (Axios)
    ▼
 API REST (Node + Express) ── hospedada no Render
    │  Prisma ORM
    ▼
 PostgreSQL ────────────────── hospedado no Neon
```

- O **front-end** é uma SPA (Single Page Application): uma única página HTML em que o React troca o conteúdo conforme a rota.
- A **API** é *stateless*: não guarda sessão em memória. Cada requisição do painel traz um token JWT que prova quem é o usuário.
- O **banco** é a única fonte de verdade: orçamentos, clientes, pacotes e administradores.

## 2. Stack

| Camada | Tecnologia | Para quê |
|---|---|---|
| Interface | React 19 + Vite | Componentes e build |
| Estilo | Tailwind CSS 4 | Classes utilitárias |
| Rotas (front) | React Router 7 | Navegação da SPA e proteção do `/admin` |
| HTTP (front) | Axios | Chamadas à API, com interceptors |
| Servidor | Node.js 20+ + Express 5 | API REST |
| Banco | PostgreSQL | Armazenamento |
| ORM | Prisma 6 | Schema, migrações e consultas tipadas |
| Validação | Zod 4 | Validar o corpo e os parâmetros das requisições |
| Autenticação | jsonwebtoken + bcryptjs | Token JWT e hash de senha |
| Segurança HTTP | helmet, cors, express-rate-limit | Cabeçalhos, origem permitida e limite de tentativas |

## 3. Estrutura de pastas

```
open-bar-mogi/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # modelos do banco
│   │   ├── migrations/          # SQL gerado pelo Prisma (versionado)
│   │   └── seed.js              # cria pacotes e o primeiro admin
│   └── src/
│       ├── server.js            # sobe o servidor HTTP
│       ├── app.js               # monta o Express (middlewares + rotas)
│       ├── config.js            # lê e valida variáveis de ambiente
│       ├── routes/index.js      # mapa URL → controller
│       ├── controllers/         # regras de cada endpoint
│       ├── middlewares/         # auth (JWT) e tratamento de erros
│       └── lib/                 # prisma, preço, serialização, HttpError
└── frontend/
    ├── public/
    │   ├── config.js            # endereço da API (editável após a build)
    │   └── _redirects           # faz todas as rotas abrirem o index.html na Netlify
    └── src/
        ├── services/            # camada de acesso à API (Axios)
        ├── context/ + hooks/    # AuthProvider e useAuth
        ├── components/admin/    # ProtectedRoute, AdminLayout, StatusBadge...
        ├── lib/quotes.js        # formatação, status e cálculo de estimativa
        └── pages/               # Home, Quote, Login, AdminDashboard, AdminQuoteDetails
```

## 4. Banco de dados

Definido em `backend/prisma/schema.prisma`. Tabelas em `snake_case`, chaves primárias em UUID.

```
 Client 1 ───< N  Quote  N >─── 1 Package
 (cliente)       (orçamento)       (pacote)

 Admin (isolado: só para login no painel)
```

| Modelo | Campos principais | Observações |
|---|---|---|
| `Admin` | name, email (único), passwordHash | A senha nunca é guardada em texto puro (bcrypt, custo 10). |
| `Client` | name, email (único), phone | Quem pede orçamento. O e-mail identifica o cliente: um segundo pedido reaproveita o mesmo registro (*upsert*) e atualiza nome/telefone. |
| `Package` | slug (único), name, description, active | "Sem álcool", "Alcoólico", "Misto". O front busca a lista na API. |
| `Quote` | eventType, eventDate, guests, duration, location, extras[], estimatedValue, status, notes, adminNotes | Ligado a 1 cliente e 1 pacote. |

Decisões de modelagem:
- **`status`** é um `enum` (`PENDENTE`, `APROVADO`, `RECUSADO`), então o banco recusa qualquer outro valor.
- **`eventDate`** é do tipo `DATE` (sem hora), o que evita problemas de fuso horário.
- **`estimatedValue`** é `DECIMAL(10,2)`, e não `float`, para não haver erro de arredondamento com dinheiro.
- **`extras`** é um array de texto do próprio PostgreSQL (`text[]`). Para 4 opções fixas, é mais simples que uma tabela extra.
- **`notes`** guarda as observações do cliente. **`adminNotes`** guarda as anotações internas da equipe, que o cliente nunca vê.
- Índices em `status` e `createdAt`, as colunas usadas para filtrar e ordenar o dashboard.

## 5. API REST

### 5.1 Endpoints

| Método | Rota | Acesso | O que faz |
|---|---|---|---|
| GET | `/api/health` | público | Verifica se a API está no ar |
| GET | `/api/packages` | público | Lista os pacotes ativos |
| POST | `/api/quotes` | público | Cria um orçamento (formulário do site) |
| POST | `/api/auth/login` | público | Devolve `{ token, admin }` |
| GET | `/api/auth/me` | admin | Confirma o token e devolve o admin logado |
| GET | `/api/quotes?status=&search=` | admin | Lista orçamentos + contadores |
| GET | `/api/quotes/:id` | admin | Detalhe de um orçamento |
| PUT | `/api/quotes/:id/status` | admin | Altera o status (e opcionalmente `adminNotes`) |

### 5.2 Caminho de uma requisição

Exemplo: `PUT /api/quotes/:id/status`

```
helmet → cors → express.json → requireAuth → updateQuoteStatus → (erro?) errorHandler
```

1. **helmet** adiciona cabeçalhos de segurança.
2. **cors** só aceita chamadas vindas das origens em `CORS_ORIGIN`.
3. **express.json** lê o corpo (limite de 100 KB).
4. **requireAuth** confere o JWT. Se for inválido, devolve 401 e a cadeia para aqui.
5. **controller**: valida com Zod, executa no banco via Prisma e responde.
6. **errorHandler**: qualquer erro lançado cai aqui e vira uma resposta JSON padronizada.

Como o Express 5 repassa sozinho os erros de funções `async` para o `errorHandler`, os controllers não precisam de `try/catch`.

### 5.3 Validação (Zod)

Cada endpoint tem um *schema* que valida **e** normaliza os dados:
- e-mail com `trim()` + `toLowerCase()`
- `guests` convertido para número inteiro, entre 1 e 5000
- data no formato `AAAA-MM-DD`, que não pode estar no passado (com 1 dia de tolerância por causa do fuso)
- `extras` só aceita as 4 opções conhecidas, sem repetição
- telefone com pelo menos 10 dígitos (inclui o DDD)
- textos com tamanho máximo

Se algo falha, a API responde `400` com o erro de cada campo:
```json
{ "error": "Dados inválidos.", "fields": { "email": "E-mail inválido." } }
```
O formulário usa `fields` para marcar o campo em vermelho e voltar o cliente para a etapa certa.

### 5.4 Regras de negócio

- **Preço calculado no servidor** (`lib/pricing.js`): `1000 + 17 × convidados + 250 × extras`. O valor mostrado no navegador é só uma prévia; o valor salvo é sempre o recalculado pela API, então ninguém consegue enviar um preço falso.
- **Criação em transação**: o *upsert* do cliente e a criação do orçamento acontecem dentro de `prisma.$transaction`. Ou os dois são gravados, ou nenhum.
- **Resposta mínima ao público**: o `POST /api/quotes` devolve só `id`, `status` e `estimatedValue`, sem expor dados internos.
- **Contadores do dashboard**: um `groupBy` por status calcula total, pendentes, aprovados, recusados e receita aprovada numa única consulta, independentemente do filtro aplicado na lista.

### 5.5 Serialização e erros

- `lib/serializers.js` converte o registro do banco para o JSON da API: `Decimal` vira `number`, `Date` vira `"AAAA-MM-DD"`, e só entram os campos necessários do cliente e do pacote.
- `HttpError(status, mensagem)` é lançado nos controllers. O `errorHandler` também traduz:
  - `ZodError` → 400
  - registro inexistente do Prisma (`P2025`) → 404
  - JSON malformado → 400
  - qualquer outro erro → 500, com mensagem genérica (o detalhe vai só para o log do servidor)

## 6. Autenticação

### 6.1 Login (API)

1. `POST /api/auth/login` com e-mail e senha.
2. A API busca o admin e compara a senha com `bcrypt.compare`.
3. Se o e-mail não existe, a comparação acontece mesmo assim, contra um hash falso. Assim a resposta leva o mesmo tempo e não revela quais e-mails estão cadastrados. A mensagem também é genérica: "E-mail ou senha inválidos."
4. Em caso de sucesso, gera um **JWT** assinado com `JWT_SECRET` (HS256):
   - `sub` = id do admin; `email` e `name` no payload
   - expira em `JWT_EXPIRES_IN` (padrão `8h`)

### 6.2 Proteção das rotas (API)

O middleware `requireAuth` lê o cabeçalho `Authorization: Bearer <token>` e chama `jwt.verify`. Se o token estiver ausente, adulterado ou expirado, responde 401. Se for válido, coloca `req.admin` disponível para o controller.

### 6.3 Sessão no navegador (front)

| Peça | Arquivo | Papel |
|---|---|---|
| Armazenamento | `services/api.js` | O token fica no `localStorage` (`obm_admin_token`). |
| Interceptor de requisição | `services/api.js` | Adiciona `Authorization: Bearer ...` em toda chamada. |
| Interceptor de resposta | `services/api.js` | Se a API responder 401, dispara o evento `auth:unauthorized`. |
| Estado global | `context/AuthProvider.jsx` | Guarda `admin` e `status` (`checking`, `authenticated`, `anonymous`). Ouve o evento acima e faz logout. |
| Validação ao abrir o site | `AuthProvider` | Se existe token salvo, chama `/api/auth/me` antes de liberar o painel. Enquanto isso, o status é `checking` e aparece uma tela de carregamento. |
| Guarda de rota | `components/admin/ProtectedRoute.jsx` | Sem login, redireciona para `/admin/login`, guardando a página de origem para voltar a ela depois do login. |

## 7. Front-end

### 7.1 Rotas

```
/                      Home (landing page)
/orcamento             Quote (formulário em 5 etapas)
/admin/login           Login
/admin                 AdminDashboard        ┐ dentro de ProtectedRoute
/admin/orcamentos/:id  AdminQuoteDetails     ┘ e de AdminLayout
*                      redireciona para /
```

### 7.2 Camada de serviços

As telas nunca chamam o Axios diretamente. Elas usam funções como `fetchPackages()`, `createQuote()`, `fetchQuotes()` e `updateQuoteStatus()`. Essas funções também conferem o formato da resposta (`pick()`): se a API devolver algo inesperado, por exemplo o HTML do próprio site quando o endereço da API está errado, elas lançam um erro com mensagem clara em vez de quebrar a tela.

O endereço da API é escolhido nesta ordem:
1. `window.OBM_API_URL`, definido em `public/config.js` (editável sem recompilar)
2. `VITE_API_URL`, definida no momento da build
3. `/api`, que em desenvolvimento o Vite repassa para `localhost:3333`

O tempo limite é de 60 s, porque a API no plano grátis do Render "dorme" e leva cerca de 50 s para acordar.

### 7.3 Telas

- **Quote**: formulário em 5 etapas (evento, pacote, extras, resumo, contato). Cada etapa é validada antes de avançar. Os pacotes vêm da API. No envio, os erros por campo devolvidos pela API levam o cliente de volta à etapa certa. No sucesso, mostra uma tela de confirmação com o valor estimado.
- **AdminDashboard**: cartões de contadores, filtro por status, busca por cliente/e-mail/evento, tabela no desktop e cartões no celular.
- **AdminQuoteDetails**: dados do evento e do cliente, extras e observações. Tem botões para aprovar, recusar ou voltar para pendente, campo de anotações internas e atalhos para WhatsApp (`wa.me/55...`) e e-mail.

Todas as buscas de dados usam `useEffect` com uma flag `active`. Se o usuário trocar de tela ou de filtro antes da resposta chegar, o resultado antigo é descartado (evita *race condition*).

## 8. Segurança

| Ameaça | Proteção |
|---|---|
| Vazamento de senhas | bcrypt (hash + salt); a senha nunca volta na resposta |
| Descobrir e-mails cadastrados | Mensagem genérica e tempo de resposta constante no login |
| Força bruta no login | 10 tentativas a cada 15 min por IP |
| Spam no formulário | 20 orçamentos por hora por IP |
| Manipulação de preço | Valor recalculado no servidor |
| Dados inválidos ou maliciosos | Validação Zod em todas as entradas; Prisma usa consultas parametrizadas (sem SQL injection) |
| Chamadas de outros sites | CORS restrito a `CORS_ORIGIN` |
| Segredo fraco em produção | A API não sobe com `NODE_ENV=production` se o `JWT_SECRET` tiver menos de 32 caracteres ou for o valor de exemplo |
| IP real atrás do proxy do Render | `TRUST_PROXY=1`, para o limite de tentativas funcionar por visitante |

## 9. Configuração e deploy

Variáveis da API (`backend/.env.example`): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `TRUST_PROXY`, `PORT`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

- **`npm run start:prod`** executa, em sequência:
  1. `prisma migrate deploy`: aplica as migrações pendentes
  2. `node prisma/seed.js`: garante os pacotes e o admin (idempotente; pode rodar a cada reinício)
  3. `node src/server.js`: sobe a API

  Por isso não é preciso acessar o terminal do servidor. Trocar `ADMIN_PASSWORD` no Render e reiniciar já atualiza a senha.
- **Migrações versionadas**: o SQL fica em `prisma/migrations/`. Uma mudança no schema exige `npm run db:migrate` localmente, que gera uma nova migração para enviar ao repositório.
- **SPA na Netlify**: `public/_redirects` (`/* /index.html 200`) faz `/admin` e `/orcamento` abrirem o app em vez de 404. Na Vercel, o `vercel.json` faz o mesmo.

## 10. Padrões de projeto usados

| Padrão | Onde |
|---|---|
| Arquitetura em camadas (MVC sem View) | routes → controllers → Prisma/model |
| Chain of Responsibility | Middlewares do Express e interceptors do Axios |
| Singleton | `lib/prisma.js`: uma conexão compartilhada com o banco |
| Factory | `limiter()` cria os limitadores de tentativas |
| DTO / Serializer | `serializeQuote()` |
| Provider + Custom Hook | `AuthProvider` + `useAuth()` |
| Service Layer | `frontend/src/services/` |
| Observer | Evento `auth:unauthorized` que derruba a sessão |
| Route Guard | `ProtectedRoute` |
| Layout / Composição | `AdminLayout` + `<Outlet />` |

## 11. Limitações conhecidas e próximos passos

- **Token no `localStorage`**: é simples e funciona com front e API em domínios diferentes, mas um ataque XSS conseguiria lê-lo. Uma evolução seria usar cookie `httpOnly` com `SameSite`.
- **Sem camada Repository**: os controllers usam o Prisma diretamente. Num projeto maior, isolar o acesso a dados facilita testes e trocas de banco.
- **Sem paginação** na lista de orçamentos. Basta para centenas de registros; para milhares, adicionar `take`/`skip` ou cursor.
- **Sem testes automatizados**: o fluxo foi testado de ponta a ponta manualmente (Playwright + curl). O próximo passo natural é adicionar testes de API (ex.: Vitest + Supertest).
- **Um único perfil de admin**: todos os administradores têm as mesmas permissões e não há tela para gerenciar usuários (são criados pelo seed).
- **Sem notificações**: a equipe precisa abrir o painel para ver pedidos novos. Uma evolução seria enviar e-mail ou WhatsApp a cada orçamento.
- **Plano grátis do Render**: a API dorme após 15 min sem uso, e o primeiro acesso demora cerca de 50 s.

# Como colocar o Open Bar Mogi no ar

O sistema tem **3 partes**, e cada uma vai para uma plataforma diferente (todas têm plano grátis):

| Parte | O que é | Plataforma | O que enviar |
|---|---|---|---|
| 🗄️ Banco de dados | Onde ficam os orçamentos e o login | **Neon** (neon.tech) | Nada. Só criar e copiar o endereço |
| ⚙️ API | O "servidor" que recebe os orçamentos e faz o login | **Render** (render.com) | Pasta **`1-API-para-Render`** |
| 🌐 Site | A landing page + painel `/admin` | **Netlify** (netlify.com) | Pasta **`2-SITE-para-Netlify`** |

A pasta `3-SITE-codigo-fonte` só serve para quem for editar o visual do site ou preferir usar a Vercel (veja o final).

> ⚠️ **Siga nesta ordem**: Banco → API → Site → voltar na API para liberar o site.
> Os nomes dos botões das plataformas podem mudar um pouco com o tempo.

---

## Passo 1 — Banco de dados (Neon)

1. Crie uma conta em **https://neon.tech**.
2. Clique em **New Project**. Dê o nome `open-bar-mogi` e, em região, escolha **São Paulo (AWS sa-east-1)**.
3. No painel do projeto, clique em **Connect** e copie a **connection string**. Ela começa com `postgresql://` e termina com `?sslmode=require`.
4. Guarde esse texto: ele é o `DATABASE_URL` do próximo passo. **Não compartilhe**, pois é a senha do banco.

Não precisa criar tabelas: a API cria tudo sozinha no primeiro deploy.

---

## Passo 2 — API (Render)

O Render só publica a partir do GitHub, então primeiro sobe a pasta para lá.

### 2a. Subir a pasta para o GitHub
1. Em **https://github.com/new**, crie um repositório **privado** chamado `open-bar-mogi-api`.
2. Na página do repositório vazio, clique em **"uploading an existing file"**.
3. Abra a pasta **`1-API-para-Render`** e arraste **o conteúdo dela** (não a pasta em si). O arquivo `package.json` precisa ficar na raiz do repositório.
4. Clique em **Commit changes**.

### 2b. Criar o serviço no Render
1. Crie uma conta em **https://render.com** usando o login do GitHub.
2. Clique em **New → Web Service** e escolha o repositório `open-bar-mogi-api`.
3. Preencha:
   - **Region**: a mais próxima disponível (ex.: *Ohio* ou *Virginia*)
   - **Runtime / Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: `Free`
4. Em **Environment Variables**, adicione uma por uma:

| Nome | Valor |
|---|---|
| `DATABASE_URL` | a connection string copiada do Neon |
| `JWT_SECRET` | clique em **Generate**, ou cole um texto aleatório com 40+ caracteres |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `CORS_ORIGIN` | `http://localhost:5173` (provisório, troca no Passo 4) |
| `ADMIN_NAME` | `Equipe Open Bar Mogi` |
| `ADMIN_EMAIL` | o e-mail que a equipe vai usar para entrar no painel |
| `ADMIN_PASSWORD` | a senha do painel (**mínimo 8 caracteres**) |

5. Clique em **Create Web Service** e espere o deploy (uns 2 a 5 minutos). No log deve aparecer:
   ```
   ✔ 3 pacotes prontos
   ✔ Admin pronto: ...
   🍹 API do Open Bar Mogi rodando ...
   ```
6. Copie o endereço do serviço (algo como `https://open-bar-mogi-api.onrender.com`).
7. Teste no navegador: `https://SEU-ENDERECO.onrender.com/api/health` deve mostrar `{"ok":true}`.

---

## Passo 3 — Site (Netlify)

1. Abra a pasta **`2-SITE-para-Netlify`** e edite o arquivo **`config.js`** com qualquer editor de texto (Bloco de Notas serve).
2. Troque a última linha, colocando o endereço da API do Passo 2 **com `/api` no final**:
   ```js
   window.OBM_API_URL = "https://open-bar-mogi-api.onrender.com/api"
   ```
   Salve.
3. Crie uma conta em **https://app.netlify.com** e faça login. Sem login, o site some depois de 1 hora.
4. Vá em **Add new site → Deploy manually** (ou https://app.netlify.com/drop) e **arraste a pasta `2-SITE-para-Netlify` inteira**.
5. Em segundos sai um endereço tipo `https://nome-aleatorio.netlify.app`. Para trocar o nome, vá em **Site configuration → Change site name** (ex.: `openbarmogi.netlify.app`).
6. Copie o endereço final do site.

---

## Passo 4 — Liberar o site na API (obrigatório)

Por segurança, a API só aceita pedidos vindos do endereço do site.

1. No Render, abra o serviço e vá em **Environment**.
2. Troque `CORS_ORIGIN` pelo endereço do site, **sem barra no final**:
   ```
   https://openbarmogi.netlify.app
   ```
   Se tiver mais de um endereço (ex.: domínio próprio), separe por vírgula:
   `https://openbarmogi.netlify.app,https://www.openbarmogi.com.br`
3. Salve. O Render reinicia sozinho.

---

## Passo 5 — Testar

1. Abra `https://SEU-SITE.netlify.app/orcamento`, preencha e envie um orçamento.
2. Abra `https://SEU-SITE.netlify.app/admin`. Vai pedir login: use o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` do Passo 2.
3. O orçamento enviado deve aparecer no painel. Clique em **Ver detalhes** e teste **Aprovar**.

---

## Dúvidas comuns

- **O primeiro acesso demora ~1 minuto.** O plano grátis do Render "dorme" depois de 15 min sem uso e acorda no primeiro acesso. Para ficar sempre rápido, mude para um plano pago no Render.
- **"Não foi possível conectar ao servidor"** no site: confira o `config.js` (precisa ter `/api` no final) e o `CORS_ORIGIN` no Render (sem barra no final, exatamente igual ao endereço do site).
- **Trocar a senha do painel**: mude `ADMIN_PASSWORD` no Render e salve. Ela é aplicada ao reiniciar.
- **Atualizar o site**: na Netlify, abra o site → **Deploys** → arraste a pasta nova. Lembre de manter o `config.js` com o endereço da API.
- **Domínio próprio** (ex.: `openbarmogi.com.br`): na Netlify, em **Domain management**, adicione o domínio. Depois inclua o domínio no `CORS_ORIGIN` do Render.
- **Nunca** coloque a `DATABASE_URL`, o `JWT_SECRET` ou a senha do admin no GitHub ou no `config.js`. Eles ficam só nas variáveis do Render.

## Alternativa: site na Vercel em vez da Netlify

1. Suba o conteúdo da pasta **`3-SITE-codigo-fonte`** para outro repositório do GitHub (mesmo processo do Passo 2a).
2. Na Vercel: **Add New → Project**, escolha o repositório. Framework: **Vite**.
3. Em **Environment Variables**, adicione `VITE_API_URL` = `https://SEU-ENDERECO.onrender.com/api`.
4. Deploy. Depois faça o Passo 4 com o endereço `.vercel.app`.

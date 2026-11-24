# Venom Workout 🐍

App da equipe **Venom Workout** (Cross Training · Skyfit Mogi das Cruzes) — [@crossvenomworkout](https://www.instagram.com/crossvenomworkout/).

> **Status: rascunho v0.1.** Funciona 100% no navegador, sem servidor. Os dados ficam salvos no próprio aparelho (localStorage + IndexedDB). Ainda não sincroniza entre usuários.

## Como abrir

```bash
cd apps/venom-workout
python3 -m http.server 8080
# abrir http://localhost:8080
```

Contas de demonstração (senha `venom123`): `atleta@venom.com` e `coach@venom.com`.

## O que já tem

| Tela | Funcionalidades |
|---|---|
| **Splash** | Logo animado (zoom + giro + brilho + anel), título "VENOM WORKOUT" e depois o login |
| **Login / Cadastro** | Entrar, criar conta (nome, WhatsApp, nível, aceite LGPD), "esqueci minha senha" |
| **Início** | Próxima aula, aulas no mês, total de marcas, semanas seguidas, WOD do dia, últimas marcas, link do Instagram |
| **Agenda** | 14 dias à frente, turmas por horário, vagas (16), agendar, cancelar (até 60 min antes), lista de espera quando lota, check-in 30 min antes, 1 aula por dia |
| **PRs** | 376 movimentos em 18 categorias (LPO, agachamentos, terra, ginástica, holds, cardio, calorias, The Girls, Hero WODs, Open…). Cada registro tem data, horário da aula, peso, reps / tempo / rounds, RX ou Scaled e observações. Mostra a melhor marca, o histórico, um gráfico de evolução e a tabela de % do 1RM (fórmula de Epley). Avisa quando você bate um PR novo, deixa postar no feed e criar movimentos personalizados |
| **Treinos (feed)** | Post com foto (comprimida), tipo, WOD, resultado, RX, horário da aula e legenda. Curtir, comentar, excluir. Filtro Equipe / Meus |
| **Perfil** | Foto, dados, peso e altura, estatísticas, lembretes, instalar o app, exportar dados (LGPD), sair |
| **Coach** | Publicar WOD do dia, ver a lista de alunos por turma |
| **PWA** | Instalável no celular, abre offline (service worker) |

## Pendências pra confirmar com a equipe

- [ ] **Logo oficial**: trocar `icons/logo.svg` (o atual é provisório). Pra Play Store, mandar em PNG 512×512
- [ ] **Grade real de horários** da Skyfit Mogi: `GYM.schedule` em `data.js`
- [ ] Nomes dos coaches, vagas por turma e regras de cancelamento
- [ ] Os WODs têm planos ou mensalidade? (isso define se entra pagamento no app)

## Roteiro até a Play Store

1. **Backend (fase 2)**: Supabase ou Firebase para login real, banco compartilhado (agenda com vagas reais), storage das fotos e push notifications. A camada `db`/`imgStore` do `app.js` vira chamadas de API.
2. **Painel admin web**: cadastro de turmas, coaches, alunos, planos, relatórios de frequência.
3. **App Android**: empacotar com **Capacitor** (`npx cap add android`) ou **TWA/Bubblewrap** (a partir do PWA publicado), gerar o AAB assinado.
4. **Play Console**: conta de desenvolvedor (US$ 25, taxa única), política de privacidade publicada, ficha da loja (ícone 512, feature graphic 1024×500, screenshots), classificação de conteúdo e teste fechado com 12 testadores por 14 dias (exigência para contas pessoais novas).

## Estrutura

```
apps/venom-workout/
├── index.html            # shell + splash
├── styles.css            # tema Venom (preto + verde veneno)
├── data.js               # catálogo de movimentos + grade da Skyfit
├── app.js                # lógica (auth, agenda, PRs, feed, perfil, coach)
├── sw.js                 # cache offline
├── manifest.webmanifest  # config de instalação PWA
└── icons/logo.svg
```

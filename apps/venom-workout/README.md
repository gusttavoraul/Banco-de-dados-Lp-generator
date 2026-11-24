# Venom Workout 🐍

App da equipe **Venom Workout** (Cross Training · Skyfit Mogi das Cruzes) — [@crossvenomworkout](https://www.instagram.com/crossvenomworkout/).

**No ar:** https://venomworkout.netlify.app (Netlify, publicado manualmente pelo zip desta pasta).

> **Status: rascunho v0.3.** Funciona 100% no navegador, sem servidor. Os dados ficam salvos no próprio aparelho (localStorage + IndexedDB). Ainda não sincroniza entre usuários.

## Como abrir

```bash
cd apps/venom-workout
python3 -m http.server 8080
# abrir http://localhost:8080
```

Contas de demonstração (senha `venom123`): `atleta@venom.com` (aluno) e `coach@venom.com` (Coach Karrasco).

## O que já tem

| Tela | Funcionalidades |
|---|---|
| **Splash** | Escudo da Venom animado (zoom + giro + brilho vermelho + anel), título "VENOM WORKOUT" e depois o login |
| **Login / Cadastro** | Entrar, criar conta (nome, WhatsApp, nível, aceite LGPD), "esqueci minha senha" |
| **Início** | Próxima aula, aulas no mês, total de marcas, semanas seguidas, WOD do dia, últimas marcas, link do Instagram |
| **Agenda** | Grade real da Skyfit Mogi, 14 dias à frente, tema de cada aula, dias sem aula (campeonato/feriado). **Vagas por ordem de agendamento**: quem agenda primeiro garante a vaga, depois do limite entra na fila, e se alguém cancela o 1º da fila é confirmado automaticamente e recebe aviso. Cancelamento até 60 min antes, check-in 30 min antes, 1 agendamento por dia |
| **PRs** | 376 movimentos em 18 categorias (LPO, agachamentos, terra, ginástica, holds, cardio, calorias, The Girls, Hero WODs, Open…). Cada registro tem data, horário da aula, peso, reps / tempo / rounds, RX ou Scaled e observações. Mostra a melhor marca, o histórico, um gráfico de evolução e a tabela de % do 1RM (fórmula de Epley). Avisa quando você bate um PR novo, deixa postar no feed e criar movimentos personalizados |
| **Treinos (feed)** | Post com foto (comprimida), tipo, WOD, resultado, RX, horário da aula e legenda. Curtir, comentar, excluir. Filtro Equipe / Meus |
| **Perfil** | Foto, dados, peso e altura, estatísticas, lembretes, instalar o app, exportar dados (LGPD), sair |
| **Coach** | **Aulas e treinos**: escolhe o dia e edita tema e treino de cada aula (ou de todas do dia), liga a **capa de treino surpresa** (revela sozinha na hora da aula ou no botão "Revelar agora", e os agendados são avisados), adiciona aulas avulsas (ex.: sábado), remove aulas e cancela dias (os alunos agendados são avisados). **Grade semanal** editável. **Limite de vagas** (padrão + exceção por horário). Lista de alunos por turma em ordem de agendamento |
| **PWA** | Instalável no celular, abre offline (service worker) |

## Grade de aulas (cronograma semanal)

| Dia | Horários | Tema |
|---|---|---|
| Segunda | 06:00 · 07:00 · 18:10 · 19:10 · 20:10 | Cross Training |
| Terça | 18:10 · 19:10 · 20:10 | Deadly Barbell — The Clean |
| Quarta | 06:00 · 07:00 | Deadly Barbell — The Clean |
| Quinta | 06:00 · 07:00 · 18:10 · 19:10 · 20:10 | Handstand Walking |
| Domingo | 10:00 | Aulão |
| Sábado | definido pelo coach a cada semana | — |
| Sáb 28/11 | — | Sem aula (dia de campeonato) |

A grade acima é só a inicial: o coach muda horários, temas, treinos, aulas de sábado e dias sem aula pelo **Painel do Coach** (Perfil → Painel do Coach).

**Mensalidade não passa pelo app** — ele é só para agendamento, PRs e treinos.

## Pendências

- [x] Logo oficial aplicado (`icons/logo-original.png`, 240 px). Para a Play Store, conseguir o arquivo em alta (512 px ou mais) e regerar `icons/logo-512.png`, `icons/icon-192.png` e `icons/icon-512.png`
- [x] Temas mudam toda semana: o coach edita em "Aulas e treinos", com opção de treino surpresa
- [x] Sábado: o coach adiciona os horários em "Aulas e treinos"

## Roteiro até a Play Store

1. **Backend (fase 2)**: Supabase ou Firebase para login real, banco compartilhado (agenda com vagas reais), storage das fotos e push notifications. A camada `db`/`imgStore` do `app.js` vira chamadas de API.
2. **Painel admin web**: cadastro de turmas, coaches, alunos, planos, relatórios de frequência.
3. **App Android**: empacotar com **Capacitor** (`npx cap add android`) ou **TWA/Bubblewrap** (a partir do PWA publicado), gerar o AAB assinado.
4. **Play Console**: conta de desenvolvedor (US$ 25, taxa única), política de privacidade publicada, ficha da loja (ícone 512, feature graphic 1024×500, screenshots), classificação de conteúdo e teste fechado com 12 testadores por 14 dias (exigência para contas pessoais novas).

## Estrutura

```
apps/venom-workout/
├── index.html            # shell + splash
├── styles.css            # tema Venom (preto + vermelho)
├── data.js               # catálogo de movimentos + grade da Skyfit
├── app.js                # lógica (auth, agenda, PRs, feed, perfil, coach)
├── sw.js                 # cache offline
├── manifest.webmanifest  # config de instalação PWA
└── icons/                # logo oficial (original + versão transparente) e ícones do app (192/512)
```

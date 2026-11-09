# Open Bar Mogi — Front-end

React + Vite + Tailwind CSS + React Router + Axios.

Veja o [README principal](../README.md) para rodar o projeto completo (front + API + banco).

Estrutura principal:

- `src/services/` — chamadas à API com Axios (`api.js` injeta o token JWT e trata 401).
- `src/context/AuthProvider.jsx` + `src/hooks/useAuth.js` — estado de login do painel.
- `src/components/admin/ProtectedRoute.jsx` — bloqueia `/admin` para quem não está logado.
- `src/pages/` — `Home`, `Quote` (formulário), `Login`, `AdminDashboard`, `AdminQuoteDetails`.

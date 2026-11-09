import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

// Moldura comum do painel: menu lateral (desktop), barra superior (celular) e logout.
function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/admin/login", { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl transition ${
      isActive ? "text-white bg-zinc-900" : "hover:text-white"
    }`

  return (
    <div className="min-h-screen bg-zinc-950 text-white md:flex">
      <aside className="w-64 bg-black border-r border-zinc-800 p-6 hidden md:flex md:flex-col">
        <h1 className="text-2xl font-bold mb-10">Open Bar Mogi</h1>

        <nav className="space-y-3 text-zinc-400 flex-1">
          <NavLink to="/admin" end className={linkClass}>
            Orçamentos
          </NavLink>
          <a href="/" target="_blank" rel="noreferrer" className="block px-4 py-3 hover:text-white">
            Ver site ↗
          </a>
        </nav>

        <div className="border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-500">Conectado como</p>
          <p className="font-semibold truncate">{admin?.name}</p>
          <p className="text-sm text-zinc-500 truncate">{admin?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full border border-zinc-700 py-2 rounded-xl hover:bg-zinc-800 transition"
          >
            Sair
          </button>
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between gap-4 px-4 py-4 bg-black border-b border-zinc-800">
        <NavLink to="/admin" className="font-bold text-lg">
          Open Bar Mogi
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm border border-zinc-700 px-3 py-1.5 rounded-lg"
        >
          Sair
        </button>
      </header>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout

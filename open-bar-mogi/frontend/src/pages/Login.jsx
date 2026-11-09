import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getErrorMessage } from "../services/api"
import LoadingScreen from "../components/admin/LoadingScreen"

function Login() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (status === "checking") return <LoadingScreen />
  if (status === "authenticated") return <Navigate to={redirectTo} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar."))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="text-zinc-500 hover:text-white text-sm">
          ← Voltar ao site
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-4">
          <p className="text-yellow-500 font-semibold uppercase tracking-widest text-sm">
            Área da equipe
          </p>
          <h1 className="text-3xl font-bold mt-2 mb-8">Entrar no painel</h1>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <label className="block">
              <span className="text-sm text-zinc-400">E-mail</span>
              <input
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 outline-none focus:border-yellow-500"
              />
            </label>

            {error && (
              <p role="alert" className="text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-50"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

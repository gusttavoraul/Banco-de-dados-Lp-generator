import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchQuotes } from "../services/quotes"
import { getErrorMessage } from "../services/api"
import { STATUS, formatCurrency, formatDate, formatDateTime } from "../lib/quotes"
import StatusBadge from "../components/admin/StatusBadge"

const FILTERS = [{ value: "", label: "Todos" }, ...Object.entries(STATUS).map(([value, { label }]) => ({ value, label }))]

function AdminDashboard() {
  const [filter, setFilter] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  const [data, setData] = useState({ quotes: [], stats: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    fetchQuotes({ status: filter || undefined, search: search || undefined })
      .then((result) => {
        if (!active) return
        setData(result)
        setError("")
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [filter, search, reloadKey])

  function changeFilter(value) {
    if (value === filter) return
    setLoading(true)
    setFilter(value)
  }

  function handleSearch(event) {
    event.preventDefault()
    setLoading(true)
    setSearch(searchInput.trim())
    setReloadKey((key) => key + 1)
  }

  function reload() {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const { quotes, stats } = data

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 mb-10">
        <div>
          <p className="text-yellow-500 font-semibold uppercase tracking-widest">
            Painel administrativo
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Orçamentos</h2>
          <p className="text-zinc-400 mt-2">Solicitações recebidas pela landing page.</p>
        </div>

        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="bg-yellow-500 text-black px-5 py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
        <StatCard label="Pendentes" value={stats?.PENDENTE} hint="Aguardando retorno" hintClass="text-yellow-500" />
        <StatCard label="Aprovados" value={stats?.APROVADO} hint="Eventos fechados" hintClass="text-green-500" />
        <StatCard label="Recusados" value={stats?.RECUSADO} hint="Não seguiram" hintClass="text-red-400" />
        <StatCard
          label="Receita aprovada"
          value={stats ? formatCurrency(stats.approvedRevenue) : undefined}
          hint={`${stats?.total ?? 0} pedidos no total`}
          hintClass="text-zinc-500"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeFilter(option.value)}
                className={`px-4 py-2 rounded-full border text-sm transition ${
                  filter === option.value
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                    : "border-zinc-700 text-zinc-400 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar cliente, e-mail ou evento"
              className="flex-1 min-w-0 lg:w-72 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 outline-none focus:border-yellow-500"
            />
            <button type="submit" className="border border-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-800">
              Buscar
            </button>
          </form>
        </div>

        {error ? (
          <div className="p-10 text-center">
            <p className="text-red-400">{error}</p>
            <button type="button" onClick={reload} className="mt-4 text-yellow-500 font-semibold">
              Tentar novamente
            </button>
          </div>
        ) : loading && quotes.length === 0 ? (
          <p className="p-10 text-center text-zinc-400">Carregando orçamentos...</p>
        ) : quotes.length === 0 ? (
          <p className="p-10 text-center text-zinc-400">
            {filter || search ? "Nenhum orçamento encontrado com esses filtros." : "Nenhum orçamento recebido ainda."}
          </p>
        ) : (
          <div className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
            {/* Celular: cartões */}
            <ul className="md:hidden divide-y divide-zinc-800">
              {quotes.map((quote) => (
                <li key={quote.id}>
                  <Link to={`/admin/orcamentos/${quote.id}`} className="block p-4 active:bg-zinc-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{quote.client.name}</p>
                        <p className="text-zinc-400 text-sm truncate">
                          {quote.eventType} · {formatDate(quote.eventDate)}
                        </p>
                      </div>
                      <StatusBadge status={quote.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-zinc-400">{quote.package.name}</span>
                      <span className="font-semibold">{formatCurrency(quote.estimatedValue)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Evento</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Pacote</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Recebido em</th>
                  <th className="p-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-zinc-800">
                    <td className="p-4 font-medium">{quote.client.name}</td>
                    <td className="p-4 text-zinc-300">{quote.eventType}</td>
                    <td className="p-4 text-zinc-300">{formatDate(quote.eventDate)}</td>
                    <td className="p-4 text-zinc-300">{quote.package.name}</td>
                    <td className="p-4 font-semibold">{formatCurrency(quote.estimatedValue)}</td>
                    <td className="p-4">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="p-4 text-zinc-500 text-sm">{formatDateTime(quote.createdAt)}</td>
                    <td className="p-4">
                      <Link
                        to={`/admin/orcamentos/${quote.id}`}
                        className="text-yellow-500 hover:text-yellow-400 font-semibold whitespace-nowrap"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function StatCard({ label, value, hint, hintClass }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
      <p className="text-zinc-400">{label}</p>
      <h3 className="text-2xl sm:text-4xl font-bold mt-3 truncate">{value ?? "—"}</h3>
      <p className={`text-sm mt-2 ${hintClass}`}>{hint}</p>
    </div>
  )
}

export default AdminDashboard

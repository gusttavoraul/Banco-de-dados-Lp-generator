import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { fetchQuote, updateQuoteStatus } from "../services/quotes"
import { getErrorMessage } from "../services/api"
import {
  STATUS,
  estimateBartenders,
  formatCurrency,
  formatDate,
  formatDateTime,
  whatsappLink,
} from "../lib/quotes"
import StatusBadge from "../components/admin/StatusBadge"

const ACTIONS = [
  { status: "APROVADO", label: "Aprovar orçamento", className: "bg-yellow-500 text-black hover:bg-yellow-400" },
  { status: "RECUSADO", label: "Recusar orçamento", className: "border border-red-400/40 text-red-400 hover:bg-red-400/10" },
  { status: "PENDENTE", label: "Voltar para pendente", className: "border border-zinc-700 hover:bg-zinc-800" },
]

function AdminQuoteDetails() {
  const { id } = useParams()

  const [quote, setQuote] = useState(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(null) // status sendo salvo
  const [feedback, setFeedback] = useState(null) // { type, message }

  useEffect(() => {
    let active = true
    fetchQuote(id)
      .then((result) => {
        if (!active) return
        setQuote(result)
        setAdminNotes(result.adminNotes ?? "")
      })
      .catch((err) => active && setError(getErrorMessage(err, "Orçamento não encontrado.")))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  async function save(status) {
    setSaving(status)
    setFeedback(null)
    try {
      const updated = await updateQuoteStatus(id, { status, adminNotes })
      setQuote(updated)
      setAdminNotes(updated.adminNotes ?? "")
      setFeedback({
        type: "success",
        message: status === quote.status ? "Observações salvas." : `Status alterado para "${STATUS[status].label}".`,
      })
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err, "Não foi possível salvar.") })
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p className="text-zinc-400">Carregando orçamento...</p>

  if (error) {
    return (
      <div>
        <BackLink />
        <p className="mt-8 text-red-400">{error}</p>
      </div>
    )
  }

  const { client } = quote

  return (
    <>
      <BackLink />

      <div className="mt-8 mb-10">
        <p className="text-yellow-500 font-semibold uppercase tracking-widest">Detalhes do orçamento</p>
        <h2 className="text-3xl sm:text-4xl font-bold mt-2 break-words">
          {quote.eventType} - {client.name}
        </h2>
        <p className="text-zinc-400 mt-2">Recebido pela landing page em {formatDateTime(quote.createdAt)}.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <h3 className="text-2xl font-bold mb-6">Informações do evento</h3>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <Info label="Tipo de evento" value={quote.eventType} />
              <Info label="Data" value={formatDate(quote.eventDate)} />
              <Info label="Convidados" value={`${quote.guests} pessoas`} />
              <Info label="Bartenders estimados" value={estimateBartenders(quote.guests)} />
              <Info label="Duração" value={quote.duration || "Não informado"} />
              <Info label="Local" value={quote.location || "Não informado"} />
              <Info label="Pacote" value={quote.package.name} highlight />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <h3 className="text-2xl font-bold mb-6">Cliente</h3>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <Info label="Nome" value={client.name} />
              <Info label="Telefone" value={client.phone} />
              <Info label="E-mail" value={client.email} className="sm:col-span-2" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <h3 className="text-2xl font-bold mb-6">Extras selecionados</h3>
            {quote.extras.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {quote.extras.map((extra) => (
                  <span
                    key={extra}
                    className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-4 py-2 rounded-full"
                  >
                    {extra}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">Nenhum extra selecionado.</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <h3 className="text-2xl font-bold mb-4">Observações do cliente</h3>
            <p className="text-zinc-300 whitespace-pre-line">{quote.notes || "Nenhuma observação."}</p>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-yellow-500 text-black rounded-2xl p-6">
            <p className="font-semibold">Valor estimado</p>
            <h3 className="text-4xl font-black mt-2">{formatCurrency(quote.estimatedValue)}</h3>
            <p className="text-black/70 mt-2">Valor sujeito à validação final.</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Status</h3>
            <StatusBadge status={quote.status} large />

            <label className="block mt-6">
              <span className="text-sm text-zinc-400">Observações internas</span>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ex.: cliente pediu desconto, retornar na sexta..."
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <div className="space-y-3 mt-4">
              {ACTIONS.filter((action) => action.status !== quote.status).map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={saving !== null}
                  onClick={() => save(action.status)}
                  className={`w-full py-3 rounded-xl font-bold transition disabled:opacity-50 ${action.className}`}
                >
                  {saving === action.status ? "Salvando..." : action.label}
                </button>
              ))}

              <button
                type="button"
                disabled={saving !== null || adminNotes === (quote.adminNotes ?? "")}
                onClick={() => save(quote.status)}
                className="w-full border border-zinc-700 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition disabled:opacity-40"
              >
                {saving === quote.status ? "Salvando..." : "Salvar observações"}
              </button>
            </div>

            {feedback && (
              <p
                role="status"
                className={`mt-4 text-sm ${feedback.type === "success" ? "text-green-500" : "text-red-400"}`}
              >
                {feedback.message}
              </p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-xl font-bold mb-2">Entrar em contato</h3>
            <a
              href={whatsappLink(client.phone)}
              target="_blank"
              rel="noreferrer"
              className="block text-center w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-semibold transition"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${client.email}?subject=${encodeURIComponent("Orçamento Open Bar Mogi")}`}
              className="block text-center w-full border border-zinc-700 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition"
            >
              E-mail
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}

function BackLink() {
  return (
    <Link to="/admin" className="text-yellow-500 font-semibold">
      ← Voltar ao dashboard
    </Link>
  )
}

function Info({ label, value, highlight, className = "" }) {
  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-xl p-4 min-w-0 ${className}`}>
      <p className="text-zinc-500 text-sm">{label}</p>
      <h4 className={`text-lg font-bold mt-1 break-words ${highlight ? "text-yellow-500" : ""}`}>{value}</h4>
    </div>
  )
}

export default AdminQuoteDetails

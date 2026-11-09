import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createQuote, fetchPackages } from "../services/quotes"
import { getErrorMessage, getFieldErrors } from "../services/api"
import { EXTRAS, estimateBartenders, estimateValue, formatCurrency, formatDate } from "../lib/quotes"

const TOTAL_STEPS = 5

// Em qual etapa cada campo aparece (para levar o cliente até o erro).
const FIELD_STEP = {
  eventType: 1,
  guests: 1,
  eventDate: 1,
  duration: 1,
  location: 1,
  packageSlug: 2,
  extras: 3,
  name: 5,
  email: 5,
  phone: 5,
  notes: 5,
}

const INITIAL_FORM = {
  eventType: "",
  guests: "",
  eventDate: "",
  duration: "",
  location: "",
  packageSlug: "",
  extras: [],
  name: "",
  email: "",
  phone: "",
  notes: "",
}

function todayISO() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

// Validação rápida no navegador; a API valida de novo.
function validateStep(step, data) {
  const errors = {}
  if (step === 1) {
    if (data.eventType.trim().length < 2) errors.eventType = "Informe o tipo de evento."
    if (!(Number(data.guests) >= 1)) errors.guests = "Informe a quantidade de convidados."
    if (!data.eventDate) errors.eventDate = "Informe a data do evento."
    else if (data.eventDate < todayISO()) errors.eventDate = "A data do evento já passou."
  }
  if (step === 2 && !data.packageSlug) errors.packageSlug = "Escolha um pacote."
  if (step === 5) {
    if (data.name.trim().length < 3) errors.name = "Informe seu nome completo."
    if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) errors.email = "E-mail inválido."
    if (data.phone.replace(/\D/g, "").length < 10) errors.phone = "Telefone inválido. Inclua o DDD."
  }
  return errors
}

function Quote() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})

  const [packages, setPackages] = useState([])
  const [packagesError, setPackagesError] = useState("")
  const [packagesLoading, setPackagesLoading] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [sentQuote, setSentQuote] = useState(null)

  useEffect(() => {
    let active = true
    fetchPackages()
      .then((list) => active && setPackages(list))
      .catch((err) => active && setPackagesError(getErrorMessage(err, "Não foi possível carregar os pacotes.")))
      .finally(() => active && setPackagesLoading(false))
    return () => {
      active = false
    }
  }, [])

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function toggleExtra(extra) {
    setFormData((current) => ({
      ...current,
      extras: current.extras.includes(extra)
        ? current.extras.filter((item) => item !== extra)
        : [...current.extras, extra],
    }))
  }

  function goBack() {
    if (step === 1) return navigate("/")
    setSubmitError("")
    setStep(step - 1)
  }

  async function goNext() {
    const stepErrors = validateStep(step, formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    setSubmitting(true)
    setSubmitError("")
    try {
      const quote = await createQuote({ ...formData, guests: Number(formData.guests) })
      setSentQuote(quote)
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      const fields = Object.keys(fieldErrors)
      if (fields.length > 0) {
        setErrors(fieldErrors)
        setStep(Math.min(...fields.map((field) => FIELD_STEP[field.split(".")[0]] ?? TOTAL_STEPS)))
      }
      setSubmitError(getErrorMessage(err, "Não foi possível enviar sua solicitação."))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPackage = packages.find((pkg) => pkg.slug === formData.packageSlug)
  const estimated = estimateValue(formData.guests, formData.extras.length)

  if (sentQuote) {
    return (
      <div className="bg-zinc-950 text-white min-h-screen px-6 lg:px-20 py-10 flex items-center">
        <div className="max-w-xl mx-auto text-center bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500 text-black text-3xl font-black flex items-center justify-center">
            ✓
          </div>
          <h1 className="text-3xl font-bold mt-6">Solicitação enviada!</h1>
          <p className="text-zinc-400 mt-4">
            Obrigado, {formData.name.split(" ")[0]}! Nossa equipe vai analisar os detalhes e entrar em contato
            pelo WhatsApp ou e-mail com a proposta oficial.
          </p>
          <p className="mt-6 text-zinc-500 text-sm">Valor estimado</p>
          <p className="text-3xl font-black text-yellow-500">{formatCurrency(sentQuote.estimatedValue)}</p>
          <Link
            to="/"
            className="inline-block mt-8 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950 text-white min-h-screen px-6 lg:px-20 py-10">
      <div className="max-w-4xl mx-auto">
        <p className="text-yellow-500 font-semibold uppercase tracking-widest mb-4">Solicitar orçamento</p>
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Monte seu evento</h1>
        <p className="text-zinc-400 mb-10">
          Responda algumas perguntas rápidas para receber uma proposta personalizada.
        </p>

        <div className="mb-10">
          <div className="flex justify-between text-sm text-zinc-400 mb-3">
            <span>
              Etapa {step} de {TOTAL_STEPS}
            </span>
            <span>{(step / TOTAL_STEPS) * 100}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full">
            <div
              className="h-2 bg-yellow-500 rounded-full transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Dados do evento</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <Field
                  label="Tipo de evento"
                  placeholder="Casamento, aniversário, corporativo..."
                  value={formData.eventType}
                  error={errors.eventType}
                  onChange={(value) => updateField("eventType", value)}
                />
                <Field
                  label="Quantidade de convidados"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="Ex.: 120"
                  value={formData.guests}
                  error={errors.guests}
                  onChange={(value) => updateField("guests", value)}
                />
                <Field
                  label="Data prevista"
                  type="date"
                  min={todayISO()}
                  value={formData.eventDate}
                  error={errors.eventDate}
                  onChange={(value) => updateField("eventDate", value)}
                />
                <Field
                  label="Duração estimada (opcional)"
                  placeholder="Ex.: 4 horas"
                  value={formData.duration}
                  error={errors.duration}
                  onChange={(value) => updateField("duration", value)}
                />
                <Field
                  className="md:col-span-2"
                  label="Cidade / Local do evento (opcional)"
                  placeholder="Ex.: Mogi das Cruzes - SP"
                  value={formData.location}
                  error={errors.location}
                  onChange={(value) => updateField("location", value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Escolha o pacote</h2>

              {packagesLoading && <p className="text-zinc-400">Carregando pacotes...</p>}
              {packagesError && <p className="text-red-400">{packagesError}</p>}

              <div className="grid md:grid-cols-3 gap-5">
                {packages.map((pkg) => (
                  <button
                    key={pkg.slug}
                    type="button"
                    onClick={() => updateField("packageSlug", pkg.slug)}
                    className={`text-left rounded-2xl p-6 border transition ${
                      formData.packageSlug === pkg.slug
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-zinc-800 bg-zinc-950 hover:border-yellow-500"
                    }`}
                  >
                    <h3 className="text-xl font-bold mb-4">{pkg.name}</h3>
                    <p className="text-zinc-400 text-sm">{pkg.description}</p>
                  </button>
                ))}
              </div>
              {errors.packageSlug && <p className="text-red-400 text-sm mt-4">{errors.packageSlug}</p>}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Escolha os extras</h2>
              <p className="text-zinc-400 mb-6">Selecione adicionais para deixar seu evento ainda mais completo.</p>

              <div className="grid md:grid-cols-2 gap-5">
                {EXTRAS.map((extra) => {
                  const isSelected = formData.extras.includes(extra)
                  return (
                    <button
                      key={extra}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`text-left rounded-2xl p-6 border transition ${
                        isSelected
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-zinc-800 bg-zinc-950 hover:border-yellow-500"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-xl font-bold">{extra}</h3>
                        <span
                          className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-yellow-500 bg-yellow-500 text-black" : "border-zinc-600"
                          }`}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Resumo do orçamento</h2>
              <p className="text-zinc-400 mb-6">Confira as informações antes de enviar sua solicitação.</p>

              <div className="grid md:grid-cols-2 gap-5">
                <Summary label="Tipo de evento" value={formData.eventType} />
                <Summary label="Convidados" value={formData.guests} />
                <Summary label="Data" value={formData.eventDate && formatDate(formData.eventDate)} />
                <Summary label="Duração" value={formData.duration} />
                <Summary label="Local" value={formData.location} className="md:col-span-2" />
                <Summary label="Pacote escolhido" value={selectedPackage?.name} highlight />
                <Summary label="Bartenders estimados" value={estimateBartenders(formData.guests)} />

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 md:col-span-2">
                  <p className="text-zinc-500 text-sm mb-3">Extras selecionados</p>
                  {formData.extras.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.extras.map((extra) => (
                        <span
                          key={extra}
                          className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full text-sm"
                        >
                          {extra}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400">Nenhum extra selecionado</p>
                  )}
                </div>

                <div className="bg-yellow-500 text-black rounded-2xl p-6 md:col-span-2">
                  <p className="font-semibold">Valor estimado</p>
                  <h3 className="text-4xl font-black mt-2">{formatCurrency(estimated)}</h3>
                  <p className="text-black/70 mt-2">Valor aproximado. A proposta final será validada pela equipe.</p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Seus dados de contato</h2>
              <p className="text-zinc-400 mb-6">
                Agora informe seus dados para que nossa equipe envie a proposta oficial.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <Field
                  className="md:col-span-2"
                  label="Nome completo"
                  autoComplete="name"
                  value={formData.name}
                  error={errors.name}
                  onChange={(value) => updateField("name", value)}
                />
                <Field
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  error={errors.email}
                  onChange={(value) => updateField("email", value)}
                />
                <Field
                  label="Telefone / WhatsApp"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  error={errors.phone}
                  onChange={(value) => updateField("phone", value)}
                />
                <label className="block md:col-span-2">
                  <span className="text-sm text-zinc-400">Observações (opcional)</span>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    placeholder="Conte algo que ajude a equipe: horário, estrutura do local, preferências de drinks..."
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 outline-none focus:border-yellow-500"
                  />
                </label>
              </div>

              <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                <p className="text-yellow-500 font-semibold">Quase lá!</p>
                <p className="text-zinc-400 mt-2">
                  Sua solicitação será enviada para análise. A proposta final poderá ser ajustada conforme detalhes do
                  evento.
                </p>
              </div>
            </div>
          )}

          {submitError && (
            <p role="alert" className="mt-6 text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl p-4">
              {submitError}
            </p>
          )}

          <div className="flex justify-between gap-4 mt-10">
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="px-6 py-3 rounded-xl border border-zinc-700 disabled:opacity-30"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={submitting || (step === 2 && packages.length === 0)}
              className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-bold disabled:opacity-50"
            >
              {step === TOTAL_STEPS ? (submitting ? "Enviando..." : "Enviar solicitação") : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, onChange, className = "", ...inputProps }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-zinc-400">{label}</span>
      <input
        {...inputProps}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`mt-2 w-full bg-zinc-950 border rounded-xl p-4 outline-none focus:border-yellow-500 [color-scheme:dark] ${
          error ? "border-red-400" : "border-zinc-800"
        }`}
      />
      {error && <span className="block text-red-400 text-sm mt-2">{error}</span>}
    </label>
  )
}

function Summary({ label, value, highlight, className = "" }) {
  return (
    <div
      className={`bg-zinc-950 border rounded-2xl p-5 ${highlight ? "border-yellow-500/40" : "border-zinc-800"} ${className}`}
    >
      <p className="text-zinc-500 text-sm">{label}</p>
      <h3 className={`text-xl font-bold mt-1 ${highlight ? "text-yellow-500" : ""}`}>{value || "Não informado"}</h3>
    </div>
  )
}

export default Quote

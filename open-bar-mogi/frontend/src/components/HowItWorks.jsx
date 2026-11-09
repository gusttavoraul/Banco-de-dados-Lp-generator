function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Solicite seu orçamento",
      description: "Informe os dados do evento, quantidade de convidados, data e pacote desejado.",
    },
    {
      number: "02",
      title: "Receba uma proposta",
      description: "Nossa equipe analisa as informações e envia uma proposta personalizada.",
    },
    {
      number: "03",
      title: "Confirme o evento",
      description: "Após aprovação, o contrato é assinado e sua data fica reservada.",
    },
  ]

  return (
    <section className="px-6 lg:px-20 py-24 bg-zinc-900">
      <div className="max-w-6xl mx-auto">
        <p className="text-yellow-500 font-semibold uppercase tracking-widest mb-4">
          Como funciona?
        </p>

        <h2 className="text-4xl lg:text-5xl font-bold mb-12">
          Do orçamento à festa, tudo de forma organizada.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6"
            >
              <span className="text-yellow-500 text-3xl font-bold">
                {step.number}
              </span>

              <h3 className="text-2xl font-bold mt-6 mb-4">
                {step.title}
              </h3>

              <p className="text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
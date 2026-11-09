function CTASection() {
  return (
    <section className="px-6 lg:px-20 py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto rounded-3xl border border-yellow-500/40 bg-gradient-to-br from-zinc-900 to-zinc-950 p-10 lg:p-16 text-center">
        <p className="text-yellow-500 font-semibold uppercase tracking-widest mb-4">
          Faça seu evento acontecer
        </p>

        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          Pronto para transformar sua festa em uma experiência premium?
        </h2>

        <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto">
          Solicite um pré-orçamento e receba uma proposta personalizada para o seu evento.
        </p>

        <button className="bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
          Solicitar orçamento
        </button>
      </div>
    </section>
  )
}

export default CTASection
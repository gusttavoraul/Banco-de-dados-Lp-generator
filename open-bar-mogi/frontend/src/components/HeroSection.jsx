function HeroSection() {
  return (
    <section className="w-full min-h-[85vh] flex items-center px-6 lg:px-20">

      <div className="max-w-3xl">

        <p className="text-yellow-500 font-semibold uppercase tracking-widest mb-4">
          Open Bar Premium
        </p>

        <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
          Transformamos eventos em experiências inesquecíveis.
        </h1>

        <p className="text-zinc-400 text-lg mt-8 leading-relaxed">
          Serviços profissionais de open bar para casamentos,
          aniversários, formaturas e eventos corporativos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">

          <button className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200 transition">
            Solicitar orçamento
          </button>

          <button className="border border-zinc-700 px-6 py-3 rounded-xl hover:bg-zinc-900 transition">
            Ver pacotes
          </button>

        </div>

      </div>

    </section>
  )
}

export default HeroSection
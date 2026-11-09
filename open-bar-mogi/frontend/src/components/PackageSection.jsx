function PackagesSection() {
  return (
    <section className="px-6 lg:px-20 py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <p className="text-yellow-500 font-semibold uppercase tracking-widest mb-4">
          Nossos pacotes
        </p>

        <h2 className="text-4xl lg:text-5xl font-bold mb-12">
          Escolha a experiência ideal para o seu evento.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4">Sem álcool</h3>
            <p className="text-zinc-400 mb-6">
              Drinks refrescantes com sucos, água gaseificada, frutas, xaropes e cremes.
            </p>
            <button className="w-full bg-white text-black py-3 rounded-xl font-semibold">
              Ver pacote
            </button>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4">Alcoólico</h3>
            <p className="text-zinc-400 mb-6">
              Caipirinhas de vodka, saquê e cachaça para eventos completos.
            </p>
            <button className="w-full bg-yellow-500 text-black py-3 rounded-xl font-semibold">
              Mais escolhido
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4">Misto</h3>
            <p className="text-zinc-400 mb-6">
              Combinação de drinks alcoólicos e não alcoólicos para todos os convidados.
            </p>
            <button className="w-full bg-white text-black py-3 rounded-xl font-semibold">
              Ver pacote
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PackagesSection
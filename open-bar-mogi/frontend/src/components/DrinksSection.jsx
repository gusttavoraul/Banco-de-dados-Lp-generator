import sexonthebeach from "../assets/drinks/sexonthebeach.jpeg"
import moscowmule from "../assets/drinks/moscowmule.jpeg"
import caipivodka from "../assets/drinks/caipivodka.jpg"

function DrinksSection() {
  const drinks = [
    { name: "Sex On The Beach", image: sexonthebeach},
    { name: "Moscow Mule", image: moscowmule},
    { name: "Caipi Vodka", image: caipivodka}
  ]

  return (
    <section className="px-6 lg:px-20 py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <p className="text-yellow-500 font-semibold uppercase tracking-widest mb-4">
          Cardápio
        </p>

        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          Drinks para todos os estilos de evento.
        </h2>

        <p className="text-zinc-400 text-lg mb-12 max-w-2xl">
          Um cardápio pensado para atender desde festas corporativas até celebrações mais descontraídas.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {drinks.map((drink) => (
            <div
              key={drink.name}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-yellow-500 transition"
            >
              <img
                src={drink.image}
                alt={drink.name}
                className="h-40 w-full object-cover rounded-xl mb-6"
              />

              <h3 className="text-2xl font-bold">
                {drink.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DrinksSection
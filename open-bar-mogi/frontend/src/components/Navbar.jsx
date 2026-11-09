import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 lg:px-10 py-6 border-b border-zinc-800 gap-6">
      <div className="min-w-fit">
        <h1 className="text-xl lg:text-2xl font-bold text-white">
          Equipe Open Bar Mogi
        </h1>
      </div>

      <div className="hidden md:flex gap-5 lg:gap-8 text-zinc-300">
        <a href="#" className="hover:text-white transition">Home</a>
        <a href="#" className="hover:text-white transition">Pacotes</a>
        <a href="#" className="hover:text-white transition">Drinks</a>
        <a href="#" className="hover:text-white transition">Galeria</a>
      </div>

      <Link
        to="/orcamento"
        className="hidden sm:block bg-white text-black px-4 lg:px-5 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition min-w-fit"
      >
        Solicitar orçamento
      </Link>
    </nav>
  )
}

export default Navbar
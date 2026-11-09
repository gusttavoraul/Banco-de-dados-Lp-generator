import { Link } from "react-router-dom"

function Footer() {
  return (
    <footer className="px-6 lg:px-20 py-12 bg-black border-t border-zinc-800">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-4">
        <h3 className="text-2xl font-bold">
          Equipe Open Bar Mogi
        </h3>

        <p className="text-zinc-500 max-w-xl">
          Open bar profissional para eventos em Mogi das Cruzes e região.
        </p>

        <div className="w-16 h-px bg-zinc-800 my-2" />

        <p className="text-zinc-600 text-sm">
          © 2026 Equipe Open Bar Mogi. Todos os direitos reservados.
        </p>

        <Link to="/admin" className="text-zinc-700 hover:text-zinc-400 text-xs transition">
          Área da equipe
        </Link>
      </div>
    </footer>
  )
}

export default Footer
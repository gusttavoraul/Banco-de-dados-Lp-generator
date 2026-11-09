function LoadingScreen({ message = "Carregando..." }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center gap-3">
      <span className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      {message}
    </div>
  )
}

export default LoadingScreen

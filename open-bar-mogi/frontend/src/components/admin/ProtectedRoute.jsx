import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import LoadingScreen from "./LoadingScreen"

// Bloqueia as rotas filhas para quem não está logado.
function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "checking") return <LoadingScreen />

  if (status !== "authenticated") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider } from "./context/AuthProvider"
import ProtectedRoute from "./components/admin/ProtectedRoute"
import AdminLayout from "./components/admin/AdminLayout"
import Home from "./pages/Home"
import Quote from "./pages/Quote"
import Login from "./pages/Login"
import AdminDashboard from "./pages/AdminDashboard"
import AdminQuoteDetails from "./pages/AdminQuoteDetails"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/orcamento" element={<Quote />} />
          <Route path="/admin/login" element={<Login />} />

          {/* Tudo abaixo exige login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orcamentos/:id" element={<AdminQuoteDetails />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

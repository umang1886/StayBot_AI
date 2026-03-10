import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";

// Pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import HotelSetup from "./pages/HotelSetup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Bookings from "./pages/Bookings.jsx";
import Menu from "./pages/Menu.jsx";
import Slots from "./pages/Slots.jsx";
import Analytics from "./pages/Analytics.jsx";
import Customers from "./pages/Customers.jsx";
import Settings from "./pages/Settings.jsx";

// Layout
import PageWrapper from "./components/layout/PageWrapper.jsx";

/** Redirects to /login if no JWT token is in context. */
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route
          path="/hotel-setup"
          element={
            <ProtectedRoute>
              <HotelSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="menu" element={<Menu />} />
                  <Route path="slots" element={<Slots />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="settings" element={<Settings />} />
                </Routes>
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

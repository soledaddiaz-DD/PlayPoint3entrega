import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));
  const [connectionError, setConnectionError] = useState(false);

  const cargarSesion = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setConnectionError(false);
    try {
      const { user: u } = await api.get("/me");
      setUser(u);
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        setUser(null);
      } else {
        setConnectionError(true); // el servidor no responde: no cerramos la sesión por eso
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
    });
    cargarSesion();
  }, [cargarSesion]);

  const login = useCallback(async (email, password, remember) => {
    const { token, user: u } = await api.post("/auth/login", { email, password });
    setToken(token, remember);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (formData) => {
    const { token, user: u } = await api.upload("/auth/register", formData);
    setToken(token, true);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* si falla, igual cerramos la sesión en este navegador */
    }
    clearToken();
    setUser(null);
  }, []);

  /** Vuelve a pedir mis datos al servidor (por ejemplo, para actualizar los tiempos de espera). */
  const refreshUser = useCallback(async () => {
    const { user: u } = await api.get("/me");
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, connectionError, retry: cargarSesion, login, register, logout, refreshUser }),
    [user, loading, connectionError, cargarSesion, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

function Pantalla({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Inter, sans-serif", color: "#0d152c", textAlign: "center" }}>
      <div>{children}</div>
    </div>
  );
}

/** Rutas que requieren haber iniciado sesión. */
export function RutasPrivadas() {
  const { user, loading, connectionError, retry } = useAuth();
  const location = useLocation();

  if (loading) return <Pantalla>Cargando…</Pantalla>;
  if (connectionError) {
    return (
      <Pantalla>
        <p style={{ marginBottom: 14 }}>No pudimos conectar con el servidor.</p>
        <button className="btn-primary" onClick={retry}>Reintentar</button>
      </Pantalla>
    );
  }
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Login y registro: si ya hay sesión, te manda al inicio. */
export function RutasPublicas() {
  const { user, loading } = useAuth();
  if (loading) return <Pantalla>Cargando…</Pantalla>;
  if (user) return <Navigate to="/home" replace />;
  return <Outlet />;
}

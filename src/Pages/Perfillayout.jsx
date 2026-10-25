import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  User,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import logo from "../assets/imagotipo.png";
import { useAuth } from "../auth/AuthContext";
import Avatar from "../components/Avatar";
import "../CSS/Perfil.css";
import "../CSS/Cuenta.css";

function PerfilLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (

    <div className="perfil-page">
      <header className="navbar">
        <Link to="/home" className="nav-brand">
          <img src={logo} alt="PlayPoint" />
        </Link>

        <nav className="nav-links">
          <Link to="/home">Inicio</Link>
          <Link to="/talleres">Talleres</Link>
          <Link to="/torneos">Torneos</Link>
          <Link to="/comunidad">Comunidad</Link>
          <Link to="/membresias">Membresía</Link>
          <Link to="/resenas">Reseñas</Link>
        </nav>
      </header>

      <div className="perfil-layout">
        <aside className="perfil-sidebar">
          <div className="perfil-usuario">
            <Avatar avatarUrl={user.avatarUrl} nombre={user.fullName} size={46} />
            <div className="perfil-usuario-datos">
              <span className="perfil-usuario-nombre">{user.fullName}</span>
              <span className="perfil-usuario-email">@{user.username}</span>
            </div>
          </div>

          <nav className="perfil-nav">
            <NavLink to="/perfil" end>
              <User size={18} />
              Mi perfil
            </NavLink>
            <NavLink to="/perfil/inscripciones">
              <ClipboardList size={18} />
              Mis inscripciones
            </NavLink>
            <NavLink to="/perfil/talleres">
              <Dumbbell size={18} />
              Mis talleres
            </NavLink>
            <NavLink to="/perfil/plan">
              <HeartPulse size={18} />
              Mi plan deportivo
            </NavLink>
            <NavLink to="/perfil/configuracion">
              <Settings size={18} />
              Configuración
            </NavLink>
            <NavLink to="/perfil/notificaciones">
              <Bell size={18} />
              Notificaciones
            </NavLink>
          </nav>

          <button type="button" className="perfil-logout" onClick={cerrarSesion}>
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </aside>

        <main className="perfil-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PerfilLayout;
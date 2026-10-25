import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import logo from "../assets/imagotipo.png";
import "../CSS/Comunidad.css";
import "../CSS/Cuenta.css";
import Footer from "./Footer";
import { api } from "../api";
import NavProfileBtn from "../components/NavProfileBtn";
import PilaAvatares from "../components/PilaAvatares";

function Comunidad() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    api
      .get("/groups")
      .then((r) => !cancelado && setGrupos(r.groups))
      .catch((err) => !cancelado && setError(err.message));
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="comunidad-page">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-brand">
          <img src={logo} alt="PlayPoint" />
        </div>

        <nav className="nav-links">
          <Link to="/home">Inicio</Link>
          <Link to="/talleres">Talleres</Link>
          <Link to="/torneos">Torneos</Link>
          <a href="#" className="active">
            Comunidad
          </a>
          <Link to="/membresias">Membresía</Link>
          <Link to="/resenas">Reseñas</Link>
        </nav>

        <NavProfileBtn />
      </header>

      {/* HEADER */}
      <section className="comunidad-header">
        <div>
          <h1>Comunidad deportiva</h1>
          <p>Unite a grupos, compartí experiencias y conectá con otros deportistas.</p>
        </div>

        <Link to="/comunidad/crear" className="btn-primary">
          <Plus size={16} /> Crear grupo
        </Link>
      </section>

      {/* GRUPOS */}
      <div className="comunidad-content">
        {error && <p className="pp-alert error" role="alert">{error}</p>}
        {!grupos && !error && <p className="cuenta-ayuda">Cargando grupos…</p>}

        <div className="grupos-grid">
          {(grupos ?? []).map((g) => (
            <div
              className="grupo-card"
              key={g.id}
              onClick={() => navigate(`/comunidad/grupo/${g.id}`)}
            >
              <div className="grupo-emoji">{g.emoji}</div>

              <div className="grupo-info">
                <h3>{g.name}</h3>
                <p>
                  {g.memberCount} {g.memberCount === 1 ? "miembro" : "miembros"}
                </p>
              </div>

              <PilaAvatares miembros={g.members} total={g.memberCount} />

              {g.isMember ? (
                <Link
                  to={`/comunidad/grupo/${g.id}`}
                  className="btn-secondary btn-joined"
                  onClick={(e) => e.stopPropagation()}
                >
                  ✓ Miembro
                </Link>
              ) : (
                <Link
                  to={`/comunidad/unirse/${g.id}`}
                  className="btn-secondary"
                  onClick={(e) => e.stopPropagation()}
                >
                  Unirse
                </Link>
              )}
            </div>
          ))}

          <div className="crear-grupo-card">
            <div className="plus-icon">
              <Plus size={20} />
            </div>
            <div className="crear-grupo-info">
              <h3>¿Tenés tu propio grupo?</h3>
              <p>Crealo y sumá a tu comunidad.</p>
            </div>
            <Link to="/comunidad/crear" className="btn-outline">
              Crear grupo
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Comunidad;
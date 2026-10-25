import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  User,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import logo from "../assets/imagotipo.png";
import "../CSS/Talleres.css";
import { api } from "../api";
import NavProfileBtn from "../components/NavProfileBtn";
import { getTallerPorId } from "../data/Talleresdata";
import Footer from "./Footer";

function TallerDetalle() {
  const { id } = useParams();
  const taller = getTallerPorId(id);

  // Cupos reales y si ya estoy inscripto (lo sabe el servidor)
  const [estado, setEstado] = useState(null);
  useEffect(() => {
    let cancelado = false;
    api
      .get("/workshops")
      .then((r) => {
        if (!cancelado) setEstado(r.workshops.find((w) => w.id === id) ?? null);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (!taller) {
    return (
      <div className="detalle-page">
        <header className="navbar">
          <div className="nav-brand">
            <img src={logo} alt="PlayPoint" />
          </div>
          <nav className="nav-links">
            <Link to="/home">Inicio</Link>
            <Link to="/talleres" className="active">
              Talleres
            </Link>
          </nav>
          <NavProfileBtn />
        </header>

        <div className="detalle-notfound">
          <h1>No encontramos ese taller</h1>
          <p>Puede que el link esté roto o el taller ya no exista.</p>
          <Link to="/talleres" className="btn-primary">
            <ArrowLeft size={14} /> Volver a talleres
          </Link>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="detalle-page">
      {/* =========================
          NAVBAR
      ========================= */}
      <header className="navbar">
        <div className="nav-brand">
          <img src={logo} alt="PlayPoint" />
        </div>

        <nav className="nav-links">
          <Link to="/home">Inicio</Link>
          <Link to="/talleres" className="active">
            Talleres
          </Link>
          <Link to="/torneos">Torneos</Link>
          <Link to="/comunidad">Comunidad</Link>
          <Link to="/membresias">Membresía</Link>
          <Link to="/resenas">Reseñas</Link>
        </nav>

        <NavProfileBtn />
      </header>

      {/* =========================
          BREADCRUMB
      ========================= */}
      <div className="breadcrumb">
        <Link to="/home">Inicio</Link>
        <span>›</span>
        <Link to="/talleres">Talleres</Link>
        <span>›</span>
        {taller.nombre}
      </div>

      <div className="detalle-layout">
        <div>
          {/* =========================
              BANNER
          ========================= */}
          <div className="detalle-hero">
            <span>{taller.emoji}</span>
          </div>

          <h1 className="detalle-title">{taller.nombre}</h1>
          <p className="detalle-desc">{taller.descripcionCorta}</p>

          <div className="detalle-attrs">
            <div className="detalle-attr">
              <Calendar size={16} />
              <span className="attr-label">Días</span>
              <span className="attr-val">{taller.dias}</span>
            </div>
            <div className="detalle-attr">
              <Clock size={16} />
              <span className="attr-label">Horario</span>
              <span className="attr-val">{taller.horario}</span>
            </div>
            <div className="detalle-attr">
              <MapPin size={16} />
              <span className="attr-label">Lugar</span>
              <span className="attr-val">{taller.lugar}</span>
            </div>
            <div className="detalle-attr">
              <User size={16} />
              <span className="attr-label">Profesor</span>
              <span className="attr-val">{taller.profesor}</span>
            </div>
          </div>

          <div className="sobre-taller">
            <h3>Sobre el taller</h3>
            <p>{taller.sobre}</p>
          </div>

          <div className="proximas-detalle">
            <h3>Próximas actividades</h3>

            {taller.proximas.map((p, i) => (
              <div className="actividad-item" key={i}>
                <div className="actividad-fecha">
                  <div className="dia">{p.dia}</div>
                  <div className="mes">{p.mes}</div>
                </div>
                <div className="actividad-info">
                  <h4>Entrenamiento de {taller.nombre}</h4>
                  <p>
                    {p.detalle} · {taller.lugar}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="detalle-cta-agenda">
            <Link to="/talleres#calendario" className="btn-secondary">
              Ver agenda completa
            </Link>
          </div>
        </div>

        {/* =========================
            SIDEBAR INSCRIPCIÓN
        ========================= */}
        <div className="inscripcion-card">
          <div className="inscripcion-info">
            <div className="inscripcion-titulo">
              <h3>
                {estado && estado.available === 0 && !estado.isEnrolled
                  ? "Cupos agotados"
                  : "Inscripciones abiertas"}
              </h3>
            </div>

            <div className="cupos">
              <span>Cupos disponibles:</span>
              <strong>{estado ? estado.available : "–"}</strong>
            </div>
          </div>

          {estado?.isEnrolled ? (
            <Link to="/perfil/inscripciones" className="btn-secondary inscripcion-btn">
              ✓ Ya estás inscripto
            </Link>
          ) : estado && estado.available === 0 ? (
            <span className="btn-secondary inscripcion-btn" aria-disabled="true">
              Sin cupos
            </span>
          ) : (
            <Link
              to={`/talleres/${taller.id}/inscripcion`}
              className="btn-primary inscripcion-btn"
            >
              Inscribirme <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default TallerDetalle;
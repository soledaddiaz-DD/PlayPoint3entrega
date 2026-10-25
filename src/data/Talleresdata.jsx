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
import Footer from "../Pages/Footer";

/* =========================================================
   DATOS (mismos que en TalleresTEMP.jsx)
========================================================= */
export const talleres = [
  {
    id: "futbol",
    nombre: "Fútbol",
    emoji: "⚽",
    dias: "Martes y Jueves",
    horario: "18:00 – 19:30",
    lugar: "Polideportivo PlayPoint",
    profesor: "Prof. Santiago Pérez",
    cupos: 18,
    descripcionCorta:
      "Entrenamientos enfocados en el trabajo en equipo, técnica, tácticos y preparación física.",
    sobre:
      "El taller busca desarrollar habilidades técnicas y tácticas, promover el trabajo en equipo y fomentar hábitos saludables a través del deporte.",
    proximas: [
      { dia: 13, mes: "MAYO", detalle: "Martes 13 de mayo · 18:00 – 19:30" },
      { dia: 15, mes: "MAYO", detalle: "Jueves 15 de mayo · 18:00 – 19:30" },
    ],
  },
  {
    id: "basquetbol",
    nombre: "Básquetbol",
    emoji: "🏀",
    dias: "Lunes y Miércoles",
    horario: "17:00 – 18:30",
    lugar: "Polideportivo PlayPoint",
    profesor: "Prof. Carolina Núñez",
    cupos: 22,
    descripcionCorta:
      "Entrenamientos de fundamentos, tiro y juego en equipo para todos los niveles.",
    sobre:
      "Trabajamos fundamentos individuales, lectura de juego y estrategias colectivas, en un ambiente competitivo pero amigable para todas las edades.",
    proximas: [
      { dia: 11, mes: "MAYO", detalle: "Lunes 11 de mayo · 17:00 – 18:30" },
      { dia: 13, mes: "MAYO", detalle: "Miércoles 13 de mayo · 17:00 – 18:30" },
    ],
  },
  {
    id: "voley",
    nombre: "Vóley",
    emoji: "🏐",
    dias: "Martes y Jueves",
    horario: "16:00 – 17:30",
    lugar: "Gimnasio PlayPoint",
    profesor: "Prof. Martina Gómez",
    cupos: 20,
    descripcionCorta:
      "Técnica de saque, recepción y armado de jugadas en un grupo que crece unido.",
    sobre:
      "Un espacio para mejorar técnica individual y de equipo, con foco en la comunicación en cancha y la constancia del entrenamiento.",
    proximas: [
      { dia: 13, mes: "MAYO", detalle: "Martes 13 de mayo · 16:00 – 17:30" },
      { dia: 15, mes: "MAYO", detalle: "Jueves 15 de mayo · 16:00 – 17:30" },
    ],
  },
  {
    id: "handball",
    nombre: "Handball",
    emoji: "🤾",
    dias: "Viernes",
    horario: "18:00 – 19:30",
    lugar: "Polideportivo PlayPoint",
    profesor: "Prof. Diego Ramírez",
    cupos: 15,
    descripcionCorta:
      "Un deporte intenso y dinámico, ideal para sumar velocidad y trabajo en equipo.",
    sobre:
      "Entrenamos resistencia, coordinación y juego colectivo en partidos intensos, siempre priorizando la técnica y la prevención de lesiones.",
    proximas: [
      { dia: 16, mes: "MAYO", detalle: "Viernes 16 de mayo · 18:00 – 19:30" },
      { dia: 23, mes: "MAYO", detalle: "Viernes 23 de mayo · 18:00 – 19:30" },
    ],
  },
  {
    id: "atletismo",
    nombre: "Atletismo",
    emoji: "🏃",
    dias: "Lunes y Miércoles",
    horario: "17:30 – 18:30",
    lugar: "Pista PlayPoint",
    profesor: "Prof. Valentina Sosa",
    cupos: 25,
    descripcionCorta:
      "Entrená resistencia y velocidad con planes adaptados a tu nivel.",
    sobre:
      "Trabajamos resistencia, velocidad y técnica de carrera con planes progresivos, sea que estés empezando o ya corras habitualmente.",
    proximas: [
      { dia: 11, mes: "MAYO", detalle: "Lunes 11 de mayo · 17:30 – 18:30" },
      { dia: 13, mes: "MAYO", detalle: "Miércoles 13 de mayo · 17:30 – 18:30" },
    ],
  },
];
export function getTallerPorId(id) {
  return talleres.find((taller) => taller.id === id);
}

function TallerDetalle() {
  const { id } = useParams();
  const taller = talleres.find((t) => t.id === id);

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
          <a href="#" className="nav-profile-btn" aria-label="Mi perfil">
            <User size={18} />
          </a>
        </header>

        <div className="detalle-notfound">
          <h1>No encontramos ese taller</h1>
          <p>Puede que el link esté roto o el taller ya no exista.</p>
          <Link to="/talleres" className="btn-primary">
            <ArrowLeft size={14} /> Volver a talleres
          </Link>
        </div>
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

        <a href="#" className="nav-profile-btn" aria-label="Mi perfil">
          <User size={18} />
        </a>
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
        <div>
          <div className="inscripcion-card">
            <h3>Inscripciones abiertas</h3>
            <p className="cupos">
              Cupos disponibles: <strong>{taller.cupos}</strong>
            </p>
            <Link to="/register" className="btn-primary">
              Inscribirme <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default TallerDetalle;
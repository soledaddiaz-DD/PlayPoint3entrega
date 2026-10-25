import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  HeartPulse,
  Trophy,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import logo from "../assets/imagotipo.png";
import "../CSS/Talleres.css";
import Footer from "./Footer";
import NavProfileBtn from "../components/NavProfileBtn";

/* =========================================================
   DATA
========================================================= */
const deportes = [
  { id: "todos", nombre: "Todos", emoji: "🎯" },
  { id: "futbol", nombre: "Fútbol", emoji: "⚽" },
  { id: "basquetbol", nombre: "Básquetbol", emoji: "🏀" },
  { id: "voley", nombre: "Vóley", emoji: "🏐" },
  { id: "handball", nombre: "Handball", emoji: "🤾" },
  { id: "atletismo", nombre: "Atletismo", emoji: "🏃" },
];

const talleres = [
  {
    id: "futbol",
    nombre: "Fútbol",
    emoji: "⚽",
    dias: "Martes y Jueves",
    horario: "18:00 – 19:30",
    lugar: "Polideportivo PlayPoint",
  },
  {
    id: "basquetbol",
    nombre: "Básquetbol",
    emoji: "🏀",
    dias: "Lunes y Miércoles",
    horario: "17:00 – 18:30",
    lugar: "Polideportivo PlayPoint",
  },
  {
    id: "voley",
    nombre: "Vóley",
    emoji: "🏐",
    dias: "Martes y Jueves",
    horario: "16:00 – 17:30",
    lugar: "Gimnasio PlayPoint",
  },
  {
    id: "handball",
    nombre: "Handball",
    emoji: "🤾",
    dias: "Viernes",
    horario: "18:00 – 19:30",
    lugar: "Polideportivo PlayPoint",
  },
  {
    id: "atletismo",
    nombre: "Atletismo",
    emoji: "🏃",
    dias: "Lunes y Miércoles",
    horario: "17:30 – 18:30",
    lugar: "Pista PlayPoint",
  },
];

const proximasActividades = [
  {
    titulo: "Entrenamiento de Vóley",
    detalle: "Martes 13 de mayo · 16:00 – 17:30",
    lugar: "Gimnasio PlayPoint",
  },
  {
    titulo: "Entrenamiento de Fútbol",
    detalle: "Jueves 14 de mayo · 18:00 – 19:30",
    lugar: "Polideportivo PlayPoint",
  },
  {
    titulo: "Entrenamiento de Básquetbol",
    detalle: "Miércoles 20 de mayo · 17:00 – 18:30",
    lugar: "Polideportivo PlayPoint",
  },
];

const agendaSemana = [
  {
    dia: "Martes 13 Mayo",
    eventos: [
      {
        id: "futbol",
        emoji: "⚽",
        nombre: "Fútbol",
        lugar: "Polideportivo PlayPoint",
        horario: "18:00 – 19:30",
      },
      {
        id: "voley",
        emoji: "🏐",
        nombre: "Vóley",
        lugar: "Gimnasio PlayPoint",
        horario: "16:00 – 17:30",
      },
    ],
  },
  {
    dia: "Miércoles 14 Mayo",
    eventos: [
      {
        id: "basquetbol",
        emoji: "🏀",
        nombre: "Básquetbol",
        lugar: "Polideportivo PlayPoint",
        horario: "17:00 – 18:30",
      },
    ],
  },
  {
    dia: "Jueves 15 Mayo",
    eventos: [
      {
        id: "futbol",
        emoji: "⚽",
        nombre: "Fútbol",
        lugar: "Polideportivo PlayPoint",
        horario: "18:00 – 19:30",
      },
    ],
  },
  {
    dia: "Viernes 16 Mayo",
    eventos: [
      {
        id: "handball",
        emoji: "🤾",
        nombre: "Handball",
        lugar: "Polideportivo PlayPoint",
        horario: "18:00 – 19:30",
      },
    ],
  },
];

/* Días del mini calendario (mayo 2026, hardcodeado como en el mockup) */
const semanas = [
  [
    { dia: 27, fuera: true },
    { dia: 28, fuera: true },
    { dia: 29, fuera: true },
    { dia: 30, fuera: true },
    { dia: 1 },
    { dia: 2 },
    { dia: 3 },
  ],
  [
    { dia: 4 },
    { dia: 5, evento: true },
    { dia: 6 },
    { dia: 7, evento: true },
    { dia: 8 },
    { dia: 9 },
    { dia: 10 },
  ],
  [
    { dia: 11 },
    { dia: 12, evento: true },
    { dia: 13 },
    { dia: 14, evento: true },
    { dia: 15 },
    { dia: 16 },
    { dia: 17 },
  ],
  [
    { dia: 18 },
    { dia: 19 },
    { dia: 20 },
    { dia: 21, hoy: true },
    { dia: 22 },
    { dia: 23 },
    { dia: 24 },
  ],
  [
    { dia: 25 },
    { dia: 26 },
    { dia: 27 },
    { dia: 28 },
    { dia: 29 },
    { dia: 30 },
    { dia: 31 },
  ],
];

/* =========================================================
   TALLERES
========================================================= */
function Talleres() {
  const [filtro, setFiltro] = useState("todos");
  const [diaSeleccionado, setDiaSeleccionado] = useState(21);

  const talleresFiltrados =
    filtro === "todos" ? talleres : talleres.filter((t) => t.id === filtro);

  return (
    <div className="talleres-page">
      {/* =========================
                NAVBAR
            ========================= */}
      <header className="navbar">
        <div className="nav-brand">
          <img src={logo} alt="PlayPoint" />
        </div>

        <nav className="nav-links">
          <Link to="/home">Inicio</Link>
          <a href="#" className="active">
            Talleres
          </a>
          <Link to="/torneos">Torneos</Link>
          <Link to="/comunidad">Comunidad</Link>
          <Link to="/membresias">Membresía</Link>
          <Link to="/resenas">Reseñas</Link>
        </nav>

        <NavProfileBtn />
      </header>

      {/* =========================
                PAGE HEADER
            ========================= */}
      <section className="page-header">
        <h1>Talleres disponibles</h1>
        <p>
          Elegí tu deporte, encontrá el taller ideal y organizá tu semana con el
          calendario.
        </p>
      </section>

      <div className="talleres-content">
        {/* =========================
                    DEPORTES (filtro)
                ========================= */}
        <section className="deportes-filter" id="deportes">
          <h2>Explorá por deporte</h2>

          <div className="filter-tabs">
            {deportes.map((d) => (
              <button
                key={d.id}
                className={`filter-tab ${filtro === d.id ? "active" : ""}`}
                onClick={() => setFiltro(d.id)}
              >
                <span className="emoji">{d.emoji}</span>
                {d.nombre}
              </button>
            ))}
          </div>
        </section>

        {/* =========================
                    TALLERES + CALENDARIO
                ========================= */}
        <div className="talleres-layout">
          <div className="taller-list">
            {talleresFiltrados.map((t) => (
              <div className="taller-card" key={t.id}>
                <div className="taller-emoji">{t.emoji}</div>

                <div className="taller-info">
                  <h3>{t.nombre}</h3>
                  <div className="taller-meta">
                    <span>
                      <Calendar size={13} /> {t.dias}
                    </span>
                    <span>
                      <Clock size={13} /> {t.horario}
                    </span>
                    <span>
                      <MapPin size={13} /> {t.lugar}
                    </span>
                  </div>
                </div>

                <Link to={`/talleres/${t.id}`} className="btn-primary">
                  Ver detalles
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}

            {talleresFiltrados.length === 0 && (
              <div className="empty-state">
                No hay talleres para este filtro por ahora.
              </div>
            )}
          </div>

          {/* =========================
                        MINI CALENDARIO
                    ========================= */}
          <div className="cal-card" id="calendario">
            <h2>Calendario</h2>

            <div className="cal-header">
              <button className="cal-nav" aria-label="Mes anterior">
                <ChevronLeft size={15} />
              </button>
              <h3>Mayo 2026</h3>
              <button className="cal-nav" aria-label="Mes siguiente">
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="cal-grid">
              <div className="cal-day-header">LUN</div>
              <div className="cal-day-header">MAR</div>
              <div className="cal-day-header">MIÉ</div>
              <div className="cal-day-header">JUE</div>
              <div className="cal-day-header">VIE</div>
              <div className="cal-day-header">SÁB</div>
              <div className="cal-day-header">DOM</div>

              {semanas.flat().map((d, i) => (
                <button
                  key={i}
                  disabled={d.fuera}
                  className={[
                    "cal-day",
                    d.fuera ? "other-month" : "",
                    d.evento ? "has-event" : "",
                    d.hoy ? "today" : "",
                    diaSeleccionado === d.dia && !d.fuera ? "selected" : "",
                  ]
                    .join(" ")
                    .trim()}
                  onClick={() => !d.fuera && setDiaSeleccionado(d.dia)}
                >
                  {d.dia}
                </button>
              ))}
            </div>

            <div className="proximas-list">
              <h3>Próximas actividades</h3>

              {proximasActividades.map((a, i) => (
                <div className="event-item" key={i}>
                  <div className="event-dot" />
                  <div className="event-info">
                    <h4>{a.titulo}</h4>
                    <p>
                      {a.detalle}
                      <br />
                      {a.lugar}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =========================
                    AGENDA COMPLETA
                ========================= */}
        <section className="agenda-section">
          <h2>Agenda completa de la semana</h2>
          <p>Todos los horarios de entrenamiento en un solo lugar.</p>

          <div className="agenda-grid">
            {agendaSemana.map((d, i) => (
              <div className="agenda-day" key={i}>
                <h3>{d.dia}</h3>

                {d.eventos.map((e, j) => (
                  <Link
                    to={`/talleres/${e.id}`}
                    className="agenda-event"
                    key={j}
                  >
                    <div className="agenda-emoji">{e.emoji}</div>
                    <div>
                      <div className="agenda-title">{e.nombre}</div>
                      <div className="agenda-loc">
                        <MapPin size={12} /> {e.lugar}
                      </div>
                    </div>
                    <div className="agenda-time">{e.horario}</div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default Talleres;
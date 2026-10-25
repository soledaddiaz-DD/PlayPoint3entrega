import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  HeartPulse,
  Trophy,
  Sparkles,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logo from "../assets/imagotipo.png";
import carrusel1 from "../assets/carrusel1.jpeg";
import carrusel2 from "../assets/carrusel2.jpeg";
import carrusel3 from "../assets/carrusel3.jpeg";
import carrusel4 from "../assets/carrusel4.jpeg";
import "../CSS/Home.css";
import Footer from "./Footer";
import NavProfileBtn from "../components/NavProfileBtn";
/* =========================================================
   CARRUSEL DE FOTOS DEL HERO
========================================================= */

const slides = [
  {
    image: carrusel1,
    icon: <HeartPulse size={64} />,
  },
  {
    image: carrusel2,
    icon: <Users size={64} />,
  },
  {
    image: carrusel3,
    icon: <Trophy size={64} />,
  },
  {
    image: carrusel4,
    icon: <Sparkles size={64} />,
  },
];

function HeroCarousel() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = () => {
    setActive((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="hero-carousel">
      <div className="carousel-frame">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === active ? "is-active" : ""}`}
            style={
              slide.image
                ? { backgroundImage: `url(${slide.image})` }
                : undefined
            }
          >
            {!slide.image && (
              <div className="carousel-placeholder">{slide.icon}</div>
            )}

            <div className="carousel-caption">{slide.caption}</div>
          </div>
        ))}

        <button
          className="carousel-arrow arrow-left"
          onClick={prev}
          aria-label="Anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          className="carousel-arrow arrow-right"
          onClick={next}
          aria-label="Siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="carousel-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === active ? "is-active" : ""}`}
            onClick={() => setActive(index)}
            aria-label={`Ir a la foto ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   DATA
========================================================= */
const deportes = [
  { id: "futbol", nombre: "Fútbol", emoji: "⚽" },
  { id: "basquetbol", nombre: "Básquetbol", emoji: "🏀" },
  { id: "voley", nombre: "Vóley", emoji: "🏐" },
  { id: "handball", nombre: "Handball", emoji: "🤾" },
  { id: "atletismo", nombre: "Atletismo", emoji: "🏃" },
];

const features = [
  {
    icon: <Users size={22} />,
    titulo: "Comunidad",
    texto: "Formamos equipos, crecemos juntos.",
  },
  {
    icon: <HeartPulse size={22} />,
    titulo: "Bienestar",
    texto: "Cuerpo y mente en equilibrio.",
  },
  {
    icon: <Trophy size={22} />,
    titulo: "Superación",
    texto: "Desafiamos todos los días.",
  },
  {
    icon: <Star size={22} />,
    titulo: "Diversión",
    texto: "Disfrutá del proceso y cada logro.",
  },
];

/* =========================================================
   HOME
========================================================= */
function Home() {
  return (
    <div className="home-page">
      {/* =========================
                NAVBAR
            ========================= */}
      <header className="navbar">
        <div className="nav-brand">
          <img src={logo} alt="PlayPoint" />
        </div>

        <nav className="nav-links">
          <a href="#" className="active">
            Inicio
          </a>
          <Link to="/Talleres">Talleres</Link>
          <Link to="/Torneos">Torneos</Link>
          <Link to="/Comunidad">Comunidad</Link>
          <Link to="/Membresias">Membresía</Link>
          <Link to="/Resenas">Reseñas</Link>
        </nav>

        <NavProfileBtn />
      </header>

      {/* =========================
                HERO
            ========================= */}
      <section className="hero">
        <div className="hero-text">
          <h1>
            Viví el deporte.
            <br />
            Viví <span>PlayPoint.</span>
          </h1>

          <p>
            Sumate a nuestros talleres deportivos y formá parte de una comunidad
            que se mueve, se esfuerza y crece unida.
          </p>

          <div className="hero-actions">
            <a href="#deportes" className="btn-primary">
              Ver talleres
              <ArrowRight size={16} />
            </a>

            <Link to="/comunidad" className="btn-outline">
              <Users size={16} />
              Unite a la comunidad
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <HeroCarousel />
        </div>
      </section>

      {/* =========================
                FEATURES FLOTANTES
            ========================= */}
      <section className="features-bar">
        {features.map((f, i) => (
          <div className="feature-item" key={i}>
            <div className="feature-icon">{f.icon}</div>

            <div>
              <h4>{f.titulo}</h4>
              <p>{f.texto}</p>
            </div>
          </div>
        ))}
      </section>

      {/* =========================
                DEPORTES
            ========================= */}
      <section className="deportes-section" id="deportes">
        <h2>Explorá nuestros deportes</h2>

        <div className="deportes-grid">
          {deportes.map((d, i) => (
            <div className="deporte-card" key={i}>
              <div className="deporte-emoji">{d.emoji}</div>

              <h3>{d.nombre}</h3>

              <Link to={`/talleres/${d.id}`} className="deporte-link">
                Ver talleres
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
                CTA
            ========================= */}
      <section className="cta-banner">
        <div className="cta-text">
          <Star size={20} />

          <div>
            <h3>¿No sabés cuál elegir?</h3>
            <p>Probá diferentes talleres y descubrí tu pasión.</p>
          </div>
        </div>

        <Link to="/talleres" className="btn-primary">
          Quiero probar
        </Link>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
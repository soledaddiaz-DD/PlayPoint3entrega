import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Building2, Lock, Check, Trash2 } from "lucide-react";
import logo from "../assets/imagotipo.png";
import Footer from "./Footer";
import "../CSS/Membresias.css";
import { cargar, guardar } from "../data/store";
import NavProfileBtn from "../components/NavProfileBtn";

/* =========================================================
   DATA
========================================================= */
const planes = [
  {
    id: "basica",
    nombre: "Básica",
    descripcion: "Acceso a talleres grupales",
    precio: "$600",
    periodo: "/ mes",
    destacado: false,
    beneficios: [
      "Todos los talleres grupales",
      "Acceso al calendario",
      "Comunidad deportiva",
    ],
  },
  {
    id: "premium",
    nombre: "Premium",
    descripcion: "Acceso total a talleres y beneficios exclusivos",
    precio: "$1.200",
    periodo: "/ mes",
    destacado: true,
    beneficios: [
      "Todo lo del plan Básica",
      "Talleres exclusivos",
      "Plan deportivo personal",
      "Prioridad de inscripción",
    ],
  },
  {
    id: "anual",
    nombre: "Anual",
    descripcion: "12 meses con 2 gratis",
    precio: "$12.000",
    periodo: "/ año",
    destacado: false,
    beneficios: [
      "Todo lo del plan Premium",
      "2 meses gratis",
      "Acceso prioritario a eventos",
    ],
  },
];

function Membresias() {
  const [planElegido, setPlanElegido] = useState(() =>
    cargar("pp_plan_elegido", null)
  );
  const [planActivo, setPlanActivo] = useState(() =>
    cargar("pp_plan_activo", null)
  );
  const [tarjetas, setTarjetas] = useState(() => cargar("pp_tarjetas", []));
  const [tarjetaSel, setTarjetaSel] = useState(() => {
    const lista = cargar("pp_tarjetas", []);
    const guardada = cargar("pp_tarjeta_sel", null);
    return lista.some((t) => t.id === guardada) ? guardada : lista[0]?.id ?? null;
  });
  const [mensaje, setMensaje] = useState("");

  const elegirPlan = (id) => {
    setPlanElegido(id);
    guardar("pp_plan_elegido", id);
    setMensaje("");
  };

  const elegirTarjeta = (id) => {
    setTarjetaSel(id);
    guardar("pp_tarjeta_sel", id);
  };

  const eliminarTarjeta = (e, id) => {
    e.stopPropagation();
    const resto = tarjetas.filter((t) => t.id !== id);
    setTarjetas(resto);
    guardar("pp_tarjetas", resto);
    if (tarjetaSel === id) elegirTarjeta(resto[0]?.id ?? null);
  };

  const pagar = () => {
    if (!planElegido) {
      setMensaje("Elegí un plan antes de pagar.");
      return;
    }
    if (!tarjetaSel) {
      setMensaje("Agregá una tarjeta para poder pagar.");
      return;
    }
    setPlanActivo(planElegido);
    guardar("pp_plan_activo", planElegido);
    const plan = planes.find((p) => p.id === planElegido);
    setMensaje(`¡Listo! Tu plan ${plan.nombre} quedó activo.`);
  };

  return (
    <div className="membresias-page">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-brand">
          <img src={logo} alt="PlayPoint" />
        </div>

        <nav className="nav-links">
          <Link to="/home">Inicio</Link>
          <Link to="/talleres">Talleres</Link>
          <Link to="/torneos">Torneos</Link>
          <Link to="/comunidad">Comunidad</Link>
          <a href="#" className="active">
            Membresía
          </a>
          <Link to="/resenas">Reseñas</Link>
        </nav>

        <NavProfileBtn />
      </header>

      {/* HEADER */}
      <section className="membresias-header">
        <h1>Membresías</h1>
        <p>Elegí el plan que más se adapta a vos</p>
      </section>

      <div className="membresias-content">
        {/* PLANES */}
        <div className="planes-grid">
          {planes.map((p) => {
            const seleccionado = planElegido === p.id;

            return (
              <div
                className={`plan-card ${p.destacado ? "destacado" : ""} ${
                  seleccionado ? "seleccionado" : ""
                }`}
                key={p.id}
                onClick={() => elegirPlan(p.id)}
              >
                {p.destacado && <div className="plan-badge">Más elegido</div>}

                <div className="plan-nombre">
                  {p.nombre}
                  {planActivo === p.id && (
                    <span className="plan-activo">Plan actual</span>
                  )}
                </div>
                <p className="plan-desc">{p.descripcion}</p>

                <div className="plan-precio">
                  {p.precio} <span>{p.periodo}</span>
                </div>

                <ul className="plan-beneficios">
                  {p.beneficios.map((b, i) => (
                    <li key={i}>
                      <Check size={14} /> {b}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={seleccionado ? "btn-primary" : "btn-secondary"}
                  onClick={(e) => {
                    e.stopPropagation();
                    elegirPlan(p.id);
                  }}
                >
                  {seleccionado ? "✓ Seleccionado" : "Elegir"}
                </button>
              </div>
            );
          })}
        </div>

        {/* MÉTODOS DE PAGO */}
        <div className="pago-section">
          <h2>Métodos de pago</h2>

          {tarjetas.length === 0 && (
            <p className="sin-tarjetas">Todavía no agregaste ninguna tarjeta.</p>
          )}

          {tarjetas.map((t) => (
            <div
              key={t.id}
              className={`pago-metodo tarjeta-guardada ${
                tarjetaSel === t.id ? "selected" : ""
              }`}
              onClick={() => elegirTarjeta(t.id)}
            >
              <CreditCard size={20} />
              <span>
                {t.marca} •••• •••• •••• {t.ultimos4}
                <em className="tarjeta-titular">
                  {t.titular} · Vence {t.vencimiento}
                </em>
              </span>
              <button
                type="button"
                className="tarjeta-eliminar"
                onClick={(e) => eliminarTarjeta(e, t.id)}
                aria-label="Eliminar tarjeta"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <Link to="/membresias/agregar-tarjeta" className="agregar-tarjeta">
            + Agregar nueva tarjeta
          </Link>

          <div className="pago-metodo">
            <Building2 size={20} />
            <span>Pago seguro</span>
            <small>Tus datos protegidos</small>
          </div>

          <button type="button" className="btn-primary pagar-btn" onClick={pagar}>
            Pagar ahora
          </button>

          {mensaje && <div className="pago-mensaje">{mensaje}</div>}

          <div className="secure-badge">
            <Lock size={13} /> Tus datos están protegidos con cifrado SSL
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Membresias;
import { useState } from "react";

const notificacionesIniciales = [
  {
    id: 1,
    titulo: "Tu clase de Fútbol empieza en 1 hora",
    fecha: "Hoy, 17:00",
    leida: false,
  },
  {
    id: 2,
    titulo: "Nueva reseña respondida por el profe de Atletismo",
    fecha: "Ayer",
    leida: false,
  },
  {
    id: 3,
    titulo: "Tu pago de la membresía fue confirmado",
    fecha: "Hace 3 días",
    leida: true,
  },
];

function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState(
    notificacionesIniciales
  );

  function marcarLeida(id) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  }

  return (
    <div>
      <h1 className="perfil-titulo">Notificaciones</h1>

      <div className="perfil-card">
        <h3>Preferencias</h3>

        <label className="config-switch-row">
          <span>Recordatorios de clases</span>
          <input type="checkbox" defaultChecked />
        </label>

        <label className="config-switch-row">
          <span>Novedades de la comunidad</span>
          <input type="checkbox" defaultChecked />
        </label>

        <label className="config-switch-row">
          <span>Promociones y membresías</span>
          <input type="checkbox" />
        </label>
      </div>

      <div className="notificaciones-lista">
        {notificaciones.map((n) => (
          <div
            className={`perfil-card notificacion-card ${
              n.leida ? "" : "no-leida"
            }`}
            key={n.id}
            onClick={() => marcarLeida(n.id)}
          >
            <span className="notificacion-titulo">{n.titulo}</span>
            <span className="notificacion-fecha">{n.fecha}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notificaciones;
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { api, clearToken, formatDuration, replaceToken } from "../api";
import { useAuth } from "../auth/AuthContext";
import Avatar from "../components/Avatar";
import "../CSS/Cuenta.css";

const MAX_FOTO = 2 * 1024 * 1024;
const USUARIO_VALIDO = /^[A-Za-z0-9_.]{3,20}$/;

/* Segundos que faltan (el servidor manda el valor; acá solo lo vamos descontando). */
function useCuentaRegresiva(segundos) {
  const [fin, setFin] = useState(() => Date.now() + segundos * 1000);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const ahoraMs = Date.now();
    setFin(ahoraMs + segundos * 1000);
    setAhora(ahoraMs);
  }, [segundos]);

  useEffect(() => {
    if (segundos <= 0) return undefined;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [segundos]);

  return Math.max(0, Math.ceil((fin - ahora) / 1000));
}

function Mensaje({ msg }) {
  if (!msg) return null;
  return (
    <p className={`pp-alert ${msg.tipo}`} role={msg.tipo === "error" ? "alert" : "status"}>
      {msg.texto}
    </p>
  );
}

function Configuracion() {
  const navigate = useNavigate();
  const { user, setUser, refreshUser } = useAuth();
  const [idioma, setIdioma] = useState("es");

  /* ---------- Foto ---------- */
  const esperaFoto = useCuentaRegresiva(user.limits.avatarRetryAfterSec);
  const inputFoto = useRef(null);
  const [fotoNueva, setFotoNueva] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [msgFoto, setMsgFoto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const elegirFoto = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    if (!["image/jpeg", "image/png"].includes(archivo.type)) {
      setMsgFoto({ tipo: "error", texto: "La foto debe ser JPG o PNG." });
      return;
    }
    if (archivo.size > MAX_FOTO) {
      setMsgFoto({ tipo: "error", texto: "La foto no puede pesar más de 2 MB." });
      return;
    }
    setMsgFoto(null);
    setFotoNueva(archivo);
    setFotoPreview(URL.createObjectURL(archivo));
  };

  const cancelarFoto = () => {
    setFotoNueva(null);
    setFotoPreview(null);
  };

  const guardarFoto = async () => {
    if (!fotoNueva || subiendo) return;
    setSubiendo(true);
    setMsgFoto(null);
    try {
      const datos = new FormData();
      datos.append("avatar", fotoNueva);
      const { user: actualizado } = await api.upload("/me/avatar", datos);
      setUser(actualizado);
      cancelarFoto();
      setMsgFoto({ tipo: "ok", texto: "¡Listo! Actualizaste tu foto de perfil." });
    } catch (err) {
      setMsgFoto({ tipo: "error", texto: err.message });
      if (err.code === "COOLDOWN") {
        cancelarFoto();
        refreshUser().catch(() => {});
      }
    } finally {
      setSubiendo(false);
    }
  };

  /* ---------- Nombre de usuario ---------- */
  const esperaUsuario = useCuentaRegresiva(user.limits.usernameRetryAfterSec);
  const [usuarioNuevo, setUsuarioNuevo] = useState(user.username);
  const [confirmandoUsuario, setConfirmandoUsuario] = useState(false);
  const [msgUsuario, setMsgUsuario] = useState(null);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  const usuarioBloqueado = esperaUsuario > 0;
  const fechaDesbloqueo = new Date(Date.now() + esperaUsuario * 1000).toLocaleDateString("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const pedirConfirmacionUsuario = (e) => {
    e.preventDefault();
    const nombre = usuarioNuevo.trim();
    if (nombre === user.username) {
      setMsgUsuario({ tipo: "error", texto: "Ese ya es tu nombre de usuario." });
      return;
    }
    if (!USUARIO_VALIDO.test(nombre)) {
      setMsgUsuario({
        tipo: "error",
        texto: "Entre 3 y 20 caracteres: letras, números, punto o guion bajo.",
      });
      return;
    }
    setMsgUsuario(null);
    setConfirmandoUsuario(true);
  };

  const guardarUsuario = async () => {
    setGuardandoUsuario(true);
    setMsgUsuario(null);
    try {
      const { user: actualizado } = await api.patch("/me/username", { username: usuarioNuevo.trim() });
      setUser(actualizado);
      setUsuarioNuevo(actualizado.username);
      setMsgUsuario({ tipo: "ok", texto: `Listo, ahora sos @${actualizado.username}.` });
    } catch (err) {
      setMsgUsuario({ tipo: "error", texto: err.message });
      if (err.code === "COOLDOWN") refreshUser().catch(() => {});
    } finally {
      setConfirmandoUsuario(false);
      setGuardandoUsuario(false);
    }
  };

  /* ---------- Contraseña ---------- */
  const [clave, setClave] = useState({ actual: "", nueva: "", repetir: "" });
  const [msgClave, setMsgClave] = useState(null);
  const [guardandoClave, setGuardandoClave] = useState(false);

  const cambiarClave = async (e) => {
    e.preventDefault();
    if (clave.nueva.length < 8) {
      setMsgClave({ tipo: "error", texto: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (clave.nueva !== clave.repetir) {
      setMsgClave({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
      return;
    }
    setGuardandoClave(true);
    setMsgClave(null);
    try {
      const { token } = await api.post("/me/password", {
        currentPassword: clave.actual,
        newPassword: clave.nueva,
      });
      replaceToken(token); // esta sesión sigue abierta; las demás se cierran
      setClave({ actual: "", nueva: "", repetir: "" });
      setMsgClave({ tipo: "ok", texto: "Contraseña actualizada. Se cerraron tus otras sesiones." });
    } catch (err) {
      setMsgClave({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoClave(false);
    }
  };

  /* ---------- Eliminar cuenta ---------- */
  const [borrando, setBorrando] = useState(false);
  const [claveBorrar, setClaveBorrar] = useState("");
  const [msgBorrar, setMsgBorrar] = useState(null);

  const eliminarCuenta = async (e) => {
    e.preventDefault();
    setMsgBorrar(null);
    try {
      await api.del("/me", { password: claveBorrar });
      clearToken();
      setUser(null);
      navigate("/", { replace: true });
    } catch (err) {
      setMsgBorrar({ tipo: "error", texto: err.message });
    }
  };

  return (
    <div>
      <h1 className="perfil-titulo">Configuración</h1>

      {/* ========== PERFIL PÚBLICO ========== */}
      <div className="perfil-card">
        <h3>Perfil público</h3>

        <div className="cuenta-foto">
          {fotoPreview ? (
            <img
              className="pp-avatar pp-avatar-img"
              style={{ width: 88, height: 88 }}
              src={fotoPreview}
              alt="Vista previa de tu nueva foto"
            />
          ) : (
            <Avatar avatarUrl={user.avatarUrl} nombre={user.fullName} size={88} />
          )}

          <div className="cuenta-foto-texto">
            <span className="label">Foto de perfil</span>

            {fotoNueva ? (
              <div className="cuenta-acciones">
                <button type="button" className="btn-guardar-plan" onClick={guardarFoto} disabled={subiendo}>
                  {subiendo ? "Guardando..." : "Guardar foto"}
                </button>
                <button type="button" className="btn-outline-perfil" onClick={cancelarFoto} disabled={subiendo}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="cuenta-acciones">
                <button
                  type="button"
                  className="btn-outline-perfil"
                  onClick={() => inputFoto.current?.click()}
                  disabled={esperaFoto > 0}
                >
                  <Camera size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Cambiar foto
                </button>
              </div>
            )}

            <input ref={inputFoto} type="file" accept="image/png,image/jpeg" onChange={elegirFoto} hidden />

            <p className="cuenta-ayuda">
              {esperaFoto > 0
                ? `Vas a poder cambiar tu foto de nuevo en ${formatDuration(esperaFoto)}.`
                : "JPG o PNG, hasta 2 MB. Después de cambiarla, tenés que esperar 30 minutos para volver a hacerlo."}
            </p>
          </div>
        </div>
        <Mensaje msg={msgFoto} />

        <form className="perfil-info-item config-item cuenta-usuario" onSubmit={pedirConfirmacionUsuario}>
          <label className="label" htmlFor="cfg-username">
            Nombre de usuario
          </label>

          <div className="cuenta-fila">
            <div className="cuenta-input-prefijo">
              <span>@</span>
              <input
                id="cfg-username"
                value={usuarioNuevo}
                onChange={(e) => {
                  setUsuarioNuevo(e.target.value);
                  setConfirmandoUsuario(false);
                  setMsgUsuario(null);
                }}
                maxLength={20}
                disabled={usuarioBloqueado || guardandoUsuario}
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>

            {!usuarioBloqueado && !confirmandoUsuario && (
              <button type="submit" className="btn-outline-perfil">
                Guardar usuario
              </button>
            )}
          </div>

          {confirmandoUsuario && (
            <div className="pp-alert info">
              <p>
                ¿Cambiar tu usuario a <strong>@{usuarioNuevo.trim()}</strong>? Después no vas a poder
                cambiarlo durante 15 días.
              </p>
              <div className="cuenta-acciones">
                <button type="button" className="btn-guardar-plan" onClick={guardarUsuario} disabled={guardandoUsuario}>
                  {guardandoUsuario ? "Guardando..." : "Sí, cambiarlo"}
                </button>
                <button type="button" className="btn-outline-perfil" onClick={() => setConfirmandoUsuario(false)} disabled={guardandoUsuario}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <p className="cuenta-ayuda">
            {usuarioBloqueado
              ? `Vas a poder cambiar tu nombre de usuario de nuevo el ${fechaDesbloqueo} (faltan ${formatDuration(esperaUsuario)}).`
              : "Lo ven los demás en reseñas y grupos. Solo se puede cambiar una vez cada 15 días."}
          </p>
          <Mensaje msg={msgUsuario} />
        </form>
      </div>

      {/* ========== CUENTA ========== */}
      <div className="perfil-card">
        <h3>Cuenta</h3>

        <div className="perfil-info-item config-item">
          <span className="label">Correo electrónico</span>
          <input value={user.email} readOnly disabled />
        </div>

        <form className="cuenta-clave" onSubmit={cambiarClave}>
          <div className="perfil-info-item config-item">
            <label className="label" htmlFor="cfg-clave-actual">Contraseña actual</label>
            <input
              id="cfg-clave-actual"
              type="password"
              autoComplete="current-password"
              value={clave.actual}
              onChange={(e) => setClave({ ...clave, actual: e.target.value })}
              required
            />
          </div>
          <div className="perfil-info-item config-item">
            <label className="label" htmlFor="cfg-clave-nueva">Nueva contraseña</label>
            <input
              id="cfg-clave-nueva"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={clave.nueva}
              onChange={(e) => setClave({ ...clave, nueva: e.target.value })}
              maxLength={72}
              required
            />
          </div>
          <div className="perfil-info-item config-item">
            <label className="label" htmlFor="cfg-clave-repetir">Repetir nueva contraseña</label>
            <input
              id="cfg-clave-repetir"
              type="password"
              autoComplete="new-password"
              value={clave.repetir}
              onChange={(e) => setClave({ ...clave, repetir: e.target.value })}
              maxLength={72}
              required
            />
          </div>

          <Mensaje msg={msgClave} />
          <button type="submit" className="btn-outline-perfil" disabled={guardandoClave}>
            {guardandoClave ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>

        <div className="perfil-info-item config-item">
          <span className="label">Idioma</span>
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="perfil-card">
        <h3>Privacidad</h3>

        <label className="config-switch-row">
          <span>Perfil visible para otros miembros de la comunidad</span>
          <input type="checkbox" defaultChecked />
        </label>

        <label className="config-switch-row">
          <span>Compartir mis estadísticas de asistencia</span>
          <input type="checkbox" />
        </label>
      </div>

      <div className="perfil-card zona-peligro">
        <p>Eliminar tu cuenta es una acción permanente y no se puede deshacer.</p>

        {!borrando ? (
          <button className="btn-danger" onClick={() => setBorrando(true)}>
            Eliminar cuenta
          </button>
        ) : (
          <form className="cuenta-borrar" onSubmit={eliminarCuenta}>
            <p className="cuenta-ayuda">
              Se borran tu perfil, tu foto, tus inscripciones y tus reseñas. Para confirmar, ingresá tu contraseña.
            </p>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={claveBorrar}
              onChange={(e) => setClaveBorrar(e.target.value)}
              required
            />
            <Mensaje msg={msgBorrar} />
            <div className="cuenta-acciones">
              <button type="submit" className="btn-danger">
                Sí, eliminar mi cuenta
              </button>
              <button
                type="button"
                className="btn-outline-perfil"
                onClick={() => {
                  setBorrando(false);
                  setClaveBorrar("");
                  setMsgBorrar(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Configuracion;

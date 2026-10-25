import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Mail,
    User,
    AtSign,
    Calendar,
    Phone,
    Users,
    Eye,
    EyeOff,
    Camera
} from "lucide-react";
import logo from "../assets/imagotipo.png";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import "../CSS/Login.css";
import "../CSS/Cuenta.css";

const MAX_FOTO = 2 * 1024 * 1024; // 2 MB, igual que en el servidor
const USUARIO_VALIDO = /^[A-Za-z0-9_.]{3,20}$/;

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        username: "",
        fullName: "",
        email: "",
        birthDate: "",
        gender: "",
        phone: "",
        description: "",
        password: "",
        confirmPassword: "",
    });
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [enviando, setEnviando] = useState(false);

    // null = sin revisar | "checking" | { ok: boolean, msg?: string }
    const [usuarioEstado, setUsuarioEstado] = useState(null);
    const inputFoto = useRef(null);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        setErrores((er) => ({ ...er, [name]: undefined }));
        setErrorGeneral("");
    };

    /* Revisa si el nombre de usuario está libre mientras escribís */
    useEffect(() => {
        const nombre = form.username.trim();
        if (!nombre) {
            setUsuarioEstado(null);
            return;
        }
        if (!USUARIO_VALIDO.test(nombre)) {
            setUsuarioEstado({
                ok: false,
                msg: "Entre 3 y 20 caracteres: letras, números, punto o guion bajo.",
            });
            return;
        }

        setUsuarioEstado("checking");
        let cancelado = false;
        const t = setTimeout(async () => {
            try {
                const r = await api.get(`/auth/username-available?username=${encodeURIComponent(nombre)}`);
                if (!cancelado) setUsuarioEstado(r.available ? { ok: true } : { ok: false, msg: r.reason });
            } catch {
                if (!cancelado) setUsuarioEstado(null); // si no se puede revisar, lo confirma el servidor al enviar
            }
        }, 450);

        return () => {
            cancelado = true;
            clearTimeout(t);
        };
    }, [form.username]);

    /* Libera la memoria de la vista previa de la foto */
    useEffect(() => {
        return () => {
            if (fotoPreview) URL.revokeObjectURL(fotoPreview);
        };
    }, [fotoPreview]);

    const elegirFoto = (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        let problema = "";
        if (!["image/jpeg", "image/png"].includes(archivo.type)) {
            problema = "La foto debe ser JPG o PNG.";
        } else if (archivo.size > MAX_FOTO) {
            problema = "La foto no puede pesar más de 2 MB.";
        }

        if (problema) {
            setErrores((er) => ({ ...er, avatar: problema }));
            e.target.value = "";
            return;
        }

        setErrores((er) => ({ ...er, avatar: undefined }));
        setFoto(archivo);
        setFotoPreview(URL.createObjectURL(archivo));
    };

    const quitarFoto = () => {
        setFoto(null);
        setFotoPreview(null);
        if (inputFoto.current) inputFoto.current.value = "";
    };

    const registrarse = async (e) => {
        e.preventDefault();
        if (enviando) return;

        const nuevos = {};
        if (!USUARIO_VALIDO.test(form.username.trim())) {
            nuevos.username = "Elegí un usuario de 3 a 20 caracteres (letras, números, punto o guion bajo).";
        } else if (usuarioEstado && usuarioEstado !== "checking" && !usuarioEstado.ok) {
            nuevos.username = usuarioEstado.msg;
        }
        if (form.password.length < 8) {
            nuevos.password = "La contraseña debe tener al menos 8 caracteres.";
        }
        if (form.password !== form.confirmPassword) {
            nuevos.confirmPassword = "Las contraseñas no coinciden";
        }
        if (Object.keys(nuevos).length) {
            setErrores(nuevos);
            return;
        }

        const datos = new FormData();
        datos.append("username", form.username.trim());
        datos.append("fullName", form.fullName);
        datos.append("email", form.email);
        datos.append("birthDate", form.birthDate);
        datos.append("gender", form.gender);
        datos.append("phone", form.phone);
        datos.append("description", form.description);
        datos.append("password", form.password);
        if (foto) datos.append("avatar", foto);

        setEnviando(true);
        setErrorGeneral("");
        try {
            await register(datos);
            navigate("/home", { replace: true });
        } catch (err) {
            if (err.field) {
                setErrores({ [err.field]: err.message });
            } else {
                setErrorGeneral(err.message);
            }
            setEnviando(false);
        }
    };

    const mostrarError = (campo) =>
        errores[campo] ? (
            <p className="field-error" role="alert">
                {errores[campo]}
            </p>
        ) : null;

    return (

        <div className="login-page">

            {/* =========================
                PANEL IZQUIERDO
            ========================= */}
            <div className="page-background">

                <div className="visual-overlay"></div>

                {/* Ondas decorativas */}
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>
                <div className="wave wave-4"></div>
                <div className="wave wave-5"></div>
                <div className="wave wave-6"></div>

            </div>
            <div className="visual-content">

                <div className="visual-bottom">

                      <h1>
                        Somos
                        <br />
                        PlayPoint
                    </h1>

                    <p>
                       Una comunidad que conecta personas a través del deporte.
                        <br />
                        Descubrí actividades, participá en torneos
                        <br />
                        y encontrá personas que comparten tu misma pasión.
                    </p>

                </div>

            </div>

            {/* =========================
                PANEL DERECHO
            ========================= */}
            <section className="form-panel">

                <div className="login-content register-content">

                    <div className="top-brand">
                         <img src={logo} alt="PlayPoint" className="brand-logo" />
                    </div>

                    <div className="form-header">

                        <h2>
                            Crea tu cuenta
                        </h2>

                        <p>
                            Registrate para empezar a jugar
                        </p>

                    </div>


                    <form onSubmit={registrarse} noValidate>

                        {/* FOTO DE PERFIL */}
                        <div className="avatar-picker">
                            <button
                                type="button"
                                className="avatar-picker-circle"
                                onClick={() => inputFoto.current?.click()}
                                aria-label="Elegir foto de perfil"
                            >
                                {fotoPreview ? (
                                    <img src={fotoPreview} alt="Vista previa de tu foto" />
                                ) : (
                                    <Camera size={26} />
                                )}
                            </button>

                            <div className="avatar-picker-text">
                                <strong>Foto de perfil <span>(opcional)</span></strong>
                                <small>JPG o PNG, hasta 2 MB.</small>

                                <div className="avatar-picker-actions">
                                    <button type="button" onClick={() => inputFoto.current?.click()}>
                                        {foto ? "Cambiar foto" : "Subir foto"}
                                    </button>
                                    {foto && (
                                        <button type="button" onClick={quitarFoto}>
                                            Quitar
                                        </button>
                                    )}
                                </div>
                                {mostrarError("avatar")}
                            </div>

                            <input
                                ref={inputFoto}
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={elegirFoto}
                                hidden
                            />
                        </div>


                        {/* USUARIO */}
                        <div className="input-group">

                            <label>
                                Nombre de usuario
                            </label>

                            <div className="input-wrapper">

                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Cómo te van a ver los demás"
                                    value={form.username}
                                    onChange={cambiar}
                                    maxLength={20}
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    required
                                />

                                <AtSign
                                    size={18}
                                    className="input-icon"
                                />

                            </div>

                            {usuarioEstado === "checking" && (
                                <p className="field-hint">Revisando disponibilidad…</p>
                            )}
                            {usuarioEstado?.ok && !errores.username && (
                                <p className="field-hint ok">✓ Nombre de usuario disponible</p>
                            )}
                            {usuarioEstado && usuarioEstado !== "checking" && !usuarioEstado.ok && (
                                <p className="field-error">{usuarioEstado.msg}</p>
                            )}
                            {!usuarioEstado && !errores.username && (
                                <p className="field-hint">Después podrás cambiarlo una vez cada 15 días.</p>
                            )}
                            {(!usuarioEstado || usuarioEstado === "checking" || usuarioEstado.ok) &&
                                mostrarError("username")}

                        </div>


                        {/* NOMBRE Y CORREO */}
                        <div className="input-row">

                            <div className="input-group">

                                <label>
                                    Nombre y apellido
                                </label>

                                <div className="input-wrapper">

                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="Ingresá tu nombre y apellido"
                                        value={form.fullName}
                                        onChange={cambiar}
                                        maxLength={80}
                                        autoComplete="name"
                                        required
                                    />

                                    <User
                                        size={18}
                                        className="input-icon"
                                    />

                                </div>
                                {mostrarError("fullName")}

                            </div>


                            <div className="input-group">

                                <label>
                                    Correo electrónico
                                </label>

                                <div className="input-wrapper">

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Ingresá tu correo"
                                        value={form.email}
                                        onChange={cambiar}
                                        autoComplete="email"
                                        required
                                    />

                                    <Mail
                                        size={18}
                                        className="input-icon"
                                    />

                                </div>
                                {mostrarError("email")}

                            </div>

                        </div>


                        {/* FECHA DE NACIMIENTO Y GÉNERO */}
                        <div className="input-row">

                            <div className="input-group">

                                <label>
                                    Fecha de nacimiento
                                </label>

                                <div className="input-wrapper">

                                    <input
                                        type="date"
                                        name="birthDate"
                                        placeholder="Fecha de nacimiento"
                                        value={form.birthDate}
                                        onChange={cambiar}
                                        max={new Date().toISOString().slice(0, 10)}
                                        autoComplete="bday"
                                        required
                                    />

                                    <Calendar
                                        size={18}
                                        className="input-icon"
                                    />

                                </div>
                                {mostrarError("birthDate")}

                            </div>


                            <div className="input-group">

                                <label>
                                    Género
                                </label>

                                <div className="input-wrapper">

                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={cambiar}
                                        required
                                    >
                                        <option value="" disabled>
                                            Seleccioná
                                        </option>
                                        <option value="femenino">
                                            Femenino
                                        </option>
                                        <option value="masculino">
                                            Masculino
                                        </option>
                                        <option value="otro">
                                            Otro
                                        </option>
                                        <option value="prefiero-no-decir">
                                            Prefiero no decir
                                        </option>
                                    </select>

                                    <Users
                                        size={18}
                                        className="input-icon"
                                    />

                                </div>
                                {mostrarError("gender")}

                            </div>

                        </div>


                        {/* TELÉFONO */}
                        <div className="input-group">

                            <label>
                                Teléfono
                            </label>

                            <div className="input-wrapper">

                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Ingresá tu teléfono"
                                    value={form.phone}
                                    onChange={cambiar}
                                    maxLength={20}
                                    autoComplete="tel"
                                    required
                                />

                                <Phone
                                    size={18}
                                    className="input-icon"
                                />

                            </div>
                            {mostrarError("phone")}

                        </div>


                        {/* DESCRIPCIÓN */}
                        <div className="input-group">

                            <label>
                                Descripción <span className="label-opcional">(opcional)</span>
                            </label>

                            <div className="input-wrapper">

                                <textarea
                                    name="description"
                                    placeholder="Contanos algo sobre vos: qué deportes te gustan, tu nivel..."
                                    value={form.description}
                                    onChange={cambiar}
                                    maxLength={300}
                                    rows={3}
                                />

                            </div>
                            <p className="field-hint contador">{form.description.length}/300</p>
                            {mostrarError("description")}

                        </div>


                        {/* CONTRASEÑA Y CONFIRMAR CONTRASEÑA */}
                        <div className="input-row">

                            <div className="input-group">

                                <label>
                                    Contraseña
                                </label>

                                <div className="input-wrapper">

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        placeholder="Mínimo 8 caracteres"
                                        value={form.password}
                                        onChange={cambiar}
                                        autoComplete="new-password"
                                        maxLength={72}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-btn"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>
                                {mostrarError("password")}

                            </div>


                            <div className="input-group">

                                <label>
                                    Confirmar contraseña
                                </label>

                                <div className="input-wrapper">

                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirmPassword"
                                        placeholder="Repetí tu contraseña"
                                        value={form.confirmPassword}
                                        onChange={cambiar}
                                        autoComplete="new-password"
                                        maxLength={72}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-btn"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>
                                {mostrarError("confirmPassword")}

                            </div>

                        </div>

                        {errorGeneral && (
                            <p className="pp-alert error" role="alert">
                                {errorGeneral}
                            </p>
                        )}


                        {/* BOTÓN */}
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={enviando}
                        >
                            <span style={{ position: "relative", zIndex: 2 }}>
                                {enviando ? "Creando tu cuenta..." : "Registrarme"}
                            </span>
                        </button>

                    </form>


                    {/* LOGIN */}
                    <p className="register-text">

                        ¿Ya tenés una cuenta?

                        <Link to="/">
                            Iniciar sesión
                        </Link>

                    </p>

                </div>

            </section>

        </div>
    );
}

export default Register;

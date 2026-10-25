import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthProvider, RutasPrivadas, RutasPublicas, useAuth } from "./auth/AuthContext";

import Login from "./Pages/Login";
import Register from "./Pages/registrarse";
import Home from "./Pages/Home";
import Talleres from "./Pages/Tallerestemp";
import TallerDetalle from "./Pages/Tallerdetalle";
import Comunidad from "./Pages/Comunidad";
import Membresias from "./Pages/Membresias";
import Resenas from "./Pages/Resenas";
import PerfilLayout from "./Pages/Perfillayout";
import MiPerfil from "./Pages/Miperfil";
import MisInscripciones from "./Pages/Misinscripciones";
import MisTalleres from "./Pages/Mistalleres";
import MiPlanDeportivo from "./Pages/Miplandeportivo";
import Configuracion from "./Pages/Configuracion";
import Notificaciones from "./Pages/Notificaciones";
import Torneos from "./Pages/Torneos";
import DetalleTorneo from "./Pages/DetalleTorneo";
import InscripcionTaller from "./Pages/InscripcionTaller";
import CrearGrupo from "./Pages/CrearGrupo";
import UnirseGrupo from "./Pages/UnirseGrupo";
import AgregarTarjeta from "./Pages/AgregarTarjeta";
import NuevaResena from "./Pages/NuevaResena";
import Chatbot from "./components/Chatbot";
import DetalleGrupo from "./Pages/DetalleGrupo";

import "./App.css";


function AppContent() {
  const location = useLocation();

  const { user } = useAuth();

  const ocultarChatbot =
    !user ||
    location.pathname === "/" ||
    location.pathname === "/register";

  return (
    <>
      <Routes>
        {/* Sin sesión: login y registro */}
        <Route element={<RutasPublicas />}>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Con sesión iniciada: el resto de la web */}
        <Route element={<RutasPrivadas />}>
        <Route path="/home" element={<Home />} />
        <Route path="/talleres" element={<Talleres />} />
        <Route path="/talleres/:id" element={<TallerDetalle />} />
        <Route
          path="/talleres/:id/inscripcion"
          element={<InscripcionTaller />}
        />
        <Route path="/torneos" element={<Torneos />} />
        <Route path="/torneos/:id" element={<DetalleTorneo />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route
          path="/comunidad/crear"
          element={<CrearGrupo />}
        />
        <Route
          path="/comunidad/unirse/:id"
          element={<UnirseGrupo />}
        />
        <Route
          path="/membresias"
          element={<Membresias />}
        />
        <Route
          path="/membresias/agregar-tarjeta"
          element={<AgregarTarjeta />}
        />
        <Route
          path="/resenas"
          element={<Resenas />}
        />
        <Route
          path="/resenas/escribir"
          element={<NuevaResena />}
        />
        <Route
          path="/perfil"
          element={<PerfilLayout />}
        >
          <Route
            index
            element={<MiPerfil />}
          />

          <Route
            path="inscripciones"
            element={<MisInscripciones />}
          />

          <Route
            path="talleres"
            element={<MisTalleres />}
          />

          <Route
            path="plan"
            element={<MiPlanDeportivo />}
          />

          <Route
            path="configuracion"
            element={<Configuracion />}
          />

          <Route
            path="notificaciones"
            element={<Notificaciones />}
          />
        </Route>
        <Route
          path="/comunidad/grupo/:id"
          element={<DetalleGrupo />}
        />
        </Route>
      </Routes>

      {/* CHATBOT
          NO aparece en:
          - Login (/)
          - Registrarse (/register)
      */}
      {!ocultarChatbot && <Chatbot />}
    </>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import { useState } from "react";

function MiPlanDeportivo() {
  const [condicionMedica, setCondicionMedica] = useState("no");
  const [medicacion, setMedicacion] = useState("no");
  const [lesion, setLesion] = useState("no");

  const [objetivo, setObjetivo] = useState("fisico");
  const [otroObjetivo, setOtroObjetivo] = useState("");

  const [peso, setPeso] = useState("70");
  const [estatura, setEstatura] = useState("175");

  function guardar(e) {
    e.preventDefault();
    alert("Cambios guardados");
  }

  return (
    <div>
      <h1 className="perfil-titulo">Mi plan deportivo</h1>

      <form className="plan-grid" onSubmit={guardar}>
        <div className="perfil-card">
          <h3>Cuestionario de salud</h3>

          <div className="plan-pregunta">
            <span>¿Tenés alguna condición médica diagnosticada?</span>
            <div className="plan-opciones">
              <label>
                <input
                  type="radio"
                  name="condicionMedica"
                  checked={condicionMedica === "si"}
                  onChange={() => setCondicionMedica("si")}
                />
                Sí
              </label>
              <label>
                <input
                  type="radio"
                  name="condicionMedica"
                  checked={condicionMedica === "no"}
                  onChange={() => setCondicionMedica("no")}
                />
                No
              </label>
            </div>
          </div>

          <div className="plan-pregunta">
            <span>¿Tomás medicación actualmente?</span>
            <div className="plan-opciones">
              <label>
                <input
                  type="radio"
                  name="medicacion"
                  checked={medicacion === "si"}
                  onChange={() => setMedicacion("si")}
                />
                Sí
              </label>
              <label>
                <input
                  type="radio"
                  name="medicacion"
                  checked={medicacion === "no"}
                  onChange={() => setMedicacion("no")}
                />
                No
              </label>
            </div>
          </div>

          <div className="plan-pregunta">
            <span>¿Sufriste alguna lesión en el último año?</span>
            <div className="plan-opciones">
              <label>
                <input
                  type="radio"
                  name="lesion"
                  checked={lesion === "si"}
                  onChange={() => setLesion("si")}
                />
                Sí
              </label>
              <label>
                <input
                  type="radio"
                  name="lesion"
                  checked={lesion === "no"}
                  onChange={() => setLesion("no")}
                />
                No
              </label>
            </div>
          </div>

          <h3 className="plan-subtitulo">Datos físicos</h3>

          <div className="plan-datos-fisicos">
            <div>
              <span className="label">Peso (kg)</span>
              <input
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </div>
            <div>
              <span className="label">Estatura (cm)</span>
              <input
                value={estatura}
                onChange={(e) => setEstatura(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="perfil-card">
          <h3>Objetivos personales</h3>
          <span className="label">Elegí tu objetivo principal</span>

          <div className="plan-objetivos">
            {[
              { id: "fisico", texto: "Mejorar físico" },
              { id: "rendimiento", texto: "Mejorar rendimiento deportivo" },
              { id: "salud", texto: "Salud / calidad de vida" },
              { id: "peso", texto: "Bajar de peso" },
              { id: "mantenimiento", texto: "Mantenerme en forma" },
              { id: "otro", texto: "Otro" },
            ].map((op) => (
              <label className="plan-checkbox" key={op.id}>
                <input
                  type="checkbox"
                  checked={objetivo === op.id}
                  onChange={() => setObjetivo(op.id)}
                />
                {op.texto}
              </label>
            ))}
          </div>

          {objetivo === "otro" && (
            <div className="plan-otro">
              <span className="label">¿Cuál?</span>
              <input
                value={otroObjetivo}
                onChange={(e) => setOtroObjetivo(e.target.value)}
              />
            </div>
          )}
        </div>

        <button type="submit" className="btn-guardar-plan">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

export default MiPlanDeportivo;
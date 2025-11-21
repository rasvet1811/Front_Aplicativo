import "./DocumentForm.css";

export default function LaboralMedicaForm() {
  return (
    <div className="form-section">
      <h2>Información Laboral y Médica</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Historial laboral</label>
          <textarea
            placeholder="Ingrese el historial laboral del empleado..."
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Historial médico</label>
          <textarea
            placeholder="Ingrese el historial médico del empleado..."
            rows="4"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Exámenes médicos realizados</label>
          <input type="text" placeholder="Ej: Examen médico ocupacional, Examen de ingreso..." />
        </div>
        <div className="form-group">
          <label>Fecha del último examen médico</label>
          <div className="date-input-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="calendar-icon"
            >
              <path
                d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                fill="#666"
              />
            </svg>
            <input type="text" placeholder="dd-mm-aa" readOnly />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>EPS</label>
          <input type="text" placeholder="Nombre de la EPS" />
        </div>
        <div className="form-group">
          <label>ARL</label>
          <input type="text" placeholder="Nombre de la ARL" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Pensión</label>
          <input type="text" placeholder="Nombre del fondo de pensiones" />
        </div>
        <div className="form-group">
          <label>Cesantías</label>
          <input type="text" placeholder="Nombre del fondo de cesantías" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Condiciones médicas especiales</label>
          <textarea
            placeholder="Describa condiciones médicas especiales o limitaciones..."
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>Restricciones laborales</label>
          <textarea
            placeholder="Describa restricciones laborales si las hay..."
            rows="3"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Certificados médicos</label>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" multiple />
        </div>
        <div className="form-group">
          <label>Documentos de seguridad social</label>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" multiple />
        </div>
      </div>
    </div>
  );
}


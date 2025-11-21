import "./DocumentForm.css";

export default function RecomendacionesForm() {
  return (
    <div className="form-section">
      <h2>Recomendaciones y Seguimiento</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Recomendaciones del supervisor</label>
          <textarea
            placeholder="Ingrese las recomendaciones del supervisor inmediato..."
            rows="5"
          />
        </div>
        <div className="form-group">
          <label>Recomendaciones de recursos humanos</label>
          <textarea
            placeholder="Ingrese las recomendaciones del área de recursos humanos..."
            rows="5"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Plan de acción</label>
          <textarea
            placeholder="Describa el plan de acción a seguir..."
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Fecha de seguimiento</label>
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
          <label>Estado del seguimiento</label>
          <select>
            <option value="">Seleccione...</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
        <div className="form-group">
          <label>Prioridad</label>
          <select>
            <option value="">Seleccione...</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Notas adicionales</label>
          <textarea
            placeholder="Agregue notas adicionales sobre el seguimiento..."
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Responsable del seguimiento</label>
          <input type="text" placeholder="Nombre del responsable" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Documentos de seguimiento</label>
          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple />
        </div>
        <div className="form-group">
          <label>Evidencias</label>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" multiple />
        </div>
      </div>
    </div>
  );
}


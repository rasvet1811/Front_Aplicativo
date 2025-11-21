import { useState } from "react";
import "./DocumentForm.css";

export default function AnexosForm() {
  const [attachments, setAttachments] = useState([]);

  const handleFileAdd = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter((att) => att.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="form-section">
      <h2>Anexos</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Subir documentos</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.txt"
            multiple
            onChange={handleFileAdd}
          />
          <p className="form-help-text">
            Puede seleccionar múltiples archivos. Formatos permitidos: PDF, Word, Excel, Imágenes, TXT
          </p>
        </div>
        <div className="form-group">
          <label>Categoría de documentos</label>
          <select>
            <option value="">Seleccione una categoría...</option>
            <option value="Contratos">Contratos</option>
            <option value="Certificados">Certificados</option>
            <option value="Exámenes médicos">Exámenes médicos</option>
            <option value="Documentos legales">Documentos legales</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="attachments-list">
          <h3 className="attachments-title">Documentos adjuntos</h3>
          <div className="attachments-grid">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="attachment-item">
                <div className="attachment-info">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="attachment-icon"
                  >
                    <path
                      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z"
                      fill="#9333EA"
                    />
                  </svg>
                  <div className="attachment-details">
                    <p className="attachment-name">{attachment.name}</p>
                    <p className="attachment-size">{formatFileSize(attachment.size)}</p>
                  </div>
                </div>
                <button
                  className="attachment-remove"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                      fill="#dc2626"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Descripción de los anexos</label>
          <textarea
            placeholder="Agregue una descripción general de los documentos adjuntos..."
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Observaciones</label>
          <textarea
            placeholder="Agregue observaciones adicionales sobre los anexos..."
            rows="4"
          />
        </div>
      </div>
    </div>
  );
}


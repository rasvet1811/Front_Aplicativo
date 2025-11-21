import { useState, useRef } from 'react';
import './index.css';
import Nav from '../components/Nav/Nav.jsx';

export default function Dashboard() {
  const userName = 'Sara Corrales Jaramillo';

  const [documents, setDocuments] = useState([
    { id: 1, personName: 'Juan Pérez', documentType: 'Contrato' },
    { id: 2, personName: 'María López', documentType: 'Permiso' },
    { id: 3, personName: 'Carlos Sánchez', documentType: 'Despido' },
  ]);

  const [cases] = useState([
    { id: 1, caseType: 'Gestión de documento', entityName: 'Ana Martínez', status: 'In progrest' },
    { id: 2, caseType: 'Entrega de documentos a una entidad', entityName: 'Ministerio de Trabajo', status: 'Unclosed' },
    { id: 3, caseType: 'Despidos', entityName: 'Roberto García', status: 'In progrest' },
    { id: 4, caseType: 'Gestión de documento', entityName: 'Laura Fernández', status: 'Unclosed' },
    { id: 5, caseType: 'Entrega de documentos a una entidad', entityName: 'EPS Sanitas', status: 'In progrest' },
  ]);

  const fileInputRef = useRef(null);

  const handleUpdateDocs = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name);
      // Aquí puedes agregar la lógica para procesar el archivo
      // Por ejemplo, subirlo a un servidor o agregarlo a la lista de documentos
      const newDocument = {
        id: documents.length + 1,
        personName: 'Nuevo Usuario',
        documentType: 'Documento',
      };
      setDocuments([...documents, newDocument]);
    }
  };

  return (
    <div className="dashboard-container">
      <Nav />
      <div className="dashboard-content">
        <div className="dashboard-sections">
          {/* Sección Documents */}
          <section className="documents-section">
            <h2 className="section-title">Documents</h2>
          
          {/* Área de Update Docs */}
          <div 
            className="update-docs-area"
            onClick={handleUpdateDocs}
          >
            <div className="cloud-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.93L7.13 8.97C8.08 6.81 9.85 5.5 12 5.5C14.93 5.5 17.36 7.81 17.85 10.65L18.15 12.35L19.86 12.5C21.67 12.68 23 14.28 23 16C23 17.66 21.66 19 20 19H19V18Z" fill="#9333EA"/>
              </svg>
            </div>
            <p className="update-docs-text">Update Docs</p>
          </div>
          
          {/* Input oculto para seleccionar archivos */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept="*/*"
          />

          <div className="dashboard-welcome">
            <h1 className="welcome-title">
              Bienvenid@ {userName}
            </h1>
            <p className="welcome-subtitle">
              Este es tu historial de lo que haz abierto o modificado hasta ahora
            </p>
          </div>

          {/* Lista de documentos */}
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <div className="document-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#9333EA"/>
                  </svg>
                </div>
                <div className="document-info">
                  <p className="document-person-name">{doc.personName}</p>
                  <p className="document-type">{doc.documentType}</p>
                </div>
                <div className="document-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10L12 15L17 10H7Z" fill="#666"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
          </section>

          {/* Sección Cases */}
          <section className="cases-section">
            <h2 className="section-title">Cases</h2>
            
            <div className="cases-list">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="case-item">
                  <div className="case-avatar">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="12" fill="#86EFAC"/>
                      <circle cx="12" cy="9" r="4" fill="#9333EA"/>
                      <path d="M12 14C8.67 14 6 15.34 6 17V18H18V17C18 15.34 15.33 14 12 14Z" fill="#9333EA"/>
                    </svg>
                  </div>
                  <div className="case-info">
                    <p className="case-type">{caseItem.caseType}</p>
                    <p className="case-entity">{caseItem.entityName}</p>
                  </div>
                  <span className={`case-status ${caseItem.status === 'In progrest' ? 'status-red' : 'status-green'}`}>
                    {caseItem.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./index.css";
import Nav from "../../components/Nav/Nav.jsx";
import user from "../../../Imagenes/Perfil/user.png";
import { documentosAPI, empleadosAPI, casosAPI } from "../../../services/api.js";

export default function Profile() {
  const fileInputRef = useRef(null);
  const location = useLocation();
  const [empleado, setEmpleado] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [casoId, setCasoId] = useState(null);

  // Obtener ID del empleado desde la navegación o URL
  const empleadoId = location.state?.empleadoId || new URLSearchParams(location.search).get('empleadoId');

  useEffect(() => {
    if (empleadoId) {
      loadEmpleado(empleadoId);
      loadDocumentos(empleadoId);
    }
  }, [empleadoId]);

  const loadEmpleado = async (id) => {
    try {
      const data = await empleadosAPI.getById(id);
      setEmpleado(data);
      
      // Buscar un caso asociado al empleado para los documentos
      const casos = await casosAPI.getAll(null, id);
      if (casos && casos.length > 0) {
        setCasoId(casos[0].id || casos[0].Id_Caso);
      }
    } catch (error) {
      console.error('Error al cargar empleado:', error);
    }
  };

  const loadDocumentos = async (empleadoId) => {
    try {
      setLoading(true);
      // Buscar casos del empleado
      const casos = await casosAPI.getAll(null, empleadoId);
      if (casos && casos.length > 0) {
        const casoId = casos[0].id || casos[0].Id_Caso;
        const data = await documentosAPI.getAll(casoId);
        // Mapear documentos al formato del frontend
        const mappedDocs = data.map(doc => ({
          id: doc.id || doc.Id_Documento,
          name: doc.nombre || doc.Nombre || 'Sin nombre',
          description: doc.descripcion || doc.Descripcion || `Tipo: ${doc.tipo || doc.Tipo || 'N/A'}`,
          file: null
        }));
        setDocuments(mappedDocs);
        if (casoId) setCasoId(casoId);
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (!casoId) {
      alert('No hay un caso asociado. Por favor, cree un caso primero.');
      return;
    }

    try {
      for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        const tipoMap = {
          'pdf': 'pdf',
          'doc': 'word',
          'docx': 'word',
          'xls': 'excel',
          'xlsx': 'excel',
          'jpg': 'imagen',
          'png': 'imagen',
          'txt': 'otro'
        };

        const documentoData = {
          caso: casoId,
          nombre: file.name,
          tipo: tipoMap[extension] || 'otro',
          descripcion: `Archivo subido - ${formatFileSize(file.size)}`,
          usuario_creador: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Usuario',
          extension: extension
        };

        await documentosAPI.create(documentoData, file);
      }

      // Recargar documentos
      await loadDocumentos(empleadoId);
    } catch (error) {
      console.error('Error al subir documentos:', error);
      alert('Error al subir los documentos. Por favor, intenta nuevamente.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container">
      <Nav />
      <main className="main-content">
        <section className="left-panel">
          <div className="profile-card">
            <div className="profile-photo">
              <img src={user} alt="User" />
            </div>
            <div className="profile-info">
              <h2>{empleado ? `${empleado.nombre || empleado.Nombre || ''} ${empleado.apellido || empleado.Apellido || ''}`.trim() : 'Felipe Gómez'}</h2>
              <p>{empleado ? (empleado.cargo || empleado.Cargo || 'Sin cargo') : 'Analista de Soluciones'}</p>
              <p>{empleado ? (empleado.division || empleado.Division || empleado.area || empleado.Area || 'Sin división') : 'Dirección de Tecnología y Transformación Digital'}</p>
              <p className="profile-status">Estado: <span className={`status-badge ${empleado?.estado === 'Activo' || empleado?.Estado === 'Activo' ? 'status-active' : 'status-inactive'}`}>
                {empleado ? (empleado.estado || empleado.Estado || 'Empleado') : 'Empleado'}
              </span></p>
            </div>
          </div>

          <div className="search-docs">
            <input type="text" placeholder="Search document..." />
          </div>

          <div className="upload-docs-section">
            <button className="upload-docs-button" onClick={handleUploadClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
              Agregar Documentos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png"
            />
          </div>

          <div className="docs-list">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Cargando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No hay documentos disponibles</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-img">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#9333EA"/>
                    </svg>
                  </div>
                  <div className="doc-lines">
                    <h4>{doc.name}</h4>
                    <p>{doc.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="right-panel">
          <div className="case-card">
            <div className="case-lines">
              <h4>RRHH-0001</h4>
              <p>Solicitud de vacaciones</p>
            </div>
            <span className="status">Unclosed</span>
          </div>

          <div className="case-card">
            <div className="case-lines">
              <h4>RRHH-0002</h4>
              <p>Día de la familia</p>
            </div>
            <span className="status">Unclosed</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
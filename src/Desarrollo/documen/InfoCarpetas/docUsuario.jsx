import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.css";
import Nav from "../../components/Nav/Nav.jsx";
import user from "../../../Imagenes/Perfil/user.png";
import { documentosAPI, empleadosAPI, carpetasAPI, casosAPI, authService } from "../../../services/api.js";

export default function DocUsuario() {
  const fileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [empleado, setEmpleado] = useState(null);
  const [carpetas, setCarpetas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Obtener ID del empleado desde la navegación o URL
  const empleadoId = location.state?.empleadoId || new URLSearchParams(location.search).get('empleadoId');

  useEffect(() => {
    if (empleadoId) {
      loadEmpleado(empleadoId);
      loadCarpetas(empleadoId);
    }
  }, [empleadoId]);

  const loadEmpleado = async (id) => {
    try {
      const data = await empleadosAPI.getById(id);
      setEmpleado(data);
    } catch (error) {
      console.error('Error al cargar empleado:', error);
    }
  };

  const loadCarpetas = async (empleadoId) => {
    try {
      setLoading(true);
      const data = await carpetasAPI.getAll(empleadoId);
      const mappedCarpetas = Array.isArray(data) ? data : (data.results || []);
      setCarpetas(mappedCarpetas.map(c => ({
        id: c.id || c.Id_Carpeta,
        nombre: c.nombre || c.Nombre || 'Sin nombre',
        fecha_creacion: c.fecha_creacion || c.Fecha_Creacion
      })));
    } catch (error) {
      console.error('Error al cargar carpetas:', error);
      setCarpetas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentos = async (carpetaId = null) => {
    try {
      setLoading(true);
      let data;
      if (carpetaId) {
        data = await documentosAPI.getAll(null, null, empleadoId, carpetaId);
      } else {
        // Cargar todos los documentos del empleado
        data = await documentosAPI.getAll(null, null, empleadoId);
      }
      const mappedDocs = Array.isArray(data) ? data : (data.results || []);
      setDocumentos(mappedDocs.map(doc => ({
        id: doc.id || doc.Id_Documento,
        nombre: doc.nombre || doc.Nombre || 'Sin nombre',
        tipo: doc.tipo || doc.Tipo || 'N/A',
        extension: doc.extension || doc.Extension || '',
        descripcion: doc.descripcion || doc.Descripcion || '',
        fecha_carga: doc.fecha_carga || doc.Fecha_Carga,
        carpeta: doc.carpeta || doc.Id_Carpeta,
        ruta: doc.ruta || doc.Ruta,
        archivo: doc.archivo || null
      })));
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCarpetaClick = (carpetaId) => {
    setCarpetaSeleccionada(carpetaId);
    loadDocumentos(carpetaId);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      alert('Por favor, ingresa un nombre para la carpeta.');
      return;
    }

    if (!empleadoId) {
      alert('Error: No se pudo identificar el empleado.');
      return;
    }

    try {
      const carpetaData = {
        empleado: parseInt(empleadoId),
        nombre: newFolderName.trim()
      };

      await carpetasAPI.create(carpetaData);
      alert('Carpeta creada exitosamente');
      setShowNewFolderModal(false);
      setNewFolderName("");
      await loadCarpetas(empleadoId);
    } catch (error) {
      console.error('Error al crear carpeta:', error);
      alert('Error al crear la carpeta. Por favor, intenta nuevamente.');
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Si no hay carpeta seleccionada, preguntar al usuario
    if (!carpetaSeleccionada) {
      alert('Por favor, selecciona una carpeta primero o crea una nueva carpeta.');
      event.target.value = ''; // Limpiar el input
      return;
    }

    try {
      setUploading(true);
      const user = authService.getUser();
      const userId = user?.id || user?.Id_Usuario;

      // Buscar un caso asociado al empleado (opcional)
      let casoId = null;
      try {
        const casos = await casosAPI.getAll(null, empleadoId);
        if (casos && casos.length > 0) {
          casoId = casos[0].id || casos[0].Id_Caso;
        }
      } catch (error) {
        console.warn('No se pudo obtener el caso, continuando sin caso:', error);
        // Continuar sin caso - el backend debería permitir documentos sin caso
      }

      for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        const tipoMap = {
          'pdf': 'PDF',
          'doc': 'Word',
          'docx': 'Word',
          'xls': 'Excel',
          'xlsx': 'Excel',
          'jpg': 'Imagen',
          'jpeg': 'Imagen',
          'png': 'Imagen',
          'txt': 'Texto',
          'csv': 'CSV'
        };

        const documentoData = {
          nombre: file.name,
          tipo: tipoMap[extension] || 'Otro',
          descripcion: `Archivo subido - ${formatFileSize(file.size)}`,
          extension: extension,
          empleado: parseInt(empleadoId)
        };

        // Solo agregar caso si existe (opcional)
        if (casoId) {
          const casoIdInt = parseInt(casoId);
          if (!isNaN(casoIdInt)) {
            documentoData.caso = casoIdInt;
          }
        }

        // Solo agregar carpeta si existe y es válida
        if (carpetaSeleccionada) {
          const carpetaId = parseInt(carpetaSeleccionada);
          if (!isNaN(carpetaId)) {
            documentoData.carpeta = carpetaId;
          }
        }

        // Solo agregar usuario_creador si existe y es válido
        if (userId) {
          const userIdInt = parseInt(userId);
          if (!isNaN(userIdInt)) {
            documentoData.usuario_creador = userIdInt;
          } else {
            documentoData.usuario_creador = userId; // Por si es un string válido
          }
        }

        console.log('[DocUsuario] Datos del documento a crear:', documentoData);
        console.log('[DocUsuario] Archivo:', file.name, 'Tamaño:', file.size, 'bytes', 'Tipo:', file.type);
        
        // Verificar que el archivo sea válido
        if (!file || file.size === 0) {
          alert(`El archivo "${file.name}" está vacío o no es válido.`);
          continue;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB límite
          alert(`El archivo "${file.name}" es demasiado grande (máximo 50MB).`);
          continue;
        }

        const resultado = await documentosAPI.create(documentoData, file);
        console.log('[DocUsuario] Documento creado exitosamente:', resultado);
        
        // Verificar que el documento creado tenga archivo asociado
        if (resultado && !resultado.archivo) {
          console.warn('[DocUsuario] El documento se creó pero no tiene archivo asociado:', resultado);
        }
      }

      alert('Documentos subidos exitosamente');
      await loadDocumentos(carpetaSeleccionada);
      
      // Disparar evento para actualizar el Dashboard
      console.log('[DocUsuario] Disparando evento document-created');
      window.dispatchEvent(new CustomEvent('document-created', { 
        detail: { 
          timestamp: new Date().toISOString(),
          empleadoId: empleadoId 
        } 
      }));
    } catch (error) {
      console.error('Error al subir documentos:', error);
      console.error('Detalles del error:', {
        message: error.message,
        stack: error.stack
      });
      
      // Mostrar mensaje de error más descriptivo
      let errorMessage = 'Error al subir los documentos. ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Por favor, verifica que todos los campos sean válidos e intenta nuevamente.';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = ''; // Limpiar el input
    }
  };

  const handleDownload = async (documento) => {
    try {
      console.log('[DocUsuario] Intentando descargar documento:', documento);
      
      // Usar el endpoint de descarga del backend
      const result = await documentosAPI.download(documento.id);
      
      // El método download ahora retorna { blob, filename }
      const blob = result.blob || result;
      const filename = result.filename || documento.nombre || `documento_${documento.id}.${documento.extension || 'pdf'}`;
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      console.log('[DocUsuario] Documento descargado exitosamente:', filename);
    } catch (error) {
      console.error('Error al descargar documento:', error);
      let errorMessage = 'Error al descargar el documento. ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Por favor, verifica que el archivo exista e intenta nuevamente.';
      }
      alert(errorMessage);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (extension) => {
    const ext = extension?.toLowerCase() || '';
    if (['pdf'].includes(ext)) {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#DC2626"/>
        </svg>
      );
    } else if (['doc', 'docx'].includes(ext)) {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#2563EB"/>
        </svg>
      );
    } else if (['xls', 'xlsx'].includes(ext)) {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#16A34A"/>
        </svg>
      );
    } else {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#9333EA"/>
        </svg>
      );
    }
  };

  const handleUploadClick = () => {
    if (!carpetaSeleccionada && carpetas.length > 0) {
      alert('Por favor, selecciona una carpeta primero para subir documentos.');
      return;
    }
    if (carpetas.length === 0) {
      alert('Por favor, crea una carpeta primero para organizar los documentos.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleViewAllDocuments = () => {
    setCarpetaSeleccionada(null);
    loadDocumentos(null);
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
              <h2>{empleado ? `${empleado.nombre || empleado.Nombre || ''} ${empleado.apellido || empleado.Apellido || ''}`.trim() : 'Cargando...'}</h2>
              <p>{empleado ? (empleado.cargo || empleado.Cargo || 'Sin cargo') : ''}</p>
              <p>{empleado ? (empleado.division || empleado.Division || empleado.area || empleado.Area || 'Sin división') : ''}</p>
              <p className="profile-status">Estado: <span className={`status-badge ${empleado?.estado === 'Activo' || empleado?.Estado === 'Activo' ? 'status-active' : 'status-inactive'}`}>
                {empleado ? (empleado.estado || empleado.Estado || 'Empleado') : 'Empleado'}
              </span></p>
            </div>
          </div>

          <div className="search-docs">
            <input type="text" placeholder="Buscar documento..." />
          </div>

          <div className="folders-section">
            <div className="folders-header">
              <h3>Carpetas</h3>
              <button 
                className="new-folder-btn"
                onClick={() => setShowNewFolderModal(true)}
                title="Crear nueva carpeta"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div className="folders-list-container">
              <button
                className={`folder-item-btn ${!carpetaSeleccionada ? 'active' : ''}`}
                onClick={handleViewAllDocuments}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
                </svg>
                <span>Todos los documentos</span>
              </button>
              {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <p>Cargando carpetas...</p>
                </div>
              ) : carpetas.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <p>No hay carpetas. Crea una nueva carpeta para organizar los documentos.</p>
                </div>
              ) : (
                carpetas.map((carpeta) => (
                  <button
                    key={carpeta.id}
                    className={`folder-item-btn ${carpetaSeleccionada === carpeta.id ? 'active' : ''}`}
                    onClick={() => handleCarpetaClick(carpeta.id)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
                    </svg>
                    <span>{carpeta.nombre}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="upload-docs-section">
            <button 
              className="upload-docs-button" 
              onClick={handleUploadClick}
              disabled={uploading || carpetas.length === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
              {uploading ? 'Subiendo...' : 'Agregar Documentos'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png,.jpeg,.csv"
            />
          </div>
        </section>

        <aside className="right-panel">
          <div className="documents-header">
            <h2>
              {carpetaSeleccionada 
                ? carpetas.find(c => c.id === carpetaSeleccionada)?.nombre || 'Documentos'
                : 'Todos los documentos'}
            </h2>
            <p className="documents-count">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="docs-list">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Cargando documentos...</p>
              </div>
            ) : documentos.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No hay documentos disponibles</p>
                {carpetaSeleccionada && (
                  <button 
                    className="upload-docs-button"
                    onClick={handleUploadClick}
                    style={{ marginTop: '1rem' }}
                  >
                    Subir documentos
                  </button>
                )}
              </div>
            ) : (
              documentos.map((doc) => (
                <div key={doc.id} className="doc-item" onClick={() => handleDownload(doc)} style={{ cursor: 'pointer' }}>
                  <div className="doc-img">
                    {getFileIcon(doc.extension)}
                  </div>
                  <div className="doc-lines">
                    <h4>{doc.nombre}</h4>
                    <p>{doc.descripcion || `Tipo: ${doc.tipo} | Extensión: ${doc.extension || 'N/A'}`}</p>
                    {doc.fecha_carga && (
                      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        {new Date(doc.fecha_carga).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                  <div className="doc-download">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="#9333EA"/>
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      {/* Modal para crear nueva carpeta */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nueva Carpeta</h2>
              <button className="modal-close" onClick={() => setShowNewFolderModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="modal-form">
              <div className="form-group">
                <label>Nombre de la carpeta *</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  placeholder="Ej: Documentos médicos, Permisos, etc."
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setShowNewFolderModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-submit">
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

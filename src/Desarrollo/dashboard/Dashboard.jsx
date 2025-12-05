import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import Nav from '../components/Nav/Nav.jsx';
import { casosAPI, authService, documentosAPI } from '../../services/api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Usuario');
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // Función para mapear estados del backend al frontend
  const mapStatusToFrontend = (backendStatus) => {
    const statusMap = {
      'abierto': 'Abierto',
      'cerrado': 'Terminado',
      'pendiente': 'Pendiente',
      'Abierto': 'Abierto',
      'Cerrado': 'Terminado',
      'Pendiente': 'Pendiente',
    };
    const statusNormalizado = (backendStatus || '').toLowerCase();
    return statusMap[statusNormalizado] || statusMap[backendStatus] || 'Abierto';
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Cargar casos desde la API
  const loadCases = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.warn('[Dashboard] No hay token de autenticación para cargar casos.');
        setCases([]);
        setLoading(false);
        return;
      }

      const data = await casosAPI.getAll();
      console.log('[Dashboard] Casos recibidos (raw):', data);

      let casosArray = [];
      if (Array.isArray(data)) {
        casosArray = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
        casosArray = data.results;
      } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
        casosArray = data.data;
      } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        casosArray = [data];
      }

      // Mapear datos del backend al formato del frontend
      const mappedCases = casosArray.map(caso => ({
        id: caso.id || caso.Id_Caso,
        caseType: caso.diagnostico || caso.Diagnostico || 'Sin título',
        entityName: caso.empleado_nombre || caso.empleado?.nombre || 'Sin empleado',
        status: mapStatusToFrontend(caso.estado || caso.Estado),
        createdAt: caso.fecha_inicio || caso.Fecha_Inicio || '',
        endDate: caso.fecha_cierre || caso.Fecha_Cierre || '',
        responsableNombre: caso.responsable_nombre || caso.responsable?.nombre || null
      }));

      // Limitar a los primeros 5 casos para el dashboard
      setCases(mappedCases.slice(0, 5));
    } catch (error) {
      console.error('[Dashboard] Error al cargar casos:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar documentos recientes desde la API
  const loadRecentDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const token = authService.getToken();
      if (!token) {
        console.warn('[Dashboard] No hay token de autenticación para cargar documentos.');
        setDocuments([]);
        setLoadingDocuments(false);
        return;
      }

      // Cargar todos los documentos y ordenarlos por fecha de carga (más recientes primero)
      const data = await documentosAPI.getAll();
      console.log('[Dashboard] Documentos recibidos (raw):', data);
      console.log('[Dashboard] Tipo de datos:', typeof data, Array.isArray(data));

      let documentosArray = [];
      if (Array.isArray(data)) {
        documentosArray = data;
        console.log('[Dashboard] Los datos son un array directo, cantidad:', documentosArray.length);
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          documentosArray = data.results;
          console.log('[Dashboard] Documentos encontrados en data.results, cantidad:', documentosArray.length);
        } else if (Array.isArray(data.data)) {
          documentosArray = data.data;
          console.log('[Dashboard] Documentos encontrados en data.data, cantidad:', documentosArray.length);
        } else {
          // Intentar convertir el objeto en un array
          documentosArray = Object.values(data).filter(item => item && (item.id || item.Id_Documento));
          console.log('[Dashboard] Documentos extraídos de objeto, cantidad:', documentosArray.length);
        }
      }

      console.log('[Dashboard] Total de documentos a procesar:', documentosArray.length);

      // Ordenar por fecha de carga (más recientes primero)
      documentosArray.sort((a, b) => {
        const fechaA = new Date(a.fecha_carga || a.Fecha_Carga || a.fecha_modificacion || a.Fecha_Modificacion || 0);
        const fechaB = new Date(b.fecha_carga || b.Fecha_Carga || b.fecha_modificacion || b.Fecha_Modificacion || 0);
        return fechaB - fechaA; // Orden descendente (más reciente primero)
      });

      // Mapear datos del backend al formato del frontend
      const mappedDocuments = documentosArray.slice(0, 10).map(doc => {
        // Obtener nombre del empleado si está disponible
        let empleadoNombre = null;
        let empleadoId = null;
        
        if (doc.empleado_nombre) {
          empleadoNombre = doc.empleado_nombre;
        } else if (doc.empleado && typeof doc.empleado === 'object') {
          const nombre = doc.empleado.nombre || doc.empleado.Nombre || '';
          const apellido = doc.empleado.apellido || doc.empleado.Apellido || '';
          empleadoNombre = `${nombre} ${apellido}`.trim() || null;
          empleadoId = doc.empleado.id || doc.empleado.Id_Empleado || null;
        } else if (doc.empleado && typeof doc.empleado === 'number') {
          empleadoId = doc.empleado;
        }

        // Si no hay empleado, usar el nombre del archivo
        const nombreArchivo = doc.nombre || doc.Nombre || 'Sin nombre';
        const displayName = empleadoNombre || nombreArchivo;

        return {
          id: doc.id || doc.Id_Documento,
          personName: displayName,
          documentType: doc.tipo || doc.Tipo || 'Documento',
          nombre: nombreArchivo,
          fechaCarga: doc.fecha_carga || doc.Fecha_Carga,
          extension: doc.extension || doc.Extension || '',
          empleadoId: empleadoId || doc.empleado || null,
          tieneEmpleado: empleadoNombre !== null
        };
      });

      console.log('[Dashboard] Documentos mapeados:', mappedDocuments.length);
      setDocuments(mappedDocuments);
    } catch (error) {
      console.error('[Dashboard] Error al cargar documentos:', error);
      console.error('[Dashboard] Detalles del error:', {
        message: error.message,
        stack: error.stack
      });
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Obtener nombre del usuario actual
  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      const nombre = user.nombre || user.Nombre || user.username || 'Usuario';
      setUserName(nombre);
    }
  }, []);

  // Cargar casos y documentos al montar el componente
  useEffect(() => {
    loadCases();
    loadRecentDocuments();
    
    // Escuchar eventos de creación de documentos para actualizar la lista
    const handleDocumentCreated = () => {
      console.log('[Dashboard] Evento document-created recibido, recargando documentos...');
      setTimeout(() => {
        loadRecentDocuments();
      }, 1000); // Esperar 1 segundo para que el backend procese el documento
    };
    
    window.addEventListener('document-created', handleDocumentCreated);
    
    // Actualizar documentos periódicamente cada 30 segundos
    const intervalId = setInterval(() => {
      console.log('[Dashboard] Actualización periódica de documentos...');
      loadRecentDocuments();
    }, 30000);
    
    // Actualizar cuando la ventana recupera el foco
    const handleFocus = () => {
      console.log('[Dashboard] Ventana recuperó el foco, recargando documentos...');
      loadRecentDocuments();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('document-created', handleDocumentCreated);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="dashboard-container">
      <Nav />
      <div className="dashboard-content">
        <div className="dashboard-sections">
          {/* Sección Documents */}
          <section className="documents-section">
            <h2 className="section-title">Documents</h2>

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
            {loadingDocuments ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Cargando documentos...
              </div>
            ) : documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No hay documentos recientes
              </div>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="document-item"
                  onClick={() => {
                    // Si tiene empleado, navegar a la carpeta del empleado
                    if (doc.empleadoId) {
                      navigate("/documents/folder", { state: { empleadoId: doc.empleadoId } });
                    } else {
                      // Si no tiene empleado, navegar a la lista de documentos
                      navigate("/documents");
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="document-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#9333EA"/>
                    </svg>
                  </div>
                  <div className="document-info">
                    <p className="document-person-name">{doc.personName}</p>
                    <p className="document-type">
                      {doc.tieneEmpleado ? doc.documentType : doc.nombre}
                    </p>
                    {doc.fechaCarga && (
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#999', 
                        marginTop: '4px' 
                      }}>
                        {formatDate(doc.fechaCarga)}
                      </p>
                    )}
                  </div>
                  <div className="document-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10L12 15L17 10H7Z" fill="#666"/>
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
          </section>

          {/* Sección Cases */}
          <section className="cases-section">
            <h2 className="section-title">Cases</h2>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Cargando casos...
              </div>
            ) : cases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No hay casos disponibles
              </div>
            ) : (
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
                      {caseItem.responsableNombre && (
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: '#666', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#16a34a"/>
                          </svg>
                          {caseItem.responsableNombre}
                        </p>
                      )}
                    </div>
                    <span className={`case-status ${
                      caseItem.status === 'Pendiente' ? 'status-yellow' : 
                      caseItem.status === 'Terminado' ? 'status-green' : 
                      caseItem.status === 'Abierto' ? 'status-blue' :
                      caseItem.status === 'In progrest' ? 'status-red' : 'status-blue'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


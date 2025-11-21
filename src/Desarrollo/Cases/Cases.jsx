import { useState, useRef, useEffect } from "react";
import "./index.css";
import Nav from "../components/Nav/Nav.jsx";
import { casosAPI, empleadosAPI } from "../../services/api.js";

export default function Cases() {
  const [selectedDate, setSelectedDate] = useState("");
  const dateInputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState(""); // "A-Z", "Z-A", or letter filter
  const [statusFilter, setStatusFilter] = useState(""); // "Pendiente", "Terminado", ""
  const [dateFilter, setDateFilter] = useState(""); // Date filter for finished cases
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    title: '',
    personName: '',
    createdAt: '',
    endDate: '',
    requestInfo: ''
  });

  const createdAtRef = useRef(null);
  const endDateRef = useRef(null);

  // Cargar casos y empleados al montar el componente
  useEffect(() => {
    loadCases();
    loadEmpleados();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await casosAPI.getAll();
      // Mapear datos del backend al formato del frontend
      const mappedCases = data.map(caso => ({
        id: caso.id || caso.Id_Caso,
        caseType: caso.diagnostico || caso.Diagnostico || 'Sin título',
        entityName: caso.empleado_nombre || caso.empleado?.nombre || 'Sin empleado',
        status: mapStatusToFrontend(caso.estado || caso.Estado),
        createdAt: caso.fecha_inicio || caso.Fecha_Inicio || '',
        endDate: caso.fecha_cierre || caso.Fecha_Cierre || '',
        requestInfo: caso.observaciones || caso.Observaciones || caso.diagnostico || caso.Diagnostico || '',
        empleadoId: caso.empleado || caso.Id_Empleado,
        tipoFuero: caso.tipo_fuero || caso.Tipo_Fuero,
        responsable: caso.responsable || caso.Responsable
      }));
      setCases(mappedCases);
    } catch (error) {
      console.error('Error al cargar casos:', error);
      // Mantener casos por defecto si hay error
    } finally {
      setLoading(false);
    }
  };

  const loadEmpleados = async () => {
    try {
      const data = await empleadosAPI.getAll();
      setEmpleados(data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const mapStatusToFrontend = (backendStatus) => {
    const statusMap = {
      'abierto': 'Pendiente',
      'cerrado': 'Terminado',
      'pendiente': 'Pendiente',
      'Abierto': 'Pendiente',
      'Cerrado': 'Terminado',
      'Pendiente': 'Pendiente',
    };
    return statusMap[backendStatus] || backendStatus || 'Pendiente';
  };

  const mapStatusToBackend = (frontendStatus) => {
    const statusMap = {
      'Pendiente': 'abierto',
      'Terminado': 'cerrado',
      'In progrest': 'pendiente',
    };
    return statusMap[frontendStatus] || 'abierto';
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const handleCalendarIconClick = () => {
    if (dateInputRef.current) {
      if (dateInputRef.current.showPicker) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const handleDateChange = (event) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const formattedDate = `${day}-${month}-${year}`;
      setSelectedDate(formattedDate);
      setDateFilter(dateValue);
    } else {
      setSelectedDate("");
      setDateFilter("");
    }
  };

  // Filtrar y ordenar casos
  const getFilteredAndSortedCases = () => {
    let filtered = [...cases];

    // Filtro de búsqueda (por nombre o título)
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filtro por fecha (solo para casos terminados)
    if (dateFilter) {
      filtered = filtered.filter(c => 
        c.status === 'Terminado' && c.endDate === dateFilter
      );
    }

    // Ordenamiento
    if (sortOrder === "A-Z") {
      filtered.sort((a, b) => a.caseType.localeCompare(b.caseType));
    } else if (sortOrder === "Z-A") {
      filtered.sort((a, b) => b.caseType.localeCompare(a.caseType));
    } else if (sortOrder && sortOrder.length === 1) {
      // Filtrar por letra específica
      filtered = filtered.filter(c => 
        c.caseType.charAt(0).toUpperCase() === sortOrder.toUpperCase()
      );
    }

    return filtered;
  };

  const handleSortClick = () => {
    if (sortOrder === "") {
      setSortOrder("A-Z");
    } else if (sortOrder === "A-Z") {
      setSortOrder("Z-A");
    } else {
      setSortOrder("");
    }
  };

  const handleStatusFilterClick = () => {
    if (statusFilter === "") {
      setStatusFilter("Pendiente");
    } else if (statusFilter === "Pendiente") {
      setStatusFilter("Terminado");
    } else {
      setStatusFilter("");
    }
  };

  const handleLetterClick = (letter) => {
    if (sortOrder === letter) {
      setSortOrder("A-Z"); // Si ya está seleccionada, volver a A-Z
    } else {
      setSortOrder(letter);
    }
  };

  const filteredCases = getFilteredAndSortedCases();

  const handleOpenModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      personName: '',
      createdAt: today,
      endDate: '',
      requestInfo: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: '',
      personName: '',
      createdAt: '',
      endDate: '',
      requestInfo: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateClick = (ref) => {
    if (ref.current) {
      if (ref.current.showPicker) {
        ref.current.showPicker();
      } else {
        ref.current.click();
      }
    }
  };

  const handleSubmitCase = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.personName || !formData.createdAt || !formData.requestInfo) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }

    try {
      // Buscar el empleado por nombre
      const empleado = empleados.find(emp => 
        `${emp.nombre || emp.Nombre} ${emp.apellido || emp.Apellido}` === formData.personName ||
        emp.nombre === formData.personName ||
        emp.Nombre === formData.personName
      );

      if (!empleado) {
        alert('Empleado no encontrado. Por favor, verifique el nombre.');
        return;
      }

      const empleadoId = empleado.id || empleado.Id_Empleado;

      const casoData = {
        empleado: empleadoId,
        tipo_fuero: formData.title,
        diagnostico: formData.requestInfo,
        fecha_inicio: formData.createdAt,
        estado: 'abierto',
        observaciones: formData.requestInfo,
        responsable: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Usuario'
      };

      const response = await casosAPI.create(casoData);
      
      // Recargar casos desde el backend
      await loadCases();
      handleCloseModal();
    } catch (error) {
      console.error('Error al crear caso:', error);
      alert('Error al crear el caso. Por favor, intenta nuevamente.');
    }
  };

  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
  };

  const handleCloseDetails = () => {
    setSelectedCase(null);
  };

  const handleMarkAsFinished = async () => {
    if (selectedCase) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const casoId = selectedCase.id;
        
        // Usar el endpoint de cerrar caso
        await casosAPI.cerrar(casoId);
        
        // O actualizar manualmente
        // await casosAPI.update(casoId, {
        //   estado: 'cerrado',
        //   fecha_cierre: today
        // });

        // Recargar casos desde el backend
        await loadCases();
        setSelectedCase(null);
      } catch (error) {
        console.error('Error al cerrar caso:', error);
        alert('Error al cerrar el caso. Por favor, intenta nuevamente.');
      }
    }
  };

  return (
    <div className="cases-container">
      <Nav />
      <main className="cases-main-content">
        {/* Left Sidebar */}
        <aside className="cases-sidebar">
          <div className="cases-sidebar-search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
              <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#666"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="cases-filters">
            <div 
              className={`cases-filter-item ${sortOrder ? 'active' : ''}`}
              onClick={handleSortClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter-icon">
                <path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z" fill={sortOrder ? "#fff" : "#666"}/>
              </svg>
              <span>{sortOrder || "A-Z"}</span>
            </div>
            <div 
              className={`cases-filter-item ${statusFilter ? 'active' : ''}`}
              onClick={handleStatusFilterClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter-icon">
                <path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z" fill={statusFilter ? "#fff" : "#666"}/>
              </svg>
              <span>{statusFilter || "Estado"}</span>
            </div>
          </div>

          {/* Selector de letras para A-Z */}
          {sortOrder && (sortOrder === "A-Z" || sortOrder === "Z-A" || sortOrder.length === 1) && (
            <div className="letter-filter">
              <div className="letter-filter-title">Filtrar por letra:</div>
              <div className="letter-buttons">
                {Array.from({ length: 26 }, (_, i) => {
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={letter}
                      className={`letter-button ${sortOrder === letter ? 'active' : ''}`}
                      onClick={() => handleLetterClick(letter)}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="cases-date-input">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="calendar-icon"
              onClick={handleCalendarIconClick}
              style={{ cursor: 'pointer' }}
            >
              <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z" fill="#666"/>
            </svg>
            <input 
              type="text" 
              placeholder="dd-mm-aa (Fecha terminación)" 
              value={selectedDate}
              readOnly
              onClick={handleCalendarIconClick}
              style={{ cursor: 'pointer' }}
            />
            <input
              ref={dateInputRef}
              type="date"
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              onChange={handleDateChange}
            />
          </div>

          <button className="cases-new-button" onClick={handleOpenModal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
            New case
          </button>
        </aside>

        {/* Right Main Content */}
        <section className="cases-content">
          <h2 className="cases-title">Cases</h2>
          
          <div className="cases-list">
            {filteredCases.length === 0 ? (
              <div className="no-cases-message">
                <p>No se encontraron casos que coincidan con los filtros aplicados.</p>
              </div>
            ) : (
              filteredCases.map((caseItem) => (
              <div 
                key={caseItem.id} 
                className="cases-item"
                onClick={() => handleCaseClick(caseItem)}
                style={{ cursor: 'pointer' }}
              >
                <div className="cases-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#86EFAC"/>
                    <circle cx="12" cy="9" r="4" fill="#9333EA"/>
                    <path d="M12 14C8.67 14 6 15.34 6 17V18H18V17C18 15.34 15.33 14 12 14Z" fill="#9333EA"/>
                  </svg>
                </div>
                <div className="cases-info">
                  <p className="cases-type">{caseItem.caseType}</p>
                  <p className="cases-entity">{caseItem.entityName}</p>
                  <div className="cases-dates">
                    <p className="cases-date">Creado: {formatDate(caseItem.createdAt)}</p>
                    {caseItem.endDate && (
                      <p className="cases-date">Fin: {formatDate(caseItem.endDate)}</p>
                    )}
                  </div>
                </div>
                <span className={`cases-status ${
                  caseItem.status === 'Pendiente' ? 'status-yellow' : 
                  caseItem.status === 'Terminado' ? 'status-green' : 
                  caseItem.status === 'In progrest' ? 'status-red' : 'status-green'
                }`}>
                  {caseItem.status}
                </span>
              </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modal de detalles del caso */}
      {selectedCase && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content case-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Caso</h2>
              <button className="modal-close" onClick={handleCloseDetails}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                </svg>
              </button>
            </div>
            <div className="case-details-content">
              <div className="case-detail-item">
                <label>Título del caso:</label>
                <p>{selectedCase.caseType}</p>
              </div>
              <div className="case-detail-item">
                <label>Nombre de la persona:</label>
                <p>{selectedCase.entityName}</p>
              </div>
              <div className="case-detail-item">
                <label>Fecha de creación:</label>
                <p>{formatDate(selectedCase.createdAt)}</p>
              </div>
              {selectedCase.endDate && (
                <div className="case-detail-item">
                  <label>Fecha de fin:</label>
                  <p>{formatDate(selectedCase.endDate)}</p>
                </div>
              )}
              <div className="case-detail-item">
                <label>Estado:</label>
                <span className={`cases-status ${
                  selectedCase.status === 'Pendiente' ? 'status-yellow' : 
                  selectedCase.status === 'Terminado' ? 'status-green' : 
                  selectedCase.status === 'In progrest' ? 'status-red' : 'status-green'
                }`}>
                  {selectedCase.status}
                </span>
              </div>
              <div className="case-detail-item full-width">
                <label>Información de que se solicita en el caso:</label>
                <div className="case-description">
                  <p>{selectedCase.requestInfo || 'No hay información adicional disponible.'}</p>
                </div>
              </div>
              {selectedCase.status === 'Pendiente' && (
                <div className="case-details-actions">
                  <button className="modal-submit" onClick={handleMarkAsFinished}>
                    Marcar como Terminado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo caso */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Caso</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitCase} className="modal-form">
              <div className="form-group">
                <label>Título del caso *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Gestión de documento"
                />
              </div>
              <div className="form-group">
                <label>Nombre de la persona que pide el caso *</label>
                <input
                  type="text"
                  name="personName"
                  value={formData.personName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre completo"
                />
              </div>
              <div className="form-group">
                <label>Fecha de creación de caso *</label>
                <div className="date-input-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="calendar-icon"
                    onClick={() => handleDateClick(createdAtRef)}
                  >
                    <path
                      d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                      fill="#666"
                    />
                  </svg>
                  <input
                    type="text"
                    value={formatDate(formData.createdAt)}
                    readOnly
                    onClick={() => handleDateClick(createdAtRef)}
                    placeholder="dd-mm-aa"
                  />
                  <input
                    ref={createdAtRef}
                    type="date"
                    name="createdAt"
                    value={formData.createdAt}
                    onChange={handleInputChange}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Fecha de fin de caso</label>
                <div className="date-input-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="calendar-icon"
                    onClick={() => handleDateClick(endDateRef)}
                  >
                    <path
                      d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                      fill="#666"
                    />
                  </svg>
                  <input
                    type="text"
                    value={formatDate(formData.endDate)}
                    readOnly
                    onClick={() => handleDateClick(endDateRef)}
                    placeholder="dd-mm-aa (opcional)"
                  />
                  <input
                    ref={endDateRef}
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Información de que se solicita en el caso *</label>
                <textarea
                  name="requestInfo"
                  value={formData.requestInfo}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Describa qué se solicita en este caso..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-submit">
                  Crear Caso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


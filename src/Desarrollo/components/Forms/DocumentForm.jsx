import { useState, useRef, useEffect } from "react";
import "./DocumentForm.css";
import Nav from "../Nav/Nav.jsx";
import LaboralMedicaForm from "./LaboralMedicaForm.jsx";
import RecomendacionesForm from "./RecomendacionesForm.jsx";
import AnexosForm from "./AnexosForm.jsx";
import { empleadosAPI } from "../../../services/api.js";

export default function DocumentForm() {
  // Estados para información general
  const [activeTab, setActiveTab] = useState("general");
  const [documentType, setDocumentType] = useState("");
  const [company, setCompany] = useState("");
  const [stabilityOrigin, setStabilityOrigin] = useState("");
  const [notificationDate, setNotificationDate] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [immediateLeader, setImmediateLeader] = useState("");
  const [workCity, setWorkCity] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentIdType, setDocumentIdType] = useState("");

  // Estados para formularios específicos
  const [incapacityData, setIncapacityData] = useState({
    startDate: "",
    endDate: "",
    cause: "",
    evidence: null,
    fileType: "",
  });

  const [dismissalData, setDismissalData] = useState({
    companyName: "",
    contractEndDate: "",
    dismissalReason: "",
    fileType: "",
  });

  const [permissionData, setPermissionData] = useState({
    startDate: "",
    endDate: "",
    approved: "",
    fileType: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const notificationDateRef = useRef(null);
  const incapacityStartRef = useRef(null);
  const incapacityEndRef = useRef(null);
  const dismissalDateRef = useRef(null);
  const permissionStartRef = useRef(null);
  const permissionEndRef = useRef(null);
  const entryDateRef = useRef(null);

  const documentTypes = [
    "Incapacidad",
    "Registro médico",
    "Carta de renuncia",
    "Despidos",
    "Contrato",
    "Vacaciones",
    "Licencia",
    "Otro",
  ];

  const companies = ["ARTMODE", "Maaji", "Otra empresa"];

  // Cargar todos los empleados al montar el componente
  useEffect(() => {
    loadAllEmployees();
  }, []);

  const loadAllEmployees = async () => {
    try {
      console.log('[DocumentForm] Cargando todos los empleados...');
      const data = await empleadosAPI.getAll();
      console.log('[DocumentForm] Empleados cargados:', data);
      setAllEmployees(data);
    } catch (error) {
      console.error('[DocumentForm] Error al cargar empleados:', error);
    }
  };

  const handleEmployeeSearch = async (value) => {
    setEmployeeName(value);
    
    if (value.length >= 1) {
      setSearchLoading(true);
      try {
        console.log('[DocumentForm] Buscando empleados con:', value);
        // Buscar empleados en la base de datos
        // Si el valor está vacío o es muy corto, buscar todos
        const searchTerm = value.length >= 2 ? value : '';
        let responseData = await empleadosAPI.getAll(searchTerm, null);
        console.log('[DocumentForm] Resultados de búsqueda (raw):', responseData);
        console.log('[DocumentForm] Tipo de datos:', typeof responseData, Array.isArray(responseData));
        console.log('[DocumentForm] Keys del objeto:', responseData ? Object.keys(responseData) : 'null');
        
        // Extraer el array de empleados de diferentes posibles formatos
        let employeesArray = null;
        
        if (Array.isArray(responseData)) {
          // Si ya es un array, usarlo directamente
          employeesArray = responseData;
          console.log('[DocumentForm] La respuesta es un array directo');
        } else if (responseData && typeof responseData === 'object') {
          // Buscar en diferentes propiedades comunes
          if (responseData.results && Array.isArray(responseData.results)) {
            employeesArray = responseData.results;
            console.log('[DocumentForm] Encontrado array en propiedad "results"');
          } else if (responseData.data && Array.isArray(responseData.data)) {
            employeesArray = responseData.data;
            console.log('[DocumentForm] Encontrado array en propiedad "data"');
          } else if (responseData.empleados && Array.isArray(responseData.empleados)) {
            employeesArray = responseData.empleados;
            console.log('[DocumentForm] Encontrado array en propiedad "empleados"');
          } else {
            // Buscar cualquier propiedad que sea un array
            for (const key in responseData) {
              if (Array.isArray(responseData[key])) {
                employeesArray = responseData[key];
                console.log('[DocumentForm] Encontrado array en propiedad:', key);
                break;
              }
            }
          }
        }
        
        if (!employeesArray || !Array.isArray(employeesArray)) {
          console.error('[DocumentForm] No se pudo extraer un array de empleados. Respuesta completa:', responseData);
          setSearchResults([]);
          setShowSearchResults(false);
          return;
        }
        
        console.log('[DocumentForm] Array de empleados extraído:', employeesArray);
        console.log('[DocumentForm] Cantidad de empleados:', employeesArray.length);
        
        // Si hay un término de búsqueda, filtrar localmente también
        let filteredData = employeesArray;
        if (value.length >= 2) {
          filteredData = employeesArray.filter(emp => {
            const nombre = (emp.nombre || emp.Nombre || '').toLowerCase();
            const apellido = (emp.apellido || emp.Apellido || '').toLowerCase();
            const cargo = (emp.cargo || emp.Cargo || '').toLowerCase();
            const correo = (emp.correo || emp.Correo || '').toLowerCase();
            const searchLower = value.toLowerCase();
            return nombre.includes(searchLower) || 
                   apellido.includes(searchLower) || 
                   cargo.includes(searchLower) ||
                   correo.includes(searchLower) ||
                   `${nombre} ${apellido}`.includes(searchLower);
          });
        }
        
        console.log('[DocumentForm] Datos filtrados:', filteredData);
        console.log('[DocumentForm] Cantidad después de filtrar:', filteredData.length);
        
        // Mapear datos de la BD al formato del formulario
        const mappedResults = filteredData.map((emp, index) => {
          console.log(`[DocumentForm] Mapeando empleado ${index + 1}:`, emp);
          const mapped = {
            id: emp.id || emp.Id_Empleado || index,
            name: emp.nombre || emp.Nombre || '',
            lastName: emp.apellido || emp.Apellido || '',
            position: emp.cargo || emp.Cargo || '',
            area: emp.area || emp.Area || emp.division || emp.Division || '',
            status: emp.estado || emp.Estado || '',
            entryDate: emp.fecha_ingreso || emp.Fecha_Ingreso || '',
            immediateLeader: emp.supervisor || emp.Supervisor || '',
            workCity: '', // Este campo no está en la BD de empleados, se puede agregar después
            documentNumber: '', // Este campo no está en la BD de empleados
            documentIdType: '', // Este campo no está en la BD de empleados
            correo: emp.correo || emp.Correo || '',
            telefono: emp.telefono || emp.Telefono || '',
            fecha_nacimiento: emp.fecha_nacimiento || emp.Fecha_Nacimiento || '',
          };
          console.log(`[DocumentForm] Empleado ${index + 1} mapeado:`, mapped);
          return mapped;
        });
        
        console.log('[DocumentForm] Resultados mapeados finales:', mappedResults);
        console.log('[DocumentForm] Cantidad de resultados mapeados:', mappedResults.length);
        setSearchResults(mappedResults);
        setShowSearchResults(mappedResults.length > 0);
      } catch (error) {
        console.error('[DocumentForm] Error al buscar empleados:', error);
        console.error('[DocumentForm] Error completo:', error.message, error.stack);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setEmployeeName(employee.name);
    setLastName(employee.lastName);
    setPosition(employee.position);
    setArea(employee.area);
    setStatus(employee.status);
    setEntryDate(employee.entryDate);
    setImmediateLeader(employee.immediateLeader);
    setWorkCity(employee.workCity);
    setDocumentNumber(employee.documentNumber);
    setDocumentIdType(employee.documentIdType);
    setShowSearchResults(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const handleFileChange = (setter, field) => (event) => {
    const file = event.target.files[0];
    if (file) {
      setter((prev) => ({ ...prev, [field]: file }));
    }
  };

  const generateDocument = () => {
    let documentContent = "";

    if (documentType === "Despidos") {
      documentContent = `Estimad@ ${employeeName} ${lastName} con ${documentIdType} ${documentNumber} tenemos la desfortuna de entregarle a usted su carta de despido por ${dismissalData.dismissalReason}, lamentamos que te vayas de esta hermosa familia, tu contrato finaliza ${formatDate(dismissalData.contractEndDate)}`;
    } else if (documentType === "Incapacidad") {
      documentContent = `Documento de Incapacidad\n\nEmpleado: ${employeeName} ${lastName}\nDocumento: ${documentIdType} ${documentNumber}\nFecha inicio: ${formatDate(incapacityData.startDate)}\nFecha fin: ${formatDate(incapacityData.endDate)}\nCausa: ${incapacityData.cause}`;
    } else if (documentType === "Permiso" || documentType === "Vacaciones" || documentType === "Licencia") {
      documentContent = `Documento de ${documentType}\n\nEmpleado: ${employeeName} ${lastName}\nDocumento: ${documentIdType} ${documentNumber}\nFecha inicio: ${formatDate(permissionData.startDate)}\nFecha fin: ${formatDate(permissionData.endDate)}\nEstado: ${permissionData.approved}`;
    }

    // Crear y descargar el documento
    const blob = new Blob([documentContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentType}_${employeeName}_${lastName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateDocument();
    alert("Documento generado exitosamente");
  };

  const renderSpecificForm = () => {
    if (documentType === "Incapacidad") {
      return (
        <div className="specific-form">
          <h3>Información de Incapacidad</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha inicio de incapacidad</label>
              <div className="date-input-wrapper">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="calendar-icon"
                  onClick={() => handleDateClick(incapacityStartRef)}
                >
                  <path
                    d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                    fill="#666"
                  />
                </svg>
                <input
                  type="text"
                  value={formatDate(incapacityData.startDate)}
                  readOnly
                  onClick={() => handleDateClick(incapacityStartRef)}
                />
                <input
                  ref={incapacityStartRef}
                  type="date"
                  style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                  }}
                  onChange={(e) =>
                    setIncapacityData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Fecha fin de incapacidad</label>
              <div className="date-input-wrapper">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="calendar-icon"
                  onClick={() => handleDateClick(incapacityEndRef)}
                >
                  <path
                    d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                    fill="#666"
                  />
                </svg>
                <input
                  type="text"
                  value={formatDate(incapacityData.endDate)}
                  readOnly
                  onClick={() => handleDateClick(incapacityEndRef)}
                />
                <input
                  ref={incapacityEndRef}
                  type="date"
                  style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                  }}
                  onChange={(e) =>
                    setIncapacityData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Causa</label>
              <input
                type="text"
                value={incapacityData.cause}
                onChange={(e) =>
                  setIncapacityData((prev) => ({
                    ...prev,
                    cause: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label>Evidencia</label>
              <input
                type="file"
                onChange={handleFileChange(setIncapacityData, "evidence")}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Tipo de documento</label>
            <select
              value={incapacityData.fileType}
              onChange={(e) =>
                setIncapacityData((prev) => ({
                  ...prev,
                  fileType: e.target.value,
                }))
              }
            >
              <option value="">Seleccione...</option>
              <option value="Excel">Excel</option>
              <option value="Word">Word</option>
              <option value="PDF">PDF</option>
            </select>
          </div>
        </div>
      );
    }

    if (documentType === "Despidos") {
      return (
        <div className="specific-form">
          <h3>Información de Despido</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre de la empresa</label>
              <input
                type="text"
                value={dismissalData.companyName}
                onChange={(e) =>
                  setDismissalData((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label>Fecha de hasta cuando es su contrato</label>
              <div className="date-input-wrapper">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="calendar-icon"
                  onClick={() => handleDateClick(dismissalDateRef)}
                >
                  <path
                    d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                    fill="#666"
                  />
                </svg>
                <input
                  type="text"
                  value={formatDate(dismissalData.contractEndDate)}
                  readOnly
                  onClick={() => handleDateClick(dismissalDateRef)}
                />
                <input
                  ref={dismissalDateRef}
                  type="date"
                  style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                  }}
                  onChange={(e) =>
                    setDismissalData((prev) => ({
                      ...prev,
                      contractEndDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Motivo del despido</label>
              <textarea
                value={dismissalData.dismissalReason}
                onChange={(e) =>
                  setDismissalData((prev) => ({
                    ...prev,
                    dismissalReason: e.target.value,
                  }))
                }
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Tipo de documento</label>
              <select
                value={dismissalData.fileType}
                onChange={(e) =>
                  setDismissalData((prev) => ({
                    ...prev,
                    fileType: e.target.value,
                  }))
                }
              >
                <option value="">Seleccione...</option>
                <option value="Excel">Excel</option>
                <option value="Word">Word</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (
      documentType === "Vacaciones" ||
      documentType === "Licencia" ||
      documentType === "Permiso"
    ) {
      return (
        <div className="specific-form">
          <h3>Información de {documentType}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha inicial del {documentType.toLowerCase()}</label>
              <div className="date-input-wrapper">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="calendar-icon"
                  onClick={() => handleDateClick(permissionStartRef)}
                >
                  <path
                    d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                    fill="#666"
                  />
                </svg>
                <input
                  type="text"
                  value={formatDate(permissionData.startDate)}
                  readOnly
                  onClick={() => handleDateClick(permissionStartRef)}
                />
                <input
                  ref={permissionStartRef}
                  type="date"
                  style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                  }}
                  onChange={(e) =>
                    setPermissionData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Fecha fin del {documentType.toLowerCase()}</label>
              <div className="date-input-wrapper">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="calendar-icon"
                  onClick={() => handleDateClick(permissionEndRef)}
                >
                  <path
                    d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                    fill="#666"
                  />
                </svg>
                <input
                  type="text"
                  value={formatDate(permissionData.endDate)}
                  readOnly
                  onClick={() => handleDateClick(permissionEndRef)}
                />
                <input
                  ref={permissionEndRef}
                  type="date"
                  style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                  }}
                  onChange={(e) =>
                    setPermissionData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Aprobada o no aprobada</label>
              <select
                value={permissionData.approved}
                onChange={(e) =>
                  setPermissionData((prev) => ({
                    ...prev,
                    approved: e.target.value,
                  }))
                }
              >
                <option value="">Seleccione...</option>
                <option value="Aprobada">Aprobada</option>
                <option value="No aprobada">No aprobada</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de documento</label>
              <select
                value={permissionData.fileType}
                onChange={(e) =>
                  setPermissionData((prev) => ({
                    ...prev,
                    fileType: e.target.value,
                  }))
                }
              >
                <option value="">Seleccione...</option>
                <option value="Excel">Excel</option>
                <option value="Word">Word</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="document-form-container">
      <Nav />
      <div className="document-form-content">
        <h1 className="form-title">Datos del trabajador</h1>

        {/* Tabs */}
        <div className="form-tabs">
          <button
            className={`tab-button ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            Información general
          </button>
          <button
            className={`tab-button ${activeTab === "laboral" ? "active" : ""}`}
            onClick={() => setActiveTab("laboral")}
          >
            Información laboral y médica
          </button>
          <button
            className={`tab-button ${activeTab === "recomendaciones" ? "active" : ""}`}
            onClick={() => setActiveTab("recomendaciones")}
          >
            Recomendaciones y seguimiento
          </button>
          <button
            className={`tab-button ${activeTab === "anexos" ? "active" : ""}`}
            onClick={() => setActiveTab("anexos")}
          >
            Anexos
          </button>
        </div>

        <form onSubmit={handleSubmit} className="document-form">
          {/* Información General */}
          {activeTab === "general" && (
            <div className="form-section">
              <h2>Información General</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de documento</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Empresa</label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {companies.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Origen de la estabilidad</label>
                  <input
                    type="text"
                    value={stabilityOrigin}
                    onChange={(e) => setStabilityOrigin(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de notificación a la compañía del empleado</label>
                  <div className="date-input-wrapper">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="calendar-icon"
                      onClick={() => handleDateClick(notificationDateRef)}
                    >
                      <path
                        d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                        fill="#666"
                      />
                    </svg>
                    <input
                      type="text"
                      value={formatDate(notificationDate)}
                      readOnly
                      onClick={() => handleDateClick(notificationDateRef)}
                      placeholder="dd-mm-aa"
                    />
                    <input
                      ref={notificationDateRef}
                      type="date"
                      style={{
                        position: "absolute",
                        opacity: 0,
                        pointerEvents: "none",
                        width: 0,
                        height: 0,
                      }}
                      onChange={(e) => setNotificationDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group search-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => handleEmployeeSearch(e.target.value)}
                    placeholder="Buscar empleado (escribe para buscar)..."
                    onBlur={() => {
                      // Ocultar resultados después de un pequeño delay para permitir el click
                      setTimeout(() => setShowSearchResults(false), 200);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                  />
                  {searchLoading && (
                    <div className="search-results">
                      <div className="search-result-item loading">Buscando...</div>
                    </div>
                  )}
                  {!searchLoading && showSearchResults && searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map((emp, index) => {
                        const displayText = `${emp.name || ''} ${emp.lastName || ''} ${emp.position ? `- ${emp.position}` : ''} ${emp.area ? `(${emp.area})` : ''}`.trim();
                        console.log(`[DocumentForm] Renderizando empleado ${index + 1}:`, displayText, emp);
                        return (
                          <div
                            key={emp.id || index}
                            className="search-result-item"
                            onClick={() => {
                              console.log('[DocumentForm] Empleado seleccionado:', emp);
                              handleEmployeeSelect(emp);
                            }}
                          >
                            {displayText || `Empleado ${index + 1}`}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!searchLoading && showSearchResults && searchResults.length === 0 && employeeName.length >= 1 && (
                    <div className="search-results">
                      <div className="search-result-item no-results">No se encontraron empleados</div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cargo</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Área</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de ingreso</label>
                  <div className="date-input-wrapper">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="calendar-icon"
                      onClick={() => handleDateClick(entryDateRef)}
                    >
                      <path
                        d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                        fill="#666"
                      />
                    </svg>
                    <input
                      type="text"
                      value={formatDate(entryDate)}
                      readOnly
                      onClick={() => handleDateClick(entryDateRef)}
                    />
                    <input
                      ref={entryDateRef}
                      type="date"
                      style={{
                        position: "absolute",
                        opacity: 0,
                        pointerEvents: "none",
                        width: 0,
                        height: 0,
                      }}
                      onChange={(e) => setEntryDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Líder inmediato</label>
                  <input
                    type="text"
                    value={immediateLeader}
                    onChange={(e) => setImmediateLeader(e.target.value)}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Ciudad donde se labora</label>
                  <input
                    type="text"
                    value={workCity}
                    onChange={(e) => setWorkCity(e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Número de documento</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de documento</label>
                  <input
                    type="text"
                    value={documentIdType}
                    onChange={(e) => setDocumentIdType(e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              {/* Formulario específico según tipo de documento */}
              {documentType && renderSpecificForm()}
            </div>
          )}

          {/* Información Laboral y Médica */}
          {activeTab === "laboral" && <LaboralMedicaForm />}

          {/* Recomendaciones y Seguimiento */}
          {activeTab === "recomendaciones" && <RecomendacionesForm />}

          {/* Anexos */}
          {activeTab === "anexos" && <AnexosForm />}

          <div className="form-actions">
            <button type="submit" className="save-button">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


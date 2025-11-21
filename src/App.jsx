import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login/login.jsx';
import Dashboard from './Desarrollo/dashboard/Dashboard.jsx';
import Archivos from './Desarrollo/documen/Archivos.jsx';
import DocUsuario from './Desarrollo/documen/InfoCarpetas/docUsuario.jsx';
import Cases from './Desarrollo/Cases/Cases.jsx';
import Profile from './Desarrollo/Profile/Perfil.jsx';
import DocumentForm from './Desarrollo/components/Forms/DocumentForm.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents/folder" element={<DocUsuario />} />
        <Route path="/documents" element={<Archivos />} />
        <Route path="/documents/form" element={<DocumentForm />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;



/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App*/

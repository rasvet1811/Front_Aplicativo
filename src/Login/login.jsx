
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import fondo from "../Imagenes/Login/fondo.jpg";
import logo from "../Imagenes/Login/logo.png";
import { authService } from "../services/api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('[Login] Intentando iniciar sesión con:', email);
      // El backend espera "username", pero aceptamos email o código
      const response = await authService.login(email, password);
      console.log('[Login] Respuesta del servidor:', response);
      
      if (response.token) {
        setEmail("");
        setPassword("");
        navigate("/dashboard");
      } else {
        setError("Error al iniciar sesión. No se recibió un token válido.");
      }
    } catch (err) {
      console.error('[Login] Error completo:', err);
      console.error('[Login] Error message:', err.message);
      console.error('[Login] Error stack:', err.stack);
      
      // Mostrar mensaje de error más descriptivo
      if (err.message && err.message.includes('No se pudo conectar')) {
        setError(err.message);
      } else if (err.message && err.message.includes('Error interno del servidor')) {
        setError(err.message);
      } else if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('incorrectos') || err.message.includes('Invalid') || err.message.includes('authentication'))) {
        setError("Correo o contraseña incorrectos.");
      } else if (err.message && err.message.includes('500')) {
        setError("Error interno del servidor. Por favor, verifica los logs del backend o contacta al administrador.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Error al iniciar sesión. Por favor, intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="login-box">
       
        <img src={logo} alt="Logo" className="login-logo" />

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Codigo o correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Entrar"}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guarda de rota (CS-001, CS-003) -- sem sessao valida do tipo exigido,
 * redireciona pro login em vez de deixar a pagina renderizar com dado
 * vazio/erro de token.
 *
 * tipo: "cliente" | "empresa" | "qualquer" (aceita as duas sessoes,
 * usado em telas compartilhadas como a conversa)
 */
export default function RotaProtegida({ tipo, children }) {
  const { cliente, empresa } = useAuth();

  const autenticado =
    tipo === "cliente" ? Boolean(cliente) :
    tipo === "empresa" ? Boolean(empresa) :
    Boolean(cliente || empresa);

  if (!autenticado) {
    return <Navigate to="/entrar" replace />;
  }

  return children;
}

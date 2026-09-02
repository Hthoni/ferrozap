import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guarda de rota (CS-001, CS-003) -- sem sessao valida do tipo exigido,
 * redireciona pro login em vez de deixar a pagina renderizar com dado
 * vazio/erro de token.
 *
 * tipo: "cliente" | "empresa" | "admin" | "qualquer" (aceita as duas
 * sessoes de cliente/empresa, usado em telas compartilhadas como a
 * conversa -- não inclui admin de propósito, área bem separada)
 */
export default function RotaProtegida({ tipo, children }) {
  const { cliente, empresa, admin } = useAuth();

  const autenticado =
    tipo === "cliente" ? Boolean(cliente) :
    tipo === "empresa" ? Boolean(empresa) :
    tipo === "admin" ? Boolean(admin) :
    Boolean(cliente || empresa);

  if (!autenticado) {
    return <Navigate to={tipo === "admin" ? "/admin/entrar" : "/entrar"} replace />;
  }

  return children;
}

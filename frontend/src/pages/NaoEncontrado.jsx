import { Link } from "react-router-dom";
import useTitulo from "../hooks/useTitulo";

export default function NaoEncontrado() {
  useTitulo("Página não encontrada");
  return (
    <div className="fz-wrap fz-secao" style={{ textAlign: "center", paddingTop: 60 }}>
      <p className="fz-rotulo fz-rotulo--aco">Erro 404</p>
      <h1 style={{ fontSize: 32, margin: "16px 0 12px" }}>Essa página não existe</h1>
      <p style={{ marginBottom: 24, color: "var(--color-neutral-700)" }}>
        O endereço que você tentou abrir não existe ou foi movido.
      </p>
      <Link className="btn btn-primary" to="/buscar" style={{ display: "inline-flex", width: "auto", padding: "0 24px", minHeight: 44 }}>
        Ir para a busca
      </Link>
    </div>
  );
}

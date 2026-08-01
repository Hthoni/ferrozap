import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const ROTULO_STATUS = { aguardando: "Aguardando", respondida: "Respondida", sem_resposta: "Sem resposta" };

export default function MinhasConversas() {
  const [conversas, setConversas] = useState([]);
  const [erro, setErro] = useState("");
  const { cliente } = useAuth();

  useEffect(() => {
    if (!cliente) return;
    api.listarMinhasConversas(cliente.token).then(setConversas).catch((err) => setErro(err.message));
  }, [cliente]);

  if (!cliente) {
    return (
      <div className="fz-wrap fz-secao">
        <p>Entre com sua conta para ver suas conversas.</p>
        <Link className="btn btn-primary" to="/entrar">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="fz-wrap fz-secao">
      <h2 style={{ fontSize: 32, margin: "0 0 24px" }}>Minhas conversas</h2>
      {erro && <p style={{ color: "var(--fz-vendido)" }}>{erro}</p>}
      {conversas.length === 0 && <p>Você ainda não iniciou nenhuma conversa.</p>}
      {conversas.map((c) => (
        <Link key={c.id} to={`/conversas/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="fz-codigo">{c.fabricante_nome} {c.modelo_nome} · {c.ano_fabricacao}</span>
            <span className={`fz-status fz-status--${c.status}`}>{ROTULO_STATUS[c.status]}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

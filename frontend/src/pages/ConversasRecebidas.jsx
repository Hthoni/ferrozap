import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ConversasRecebidas() {
  const { empresa } = useAuth();
  const [conversas, setConversas] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!empresa) return;
    api.listarConversasRecebidas(empresa.token).then(setConversas).catch((err) => setErro(err.message));
  }, [empresa]);

  if (!empresa) {
    return (
      <div className="container">
        <p>Entre com a conta da empresa para ver as conversas.</p>
        <Link to="/empresa/entrar"><button>Entrar</button></Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Conversas recebidas</h2>
      {erro && <p className="erro">{erro}</p>}
      {conversas.length === 0 && <p>Nenhuma conversa recebida ainda.</p>}
      {conversas.map((c) => (
        <Link key={c.id} to={`/conversas/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card lista-item">
            <span>Conversa #{c.id} · veículo #{c.veiculo_desmonte_id}</span>
            <span className={`badge ${c.status}`}>
              {c.status === "aguardando" ? "Aguardando" : c.status === "respondida" ? "Respondida" : "Sem resposta"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function MinhasConversas() {
  const [conversas, setConversas] = useState([]);
  const [erro, setErro] = useState("");
  const { cliente } = useAuth();

  useEffect(() => {
    if (!cliente) return;
    api
      .listarMinhasConversas(cliente.token)
      .then(setConversas)
      .catch((err) => setErro(err.message));
  }, [cliente]);

  if (!cliente) {
    return (
      <div className="container">
        <p>Entre com sua conta para ver suas conversas.</p>
        <Link to="/entrar"><button>Entrar</button></Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Minhas conversas</h2>
      {erro && <p className="erro">{erro}</p>}
      {conversas.length === 0 && <p>Você ainda não iniciou nenhuma conversa.</p>}
      {conversas.map((c) => (
        <Link key={c.id} to={`/conversas/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card lista-item">
            <span>Conversa #{c.id}</span>
            <span className={`badge ${c.status}`}>
              {c.status === "aguardando" ? "Aguardando" : c.status === "respondida" ? "Respondida" : "Sem resposta"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

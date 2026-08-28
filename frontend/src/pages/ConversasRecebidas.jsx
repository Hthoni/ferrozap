import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import useTitulo from "../hooks/useTitulo";

const ROTULO_STATUS = { aguardando: "Aguardando", respondida: "Respondida", sem_resposta: "Sem resposta" };

export default function ConversasRecebidas() {
  useTitulo("Mensagens recebidas");
  const { empresa } = useAuth();
  const [conversas, setConversas] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!empresa) return;
    api.listarConversasRecebidas(empresa.token).then(setConversas).catch((err) => setErro(err.message));
  }, [empresa]);

  if (!empresa) {
    return (
      <div className="fz-wrap fz-secao">
        <p>Entre com a conta da empresa para ver as conversas.</p>
        <Link className="btn btn-primary" to="/empresa/entrar">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="fz-wrap fz-secao">
      <h2 style={{ fontSize: 32, margin: "0 0 24px" }}>Conversas recebidas</h2>
      {erro && <p style={{ color: "var(--fz-vendido)" }}>{erro}</p>}
      {conversas.length === 0 && <p>Nenhuma conversa recebida ainda.</p>}
      {conversas.map((c) => (
        <Link key={c.id} to={`/conversas/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="fz-codigo">{c.fabricante_nome} {c.modelo_nome} · {c.ano_fabricacao}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {c.tem_nao_lida && (
                <span className="tag" style={{ background: "var(--fz-vendido)", color: "#fff" }}>Não lida</span>
              )}
              <span className={`fz-status fz-status--${c.status}`}>{ROTULO_STATUS[c.status]}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import useTitulo from "../hooks/useTitulo";

const ROTULO_STATUS = { aguardando: "Aguardando", respondida: "Respondida", sem_resposta: "Sem resposta" };

export default function MinhasConversas() {
  useTitulo("Mensagens");
  const [conversas, setConversas] = useState([]);
  const [erro, setErro] = useState("");
  const { cliente } = useAuth();

  useEffect(() => {
    if (!cliente) return;
    api.listarMinhasConversas(cliente.token).then(setConversas).catch((err) => {
      // CS-001: token expirado mostrava o texto cru do backend aqui --
      // esse era o único lugar do site que ainda fazia isso.
      if (err.status === 401) {
        setErro("Sua sessão expirou. Entre novamente para continuar.");
      } else {
        setErro(err.message);
      }
    });
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
      <h2 style={{ fontSize: 32, marginBottom: 24 }}>Mensagens</h2>
      {erro && (
        <p role="alert" style={{ color: "var(--fz-vendido)" }}>
          {erro}
          {erro.includes("sessão expirou") && (
            <> <Link to="/entrar" style={{ color: "inherit", textDecoration: "underline" }}>Entrar de novo</Link></>
          )}
        </p>
      )}
      {conversas.length === 0 && !erro && <p>Você ainda não iniciou nenhuma conversa.</p>}
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

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ConversaDetalhe() {
  const { id } = useParams();
  const { cliente, empresa } = useAuth();
  const token = cliente?.token || empresa?.token;
  const meuTipo = empresa ? "empresa" : "cliente";

  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function carregar() {
    api
      .listarMensagens(id, token)
      .then(setMensagens)
      .catch((err) => setErro(err.message));
  }

  useEffect(() => {
    if (token) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.enviarMensagem(id, texto, token);
      setTexto("");
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!token) return <div className="container"><p>Você precisa estar autenticado.</p></div>;

  return (
    <div className="container">
      <h2>Conversa #{id}</h2>
      {erro && <p className="erro">{erro}</p>}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {mensagens.map((m) => (
          <div
            key={m.id}
            className={`mensagem ${m.remetente_tipo === meuTipo ? "empresa" : "cliente"}`}
          >
            <p style={{ margin: 0 }}>{m.texto}</p>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.6 }}>
              {new Date(m.criado_em).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={enviar} className="card">
        <textarea
          rows={3}
          placeholder="Escreva sua mensagem"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          required
        />
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ConversaDetalhe() {
  const { id } = useParams();
  const { cliente, empresa } = useAuth();
  const token = cliente?.token || empresa?.token;
  const meuTipo = empresa ? "empresa" : "cliente";

  const [veiculo, setVeiculo] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function carregar() {
    api.listarMensagens(id, token).then(setMensagens).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    if (!token) return;
    carregar();
    // Busca o resumo do veiculo a partir da lista (ja carregada em
    // Minhas conversas / Conversas recebidas) — evita endpoint novo.
    const lista = cliente ? api.listarMinhasConversas : api.listarConversasRecebidas;
    lista(token).then((conversas) => {
      const atual = conversas.find((c) => String(c.id) === String(id));
      if (atual) setVeiculo(atual);
    });
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

  if (!token) return <div className="fz-wrap fz-secao"><p>Você precisa estar autenticado.</p></div>;

  return (
    <div className="fz-wrap fz-secao" style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="fz-rotulo fz-rotulo--aco" style={{ margin: 0 }}>Conversa #{id}</p>
        {cliente && (
          <Link className="btn btn-primary" to="/buscar" style={{ width: "auto" }}>Nova busca</Link>
        )}
      </div>
      {veiculo && (
        <h2 style={{ fontSize: 28, margin: "8px 0 24px" }}>
          {veiculo.fabricante_nome} {veiculo.modelo_nome}
          {veiculo.submodelo_nome && ` ${veiculo.submodelo_nome}`} · {veiculo.ano_fabricacao}
        </h2>
      )}
      {erro && <p style={{ color: "var(--fz-vendido)" }}>{erro}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "24px 0" }}>
        {mensagens.map((m) => {
          const minha = m.remetente_tipo === meuTipo;
          return (
            <div
              key={m.id}
              className="card"
              style={{
                maxWidth: "78%",
                alignSelf: minha ? "flex-end" : "flex-start",
                background: minha ? "var(--color-accent-100)" : "var(--color-neutral-100)",
                border: "1px solid var(--fz-linha)",
              }}
            >
              <p className="card-body" style={{ opacity: 1 }}>{m.texto}</p>
              <p className="card-meta">{new Date(m.criado_em).toLocaleString("pt-BR")}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={enviar} className="field">
        <label>Responder</label>
        <textarea
          className="input"
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          required
        />
        <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

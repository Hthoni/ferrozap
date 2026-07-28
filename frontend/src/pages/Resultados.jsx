import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Resultados() {
  const [params] = useSearchParams();
  const modeloId = params.get("modeloId");
  const ano = params.get("ano");
  const cep = params.get("cep");

  const [resultados, setResultados] = useState([]);
  const [ordenarPor, setOrdenarPor] = useState("compatibilidade");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [cardSelecionado, setCardSelecionado] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState("");

  const { cliente } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setCarregando(true);
    setErro("");
    api
      .buscar({ modeloId, ano, cep, ordenarPor })
      .then(setResultados)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, [modeloId, ano, cep, ordenarPor]);

  async function enviarMensagem(e) {
    e.preventDefault();
    if (!cliente) {
      navigate("/entrar");
      return;
    }
    setEnviando(true);
    try {
      await api.iniciarConversa(
        {
          veiculo_desmonte_id: cardSelecionado.veiculo_id,
          modelo_id: Number(modeloId),
          ano: Number(ano),
          cep,
          texto,
        },
        cliente.token
      );
      setSucesso("Mensagem enviada! Acompanhe a resposta em Minhas conversas.");
      setCardSelecionado(null);
      setTexto("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container">
      <h2>Resultados</h2>

      <div className="toggle-linha">
        <button
          className={ordenarPor === "compatibilidade" ? "" : "secundario"}
          onClick={() => setOrdenarPor("compatibilidade")}
        >
          Compatibilidade
        </button>
        <button
          className={ordenarPor === "distancia" ? "" : "secundario"}
          onClick={() => setOrdenarPor("distancia")}
        >
          Distância
        </button>
      </div>

      {carregando && <p>Buscando...</p>}
      {erro && <p className="erro">{erro}</p>}
      {sucesso && <p className="card">{sucesso}</p>}
      {!carregando && !erro && resultados.length === 0 && (
        <p>Nenhum desmonte compatível encontrado ainda para esse veículo.</p>
      )}

      {resultados.map((r) => (
        <div className="card" key={r.veiculo_id}>
          <p style={{ fontWeight: 500, margin: 0 }}>{r.nome}</p>
          <p style={{ fontSize: 13, color: "#666", margin: "4px 0" }}>
            {Number(r.distancia_km).toFixed(0)} km · veículo {r.ano_fabricacao}
          </p>
          <span className={`badge ${r.nivel_confianca === "compativel_exato" ? "exato" : "provavel"}`}>
            {r.nivel_confianca === "compativel_exato" ? "Encontrado" : "Encaixe provável"}
          </span>
          <div style={{ marginTop: 10 }}>
            <button onClick={() => setCardSelecionado(r)}>
              Fazer contato
            </button>
          </div>
        </div>
      ))}

      {cardSelecionado && (
        <div className="card">
          <p style={{ fontWeight: 500 }}>Descreva o que você precisa</p>
          <form onSubmit={enviarMensagem}>
            <textarea
              rows={4}
              placeholder="Ex: preciso do para-lama dianteiro direito, na cor original se tiver"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
            />
            <button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar mensagem"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

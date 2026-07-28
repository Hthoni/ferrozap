import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

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
      setSucesso("Mensagem enviada. Acompanhe a resposta em Minhas conversas.");
      setCardSelecionado(null);
      setTexto("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fz-wrap fz-secao">
      <h2 style={{ fontSize: 32, margin: "0 0 24px" }}>Resultados</h2>

      <div className="seg" style={{ marginBottom: 24 }}>
        <label className="seg-opt">
          <input
            type="radio"
            checked={ordenarPor === "compatibilidade"}
            onChange={() => setOrdenarPor("compatibilidade")}
          />
          Compatibilidade
        </label>
        <label className="seg-opt">
          <input
            type="radio"
            checked={ordenarPor === "distancia"}
            onChange={() => setOrdenarPor("distancia")}
          />
          Distância
        </label>
      </div>

      {carregando && <p>Buscando...</p>}
      {erro && <p style={{ color: "var(--fz-vendido)" }}>{erro}</p>}
      {sucesso && <p className="card"><span className="card-body">{sucesso}</span></p>}
      {!carregando && !erro && resultados.length === 0 && (
        <p>Nenhum desmonte compatível encontrado ainda para esse veículo.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
        {resultados.map((r) => {
          const exato = r.nivel_confianca === "compativel_exato";
          return (
            <article className="fz-card-peca blueprint" key={r.veiculo_id}>
              <Corners />
              {exato && (
                <p className="fz-selo"><BadgeCheck size={15} strokeWidth={1.5} /> Desmontadora verificada</p>
              )}
              <h3 className="fz-card-titulo">{r.nome}</h3>
              <div className="fz-tags">
                <span className="tag tag-neutral">
                  <MapPin size={13} strokeWidth={1.5} style={{ marginRight: 4 }} />
                  {Number(r.distancia_km).toFixed(0)} km
                </span>
                <span className={`tag ${exato ? "tag-accent" : "tag-neutral"}`}>
                  {exato ? "Encontrado" : "Encaixe provável"}
                </span>
              </div>
              <p className="fz-codigo">Veículo ano {r.ano_fabricacao}</p>
              <button className="btn btn-primary btn-block blueprint" onClick={() => setCardSelecionado(r)}>
                <Corners />
                Falar com a desmontadora
              </button>
            </article>
          );
        })}
      </div>

      {cardSelecionado && (
        <div className="blueprint" style={{ padding: 24, marginTop: 24, maxWidth: 480 }}>
          <Corners />
          <p className="card-title" style={{ marginBottom: 12 }}>Descreva o que você precisa</p>
          <form onSubmit={enviarMensagem}>
            <textarea
              className="input"
              rows={4}
              placeholder="Ex: preciso do para-lama dianteiro direito, na cor original se tiver"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
            />
            <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar mensagem"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

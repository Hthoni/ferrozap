import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function Resultados() {
  const [params] = useSearchParams();
  const modeloId = params.get("modeloId");
  const ano = params.get("ano");
  const cep = params.get("cep");
  const fabricanteNome = params.get("fabricanteNome") || "";
  const modeloNome = params.get("modeloNome") || "";
  const submodeloId = params.get("submodeloId") || null;

  const [resultados, setResultados] = useState([]);
  const [ordenarPor, setOrdenarPor] = useState("compatibilidade");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [empresaAbertaId, setEmpresaAbertaId] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucessoId, setSucessoId] = useState(null);

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

  function abrirMensagem(empresaId) {
    if (!cliente) {
      navigate("/entrar");
      return;
    }
    setEmpresaAbertaId(empresaId === empresaAbertaId ? null : empresaId);
    setTexto("");
    setSucessoId(null);
  }

  async function enviarMensagem(e, grupo) {
    e.preventDefault();
    setEnviando(true);
    try {
      const melhorVeiculo = grupo.veiculos[0]; // já vem ordenado, exato primeiro
      await api.iniciarConversa(
        {
          veiculo_desmonte_id: melhorVeiculo.veiculo_id,
          modelo_id: Number(modeloId),
          submodelo_id: submodeloId ? Number(submodeloId) : null,
          ano: Number(ano),
          cep,
          texto,
        },
        cliente.token
      );
      setSucessoId(grupo.empresa_id);
      setEmpresaAbertaId(null);
      setTexto("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fz-wrap fz-secao">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>Resultados</h2>
        <Link className="btn btn-secondary" to="/buscar" style={{ width: "auto" }}>Nova busca</Link>
      </div>

      <div className="seg" style={{ marginBottom: 20 }}>
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
      {!carregando && !erro && resultados.length === 0 && (
        <>
          <p>Nenhum desmonte compatível encontrado ainda para esse veículo.</p>
          <Link className="btn btn-primary" to="/buscar" style={{ display: "inline-block", width: "auto", marginTop: 12 }}>
            Nova busca
          </Link>
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {resultados.map((grupo) => (
          <article className="fz-card-peca blueprint" key={grupo.empresa_id}>
            <Corners />
            <h3 className="fz-card-titulo" style={{ margin: 0 }}>{grupo.empresa_nome}</h3>
            <p className="fz-selo" style={{ margin: 0 }}>
              <BadgeCheck size={15} strokeWidth={1.5} /> Desmontadora verificada
            </p>
            <p className="fz-selo" style={{ margin: 0 }}>
              <MapPin size={13} strokeWidth={1.5} />
              {grupo.distancia_km.toFixed(0)} km
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {grupo.veiculos.map((v) => {
                const exato = v.nivel_confianca === "compativel_exato";
                return (
                  <li key={v.veiculo_id} style={{ fontSize: 14 }}>
                    <span style={{ color: "var(--fz-tinta)" }}>— </span>
                    <span style={{ color: "var(--fz-disponivel)", fontWeight: 600 }}>{fabricanteNome}</span>
                    <span style={{ color: "var(--fz-tinta)" }}> / </span>
                    <span style={{ color: "var(--fz-disponivel)", fontWeight: 600 }}>{modeloNome}</span>
                    <span style={{ color: "var(--fz-tinta)" }}> / </span>
                    <span style={{ color: exato ? "var(--fz-disponivel)" : "var(--fz-vendido)", fontWeight: 600 }}>
                      {v.ano_fabricacao}
                    </span>
                  </li>
                );
              })}
            </ul>

            {sucessoId === grupo.empresa_id ? (
              <p style={{ fontSize: 13, margin: 0 }}>Mensagem enviada. Acompanhe em Mensagens.</p>
            ) : empresaAbertaId === grupo.empresa_id ? (
              <form onSubmit={(e) => enviarMensagem(e, grupo)} style={{ width: "100%" }}>
                <textarea
                  className="input"
                  rows={2}
                  style={{ resize: "vertical", maxHeight: 80, overflowY: "auto" }}
                  placeholder="Descreva a peça que precisa"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  autoFocus
                  required
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: "auto" }}
                    onClick={() => setEmpresaAbertaId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn btn-primary btn-block blueprint" onClick={() => abrirMensagem(grupo.empresa_id)}>
                <Corners />
                Falar com a desmontadora
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

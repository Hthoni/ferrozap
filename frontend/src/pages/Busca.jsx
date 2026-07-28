import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Corners from "../components/Corners";

export default function Busca() {
  const [fabricantes, setFabricantes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [submodelos, setSubmodelos] = useState([]);

  const [fabricanteId, setFabricanteId] = useState("");
  const [fabricanteNome, setFabricanteNome] = useState("");
  const [modoTextoFabricante, setModoTextoFabricante] = useState(false);
  const [textoFabricante, setTextoFabricante] = useState("");

  const [modeloId, setModeloId] = useState("");
  const [modoTextoModelo, setModoTextoModelo] = useState(false);
  const [textoModelo, setTextoModelo] = useState("");

  const [submodeloId, setSubmodeloId] = useState("");
  const [temSubmodelo, setTemSubmodelo] = useState(false);
  const [ano, setAno] = useState("");
  const [cep, setCep] = useState("");
  const [erro, setErro] = useState("");
  const [resolvendo, setResolvendo] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    api.listarFabricantes().then(setFabricantes).catch(() => setErro("Não foi possível carregar os fabricantes."));
  }, []);

  useEffect(() => {
    if (!fabricanteId) return;
    setModeloId("");
    setSubmodelos([]);
    api.listarModelos(fabricanteId).then(setModelos);
  }, [fabricanteId]);

  useEffect(() => {
    if (!modeloId) return;
    const modelo = modelos.find((m) => String(m.id) === String(modeloId));
    setTemSubmodelo(Boolean(modelo?.tem_submodelo_relevante));
    if (modelo?.tem_submodelo_relevante) {
      api.listarSubmodelos(modeloId).then(setSubmodelos);
    } else {
      setSubmodelos([]);
      setSubmodeloId("");
    }
  }, [modeloId, modelos]);

  async function confirmarFabricanteLivre() {
    if (!textoFabricante.trim()) return;
    setResolvendo(true);
    setErro("");
    try {
      const resultado = await api.criarOuObterFabricante(textoFabricante.trim());
      setFabricanteId(String(resultado.id));
      setFabricanteNome(resultado.nome);
      setModoTextoFabricante(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setResolvendo(false);
    }
  }

  async function confirmarModeloLivre() {
    if (!textoModelo.trim()) return;
    setResolvendo(true);
    setErro("");
    try {
      const resultado = await api.criarOuObterModelo(fabricanteId, textoModelo.trim());
      setModeloId(String(resultado.id));
      setModoTextoModelo(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setResolvendo(false);
    }
  }

  function trocarFabricante() {
    setFabricanteId("");
    setFabricanteNome("");
    setTextoFabricante("");
    setModeloId("");
    setModelos([]);
  }

  function buscar(e) {
    e.preventDefault();
    setErro("");
    if (!modeloId || !ano || !cep) {
      setErro("Preencha modelo, ano e CEP para buscar.");
      return;
    }
    const params = new URLSearchParams({ modeloId, ano, cep });
    navigate(`/resultados?${params.toString()}`);
  }

  return (
    <div className="fz-wrap fz-secao" style={{ borderTop: 0 }}>
      <p className="fz-rotulo fz-rotulo--aco">Marketplace de peças usadas</p>
      <h1 style={{ fontSize: 56, lineHeight: 0.98, margin: "16px 0 24px", maxWidth: "16ch" }}>
        A peça existe. A gente mostra onde.
      </h1>

      <form onSubmit={buscar} className="blueprint" style={{ padding: 24, maxWidth: 480 }}>
        <Corners />

        {/* Fabricante */}
        {!fabricanteId && !modoTextoFabricante && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Fabricante</label>
            <select
              className="input"
              value=""
              onChange={(e) => {
                const f = fabricantes.find((x) => String(x.id) === e.target.value);
                setFabricanteId(e.target.value);
                setFabricanteNome(f?.nome || "");
              }}
              required
            >
              <option value="">Selecione</option>
              {fabricantes.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
        )}
        {!fabricanteId && !modoTextoFabricante && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginBottom: 16, padding: 0, fontSize: 13 }}
            onClick={() => setModoTextoFabricante(true)}
          >
            Não encontrou sua marca? Digite aqui
          </button>
        )}
        {!fabricanteId && modoTextoFabricante && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Nome da marca</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={textoFabricante}
                onChange={(e) => setTextoFabricante(e.target.value)}
                placeholder="Ex: Gurgel"
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "auto", whiteSpace: "nowrap" }}
                disabled={resolvendo}
                onClick={confirmarFabricanteLivre}
              >
                Usar
              </button>
            </div>
          </div>
        )}
        {fabricanteId && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Fabricante</label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo">{fabricanteNome}</span>
              <button type="button" className="btn btn-ghost" style={{ width: "auto", fontSize: 12 }} onClick={trocarFabricante}>
                Trocar
              </button>
            </div>
          </div>
        )}

        {/* Modelo — só aparece depois que o fabricante está resolvido */}
        {fabricanteId && !modeloId && !modoTextoModelo && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Modelo</label>
            <select className="input" value={modeloId} onChange={(e) => setModeloId(e.target.value)} required>
              <option value="">Selecione</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
        )}
        {fabricanteId && !modeloId && !modoTextoModelo && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginBottom: 16, padding: 0, fontSize: 13 }}
            onClick={() => setModoTextoModelo(true)}
          >
            Não encontrou seu modelo? Digite aqui
          </button>
        )}
        {fabricanteId && !modeloId && modoTextoModelo && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Nome do modelo</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={textoModelo}
                onChange={(e) => setTextoModelo(e.target.value)}
                placeholder="Ex: BR-800"
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "auto", whiteSpace: "nowrap" }}
                disabled={resolvendo}
                onClick={confirmarModeloLivre}
              >
                Usar
              </button>
            </div>
          </div>
        )}

        {temSubmodelo && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Versão (opcional)</label>
            <select className="input" value={submodeloId} onChange={(e) => setSubmodeloId(e.target.value)}>
              <option value="">Selecione</option>
              {submodelos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Ano de fabricação</label>
          <input className="input" type="number" value={ano} onChange={(e) => setAno(e.target.value)} required />
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Seu CEP</label>
          <input className="input" value={cep} onChange={(e) => setCep(e.target.value)} required />
        </div>

        {erro && <p style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        <button className="btn btn-primary btn-block" type="submit">Buscar</button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Corners from "../components/Corners";

export default function Busca() {
  const [fabricantes, setFabricantes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [submodelos, setSubmodelos] = useState([]);

  const [fabricanteId, setFabricanteId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [submodeloId, setSubmodeloId] = useState("");
  const [temSubmodelo, setTemSubmodelo] = useState(false);
  const [ano, setAno] = useState("");
  const [cep, setCep] = useState("");
  const [erro, setErro] = useState("");

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
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Fabricante</label>
          <select className="input" value={fabricanteId} onChange={(e) => setFabricanteId(e.target.value)} required>
            <option value="">Selecione</option>
            {fabricantes.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Modelo</label>
          <select
            className="input"
            value={modeloId}
            onChange={(e) => setModeloId(e.target.value)}
            disabled={!fabricanteId}
            required
          >
            <option value="">Selecione</option>
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>

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

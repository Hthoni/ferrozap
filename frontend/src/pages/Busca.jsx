import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

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
    <div className="container">
      <h2>Qual peça você precisa?</h2>
      <form onSubmit={buscar} className="card">
        <select value={fabricanteId} onChange={(e) => setFabricanteId(e.target.value)} required>
          <option value="">Fabricante</option>
          {fabricantes.map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>

        <select value={modeloId} onChange={(e) => setModeloId(e.target.value)} disabled={!fabricanteId} required>
          <option value="">Modelo</option>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>

        {temSubmodelo && (
          <select value={submodeloId} onChange={(e) => setSubmodeloId(e.target.value)}>
            <option value="">Versão (opcional)</option>
            {submodelos.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        )}

        <input
          type="number"
          placeholder="Ano de fabricação"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          required
        />
        <input
          placeholder="Seu CEP"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          required
        />

        {erro && <p className="erro">{erro}</p>}
        <button type="submit">Buscar</button>
      </form>
    </div>
  );
}

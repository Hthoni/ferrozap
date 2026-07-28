import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function EstoqueEmpresa() {
  const { empresa } = useAuth();
  const [fabricantes, setFabricantes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [fabricanteId, setFabricanteId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [ano, setAno] = useState("");
  const [veiculos, setVeiculos] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  function carregarEstoque() {
    api.listarMeusVeiculos(empresa.token).then(setVeiculos).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    if (!empresa) return;
    api.listarFabricantes().then(setFabricantes);
    carregarEstoque();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa]);

  useEffect(() => {
    if (!fabricanteId) return;
    api.listarModelos(fabricanteId).then(setModelos);
  }, [fabricanteId]);

  async function cadastrar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setEnviando(true);
    try {
      await api.cadastrarVeiculo({ modelo_id: Number(modeloId), ano_fabricacao: Number(ano) }, empresa.token);
      setSucesso("Veículo adicionado ao estoque.");
      setAno("");
      carregarEstoque();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!empresa) {
    return (
      <div className="fz-wrap fz-secao">
        <p>Entre com a conta da empresa para gerenciar o estoque.</p>
        <Link className="btn btn-primary" to="/empresa/entrar">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="fz-wrap fz-secao">
      <h2 style={{ fontSize: 32, margin: "0 0 24px" }}>Meu estoque</h2>

      <form onSubmit={cadastrar} className="blueprint" style={{ padding: 24, maxWidth: 440, marginBottom: 32 }}>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Adicionar veículo em desmonte</p>

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
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Ano de fabricação</label>
          <input className="input" type="number" value={ano} onChange={(e) => setAno(e.target.value)} required />
        </div>

        {erro && <p style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        {sucesso && <p style={{ fontSize: 13 }}>{sucesso}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
          {enviando ? "Adicionando..." : "Adicionar ao estoque"}
        </button>
      </form>

      <h3 style={{ fontSize: 25, marginBottom: 16 }}>Veículos cadastrados</h3>
      {veiculos.length === 0 && <p>Nenhum veículo no estoque ainda.</p>}
      {veiculos.map((v) => (
        <div key={v.id} className="card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="fz-codigo">Modelo #{v.modelo_id} · {v.ano_fabricacao}</span>
          <span className={`tag ${v.geracao_id ? "tag-accent" : "tag-neutral"}`}>
            {v.geracao_id ? "Geração mapeada" : "Sem geração ainda"}
          </span>
        </div>
      ))}
    </div>
  );
}

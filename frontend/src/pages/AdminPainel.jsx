import { useEffect, useState } from "react";
import { api } from "../api";
import Corners from "../components/Corners";

export default function AdminPainel() {
  const [pendentes, setPendentes] = useState([]);
  const [coordenadas, setCoordenadas] = useState({});
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    api.listarPendentes().then(setPendentes).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarCoordenada(empresaId, campo, valor) {
    setCoordenadas((atual) => ({ ...atual, [empresaId]: { ...atual[empresaId], [campo]: valor } }));
  }

  async function decidir(empresaId, status) {
    setErro("");
    setMensagem("");
    const coord = coordenadas[empresaId] || {};
    try {
      await api.aprovarEmpresa(empresaId, {
        status_verificacao: status,
        latitude: coord.latitude ? Number(coord.latitude) : undefined,
        longitude: coord.longitude ? Number(coord.longitude) : undefined,
      });
      setMensagem(`Empresa #${empresaId} atualizada para "${status}".`);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="fz-wrap fz-secao">
      <p className="fz-rotulo" style={{ color: "var(--fz-vendido)" }}>
        Sem autenticação de admin ainda — uso interno apenas
      </p>
      <h2 style={{ fontSize: 32, margin: "8px 0 24px" }}>Painel de admin</h2>

      {erro && <p style={{ color: "var(--fz-vendido)" }}>{erro}</p>}
      {mensagem && <p>{mensagem}</p>}

      <h3 style={{ fontSize: 20, marginBottom: 16 }}>Empresas pendentes ({pendentes.length})</h3>
      {pendentes.length === 0 && <p>Nenhuma empresa aguardando aprovação.</p>}

      {pendentes.map((e) => (
        <div key={e.id} className="blueprint" style={{ padding: 24, maxWidth: 480, marginBottom: 24 }}>
          <Corners />
          <p className="card-title">{e.nome}</p>
          <p className="fz-codigo" style={{ margin: "8px 0" }}>
            CNPJ {e.cnpj} · Detran {e.credenciamento_detran} · UF {e.uf}
          </p>
          <p className="card-meta" style={{ marginBottom: 16 }}>
            {e.endereco || "Endereço não informado"} · CEP {e.cep}
          </p>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Latitude</label>
            <input
              className="input"
              placeholder="-23.55"
              value={coordenadas[e.id]?.latitude || ""}
              onChange={(ev) => atualizarCoordenada(e.id, "latitude", ev.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Longitude</label>
            <input
              className="input"
              placeholder="-46.63"
              value={coordenadas[e.id]?.longitude || ""}
              onChange={(ev) => atualizarCoordenada(e.id, "longitude", ev.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => decidir(e.id, "verificado")}>
              Aprovar
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => decidir(e.id, "rejeitado")}>
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

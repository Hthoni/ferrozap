import { useEffect, useState } from "react";
import { api } from "../api";
import Corners from "../components/Corners";

export default function AdminPainel() {
  const [aba, setAba] = useState("pendentes");
  const [pendentes, setPendentes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [coordenadas, setCoordenadas] = useState({});
  const [editandoEmpresaId, setEditandoEmpresaId] = useState(null);
  const [formEmpresa, setFormEmpresa] = useState({});
  const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
  const [formUsuario, setFormUsuario] = useState({});
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregarPendentes() {
    api.listarPendentes().then(setPendentes).catch((err) => setErro(err.message));
  }
  function carregarEmpresas() {
    api.listarTodasEmpresas().then(setEmpresas).catch((err) => setErro(err.message));
  }
  function carregarUsuarios() {
    api.listarTodosUsuarios().then(setUsuarios).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    carregarPendentes();
    carregarEmpresas();
    carregarUsuarios();
  }, []);

  function atualizarCoordenada(empresaId, campo, valor) {
    setCoordenadas((atual) => ({ ...atual, [empresaId]: { ...atual[empresaId], [campo]: valor } }));
  }

  async function decidir(empresaId, status) {
    setErro(""); setMensagem("");
    const coord = coordenadas[empresaId] || {};
    const paraNumero = (v) => (v ? Number(String(v).replace(",", ".")) : undefined);
    try {
      await api.aprovarEmpresa(empresaId, {
        status_verificacao: status,
        latitude: paraNumero(coord.latitude),
        longitude: paraNumero(coord.longitude),
      });
      setMensagem(`Empresa #${empresaId} atualizada para "${status}".`);
      carregarPendentes();
      carregarEmpresas();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function alternarAtivoEmpresa(id, ativo) {
    try {
      await api.atualizarAtivoEmpresa(id, !ativo);
      carregarEmpresas();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function alternarAtivoUsuario(id, ativo) {
    try {
      await api.atualizarAtivoUsuario(id, !ativo);
      carregarUsuarios();
    } catch (err) {
      setErro(err.message);
    }
  }

  function iniciarEdicaoEmpresa(e) {
    setEditandoEmpresaId(e.id);
    setFormEmpresa({
      nome: e.nome || "",
      email: e.email || "",
      telefone: e.telefone || "",
      telefoneEhWhatsapp: Boolean(e.whatsapp),
      endereco: e.endereco || "",
      cep: e.cep || "",
      latitude: e.latitude ?? "",
      longitude: e.longitude ?? "",
    });
  }

  async function salvarEdicaoEmpresa(id) {
    setErro(""); setMensagem("");
    const paraNumero = (v) => (v === "" || v === null || v === undefined ? undefined : Number(String(v).replace(",", ".")));
    try {
      await api.editarEmpresaAdmin(id, {
        nome: formEmpresa.nome,
        email: formEmpresa.email,
        telefone: formEmpresa.telefone,
        telefone_e_whatsapp: formEmpresa.telefoneEhWhatsapp,
        endereco: formEmpresa.endereco,
        cep: formEmpresa.cep,
        latitude: paraNumero(formEmpresa.latitude),
        longitude: paraNumero(formEmpresa.longitude),
      });
      setMensagem("Empresa atualizada.");
      setEditandoEmpresaId(null);
      carregarEmpresas();
    } catch (err) {
      setErro(err.message);
    }
  }

  function iniciarEdicaoUsuario(u) {
    setEditandoUsuarioId(u.id);
    setFormUsuario({
      nome: u.nome || "",
      email: u.email || "",
      telefone: u.telefone || "",
    });
  }

  async function salvarEdicaoUsuario(id) {
    setErro(""); setMensagem("");
    try {
      await api.editarUsuarioAdmin(id, formUsuario);
      setMensagem("Cliente atualizado.");
      setEditandoUsuarioId(null);
      carregarUsuarios();
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

      <div className="seg" style={{ marginBottom: 24 }}>
        <label className="seg-opt">
          <input type="radio" checked={aba === "pendentes"} onChange={() => setAba("pendentes")} />
          Pendentes ({pendentes.length})
        </label>
        <label className="seg-opt">
          <input type="radio" checked={aba === "empresas"} onChange={() => setAba("empresas")} />
          Empresas ({empresas.length})
        </label>
        <label className="seg-opt">
          <input type="radio" checked={aba === "clientes"} onChange={() => setAba("clientes")} />
          Clientes ({usuarios.length})
        </label>
      </div>

      {erro && <p style={{ color: "var(--fz-vendido)" }}>{erro}</p>}
      {mensagem && <p>{mensagem}</p>}

      {aba === "pendentes" && (
        <>
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
                  placeholder="-23,550"
                  value={coordenadas[e.id]?.latitude || ""}
                  onChange={(ev) => atualizarCoordenada(e.id, "latitude", ev.target.value)}
                />
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Longitude</label>
                <input
                  className="input"
                  placeholder="-46,633"
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
        </>
      )}

      {aba === "empresas" && (
        <div>
          {empresas.map((e) => (
            <div key={e.id} className="card" style={{ marginBottom: 12 }}>
              {editandoEmpresaId === e.id ? (
                <div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Nome</label>
                    <input className="input" value={formEmpresa.nome} onChange={(ev) => setFormEmpresa({ ...formEmpresa, nome: ev.target.value })} />
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>E-mail</label>
                    <input className="input" value={formEmpresa.email} onChange={(ev) => setFormEmpresa({ ...formEmpresa, email: ev.target.value })} />
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Telefone</label>
                    <input className="input" value={formEmpresa.telefone} onChange={(ev) => setFormEmpresa({ ...formEmpresa, telefone: ev.target.value })} />
                    <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={formEmpresa.telefoneEhWhatsapp}
                        onChange={(ev) => setFormEmpresa({ ...formEmpresa, telefoneEhWhatsapp: ev.target.checked })}
                      />
                      <span>É WhatsApp</span>
                    </label>
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Endereço</label>
                    <input className="input" value={formEmpresa.endereco} onChange={(ev) => setFormEmpresa({ ...formEmpresa, endereco: ev.target.value })} />
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>CEP</label>
                    <input className="input" value={formEmpresa.cep} onChange={(ev) => setFormEmpresa({ ...formEmpresa, cep: ev.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div className="field" style={{ marginBottom: 10, flex: 1 }}>
                      <label>Latitude</label>
                      <input className="input" value={formEmpresa.latitude} onChange={(ev) => setFormEmpresa({ ...formEmpresa, latitude: ev.target.value })} />
                    </div>
                    <div className="field" style={{ marginBottom: 10, flex: 1 }}>
                      <label>Longitude</label>
                      <input className="input" value={formEmpresa.longitude} onChange={(ev) => setFormEmpresa({ ...formEmpresa, longitude: ev.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => salvarEdicaoEmpresa(e.id)}>Salvar</button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditandoEmpresaId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0 }}>{e.nome}</p>
                    <p className="card-meta">{e.email} · UF {e.uf} · plano {e.plano}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`tag ${e.status_verificacao === "verificado" ? "tag-accent" : "tag-neutral"}`}>
                      {e.status_verificacao}
                    </span>
                    <button className="btn btn-ghost" style={{ width: "auto", fontSize: 12 }} onClick={() => iniciarEdicaoEmpresa(e)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ width: "auto", fontSize: 12, color: e.ativo ? "var(--fz-vendido)" : undefined }}
                      onClick={() => alternarAtivoEmpresa(e.id, e.ativo)}
                    >
                      {e.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {aba === "clientes" && (
        <div>
          {usuarios.map((u) => (
            <div key={u.id} className="card" style={{ marginBottom: 12 }}>
              {editandoUsuarioId === u.id ? (
                <div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Nome</label>
                    <input className="input" value={formUsuario.nome} onChange={(ev) => setFormUsuario({ ...formUsuario, nome: ev.target.value })} />
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>E-mail</label>
                    <input className="input" value={formUsuario.email} onChange={(ev) => setFormUsuario({ ...formUsuario, email: ev.target.value })} />
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Telefone</label>
                    <input className="input" value={formUsuario.telefone} onChange={(ev) => setFormUsuario({ ...formUsuario, telefone: ev.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => salvarEdicaoUsuario(u.id)}>Salvar</button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditandoUsuarioId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0 }}>{u.nome}</p>
                    <p className="card-meta">{u.email} · {u.telefone}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" style={{ width: "auto", fontSize: 12 }} onClick={() => iniciarEdicaoUsuario(u)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ width: "auto", fontSize: 12, color: u.ativo ? "var(--fz-vendido)" : undefined }}
                      onClick={() => alternarAtivoUsuario(u.id, u.ativo)}
                    >
                      {u.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

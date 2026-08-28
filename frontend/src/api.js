const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function chamar(caminho, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (falhaDeRede) {
    // CS-031: fetch rejeita direto (sem nem chegar a ter resposta)
    // quando não há internet ou o servidor está fora do ar -- sem
    // isso, o erro cru ("Failed to fetch") ia parar na tela do
    // usuário sem explicação nenhuma.
    const erro = new Error("Não foi possível conectar. Confira sua internet e tente de novo.");
    erro.status = 0;
    throw erro;
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.detail || "Algo deu errado. Tente novamente.";
    const erro = new Error(typeof mensagem === "string" ? mensagem : "Dados inválidos.");
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

export const api = {
  // Catálogo
  listarFabricantes: () => chamar("/catalogo/fabricantes"),
  listarModelos: (fabricanteId) => chamar(`/catalogo/fabricantes/${fabricanteId}/modelos`),
  listarSubmodelos: (modeloId) => chamar(`/catalogo/modelos/${modeloId}/submodelos`),
  listarAnos: (modeloId) => chamar(`/catalogo/modelos/${modeloId}/anos`),
  criarOuObterFabricante: (nome) =>
    chamar("/catalogo/fabricantes", { method: "POST", body: { nome } }),
  criarOuObterModelo: (fabricanteId, nome) =>
    chamar("/catalogo/modelos", { method: "POST", body: { fabricante_id: fabricanteId, nome } }),
  sugerirFabricante: (nome) =>
    chamar("/catalogo/sugestoes/fabricante", { method: "POST", body: { nome } }),
  sugerirModelo: (fabricanteNome, nome) =>
    chamar("/catalogo/sugestoes/modelo", { method: "POST", body: { fabricante_nome: fabricanteNome, nome } }),

  // Busca
  buscar: ({ modeloId, ano, cep, lat, lon, ordenarPor }) => {
    const parametros = { modelo_id: modeloId, ano, ordenar_por: ordenarPor || "compatibilidade" };
    if (lat && lon) {
      parametros.lat = lat;
      parametros.lon = lon;
    } else {
      parametros.cep = cep;
    }
    const query = new URLSearchParams(parametros).toString();
    return chamar(`/busca/?${query}`);
  },

  // Autenticação — cliente final
  cadastrarUsuario: (dados) => chamar("/auth/usuarios", { method: "POST", body: dados }),
  loginUsuario: (dados) => chamar("/auth/usuarios/login", { method: "POST", body: dados }),
  meuPerfil: (token) => chamar("/auth/usuarios/me", { token }),
  atualizarMeuPerfil: (dados, token) => chamar("/auth/usuarios/me", { method: "PATCH", body: dados, token }),
  alterarMinhaSenha: (dados, token) => chamar("/auth/usuarios/me/senha", { method: "PATCH", body: dados, token }),
  atualizarMeuCep: (cep, token) =>
    chamar("/auth/usuarios/me/cep", { method: "PATCH", body: { cep }, token }),

  // Autenticação — empresa
  cadastrarEmpresa: (dados) => chamar("/empresas/", { method: "POST", body: dados }),
  loginEmpresa: (dados) => chamar("/auth/empresas/login", { method: "POST", body: dados }),

  // Empresa autenticada
  minhaEmpresa: (token) => chamar("/empresas/me", { token }),
  atualizarMinhaEmpresa: (dados, token) => chamar("/empresas/me", { method: "PATCH", body: dados, token }),
  alterarSenhaEmpresa: (dados, token) => chamar("/empresas/me/senha", { method: "PATCH", body: dados, token }),
  cadastrarVeiculo: (dados, token) =>
    chamar("/empresas/veiculos", { method: "POST", body: dados, token }),
  listarMeusVeiculos: (token) => chamar("/empresas/veiculos", { token }),
  editarVeiculo: (id, dados, token) =>
    chamar(`/empresas/veiculos/${id}`, { method: "PATCH", body: dados, token }),
  apagarVeiculo: (id, token) =>
    chamar(`/empresas/veiculos/${id}`, { method: "DELETE", token }),

  // Mensageria
  iniciarConversa: (dados, token) => chamar("/conversas/", { method: "POST", body: dados, token }),
  registrarLeadWhatsapp: (dados, token) => chamar("/leads-whatsapp/", { method: "POST", body: dados, token }),
  listarMinhasConversas: (token) => chamar("/conversas/minhas", { token }),
  listarConversasRecebidas: (token) => chamar("/conversas/recebidas", { token }),
  listarMensagens: (conversaId, token) => chamar(`/conversas/${conversaId}/mensagens`, { token }),
  enviarMensagem: (conversaId, texto, token) =>
    chamar(`/conversas/${conversaId}/mensagens`, { method: "POST", body: { texto }, token }),
  contarNaoLidas: (token) => chamar("/conversas/contagem-nao-lidas", { token }),

  // Admin
  listarPendentes: () => chamar("/admin/empresas/pendentes"),
  aprovarEmpresa: (empresaId, dados) =>
    chamar(`/admin/empresas/${empresaId}/verificacao`, { method: "PATCH", body: dados }),
  listarTodasEmpresas: () => chamar("/admin/empresas"),
  listarTodosUsuarios: () => chamar("/admin/usuarios"),
  atualizarAtivoEmpresa: (id, ativo) =>
    chamar(`/admin/empresas/${id}/ativo`, { method: "PATCH", body: { ativo } }),
  editarEmpresaAdmin: (id, dados) => chamar(`/admin/empresas/${id}`, { method: "PATCH", body: dados }),
  atualizarAtivoUsuario: (id, ativo) =>
    chamar(`/admin/usuarios/${id}/ativo`, { method: "PATCH", body: { ativo } }),
  editarUsuarioAdmin: (id, dados) => chamar(`/admin/usuarios/${id}`, { method: "PATCH", body: dados }),
};

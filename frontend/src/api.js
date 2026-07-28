const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function chamar(caminho, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.detail || "Algo deu errado. Tente novamente.";
    throw new Error(typeof mensagem === "string" ? mensagem : "Dados inválidos.");
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

  // Busca
  buscar: ({ modeloId, ano, cep, ordenarPor }) => {
    const query = new URLSearchParams({
      modelo_id: modeloId,
      ano,
      cep,
      ordenar_por: ordenarPor || "compatibilidade",
    }).toString();
    return chamar(`/busca/?${query}`);
  },

  // Autenticação — cliente final
  cadastrarUsuario: (dados) => chamar("/auth/usuarios", { method: "POST", body: dados }),
  loginUsuario: (dados) => chamar("/auth/usuarios/login", { method: "POST", body: dados }),

  // Autenticação — empresa
  cadastrarEmpresa: (dados) => chamar("/empresas/", { method: "POST", body: dados }),
  loginEmpresa: (dados) => chamar("/auth/empresas/login", { method: "POST", body: dados }),

  // Empresa autenticada
  cadastrarVeiculo: (dados, token) =>
    chamar("/empresas/veiculos", { method: "POST", body: dados, token }),
  listarMeusVeiculos: (token) => chamar("/empresas/veiculos", { token }),

  // Mensageria
  iniciarConversa: (dados, token) => chamar("/conversas/", { method: "POST", body: dados, token }),
  listarMinhasConversas: (token) => chamar("/conversas/minhas", { token }),
  listarConversasRecebidas: (token) => chamar("/conversas/recebidas", { token }),
  listarMensagens: (conversaId, token) => chamar(`/conversas/${conversaId}/mensagens`, { token }),
  enviarMensagem: (conversaId, texto, token) =>
    chamar(`/conversas/${conversaId}/mensagens`, { method: "POST", body: { texto }, token }),

  // Admin
  listarPendentes: () => chamar("/admin/empresas/pendentes"),
  aprovarEmpresa: (empresaId, dados) =>
    chamar(`/admin/empresas/${empresaId}/verificacao`, { method: "PATCH", body: dados }),
};

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function lerSessao(chave) {
  const bruto = localStorage.getItem(chave);
  return bruto ? JSON.parse(bruto) : null;
}

export function AuthProvider({ children }) {
  const [cliente, setClienteState] = useState(() => lerSessao("ferrozap_cliente"));
  const [empresa, setEmpresaState] = useState(() => lerSessao("ferrozap_empresa"));

  const setCliente = (dados) => {
    if (dados) localStorage.setItem("ferrozap_cliente", JSON.stringify(dados));
    else localStorage.removeItem("ferrozap_cliente");
    setClienteState(dados);
  };

  const setEmpresa = (dados) => {
    if (dados) localStorage.setItem("ferrozap_empresa", JSON.stringify(dados));
    else localStorage.removeItem("ferrozap_empresa");
    setEmpresaState(dados);
  };

  return (
    <AuthContext.Provider value={{ cliente, setCliente, empresa, setEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de um AuthProvider");
  return ctx;
}

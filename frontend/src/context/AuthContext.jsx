import { createContext, useContext, useEffect, useState } from "react";
import { registrarExpiracaoSessao } from "../api";

const AuthContext = createContext(null);

function lerSessao(chave) {
  const bruto = localStorage.getItem(chave);
  return bruto ? JSON.parse(bruto) : null;
}

export function AuthProvider({ children }) {
  const [cliente, setClienteState] = useState(() => lerSessao("catasucata_cliente"));
  const [empresa, setEmpresaState] = useState(() => lerSessao("catasucata_empresa"));

  const setCliente = (dados) => {
    if (dados) localStorage.setItem("catasucata_cliente", JSON.stringify(dados));
    else localStorage.removeItem("catasucata_cliente");
    setClienteState(dados);
  };

  const setEmpresa = (dados) => {
    if (dados) localStorage.setItem("catasucata_empresa", JSON.stringify(dados));
    else localStorage.removeItem("catasucata_empresa");
    setEmpresaState(dados);
  };

  // CS-001/CS-004: qualquer 401 vindo do backend (token expirado de
  // verdade, não só localStorage apagado por fora) encerra as duas
  // sessões de vez, reativamente -- o guard de rota passa a barrar
  // corretamente na navegação seguinte, sem precisar de reload.
  useEffect(() => {
    registrarExpiracaoSessao(() => {
      setClienteState(null);
      setEmpresaState(null);
      localStorage.removeItem("catasucata_cliente");
      localStorage.removeItem("catasucata_empresa");
    });
  }, []);

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

import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import RotaProtegida from "./components/RotaProtegida";

import Busca from "./pages/Busca";
import Resultados from "./pages/Resultados";
import Entrar from "./pages/Entrar";
import MinhasConversas from "./pages/MinhasConversas";
import ConversaDetalhe from "./pages/ConversaDetalhe";
import EstoqueEmpresa from "./pages/EstoqueEmpresa";
import ConversasRecebidas from "./pages/ConversasRecebidas";
import MinhaContaCliente from "./pages/MinhaContaCliente";
import MinhaContaEmpresa from "./pages/MinhaContaEmpresa";
import AdminPainel from "./pages/AdminPainel";
import AdminLogin from "./pages/AdminLogin";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import NaoEncontrado from "./pages/NaoEncontrado";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<Busca />} />
            <Route path="/buscar" element={<Busca />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/entrar" element={<Entrar tipoInicial="cliente" />} />
            <Route path="/empresa/entrar" element={<Entrar tipoInicial="empresa" />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha tipoInicial="usuario_final" />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/admin/entrar" element={<AdminLogin />} />

            <Route path="/conversas" element={
              <RotaProtegida tipo="cliente"><MinhasConversas /></RotaProtegida>
            } />
            <Route path="/conversas/:id" element={
              <RotaProtegida tipo="qualquer"><ConversaDetalhe /></RotaProtegida>
            } />
            <Route path="/estoque" element={
              <RotaProtegida tipo="empresa"><EstoqueEmpresa /></RotaProtegida>
            } />
            <Route path="/conversas-recebidas" element={
              <RotaProtegida tipo="empresa"><ConversasRecebidas /></RotaProtegida>
            } />
            <Route path="/minha-conta" element={
              <RotaProtegida tipo="cliente"><MinhaContaCliente /></RotaProtegida>
            } />
            <Route path="/empresa/minha-conta" element={
              <RotaProtegida tipo="empresa"><MinhaContaEmpresa /></RotaProtegida>
            } />

            <Route path="/admin" element={
              <RotaProtegida tipo="admin"><AdminPainel /></RotaProtegida>
            } />
            <Route path="*" element={<NaoEncontrado />} />
          </Routes>
        </main>
        <Footer />
      </HashRouter>
    </AuthProvider>
  );
}

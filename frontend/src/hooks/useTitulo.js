import { useEffect } from "react";

/**
 * CS-029: título da aba muda por rota (antes era sempre a mesma frase
 * de marketing longa, em toda página). Só afeta a aba do navegador --
 * não ajuda preview de link no WhatsApp/redes sociais, que só lê o
 * HTML estático (ver index.html, tags og:*).
 */
export default function useTitulo(titulo) {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo ? `${titulo} · Catasucata` : "Catasucata";
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}

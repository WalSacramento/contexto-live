"use client";

import { useState, useEffect } from "react";

interface KeyboardState {
  isKeyboardVisible: boolean;
  viewportHeight: number;
}

/**
 * Hook para detectar quando o teclado virtual mobile está aberto
 *
 * Usa Visual Viewport API quando disponível (iOS 13+, Chrome 61+)
 * Fallback: detecta via resize + mudança significativa na altura do viewport
 *
 * @returns {KeyboardState} Estado do teclado e altura do viewport
 */
export function useKeyboardVisible(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isKeyboardVisible: false,
    viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    // SSR safety check
    if (typeof window === "undefined") return;

    // Guarda a altura inicial para comparação
    const initialHeight = window.innerHeight;
    let timeoutId: NodeJS.Timeout;

    /**
     * Detecta se o teclado está aberto baseado na altura do viewport
     * Considera aberto se a altura for < 70% da altura inicial
     */
    const detectKeyboard = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      const heightRatio = currentHeight / initialHeight;

      // Teclado considerado aberto se viewport < 70% da altura original
      // Isso funciona porque o teclado geralmente ocupa 30-50% da tela
      const isOpen = heightRatio < 0.7;

      setKeyboardState({
        isKeyboardVisible: isOpen,
        viewportHeight: currentHeight,
      });
    };

    /**
     * Debounced handler para evitar múltiplas atualizações
     * Espera 100ms antes de processar a mudança
     */
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(detectKeyboard, 100);
    };

    // Usar Visual Viewport API se disponível (mais preciso)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    } else {
      // Fallback para window resize (menos preciso, mas funciona)
      window.addEventListener("resize", handleResize, { passive: true });
    }

    // Detecção inicial
    detectKeyboard();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return keyboardState;
}

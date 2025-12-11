import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formata números de telefone brasileiros a partir de uma string livre.
// Aceita entradas com DDD e opcionalmente código do país (55), removendo caracteres não numéricos.
// Exemplos:
//  - "22999999999" -> "(22) 99999-9999"
//  - "(22) 9999-9999" -> "(22) 9999-9999"
//  - "+55 (22) 99999-9999" -> "(22) 99999-9999"
export function formatPhoneBR(input?: string | null): string | null {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, "");
  if (!digits) return null;

  // Remove código do país 55 se presente
  let num = digits;
  if (num.startsWith("55") && (num.length === 12 || num.length === 13)) {
    num = num.slice(2);
  }

  // Com DDD
  if (num.length === 11) {
    // Celular: (AA) 9XXXX-XXXX
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
  }
  if (num.length === 10) {
    // Fixo: (AA) XXXX-XXXX
    return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
  }

  // Sem DDD
  if (num.length === 9) {
    return `${num.slice(0, 5)}-${num.slice(5)}`;
  }
  if (num.length === 8) {
    return `${num.slice(0, 4)}-${num.slice(4)}`;
  }

  // Caso não caiba em nenhum formato conhecido, retorna a entrada original
  return input;
}

/**
 * Retorna as iniciais de um nome (primeira e última letra)
 * @param name Nome completo
 * @returns Iniciais em maiúsculo ou "?" se não houver nome
 */
export function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

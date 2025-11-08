import { PublicKey } from '@solana/web3.js';

/**
 * Valida se uma string é um endereço de wallet Solana válido
 * @param address - String para validar
 * @returns true se for uma wallet válida, false caso contrário
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Remove espaços em branco
    const trimmed = address.trim();

    // Wallet Solana tem 32-44 caracteres (base58)
    if (trimmed.length < 32 || trimmed.length > 44) {
      return false;
    }

    // Tenta criar uma PublicKey - se falhar, não é válida
    new PublicKey(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extrai endereços de wallet Solana de um texto
 * @param text - Texto para analisar
 * @returns Array de endereços válidos encontrados
 */
export function extractSolanaAddresses(text: string): string[] {
  // Regex para capturar sequências base58 com tamanho de wallet Solana
  const base58Regex = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
  const matches = text.match(base58Regex) || [];

  // Filtra apenas os que são wallets válidas
  return matches.filter(isValidSolanaAddress);
}

/**
 * Gera URL do Solscan para uma wallet
 * @param address - Endereço da wallet
 * @param cluster - Cluster Solana (mainnet-beta, devnet, testnet)
 * @returns URL do Solscan
 */
export function getSolscanUrl(address: string, cluster: 'mainnet-beta' | 'devnet' | 'testnet' = 'mainnet-beta'): string {
  const base = cluster === 'mainnet-beta'
    ? 'https://solscan.io'
    : `https://solscan.io?cluster=${cluster}`;

  return `${base}/account/${address}`;
}

/**
 * Encurta um endereço de wallet para exibição
 * @param address - Endereço completo
 * @param chars - Quantidade de caracteres no início e fim (padrão: 4)
 * @returns Endereço encurtado (ex: "7Np7...3xQp")
 */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

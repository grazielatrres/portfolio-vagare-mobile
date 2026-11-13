// Prefixo dos ids gerados no aparelho para itens criados offline, antes de o
// servidor devolver o id real. Módulo separado para os caches poderem usar sem
// importar a fila de sincronização (que importa os caches).
export const LOCAL_ID_PREFIX = 'local-';

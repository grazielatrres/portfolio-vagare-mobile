// Ao gravar uma lista do servidor no cache, itens com alteração na fila offline
// não podem ser sobrescritos nem reinseridos, senão a alteração é desfeita.
export const PENDING_IDS_SQL = 'SELECT localId FROM pending_mutations';

export const NO_PENDING_MUTATION_SQL =
  'WHERE NOT EXISTS (SELECT 1 FROM pending_mutations WHERE localId = ?)';

export const EXPENSE_CATEGORIES = [
  'Hospedagem',
  'Transporte',
  'Alimentação',
  'Passeios',
  'Compras',
  'Documentos',
  'Geral',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

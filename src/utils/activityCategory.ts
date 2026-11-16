export const ACTIVITY_CATEGORIES = [
  'Passeio guiado',
  'Praia',
  'Café da manhã',
  'Almoço',
  'Jantar',
  'Compras',
  'Cultura',
  'Vida noturna',
  'Transporte',
  'Hospedagem',
  'Outros',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

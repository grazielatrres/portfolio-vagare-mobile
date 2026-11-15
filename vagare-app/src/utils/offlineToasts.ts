import type { ToastData } from '@/contexts/ToastContext';

// Textos únicos para os avisos de alterações guardadas offline, usados por
// todas as entidades (viagem, atividade, gasto, info) para não divergirem.
export const OFFLINE_SAVED_TOAST: ToastData = {
  title: 'Salvo localmente',
  message: 'Será sincronizado quando a conexão voltar.',
};

export const OFFLINE_DELETED_TOAST: ToastData = {
  title: 'Excluído localmente',
  message: 'Será sincronizado quando a conexão voltar.',
};

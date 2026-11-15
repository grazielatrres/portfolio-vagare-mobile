import type { ToastData } from '@/contexts/ToastContext';

export const OFFLINE_SAVED_TOAST: ToastData = {
  title: 'Salvo localmente',
  message: 'Será sincronizado quando a conexão voltar.',
};

export const OFFLINE_DELETED_TOAST: ToastData = {
  title: 'Excluído localmente',
  message: 'Será sincronizado quando a conexão voltar.',
};

import { useState } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';

type DeleteMutate = (id: string, options: { onError: (error: unknown) => void }) => void;

/**
 * Controla o diálogo de confirmação de exclusão de um item e, se a exclusão
 * falhar, avisa por toast em vez de deixar um erro fixo no card.
 */
export function useConfirmDelete(mutate: DeleteMutate, id: string, errorTitle: string) {
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);

  function confirm() {
    setVisible(false);
    mutate(id, {
      onError: (err) => {
        showToast({
          title: errorTitle,
          message: err instanceof ApiError ? err.message : 'Tente novamente.',
        });
      },
    });
  }

  return {
    visible,
    request: () => setVisible(true),
    cancel: () => setVisible(false),
    confirm,
  };
}

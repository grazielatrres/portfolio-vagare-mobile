import { useCallback, useState } from 'react';

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

/**
 * Erros de validação por campo, exibidos embaixo do respectivo input.
 * O erro de um campo some assim que ele é editado.
 */
export function useFieldErrors<F extends string>() {
  const [errors, setErrors] = useState<FieldErrors<F>>({});

  const clearError = useCallback((field: F) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /** Substitui todos os erros e informa se o formulário está válido. */
  const validate = useCallback((next: FieldErrors<F>) => {
    setErrors(next);
    return Object.keys(next).length === 0;
  }, []);

  return { errors, validate, clearError };
}

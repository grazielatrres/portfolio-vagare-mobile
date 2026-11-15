// Mantenha em sincronia com portfolio-vagare-backend/src/services/auth/passwordPolicy.ts
export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordRequirement {
  id: 'length' | 'lowercase' | 'uppercase' | 'number' | 'special' | 'noSpaces';
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`,
    test: (p) => p.length >= MIN_PASSWORD_LENGTH,
  },
  { id: 'lowercase', label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Um número', test: (p) => /\d/.test(p) },
  {
    id: 'special',
    label: 'Um caractere especial (ex: !@#$%)',
    test: (p) => /[^A-Za-z0-9\s]/.test(p),
  },
  { id: 'noSpaces', label: 'Sem espaços', test: (p) => !/\s/.test(p) },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}

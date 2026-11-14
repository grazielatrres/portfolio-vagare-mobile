import { isStrongPassword, PASSWORD_REQUIREMENTS } from '@/utils/passwordPolicy';

function failedIds(password: string) {
  return PASSWORD_REQUIREMENTS.filter((req) => !req.test(password)).map((req) => req.id);
}

describe('passwordPolicy', () => {
  it('aceita senha que atende a todos os critérios', () => {
    expect(isStrongPassword('Senha@123')).toBe(true);
    expect(failedIds('Senha@123')).toEqual([]);
  });

  it.each([
    ['Ab@1', 'length'],
    ['SENHA@123', 'lowercase'],
    ['senha@123', 'uppercase'],
    ['Senha@abc', 'number'],
    ['Senha1234', 'special'],
    ['Senha @123', 'noSpaces'],
  ])('rejeita "%s" (falha em %s)', (password, id) => {
    expect(isStrongPassword(password)).toBe(false);
    expect(failedIds(password)).toEqual([id]);
  });

  it('rejeita senha vazia', () => {
    expect(isStrongPassword('')).toBe(false);
  });
});

import { isStrongPassword, PASSWORD_REQUIREMENTS, passwordErrors } from '@/utils/passwordPolicy';

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

describe('passwordErrors', () => {
  it('não retorna erros para senha forte confirmada', () => {
    expect(passwordErrors('Senha@123', 'Senha@123')).toEqual({});
  });

  it('aponta os dois campos quando estão vazios', () => {
    expect(passwordErrors('', '')).toEqual({
      password: 'Crie uma senha',
      confirmPassword: 'Confirme a senha',
    });
  });

  it('aponta a senha fraca no campo de senha', () => {
    expect(passwordErrors('fraca', 'fraca')).toEqual({
      password: 'A senha não atende a todos os requisitos de segurança.',
    });
  });

  it('aponta a divergência no campo de confirmação', () => {
    expect(passwordErrors('Senha@123', 'Senha@124')).toEqual({
      confirmPassword: 'As senhas não coincidem.',
    });
  });
});

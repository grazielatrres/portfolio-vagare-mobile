import { renderHook, waitFor } from '@testing-library/react-native';

import { useProfileQuery } from '@/hooks/useProfileQuery';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/users');

import { getMe } from '@/services/users';

const getMeMock = getMe as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useProfileQuery', () => {
  it('busca o perfil do usuário autenticado', async () => {
    const profile = {
      id: 'user-1',
      name: 'Graziela Torres',
      email: 'graziela@example.com',
      provider: 'local' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      stats: { totalTrips: 2 },
    };
    getMeMock.mockResolvedValue(profile);

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMeMock).toHaveBeenCalledWith('test-token');
    expect(result.current.data).toEqual(profile);
  });
});

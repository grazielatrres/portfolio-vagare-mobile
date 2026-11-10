export const authContextMock = {
  useAuth: () => ({
    token: 'test-token',
    user: null,
    isLoading: false,
    isRestoring: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  }),
};

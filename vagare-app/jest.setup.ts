// Mock oficial da biblioteca para ambiente de teste — sem ele, useSafeAreaInsets()
// nunca recebe um valor (não há medição nativa disponível no jest-expo).
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock'),
);

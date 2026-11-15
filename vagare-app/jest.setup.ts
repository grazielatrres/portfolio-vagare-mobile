// Mock oficial da biblioteca para ambiente de teste — sem ele, useSafeAreaInsets()
// nunca recebe um valor (não há medição nativa disponível no jest-expo).
jest.mock('react-native-safe-area-context', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
  require('react-native-safe-area-context/jest/mock').default,
);

// Mock oficial: o KeyboardAwareScrollView depende de um módulo nativo.
jest.mock('react-native-keyboard-controller', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
  require('react-native-keyboard-controller/jest'),
);

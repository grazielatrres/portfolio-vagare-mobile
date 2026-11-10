export const showToastMock = jest.fn();

export const toastContextMock = {
  useToast: () => ({ showToast: showToastMock }),
};

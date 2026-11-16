import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider, useToast } from '@/contexts/ToastContext';

const safeAreaMetrics = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};

function TriggerToast() {
  const { showToast } = useToast();
  return (
    <Pressable onPress={() => showToast({ title: 'Viagem salva', message: 'Seus dados foram atualizados.' })}>
      <Text>Mostrar toast</Text>
    </Pressable>
  );
}

function renderWithProvider() {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('ToastProvider', () => {
  it('anuncia o toast via AccessibilityInfo.announceForAccessibility ao ser exibido', async () => {
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});

    await renderWithProvider();
    await fireEvent.press(screen.getByText('Mostrar toast'));

    expect(announceSpy).toHaveBeenCalledWith('Viagem salva. Seus dados foram atualizados.');
    expect(screen.getByText('Viagem salva')).toBeTruthy();
    expect(screen.getByText('Seus dados foram atualizados.')).toBeTruthy();

    announceSpy.mockRestore();
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { DestinationField, SEARCH_DEBOUNCE_MS } from '@/components/DestinationField';
import { PlaceSuggestion, searchPlaces } from '@/services/geocoding';

jest.mock('@/services/geocoding', () => ({
  searchPlaces: jest.fn(),
}));

const mockedSearchPlaces = searchPlaces as jest.MockedFunction<typeof searchPlaces>;

const LISBOA: PlaceSuggestion = { label: 'Lisboa, Portugal', latitude: 38.72, longitude: -9.14 };
const PLACEHOLDER = 'Ex: Santorini, Grécia';

function Harness({ onSelectPlace = jest.fn() }: { onSelectPlace?: (p: PlaceSuggestion) => void }) {
  const [value, setValue] = useState('');
  return (
    <DestinationField
      value={value}
      onChangeText={setValue}
      onSelectPlace={(place) => {
        setValue(place.label);
        onSelectPlace(place);
      }}
    />
  );
}

async function advanceDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
  });
}

describe('DestinationField', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedSearchPlaces.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sugere destinos enquanto o usuário digita, após a pausa', async () => {
    mockedSearchPlaces.mockResolvedValue([LISBOA]);
    await render(<Harness />);

    await fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'Lisb');
    expect(mockedSearchPlaces).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(mockedSearchPlaces).toHaveBeenCalledTimes(1);
    expect(mockedSearchPlaces).toHaveBeenCalledWith(
      'Lisb',
      expect.objectContaining({ kind: 'city' }),
    );
    expect(await screen.findByText('Lisboa, Portugal')).toBeTruthy();
  });

  it('faz uma única busca quando o usuário digita rápido', async () => {
    mockedSearchPlaces.mockResolvedValue([LISBOA]);
    await render(<Harness />);
    const input = screen.getByPlaceholderText(PLACEHOLDER);

    await fireEvent.changeText(input, 'Lis');
    await fireEvent.changeText(input, 'Lisb');
    await fireEvent.changeText(input, 'Lisbo');
    await advanceDebounce();

    expect(mockedSearchPlaces).toHaveBeenCalledTimes(1);
    expect(mockedSearchPlaces).toHaveBeenCalledWith('Lisbo', expect.anything());
  });

  it('não busca com menos de 3 letras', async () => {
    await render(<Harness />);

    await fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'Li');
    await advanceDebounce();

    expect(mockedSearchPlaces).not.toHaveBeenCalled();
  });

  it('seleciona a sugestão, fecha a lista e não busca de novo', async () => {
    mockedSearchPlaces.mockResolvedValue([LISBOA]);
    const onSelectPlace = jest.fn();
    await render(<Harness onSelectPlace={onSelectPlace} />);

    await fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'Lisb');
    await advanceDebounce();
    await fireEvent.press(await screen.findByLabelText('Selecionar Lisboa, Portugal'));
    await advanceDebounce();

    expect(onSelectPlace).toHaveBeenCalledWith(LISBOA);
    expect(screen.queryByLabelText('Selecionar Lisboa, Portugal')).toBeNull();
    expect(mockedSearchPlaces).toHaveBeenCalledTimes(1);
  });

  it('mostra aviso quando nenhum destino é encontrado', async () => {
    mockedSearchPlaces.mockResolvedValue([]);
    await render(<Harness />);

    await fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'xyzxyz');
    await advanceDebounce();

    expect(await screen.findByText('Nenhum local encontrado.')).toBeTruthy();
  });

  it('repassa o tipo de busca "place" para o serviço', async () => {
    mockedSearchPlaces.mockResolvedValue([]);
    await render(
      <DestinationField
        label="Localização"
        placeholder="Ex: Oia, Santorini"
        searchKind="place"
        value=""
        onChangeText={jest.fn()}
        onSelectPlace={jest.fn()}
      />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Ex: Oia, Santorini'), 'Torre de Belém');
    await advanceDebounce();

    expect(mockedSearchPlaces).toHaveBeenCalledWith(
      'Torre de Belém',
      expect.objectContaining({ kind: 'place' }),
    );
  });
});

import { capitalize, mapWeatherIcon } from '@/utils/weatherIcon';

describe('mapWeatherIcon', () => {
  it('mapeia códigos conhecidos do OpenWeatherMap para ícones', () => {
    expect(mapWeatherIcon('01d')).toBe('sunny-outline');
    expect(mapWeatherIcon('02n')).toBe('partly-sunny-outline');
    expect(mapWeatherIcon('10d')).toBe('rainy-outline');
    expect(mapWeatherIcon('11n')).toBe('thunderstorm-outline');
    expect(mapWeatherIcon('13d')).toBe('snow-outline');
  });

  it('retorna o ícone de nuvem como fallback para códigos desconhecidos', () => {
    expect(mapWeatherIcon('99x')).toBe('cloud-outline');
  });
});

describe('capitalize', () => {
  it('deixa a primeira letra maiúscula', () => {
    expect(capitalize('ensolarado')).toBe('Ensolarado');
  });

  it('retorna o texto original quando já está vazio', () => {
    expect(capitalize('')).toBe('');
  });

  it('não altera o restante do texto', () => {
    expect(capitalize('céu limpo')).toBe('Céu limpo');
  });
});

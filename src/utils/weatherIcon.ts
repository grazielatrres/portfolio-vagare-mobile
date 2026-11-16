import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS_BY_CODE: Record<string, IconName> = {
  '01': 'sunny-outline',
  '02': 'partly-sunny-outline',
  '03': 'cloud-outline',
  '04': 'cloudy-outline',
  '09': 'rainy-outline',
  '10': 'rainy-outline',
  '11': 'thunderstorm-outline',
  '13': 'snow-outline',
  '50': 'cloud-outline',
};

export function mapWeatherIcon(icon: string): IconName {
  return ICONS_BY_CODE[icon.slice(0, 2)] ?? 'cloud-outline';
}

export function capitalize(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

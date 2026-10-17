const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface PlaceSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
  };
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    'accept-language': 'pt-BR',
    addressdetails: '1',
    limit: '6',
  });

  let response: Response;
  try {
    response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': 'VagareTravelApp/1.0' },
    });
  } catch {
    throw new Error('Não foi possível buscar destinos. Verifique sua conexão.');
  }

  if (!response.ok) {
    throw new Error('Não foi possível buscar destinos.');
  }

  const data = (await response.json()) as NominatimResult[];

  return data.map((result) => {
    const address = result.address ?? {};
    const place =
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      result.display_name.split(',')[0].trim();
    const country = address.country;
    const label = country && country !== place ? `${place}, ${country}` : place;

    return {
      label,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
    };
  });
}

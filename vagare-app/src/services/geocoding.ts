const PHOTON_URL = 'https://photon.komoot.io/api/';

export interface PlaceSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  properties: {
    name?: string;
    state?: string;
    country?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q: query, limit: '6', lang: 'en' });

  let response: Response;
  try {
    response = await fetch(`${PHOTON_URL}?${params.toString()}`);
  } catch {
    throw new Error('Não foi possível buscar destinos. Verifique sua conexão.');
  }

  if (!response.ok) {
    throw new Error('Não foi possível buscar destinos.');
  }

  const data = (await response.json()) as PhotonResponse;

  return (data.features ?? [])
    .filter((feature) => !!feature.properties.name)
    .map((feature) => {
      const { name, country } = feature.properties;
      const label = country ? `${name}, ${country}` : (name as string);
      const [longitude, latitude] = feature.geometry.coordinates;
      return { label, latitude, longitude };
    });
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface PlaceSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * - `city`: rótulo "Cidade, País" — usado no destino da viagem (a contagem de
 *   países depende desse formato).
 * - `place`: mantém o nome do lugar, ex. "Torre de Belém, Lisboa, Portugal" —
 *   usado na localização de atividades.
 */
export type PlaceLabelKind = 'city' | 'place';

export interface SearchPlacesOptions {
  signal?: AbortSignal;
  kind?: PlaceLabelKind;
}

interface NominatimResult {
  display_name: string;
  name?: string;
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

// Cache em memória: o autocomplete repete consultas (ex.: apagar e redigitar) e o
// Nominatim limita a 1 requisição/segundo.
const MAX_CACHE_ENTRIES = 50;
const cache = new Map<string, PlaceSuggestion[]>();

function rememberResult(key: string, places: PlaceSuggestion[]) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, places);
}

export function clearPlacesCache() {
  cache.clear();
}

export async function searchPlaces(
  query: string,
  { signal, kind = 'city' }: SearchPlacesOptions = {},
): Promise<PlaceSuggestion[]> {
  const cacheKey = `${kind}:${query.trim().toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const places = await fetchPlaces(query, kind, signal);
  rememberResult(cacheKey, places);
  return places;
}

async function fetchPlaces(
  query: string,
  kind: PlaceLabelKind,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    'accept-language': 'pt-BR',
    addressdetails: '1',
    limit: '6',
  });

  let response: Response;
  try {
    response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': 'VagareTravelApp/1.0' },
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new Error('Sem conexão para buscar sugestões — digite o local e salve mesmo assim.');
  }

  if (!response.ok) {
    throw new Error('Não foi possível buscar sugestões.');
  }

  const data = (await response.json()) as NominatimResult[];

  const places = data.map((result) => ({
    label: kind === 'place' ? buildPlaceLabel(result) : buildCityLabel(result),
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  }));

  return dedupeByLabel(places);
}

function firstSegment(displayName: string): string {
  return displayName.split(',')[0].trim();
}

function cityOf(result: NominatimResult): string | undefined {
  const address = result.address ?? {};
  return address.city ?? address.town ?? address.village ?? address.municipality;
}

function buildCityLabel(result: NominatimResult): string {
  const place = cityOf(result) ?? firstSegment(result.display_name);
  const country = result.address?.country;
  return country && country !== place ? `${place}, ${country}` : place;
}

function buildPlaceLabel(result: NominatimResult): string {
  const name = result.name?.trim() || firstSegment(result.display_name);
  const parts = [name, cityOf(result), result.address?.country].filter(
    (part): part is string => !!part,
  );
  // Remove repetições como "Lisboa, Lisboa, Portugal".
  const unique = parts.filter(
    (part, index) => parts.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === index,
  );
  return unique.join(', ');
}

function dedupeByLabel(places: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = place.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PlaceLabelKind, PlaceSuggestion, searchPlaces } from '@/services/geocoding';
import { colors, fonts, spacing } from '@/theme';
import { Input } from './Input';

export interface DestinationFieldProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: PlaceSuggestion) => void;
  /** `city` (padrão) sugere "Cidade, País"; `place` mantém o nome do lugar. */
  searchKind?: PlaceLabelKind;
  containerStyle?: ViewStyle;
}

export const MIN_QUERY_LENGTH = 3;
// Espera o usuário pausar a digitação antes de consultar (o Nominatim aceita
// no máximo 1 requisição por segundo).
export const SEARCH_DEBOUNCE_MS = 700;

export function DestinationField({
  label = 'Destino',
  placeholder = 'Ex: Santorini, Grécia',
  required,
  error,
  value,
  onChangeText,
  onSelectPlace,
  searchKind = 'city',
  containerStyle,
}: DestinationFieldProps) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancelPending = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const runSearch = useCallback(
    async (rawQuery: string, { manual }: { manual: boolean }) => {
      const query = rawQuery.trim();
      cancelPending();

      if (query.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setLoading(false);
        setHint(manual ? `Digite ao menos ${MIN_QUERY_LENGTH} letras pra buscar.` : null);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setHint(null);

      try {
        const places = await searchPlaces(query, {
          signal: controller.signal,
          kind: searchKind,
        });
        if (controller.signal.aborted) return;
        setResults(places);
        setHint(places.length === 0 ? 'Nenhum local encontrado.' : null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setResults([]);
        setHint(err instanceof Error ? err.message : 'Não foi possível buscar sugestões.');
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setLoading(false);
        }
      }
    },
    [cancelPending, searchKind],
  );

  function handleChangeText(text: string) {
    onChangeText(text);
    cancelPending();
    setLoading(false);
    setHint(null);

    if (text.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void runSearch(text, { manual: false });
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSearchNow() {
    void runSearch(value, { manual: true });
  }

  function handleSelect(place: PlaceSuggestion) {
    cancelPending();
    onSelectPlace(place);
    setResults([]);
    setHint(null);
    setLoading(false);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Input
        label={label}
        required={required}
        error={error}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChangeText}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={handleSearchNow}
        rightElement={
          <Pressable
            onPress={handleSearchNow}
            disabled={loading}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`Buscar ${label.toLowerCase()}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="search" size={20} color={colors.accent} />
            )}
          </Pressable>
        }
      />

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {results.length > 0 ? (
        <View style={styles.dropdown} accessibilityRole="list">
          {results.map((place, index) => (
            <Pressable
              key={`${place.label}-${place.latitude}-${place.longitude}`}
              onPress={() => handleSelect(place)}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${place.label}`}
              style={[styles.option, index === results.length - 1 && styles.optionLast]}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.text.secondary}
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{place.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  dropdown: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text.primary,
  },
});

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { PlaceSuggestion, searchPlaces } from '@/services/geocoding';
import { colors, fonts, spacing } from '@/theme';
import { Input } from './Input';

export interface DestinationFieldProps {
  label?: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: PlaceSuggestion) => void;
  containerStyle?: ViewStyle;
}

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;

export function DestinationField({
  label = 'Destino',
  required,
  value,
  onChangeText,
  onSelectPlace,
  containerStyle,
}: DestinationFieldProps) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const query = value.trim();

    if (query.length < MIN_QUERY_LENGTH) {
      const reset = setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(reset);
    }

    const currentRequest = ++requestId.current;

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await searchPlaces(query);
        if (requestId.current === currentRequest) {
          setResults(places);
        }
      } catch {
        if (requestId.current === currentRequest) {
          setResults([]);
        }
      } finally {
        if (requestId.current === currentRequest) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [value]);

  function handleSelect(place: PlaceSuggestion) {
    onSelectPlace(place);
    setResults([]);
    setIsOpen(false);
  }

  const showDropdown = isOpen && (loading || results.length > 0);

  return (
    <View style={[styles.container, containerStyle]}>
      <Input
        label={label}
        required={required}
        placeholder="Ex: Santorini, Grécia"
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />

      {showDropdown ? (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Buscando destinos...</Text>
            </View>
          ) : (
            results.map((place, index) => (
              <Pressable
                key={`${place.label}-${index}`}
                onPress={() => handleSelect(place)}
                style={[styles.option, index === results.length - 1 && styles.optionLast]}
              >
                <Text style={styles.optionText}>{place.label}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  dropdown: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    overflow: 'hidden',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 15,
    fontFamily: fonts.serif.regular,
    color: colors.text.primary,
  },
});

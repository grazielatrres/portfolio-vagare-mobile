import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [hint, setHint] = useState<string | null>(null);

  async function handleSearch() {
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setHint('Digite ao menos 3 letras pra buscar.');
      return;
    }

    setLoading(true);
    setHint(null);
    try {
      const places = await searchPlaces(query);
      setResults(places);
      if (places.length === 0) {
        setHint('Nenhum destino encontrado.');
      }
    } catch (err) {
      setResults([]);
      setHint(err instanceof Error ? err.message : 'Não foi possível buscar destinos.');
    } finally {
      setLoading(false);
    }
  }

  function handleChangeText(text: string) {
    onChangeText(text);
    setResults([]);
    setHint(null);
  }

  function handleSelect(place: PlaceSuggestion) {
    onSelectPlace(place);
    setResults([]);
    setHint(null);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Input
        label={label}
        required={required}
        placeholder="Ex: Santorini, Grécia"
        value={value}
        onChangeText={handleChangeText}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        rightElement={
          <Pressable onPress={handleSearch} disabled={loading} hitSlop={12}>
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
        <View style={styles.dropdown}>
          {results.map((place, index) => (
            <Pressable
              key={`${place.label}-${index}`}
              onPress={() => handleSelect(place)}
              style={[styles.option, index === results.length - 1 && styles.optionLast]}
            >
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
    fontFamily: fonts.serif.regular,
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

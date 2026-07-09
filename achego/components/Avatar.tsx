import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

type Props = {
  name: string;
  url?: string | null;
  size?: number;
};

// Mostra a foto se houver; senao, a inicial do nome sobre o tom da marca.
export function Avatar({ name, url, size = 52 }: Props) {
  const radius = size / 2;
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.card }}
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: colors.accent, fontWeight: '700' },
});

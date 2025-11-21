import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GradientIcon } from '../common';
import { gradients, gradientDirections, iconSizes } from '../../styles/theme';

/**
 * Ekran demonstracyjny pokazujący możliwości komponentu GradientIcon
 * Ten plik służy jako dokumentacja i przykłady użycia
 */
const GradientIconDemo = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>GradientIcon - Przykłady użycia</Text>

      {/* Sekcja 1: Podstawowe użycie */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Podstawowe użycie (gradient motywu)</Text>
        <View style={styles.row}>
          <GradientIcon name="barbell" size={32} />
          <GradientIcon name="flash" size={32} />
          <GradientIcon name="fitness" size={32} />
          <GradientIcon name="trophy" size={32} />
        </View>
        <Text style={styles.code}>
          {`<GradientIcon name="barbell" size={32} />`}
        </Text>
      </View>

      {/* Sekcja 2: Różne rozmiary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Różne rozmiary</Text>
        <View style={styles.row}>
          <GradientIcon name="barbell" size={iconSizes.xs} />
          <GradientIcon name="barbell" size={iconSizes.sm} />
          <GradientIcon name="barbell" size={iconSizes.md} />
          <GradientIcon name="barbell" size={iconSizes.lg} />
          <GradientIcon name="barbell" size={iconSizes.xl} />
        </View>
        <Text style={styles.code}>
          {`size={iconSizes.xs/sm/md/lg/xl}`}
        </Text>
      </View>

      {/* Sekcja 3: Różne gradienty */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Różne gradienty</Text>
        <View style={styles.row}>
          <View style={styles.iconWrapper}>
            <GradientIcon
              name="checkmark-circle"
              size={40}
              gradientColors={gradients.success}
            />
            <Text style={styles.label}>Success</Text>
          </View>
          <View style={styles.iconWrapper}>
            <GradientIcon
              name="close-circle"
              size={40}
              gradientColors={gradients.danger}
            />
            <Text style={styles.label}>Danger</Text>
          </View>
          <View style={styles.iconWrapper}>
            <GradientIcon
              name="alert-circle"
              size={40}
              gradientColors={gradients.warning}
            />
            <Text style={styles.label}>Warning</Text>
          </View>
          <View style={styles.iconWrapper}>
            <GradientIcon
              name="information-circle"
              size={40}
              gradientColors={gradients.info}
            />
            <Text style={styles.label}>Info</Text>
          </View>
        </View>
        <Text style={styles.code}>
          {`gradientColors={gradients.success}`}
        </Text>
      </View>

      {/* Sekcja 4: Kierunki gradientów */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Kierunki gradientów</Text>
        <View style={styles.row}>
          <View style={styles.iconWrapper}>
            <GradientIcon
              name="arrow-down"
              size={36}
              gradientDirection={gradientDirections.vertical}
            />
            <Text style={styles.label}>Vertical</Text>
          </View>
          <View style={styles.iconWrapper}>
            <GradientIcon
              name="arrow-forward"
              size={36}
              gradientDirection={gradientDirections.horizontal}
            />
            <Text style={styles.label}>Horizontal</Text>
          </View>
          <View style={styles.iconWrapper}>
            <GradientIcon
              name="trending-up"
              size={36}
              gradientDirection={gradientDirections.diagonal}
            />
            <Text style={styles.label}>Diagonal</Text>
          </View>
        </View>
        <Text style={styles.code}>
          {`gradientDirection={gradientDirections.vertical}`}
        </Text>
      </View>

      {/* Sekcja 5: Ikony treningowe */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Przykład: Ikony treningowe</Text>
        <View style={styles.row}>
          <GradientIcon name="barbell" size={48} />
          <GradientIcon name="fitness" size={48} />
          <GradientIcon name="barbell-outline" size={48} />
          <GradientIcon name="body" size={48} />
        </View>
      </View>

      {/* Sekcja 6: Ikony nawigacyjne */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Przykład: Ikony nawigacyjne</Text>
        <View style={styles.row}>
          <GradientIcon
            name="calendar"
            size={36}
            gradientColors={gradients.info}
          />
          <GradientIcon
            name="stats-chart"
            size={36}
            gradientColors={gradients.success}
          />
          <GradientIcon
            name="person"
            size={36}
            gradientColors={gradients.profile}
          />
          <GradientIcon
            name="library"
            size={36}
            gradientColors={gradients.warning}
          />
        </View>
      </View>

      {/* Sekcja 7: Niestandardowe zaokrąglenie */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Niestandardowe zaokrąglenie</Text>
        <View style={styles.row}>
          <GradientIcon name="star" size={36} borderRadius={4} />
          <GradientIcon name="star" size={36} borderRadius={12} />
          <GradientIcon name="star" size={36} borderRadius={20} />
          <GradientIcon name="star" size={36} borderRadius={9999} />
        </View>
        <Text style={styles.code}>
          {`borderRadius={4/12/20/9999}`}
        </Text>
      </View>

      {/* Sekcja 8: Jak używać w kodzie */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Jak używać w swoim kodzie</Text>
        <Text style={styles.codeBlock}>
          {`// 1. Import komponentu
import { GradientIcon } from '../common';
import { gradients } from '../../styles/theme';

// 2. Użycie w komponencie
<GradientIcon
  name="barbell"
  size={48}
/>

// 3. Z niestandardowym gradientem
<GradientIcon
  name="checkmark-circle"
  size={32}
  gradientColors={gradients.success}
/>

// 4. Pełna konfiguracja
<GradientIcon
  name="flash"
  size={64}
  iconColor="#ffffff"
  gradientColors={gradients.primary}
  gradientDirection={gradientDirections.diagonal}
  borderRadius={16}
  containerSize={100}
/>`}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Możesz zastąpić każdą ikonę Ionicons komponentem GradientIcon,
          aby dodać gradient z motywu aplikacji.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  iconWrapper: {
    alignItems: 'center',
    margin: 8,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#9333ea',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#4338ca',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GradientIconDemo;

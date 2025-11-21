import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradients, gradientDirections, iconSizes } from '../../styles/theme';

/**
 * Komponent ikony z gradientowym tłem
 *
 * @param {Object} props
 * @param {string} props.name - Nazwa ikony z Ionicons (np. 'barbell', 'flash')
 * @param {number} props.size - Rozmiar ikony (domyślnie: 24)
 * @param {string} props.iconColor - Kolor ikony (domyślnie: '#ffffff')
 * @param {Array<string>} props.gradientColors - Kolory gradientu (domyślnie: gradient główny motywu)
 * @param {Object} props.gradientDirection - Kierunek gradientu (domyślnie: vertical)
 * @param {number} props.containerSize - Rozmiar kontenera (domyślnie: auto-obliczany na podstawie rozmiaru ikony)
 * @param {number} props.borderRadius - Zaokrąglenie rogów (domyślnie: 12)
 * @param {Object} props.style - Dodatkowe style dla kontenera
 * @param {Object} props.iconStyle - Dodatkowe style dla ikony
 *
 * @example
 * // Podstawowe użycie z domyślnym gradientem motywu
 * <GradientIcon name="barbell" size={48} />
 *
 * @example
 * // Z niestandardowym gradientem sukcesu
 * <GradientIcon
 *   name="checkmark-circle"
 *   size={32}
 *   gradientColors={gradients.success}
 * />
 *
 * @example
 * // Z niestandardowym kierunkiem gradientu
 * <GradientIcon
 *   name="flash"
 *   size={64}
 *   gradientDirection={gradientDirections.diagonal}
 * />
 */
const GradientIcon = ({
  name,
  size = iconSizes.md,
  iconColor = '#ffffff',
  gradientColors = gradients.primary,
  gradientDirection = gradientDirections.vertical,
  containerSize,
  borderRadius = 12,
  style,
  iconStyle,
}) => {
  // Automatyczne obliczanie rozmiaru kontenera jeśli nie podano
  const calculatedContainerSize = containerSize || size * 1.8;

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientDirection.start}
      end={gradientDirection.end}
      style={[
        styles.container,
        {
          width: calculatedContainerSize,
          height: calculatedContainerSize,
          borderRadius: borderRadius,
        },
        style,
      ]}
    >
      <Ionicons
        name={name}
        size={size}
        color={iconColor}
        style={iconStyle}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GradientIcon;

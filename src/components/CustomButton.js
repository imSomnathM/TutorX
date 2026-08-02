// src/components/CustomButton.js
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../theme/colors';

const CustomButton = ({
  title,
  onPress,
  loading,
  variant = 'primary',
  style,
  textStyle,
  iconName,
  iconRight,
  disabled,
  size = 'md',
}) => {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isPrimary && styles.primary,
        isDanger && styles.danger,
        !isPrimary && !isDanger && styles.outline,
        isSmall && styles.smallBtn,
        (loading || disabled) && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator
          color={isPrimary || isDanger ? COLORS.white : COLORS.primary}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {iconName && !iconRight && (
            <Icon
              name={iconName}
              size={isSmall ? 16 : 20}
              color={isPrimary || isDanger ? COLORS.white : COLORS.primary}
              style={{marginRight: 6}}
            />
          )}
          <Text
            style={[
              styles.text,
              !isPrimary && !isDanger && {color: COLORS.primary},
              isSmall && {fontSize: SIZES.sm},
              textStyle,
            ]}>
            {title}
          </Text>
          {iconName && iconRight && (
            <Icon
              name={iconName}
              size={isSmall ? 16 : 20}
              color={isPrimary || isDanger ? COLORS.white : COLORS.primary}
              style={{marginLeft: 6}}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  smallBtn: {height: 38, borderRadius: 10, paddingHorizontal: 16},
  primary: {backgroundColor: COLORS.primary},
  danger: {backgroundColor: COLORS.error},
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  btnDisabled: {opacity: 0.6},
  inner: {flexDirection: 'row', alignItems: 'center'},
  text: {color: COLORS.white, fontSize: SIZES.base, fontWeight: '600'},
});

export default CustomButton;

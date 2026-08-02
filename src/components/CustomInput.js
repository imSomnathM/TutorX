// src/components/CustomInput.js
import React, {useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../theme/colors';

const CustomInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  iconName,
  keyboardType = 'default',
  multiline = false,
  editable = true,
  label,
  error,
  style,
  inputStyle,
  autoCapitalize = 'none',
  maxLength,
  onFocus,
  onBlur,
}) => {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleFocus = e => {
    setFocused(true);
    onFocus && onFocus(e);
  };
  const handleBlur = e => {
    setFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          focused && styles.focused,
          error && styles.errorBorder,
          !editable && styles.disabled,
          multiline && {height: 90, alignItems: 'flex-start'},
        ]}>
        {iconName && (
          <Icon
            name={iconName}
            size={20}
            color={focused ? COLORS.primary : COLORS.textSecondary}
            style={[styles.icon, multiline && {marginTop: 14}]}
          />
        )}
        <TextInput
          style={[
            styles.input,
            multiline && {textAlignVertical: 'top', paddingTop: 12},
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPass}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon
              name={showPass ? 'visibility' : 'visibility-off'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {marginBottom: 14},
  label: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  focused: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  errorBorder: {borderColor: COLORS.error},
  disabled: {backgroundColor: '#F3F4F6', opacity: 0.7},
  icon: {marginRight: 10},
  input: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.text,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: SIZES.xs,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default CustomInput;

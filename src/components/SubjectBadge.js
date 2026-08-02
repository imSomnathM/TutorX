// src/components/SubjectBadge.js
import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {COLORS, SIZES} from '../theme/colors';

const SubjectBadge = ({subject, onPress, active, style}) => (
  <TouchableOpacity
    style={[styles.badge, active && styles.activeBadge, style]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text style={[styles.text, active && styles.activeText]}>{subject}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    margin: 4,
  },
  activeBadge: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  text: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: SIZES.sm,
  },
  activeText: {color: COLORS.white},
});

export default SubjectBadge;

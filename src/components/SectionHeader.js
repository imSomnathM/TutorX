// src/components/SectionHeader.js
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {COLORS, SIZES} from '../theme/colors';

const SectionHeader = ({title, actionLabel, onAction}) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {actionLabel && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  action: {fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600'},
});

export default SectionHeader;

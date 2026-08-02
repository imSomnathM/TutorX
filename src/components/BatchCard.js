// src/components/BatchCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, SIZES, RADIUS } from '../theme/colors';

const BatchCard = ({ batch, onEdit, onManage, showActions = true }) => {
  return (
    <View style={styles.card}>
      <View style={styles.colorStrip} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.batchName} numberOfLines={1}>
            {batch?.batchName ?? 'Batch'}
          </Text>
          {showActions ? (
            <View style={styles.actions}>
              {onEdit ? (
                <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                  <Icon name="edit" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ) : null}
              {onManage ? (
                <TouchableOpacity onPress={onManage} style={styles.actionBtn}>
                  <Icon name="people" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.detailRow}>
          <Icon name="place" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detail}>{batch?.address ?? '—'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="event" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detail}>
            {batch?.days?.join(', ') ?? '—'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="people" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detail}>
            Students: {batch?.studentCount ?? 0}/{batch?.maxStudents ?? 30}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.detail}>Class: {batch?.forClass ?? '—'}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.subjectChip}>
            <Text style={styles.subjectText}>{batch?.subjects ?? '—'}</Text>
          </View>
          {batch?.price ? (
            <Text style={styles.price}>₹{batch.price}/month</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  colorStrip: {
    width: 5,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchName: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  detail: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subjectChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  subjectText: {
    color: COLORS.primary,
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  price: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: SIZES.sm,
  },
});

export default BatchCard;

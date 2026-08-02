// src/components/TutorCard.js
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../theme/colors';

const TutorCard = ({tutor, onPress, horizontal = false}) => {
  const initials = (tutor?.name || tutor?.displayName || 'T')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.hAvatar}>
          {tutor?.photoURL ? (
            <Image source={{uri: tutor.photoURL}} style={styles.hAvatarImg} />
          ) : (
            <Text style={styles.hAvatarText}>{initials}</Text>
          )}
        </View>
        <Text style={styles.hName} numberOfLines={1}>
          {tutor?.name || tutor?.displayName || 'Tutor'}
        </Text>
        <Text style={styles.hLocation} numberOfLines={1}>
          {tutor?.distanceKm != null
            ? `${tutor.distanceKm.toFixed(1)} km away`
            : tutor?.address
            ? `(${tutor.address})`
            : ''}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar}>
        {tutor?.photoURL ? (
          <Image source={{uri: tutor.photoURL}} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {tutor?.name || tutor?.displayName || 'Tutor'}
        </Text>
        <Text style={styles.subjects} numberOfLines={1}>
          {tutor?.subjects || ''}
        </Text>
        <View style={styles.meta}>
          <Icon name="place" size={13} color={COLORS.textSecondary} />
          <Text style={styles.location}>
            {tutor?.address || '—'}
            {tutor?.distanceKm != null ? ` · ${tutor.distanceKm.toFixed(1)} km away` : ''}
          </Text>
        </View>
        <View style={styles.meta}>
          <Icon name="school" size={13} color={COLORS.textSecondary} />
          <Text style={styles.location}>{tutor?.qualification || '—'}</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Horizontal (for home page)
  hCard: {width: 90, alignItems: 'center', marginRight: 14},
  hAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 3,
  },
  hAvatarImg: {width: 62, height: 62, borderRadius: 31},
  hAvatarText: {color: COLORS.white, fontSize: 20, fontWeight: '700'},
  hName: {
    fontSize: SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  hLocation: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Vertical card (for search/list)
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImg: {width: 54, height: 54, borderRadius: 27},
  avatarText: {color: COLORS.white, fontSize: 18, fontWeight: '700'},
  info: {flex: 1},
  name: {fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: 2},
  subjects: {fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '500', marginBottom: 4},
  meta: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2},
  location: {fontSize: SIZES.xs, color: COLORS.textSecondary},
});

export default TutorCard;

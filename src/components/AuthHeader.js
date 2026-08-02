// src/components/AuthHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, SIZES } from '../theme/colors';

const AuthHeader = ({ navigation, showBack = true }) => {
  return (
    <View style={styles.container}>
      {showBack && navigation ? (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>TX</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: 55,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  logoText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: SIZES.xxl,
    letterSpacing: 1,
  },
});

export default AuthHeader;

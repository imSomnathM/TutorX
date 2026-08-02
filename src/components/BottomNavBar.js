// src/components/BottomNavBar.js
import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../theme/colors';

const TABS = [
  {name: 'Home', icon: 'home', route: 'Home'},
  {name: 'Search', icon: 'search', route: 'Search'},
  {name: 'Batches', icon: 'menu-book', route: 'Batches'},
  {name: 'Settings', icon: 'settings', route: 'Settings'},
];

const BottomNavBar = ({activeRoute, navigation}) => (
  <View style={styles.container}>
    {TABS.map(tab => {
      const isActive = activeRoute === tab.route;
      return (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => navigation.navigate(tab.route)}
          activeOpacity={0.7}>
          <View style={isActive ? styles.activeIndicator : null}>
            <Icon
              name={tab.icon}
              size={26}
              color={isActive ? COLORS.primary : COLORS.textSecondary}
            />
          </View>
          <Text style={[styles.label, isActive && styles.activeLabel]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tab: {flex: 1, alignItems: 'center'},
  activeIndicator: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  label: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 3},
  activeLabel: {color: COLORS.primary, fontWeight: '600'},
});

export default BottomNavBar;

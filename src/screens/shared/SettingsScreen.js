// src/screens/shared/SettingsScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
   Alert, StatusBar, Switch,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import {signOut, deleteAccount} from '../../firebase/auth';
import {useAuth} from '../../context/AuthContext';

const SettingRow = ({icon, title, subtitle, onPress, rightEl, danger, disabled}) => (
  <TouchableOpacity
    style={[styles.row, disabled && styles.rowDisabled]}
    onPress={disabled ? undefined : onPress}
    activeOpacity={disabled ? 1 : 0.7}
    disabled={disabled}>
    <View style={[styles.rowIconBg, danger && {backgroundColor: '#FEE2E2'}, disabled && {backgroundColor: COLORS.border}]}>
      <Icon name={icon} size={20} color={danger ? COLORS.error : disabled ? COLORS.textSecondary : COLORS.primary} />
    </View>
    <View style={styles.rowContent}>
      <Text style={[styles.rowTitle, danger && {color: COLORS.error}, disabled && {color: COLORS.textSecondary}]}>{title}</Text>
      {subtitle && <Text style={[styles.rowSub, disabled && {color: COLORS.textSecondary}]}>{subtitle}</Text>}
    </View>
    {disabled ? (
      <View style={styles.lockedBadge}>
        <Text style={styles.lockedBadgeText}>Locked</Text>
      </View>
    ) : (
      rightEl ?? <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
    )}
  </TouchableOpacity>
);

const SettingsScreen = ({navigation}) => {
  const {user, role} = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log Out', style: 'destructive', onPress: () => signOut()},
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: () => deleteAccount()},
      ],
    );
  };

  const profileRoute = role === 'teacher' ? 'TutorProfile' : 'StudentProfile';
  const editProfileRoute = role === 'teacher' ? 'TutorEditProfile' : 'StudentEditProfile';
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.titleBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Settings</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => navigation.navigate(profileRoute)}
          activeOpacity={0.85}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role === 'teacher' ? '👨‍🏫 Teacher' : '📚 Student'}</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Profile Setting */}
        <Text style={styles.sectionLabel}>Profile Setting</Text>
        <View style={styles.group}>
          <SettingRow
            icon="person"
            title="Edit Profile"
            subtitle="Name, photo, phone and more"
            onPress={() => navigation.navigate(editProfileRoute)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="lock"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => navigation.navigate('ForgotPassword')}
          />
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>Theme & Appearance</Text>
        <View style={styles.group}>
          <SettingRow
            icon="dark-mode"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            onPress={() => Alert.alert('Coming Soon', 'Dark mode will be available soon!')}
            rightEl={<Switch value={false} onValueChange={() => {}} trackColor={{false: COLORS.border, true: COLORS.primary}} />}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="text-fields"
            title="Font Size"
            subtitle="Adjust text size"
            onPress={() => {}}
          />
        </View>

        {/* Subscribe */}
        <Text style={styles.sectionLabel}>Subscribe</Text>
        <View style={styles.group}>
          <SettingRow
            icon="star"
            title="Subscription Plans"
            subtitle="Unlock premium features"
            onPress={() => Alert.alert('Coming Soon', 'Subscription plans will be available soon!')}
            disabled
          />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.group}>
          <SettingRow
            icon="notifications"
            title="Push Notifications"
            subtitle="Batch updates and reminders"
            onPress={() => {}}
            rightEl={<Switch value={true} onValueChange={() => {}} trackColor={{false: COLORS.border, true: COLORS.primary}} />}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.group}>
          <SettingRow icon="help" title="FAQ" subtitle="Frequently asked questions" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="description" title="Terms & Conditions" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="privacy-tip" title="Privacy Policy" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="email" title="Contact Support" subtitle="Get help from our team" onPress={() => {}} />
        </View>

        {/* App Info */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <SettingRow
            icon="info"
            title="App Version"
            subtitle="1.0.0"
            onPress={() => {}}
            rightEl={<Text style={styles.versionText}>v1.0.0</Text>}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <View style={styles.group}>
          <SettingRow icon="logout" title="Log Out" onPress={handleLogout} danger />
          <View style={styles.divider} />
          <SettingRow icon="delete-forever" title="Delete Account" subtitle="This cannot be undone" onPress={handleDelete} danger />
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  titleBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14},
  pageTitle: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text},
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20, padding: 16, gap: 14,
    elevation: 4,
  },
  avatar: {width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center'},
  avatarText: {color: COLORS.primary, fontSize: 20, fontWeight: '800'},
  userInfo: {flex: 1},
  userName: {fontWeight: '700', fontSize: SIZES.base, color: COLORS.white},
  userEmail: {color: 'rgba(255,255,255,0.8)', fontSize: SIZES.xs, marginTop: 2},
  roleBadge: {marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start'},
  roleText: {color: COLORS.white, fontSize: SIZES.xs, fontWeight: '600'},
  sectionLabel: {marginHorizontal: 16, marginBottom: 8, marginTop: 18, color: COLORS.textSecondary, fontWeight: '700', fontSize: SIZES.xs, letterSpacing: 0.8, textTransform: 'uppercase'},
  group: {marginHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 14, elevation: 1},
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12},
  rowDisabled: {opacity: 0.5},
  lockedBadge: {backgroundColor: COLORS.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3},
  lockedBadgeText: {fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary},
  rowIconBg: {width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  rowContent: {flex: 1},
  rowTitle: {fontSize: SIZES.md, color: COLORS.text, fontWeight: '500'},
  rowSub: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
  divider: {height: 1, backgroundColor: COLORS.border, marginLeft: 48},
  versionText: {fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500'},
});

export default SettingsScreen;
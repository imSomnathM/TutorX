// src/screens/student/StudentProfileScreen.js
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES, FONTS} from '../../theme/colors';
import {useAuth} from '../../context/AuthContext';
import {getStudentProfile} from '../../firebase/firestore';

// ---------------------------------------------------------------------------
// StudentProfileScreen — the student's OWN profile.
//
// This previously contained a stray copy of the tutor-viewing "batches +
// join" screen, which required a route.params.tutorId that navigation.
// navigate('StudentProfile') never passed — so it sat on `loading: true`
// forever (the infinite spinner when tapping the home screen avatar).
// This is a proper self-profile view instead.
// ---------------------------------------------------------------------------

const StudentProfileScreen = ({navigation}) => {
  const {user, userData} = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setLoading(false);
      return;
    }
    getStudentProfile(user.uid)
      .then(snap => {
        if (isMounted && snap.exists) setProfile(snap.data());
      })
      .catch(e => console.warn('StudentProfile fetch error:', e))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const initials = (user?.displayName || 'S')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const subjects = profile?.subjects
    ? profile.subjects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Profile</Text>
        <View style={{width: 34}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            {userData?.photoURL ? (
              <Image source={{uri: userData.photoURL}} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          <Text style={styles.studentName}>{user?.displayName || 'Student'}</Text>
          {!!user?.email && <Text style={styles.studentEmail}>{user.email}</Text>}

          <View style={styles.badge}>
            <Icon name="school" size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>Student</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Profile Details</Text>
        <View style={styles.detailsCard}>
          <DetailRow icon="phone" label="Phone" value={profile?.phone} />
          <DetailRow icon="school" label="Class" value={profile?.className} />
          <DetailRow icon="translate" label="Medium" value={profile?.medium} />
          <DetailRow icon="place" label="Address" value={profile?.address} last />
        </View>

        {subjects.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <View style={styles.chipsWrap}>
              {subjects.map(s => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.editBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StudentEditProfile')}>
          <Icon name="edit" size={18} color={COLORS.white} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({icon, label, value, last}) => (
  <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
    <Icon name={icon} size={18} color={COLORS.primary} />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center'},
  topBarTitle: {color: COLORS.white, fontSize: SIZES.lg, ...FONTS.bold},
  scrollContent: {padding: 20, paddingBottom: 40},
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  avatarWrapper: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, overflow: 'hidden',
  },
  avatarImage: {width: 78, height: 78},
  avatarInitials: {fontSize: SIZES.xl, color: COLORS.primary, ...FONTS.bold},
  studentName: {fontSize: SIZES.xl, color: COLORS.text, ...FONTS.extraBold},
  studentEmail: {fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2},
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginTop: 10,
  },
  badgeText: {color: COLORS.primary, fontSize: SIZES.xs, ...FONTS.semiBold},
  sectionTitle: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.bold, marginBottom: 10},
  detailsCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, marginBottom: 20, elevation: 1,
  },
  detailRow: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14},
  detailRowBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.border},
  detailLabel: {fontSize: SIZES.sm, color: COLORS.textSecondary, width: 70},
  detailValue: {flex: 1, fontSize: SIZES.sm, color: COLORS.text, ...FONTS.semiBold, textAlign: 'right'},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24},
  chip: {backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  chipText: {color: COLORS.primaryDark, fontSize: SIZES.xs, ...FONTS.semiBold},
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 15,
    elevation: 3,
  },
  editBtnText: {color: COLORS.white, fontSize: SIZES.base, ...FONTS.bold},
});

export default StudentProfileScreen;
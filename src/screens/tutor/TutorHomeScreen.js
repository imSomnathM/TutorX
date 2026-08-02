// src/screens/tutor/TutorHomeScreen.js
import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
   StatusBar, RefreshControl, Image,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import {COLORS, SIZES} from '../../theme/colors';
import BottomNavBar from '../../components/BottomNavBar';
import SectionHeader from '../../components/SectionHeader';
import {useAuth} from '../../context/AuthContext';
import {getTutorProfile} from '../../firebase/firestore';

const StatCard = ({icon, label, value, color}) => (
  <View style={[styles.statCard, {borderLeftColor: color}]}>
    <View style={[styles.statIcon, {backgroundColor: color + '20'}]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TutorHomeScreen = ({navigation}) => {
  const {user, userData} = useAuth();
  const [batches, setBatches] = useState([]);
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profileSnap = await getTutorProfile(user.uid);
      if (profileSnap.exists) setProfile(profileSnap.data());
    } catch (e) {
      console.warn('TutorHome profile load error:', e);
    }
  };

  // Realtime listener for this tutor's batches. Previously this was a
  // one-time getTutorBatches() fetch that only re-ran when the screen
  // regained focus, so the "Students" count (and each batch's own
  // studentCount) stayed stale until you navigated away and back — e.g. a
  // student leaving a batch wouldn't reduce the count you were looking at.
  // onSnapshot pushes every change (join, leave, remove) the instant it
  // happens in Firestore, with no need to leave/re-enter the screen.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = firestore()
      .collection('batches')
      .where('tutorId', '==', user.uid)
      .onSnapshot(
        snap => {
          const batchList = snap.docs.map(d => ({id: d.id, ...d.data()}));
          setBatches(batchList);
          setTotalStudents(batchList.reduce((acc, b) => acc + (b.studentCount || 0), 0));
        },
        e => console.warn('TutorHome batches listener error:', e),
      );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    loadProfile();
    const unsub = navigation.addListener('focus', loadProfile);
    return unsub;
  }, [navigation, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{user?.displayName || 'Tutor'} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('TutorProfile')}>
          <View style={styles.avatar}>
            {userData?.photoURL ? (
              <Image source={{uri: userData.photoURL}} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="menu-book" label="Batches" value={batches.length} color={COLORS.primary} />
        <StatCard icon="people" label="Students" value={totalStudents} color={COLORS.success} />
        <StatCard
          icon="stars"
          label={profile?.reviewCount ? `Rating (${profile.reviewCount})` : 'Rating'}
          value={profile?.rating ? profile.rating.toFixed(1) : 'New'}
          color={COLORS.warning}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            {[
              {icon: 'add-circle', label: 'Create Batch', route: 'CreateBatch', color: COLORS.primary},
              {icon: 'menu-book', label: 'My Batches', route: 'Batches', color: COLORS.secondary},
              {icon: 'people', label: 'Students', route: 'Batches', color: COLORS.success},
              {icon: 'person', label: 'My Profile', route: 'TutorProfile', color: COLORS.warning},
              {icon: 'search', label: 'Search', route: 'Search', color: '#EC4899'},
              {icon: 'settings', label: 'Settings', route: 'Settings', color: COLORS.textSecondary},
            ].map(action => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.route)}
                activeOpacity={0.8}>
                <View style={[styles.actionIcon, {backgroundColor: action.color + '18'}]}>
                  <Icon name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Batches */}
        <View style={styles.section}>
          <SectionHeader
            title="Your Batches"
            actionLabel={batches.length > 0 ? 'View All' : undefined}
            onAction={() => navigation.navigate('Batches')}
          />
          {batches.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => navigation.navigate('CreateBatch')}>
              <Icon name="add-circle-outline" size={40} color={COLORS.primary} />
              <Text style={styles.emptyCardTitle}>Create Your First Batch</Text>
              <Text style={styles.emptyCardDesc}>Start teaching by creating a new batch</Text>
            </TouchableOpacity>
          ) : (
            batches.slice(0, 3).map(batch => (
              <TouchableOpacity
                key={batch.id}
                style={styles.batchItem}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('EditBatch', {batch})}>
                <View style={styles.batchLeft}>
                  <View style={styles.batchIconBg}>
                    <Icon name="menu-book" size={20} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.batchName}>{batch.batchName}</Text>
                    <Text style={styles.batchMeta}>
                      {batch.forClass} • {batch.studentCount || 0}/{batch.maxStudents || 30} students
                    </Text>
                  </View>
                </View>
                <Icon name="arrow-forward-ios" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Profile completeness */}
        {!profile?.bio && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.completeCard}
              onPress={() => navigation.navigate('TutorEditProfile')}>
              <Icon name="info" size={22} color={COLORS.warning} />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.completeTitle}>Complete Your Profile</Text>
                <Text style={styles.completeDesc}>Add bio and documents to attract more students</Text>
              </View>
              <Icon name="chevron-right" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{height: 20}} />
      </ScrollView>

      <BottomNavBar activeRoute="Home" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  greeting: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500'},
  name: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white},
  avatarBtn: {},
  avatar: {width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  avatarImage: {width: 46, height: 46},
  avatarText: {color: COLORS.primary, fontWeight: '800', fontSize: 18},
  statsRow: {flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: -16, marginBottom: 8},
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', elevation: 4,
    borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 4,
  },
  statIcon: {width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8},
  statValue: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text},
  statLabel: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
  section: {paddingHorizontal: 16, marginTop: 20},
  actionsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  actionCard: {
    width: '30%', backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', elevation: 2,
  },
  actionIcon: {width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8},
  actionLabel: {fontSize: SIZES.xs, fontWeight: '600', color: COLORS.text, textAlign: 'center'},
  emptyCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary,
    borderStyle: 'dashed', gap: 8,
  },
  emptyCardTitle: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary},
  emptyCardDesc: {fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center'},
  batchItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2,
  },
  batchLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  batchIconBg: {width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  batchName: {fontSize: SIZES.md, fontWeight: '600', color: COLORS.text},
  batchMeta: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
  completeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  completeTitle: {fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text},
  completeDesc: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
});

export default TutorHomeScreen;
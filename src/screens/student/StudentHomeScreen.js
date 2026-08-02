// src/screens/student/StudentHomeScreen.js
import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
   StatusBar, FlatList, RefreshControl,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import BottomNavBar from '../../components/BottomNavBar';
import TutorCard from '../../components/TutorCard';
import SubjectBadge from '../../components/SubjectBadge';
import SectionHeader from '../../components/SectionHeader';
import {useAuth} from '../../context/AuthContext';
import {getFeaturedTutors, getStudentBatches, getBatchById} from '../../firebase/firestore';
import LocationService from '../../services/LocationService';

const SUBJECTS = [
  'Math', 'Physics', 'Chemistry', 'Biology',
  'History', 'English', 'Bengali', 'Computer Science',
];

const StudentHomeScreen = ({navigation}) => {
  const {user} = useAuth();
  const [tutors, setTutors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubject, setActiveSubject] = useState('');
  const [studentLocation, setStudentLocation] = useState(null);

  const loadData = async () => {
    if (!user) return;
    try {
      // Ask for location once per screen lifetime (GPS, falling back to IP
      // location if permission is denied) so we can suggest nearby tutors.
      let location = studentLocation;
      if (!location) {
        try {
          location = await LocationService.getCurrentLocation();
          setStudentLocation(location);
        } catch (_) {
          // No GPS, no IP fallback available — just show tutors unfiltered.
        }
      }

      // Load featured tutors (nearby-first when we have a location)
      const tutorSnap = await getFeaturedTutors(location);
      setTutors(tutorSnap.docs.map(d => ({id: d.id, ...d.data()})));

      // Load student's enrolled batches
      const batchStudentSnap = await getStudentBatches(user.uid);
      const batchIds = batchStudentSnap.docs.map(d => d.data().batchId);
      if (batchIds.length > 0) {
        const batchSnaps = await Promise.all(batchIds.map(id => getBatchById(id)));
        setSessions(batchSnaps.filter(s => s.exists).map(s => ({id: s.id, ...s.data()})));
      }
    } catch (e) {
      console.warn('StudentHome loadData:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{user?.displayName || 'Student'} 📚</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('StudentProfile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>

        {/* Search bar shortcut */}
        <TouchableOpacity
          style={styles.searchShortcut}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}>
          <Icon name="search" size={20} color={COLORS.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search tutors, subjects, location...</Text>
          <View style={styles.filterIcon}>
            <Icon name="tune" size={18} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* My Sessions */}
        <View style={styles.section}>
          <SectionHeader
            title="My Sessions"
            actionLabel={sessions.length > 0 ? 'View All' : undefined}
            onAction={() => navigation.navigate('Batches')}
          />
          {sessions.length === 0 ? (
            <TouchableOpacity
              style={styles.joinCard}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.85}>
              <Icon name="add-circle-outline" size={36} color={COLORS.primary} />
              <Text style={styles.joinCardTitle}>Find a Tutor & Join a Batch</Text>
              <Text style={styles.joinCardDesc}>
                Browse tutors and enroll in batches that match your needs
              </Text>
              <View style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>Explore Now</Text>
                <Icon name="arrow-forward" size={16} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          ) : (
            sessions.slice(0, 2).map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionLeft}>
                  <View style={styles.sessionIconBg}>
                    <Icon name="menu-book" size={22} color={COLORS.primary} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.sessionName}>{session.batchName}</Text>
                    <Text style={styles.sessionMeta}>
                      {session.forClass} • {session.subjects}
                    </Text>
                    <View style={styles.sessionSchedule}>
                      <Icon name="event" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.sessionScheduleText}>
                        {session.days?.join(', ')} {session.startTime ? `@ ${session.startTime}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>
                    {session.price ? `₹${session.price}/mo` : 'Enrolled'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <SectionHeader
            title="Browse by Subject"
            actionLabel="See All"
            onAction={() => navigation.navigate('Search')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
            {SUBJECTS.map(s => (
              <SubjectBadge
                key={s}
                subject={s}
                active={activeSubject === s}
                onPress={() => {
                  setActiveSubject(s === activeSubject ? '' : s);
                  navigation.navigate('Search');
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Tutors */}
        <View style={styles.section}>
          <SectionHeader
            title={studentLocation ? 'Tutors Near You' : 'Featured Tutors'}
            actionLabel="See All"
            onAction={() => navigation.navigate('Search')}
          />
          {tutors.length > 0 ? (
            <FlatList
              data={tutors}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <TutorCard
                  tutor={item}
                  horizontal
                  onPress={() => navigation.navigate('TutorProfile', {tutorId: item.id})}
                />
              )}
            />
          ) : (
            // Fallback skeleton-like placeholders
            <View style={styles.skeletonRow}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonLine} />
                  <View style={styles.skeletonLineShort} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tips card */}
        <View style={styles.section}>
          <View style={styles.tipsCard}>
            <Icon name="lightbulb" size={24} color={COLORS.warning} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.tipsTitle}>Study Tip of the Day</Text>
              <Text style={styles.tipsText}>
                Break your study sessions into 25-minute focused blocks with 5-minute breaks for maximum retention.
              </Text>
            </View>
          </View>
        </View>

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
  avatar: {width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center'},
  avatarText: {color: COLORS.primary, fontWeight: '800', fontSize: 18},
  searchShortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 14,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    elevation: 2,
  },
  searchPlaceholder: {flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary},
  filterIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  section: {paddingHorizontal: 16, marginTop: 20},
  joinCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 18, padding: 22,
    alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary,
    borderStyle: 'dashed', gap: 8,
  },
  joinCardTitle: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary, textAlign: 'center'},
  joinCardDesc: {fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20},
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, marginTop: 4,
  },
  joinBtnText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.sm},
  sessionCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2,
  },
  sessionLeft: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1},
  sessionIconBg: {width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0},
  sessionName: {fontSize: SIZES.md, fontWeight: '700', color: COLORS.text},
  sessionMeta: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
  sessionSchedule: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5},
  sessionScheduleText: {fontSize: 11, color: COLORS.textSecondary},
  pricePill: {backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginLeft: 8},
  priceText: {fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '700'},
  skeletonRow: {flexDirection: 'row', gap: 14},
  skeletonCard: {width: 80, alignItems: 'center', gap: 6},
  skeletonAvatar: {width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.border},
  skeletonLine: {width: 70, height: 10, borderRadius: 5, backgroundColor: COLORS.border},
  skeletonLineShort: {width: 50, height: 8, borderRadius: 4, backgroundColor: COLORS.border},
  tipsCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  tipsTitle: {fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text, marginBottom: 4},
  tipsText: {fontSize: SIZES.xs, color: COLORS.textSecondary, lineHeight: 18},
});

export default StudentHomeScreen;

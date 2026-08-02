// src/screens/student/MySessionsScreen.js
import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
   StatusBar, RefreshControl, Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import BottomNavBar from '../../components/BottomNavBar';
import {useAuth} from '../../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import {getBatchById, removeStudentFromBatch, getStudentRatingForBatch, incrementBatchStudentCount} from '../../firebase/firestore';

const MySessionsScreen = ({navigation}) => {
  const {user} = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await firestore()
        .collection('batchStudents')
        .where('studentId', '==', user.uid)
        .get();

      if (snap.empty) {setSessions([]); setLoading(false); return;}

      const entries = snap.docs.map(d => ({docId: d.id, ...d.data()}));
      const batchSnaps = await Promise.all(entries.map(e => getBatchById(e.batchId)));

      const result = batchSnaps
        .map((s, i) => s.exists ? {id: s.id, docId: entries[i].docId, ...s.data()} : null)
        .filter(Boolean);

      // Batch docs only store `tutorId`, not the tutor's name — fetch each
      // tutor's user doc so the card can show "by <name>" instead of the
      // "by Tutor" placeholder it was falling back to.
      // Also check whether this student already rated each batch, so the
      // button can say "Update Rating" instead of "Give Rating".
      const enriched = await Promise.all(
        result.map(async batch => {
          let tutorName = 'Tutor';
          try {
            const tutorUserSnap = await firestore().collection('users').doc(batch.tutorId).get();
            if (tutorUserSnap.exists) {
              tutorName = tutorUserSnap.data().name || tutorName;
            }
          } catch (_) {}

          let myRating = null;
          try {
            const ratingSnap = await getStudentRatingForBatch(user.uid, batch.id);
            if (!ratingSnap.empty) {
              myRating = ratingSnap.docs[0].data().rating;
            }
          } catch (_) {}

          return {...batch, tutorName, myRating};
        }),
      );

      setSessions(enriched);
    } catch (e) {
      console.warn('MySessionsScreen fetch:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchSessions);
    return unsub;
  }, [navigation, fetchSessions]);

  const onRefresh = async () => {setRefreshing(true); await fetchSessions(); setRefreshing(false);};

  const handleLeave = (docId, batchName, batchId) => {
    Alert.alert('Leave Batch', `Leave "${batchName}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeStudentFromBatch(docId);
            // This was the actual bug: leaving a batch deleted the
            // enrollment doc but never touched the batch's studentCount,
            // so the tutor's "Students" count and per-batch counts never
            // went down when a student left on their own (removing a
            // student FROM the tutor's side already did this correctly).
            await incrementBatchStudentCount(batchId, -1);
            fetchSessions();
          } catch (e) {
            Alert.alert('Could not leave batch', e.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Icon name="book" size={52} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Sessions Yet!</Text>
      <Text style={styles.emptyDesc}>
        You haven't joined any batch yet. Start exploring tutors and find the perfect learning experience.
      </Text>
      <TouchableOpacity
        style={styles.findBtn}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.85}>
        <Icon name="search" size={20} color={COLORS.white} />
        <Text style={styles.findBtnText}>Find Tutor & Batches</Text>
      </TouchableOpacity>
    </View>
  );

  const getStatusColor = count =>
    count > 25 ? COLORS.error : count > 15 ? COLORS.warning : COLORS.success;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Sessions</Text>
          <Text style={styles.subtitle}>
            {sessions.length > 0
              ? `${sessions.length} batch${sessions.length > 1 ? 'es' : ''} enrolled`
              : 'Your groups and classes'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => navigation.navigate('Search')}>
          <Icon name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[styles.list, sessions.length === 0 && {flex: 1}]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        renderItem={({item}) => (
          <View style={styles.sessionCard}>
            {/* Header row */}
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBg}>
                <Icon name="menu-book" size={24} color={COLORS.primary} />
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.batchName} numberOfLines={1}>{item.batchName}</Text>
                <Text style={styles.tutorName}>by {item.tutorName || 'Tutor'}</Text>
              </View>
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={() => handleLeave(item.docId, item.batchName, item.id)}>
                <Icon name="exit-to-app" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Details grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Icon name="school" size={14} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Class</Text>
                <Text style={styles.detailValue}>{item.forClass}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="book" size={14} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Subjects</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{item.subjects}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="language" size={14} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Medium</Text>
                <Text style={styles.detailValue}>{item.medium || '—'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="currency-rupee" size={14} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Fee</Text>
                <Text style={styles.detailValue}>{item.price ? `₹${item.price}/mo` : 'Free'}</Text>
              </View>
            </View>

            {/* Schedule & location */}
            {(item.days?.length > 0 || item.address) && (
              <View style={styles.scheduleSection}>
                {item.days?.length > 0 && (
                  <View style={styles.scheduleRow}>
                    <Icon name="event" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.scheduleText}>
                      {item.days.join(', ')}{item.startTime ? ` @ ${item.startTime}` : ''}
                    </Text>
                  </View>
                )}
                {item.address && (
                  <View style={styles.scheduleRow}>
                    <Icon name="place" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.scheduleText} numberOfLines={1}>{item.address}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Seat availability */}
            <View style={styles.seatRow}>
              <Icon
                name="people"
                size={13}
                color={getStatusColor(item.studentCount || 0)}
              />
              <Text style={[styles.seatText, {color: getStatusColor(item.studentCount || 0)}]}>
                {item.studentCount || 0}/{item.maxStudents || 30} students enrolled
              </Text>
            </View>

            <TouchableOpacity
              style={styles.rateBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('RateReview', {
                  tutorId: item.tutorId,
                  tutorName: item.tutorName,
                  batchId: item.id,
                  batchName: item.batchName,
                  existingRating: item.myRating,
                })
              }>
              <Icon
                name={item.myRating ? 'star' : 'star-outline'}
                size={16}
                color={COLORS.warning}
              />
              <Text style={styles.rateBtnText}>
                {item.myRating ? `Your Rating: ${item.myRating} • Update` : 'Give Rating'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <BottomNavBar activeRoute="Batches" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  title: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text},
  subtitle: {fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2},
  searchBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  list: {padding: 16, paddingTop: 0},
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  emptyIconBg: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: {fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 10},
  emptyDesc: {color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28, fontSize: SIZES.sm},
  findBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
    alignItems: 'center', gap: 8, elevation: 4,
  },
  findBtnText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.base},
  sessionCard: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 16,
    marginBottom: 14, elevation: 3,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'center'},
  cardIconBg: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  batchName: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.text},
  tutorName: {fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '500', marginTop: 2},
  leaveBtn: {padding: 8, backgroundColor: '#FEE2E2', borderRadius: 10},
  divider: {height: 1, backgroundColor: COLORS.border, marginVertical: 12},
  detailsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  detailItem: {
    flex: 1, minWidth: '44%', backgroundColor: COLORS.background,
    borderRadius: 10, padding: 10, gap: 3,
  },
  detailLabel: {fontSize: 10, color: COLORS.textSecondary, fontWeight: '500'},
  detailValue: {fontSize: SIZES.sm, color: COLORS.text, fontWeight: '600'},
  scheduleSection: {gap: 5, marginBottom: 10},
  scheduleRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  scheduleText: {fontSize: SIZES.xs, color: COLORS.textSecondary, flex: 1},
  seatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.background, borderRadius: 8, padding: 8,
  },
  seatText: {fontSize: SIZES.xs, fontWeight: '600'},
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFFBEB', borderRadius: 10, paddingVertical: 10, marginTop: 10,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  rateBtnText: {fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text},
});

export default MySessionsScreen;
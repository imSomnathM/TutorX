// src/screens/tutor/ManageStudentsScreen.js
import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
   Alert, StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import CustomButton from '../../components/CustomButton';
import {
  getBatchStudents,
  removeStudentFromBatch,
  incrementBatchStudentCount,
  getBatchById,
  getStudentProfile,
} from '../../firebase/firestore';
import {useAuth} from '../../context/AuthContext';

const ManageStudentsScreen = ({route, navigation}) => {
  const {user} = useAuth();
  const {batchId} = route.params;
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [studentsSnap, batchSnap] = await Promise.all([
        getBatchStudents(user.uid, batchId),
        getBatchById(batchId),
      ]);
      const list = studentsSnap.docs.map(d => ({docId: d.id, ...d.data()}));

      // batchStudents.phone is just a snapshot copied at join time — it's
      // blank for anyone who joined before phone number collection was
      // added to onboarding, and can go stale if a student updates their
      // number later. Fetch each student's live phone from their own
      // students/{uid} profile doc instead, falling back to the snapshot
      // copy only if that read fails for some reason.
      const withLivePhone = await Promise.all(
        list.map(async s => {
          try {
            const profileSnap = await getStudentProfile(s.studentId);
            return {...s, phone: profileSnap.exists ? profileSnap.data().phone || s.phone : s.phone};
          } catch (_) {
            return s;
          }
        }),
      );

      setStudents(withLivePhone);
      setFiltered(withLivePhone);
      if (batchSnap.exists) setBatch({id: batchSnap.id, ...batchSnap.data()});
    } catch (e) {
      // This used to fail silently (no try/catch at all) — the screen just
      // sat blank forever with loading stuck true. The most common real
      // cause of a permission-denied error here is the Firestore security
      // rules for `batchStudents` only allowing the *student* who owns a
      // doc to read it, not the tutor who owns the batch it belongs to —
      // that collection's rules need to also allow
      // `resource.data.tutorId == request.auth.uid`.
      console.warn('ManageStudents fetch error:', e);
      setLoadError(
        e.code === 'firestore/permission-denied' || e.message?.includes('permission')
          ? "You don't have permission to view this batch's students. Please check your Firestore security rules."
          : "Couldn't load students. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [batchId, user]);

  useEffect(() => {fetchData();}, [fetchData]);

  const handleSearch = text => {
    setQuery(text);
    if (!text.trim()) return setFiltered(students);
    const q = text.toLowerCase();
    setFiltered(students.filter(s =>
      s.studentName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q),
    ));
  };

  const handleRemove = (docId, name) => {
    Alert.alert(
      'Remove Student',
      `Remove "${name}" from this batch?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeStudentFromBatch(docId);
              await incrementBatchStudentCount(batchId, -1);
              fetchData();
            } catch (e) {
              Alert.alert('Could not remove student', e.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const getInitials = name =>
    (name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Icon name="people-outline" size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Students Yet</Text>
      <Text style={styles.emptyDesc}>
        Students who join this batch will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.topBarInfo}>
          <Text style={styles.pageTitle}>Manage Students</Text>
          {batch && (
            <Text style={styles.batchLabel} numberOfLines={1}>
              {batch.batchName}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Icon name="error-outline" size={40} color={COLORS.error} />
          <Text style={styles.errorText}>{loadError}</Text>
          <CustomButton title="Retry" onPress={fetchData} iconName="refresh" />
        </View>
      ) : (
        <>
          {/* Stats banner */}
          {batch && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{students.length}</Text>
            <Text style={styles.statLbl}>Enrolled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{batch.maxStudents || 30}</Text>
            <Text style={styles.statLbl}>Capacity</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {Math.max(0, (batch.maxStudents || 30) - students.length)}
            </Text>
            <Text style={styles.statLbl}>Seats Left</Text>
          </View>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or phone..."
          placeholderTextColor={COLORS.textSecondary}
          value={query}
          onChangeText={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.docId}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[styles.list, filtered.length === 0 && {flex: 1}]}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => (
          <View style={styles.studentCard}>
            <View style={styles.studentLeft}>
              {/* Avatar */}
              <View style={[styles.avatar, {backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length]}]}>
                <Text style={styles.avatarText}>{getInitials(item.studentName)}</Text>
              </View>

              {/* Info */}
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.studentName || 'Student'}</Text>
                <View style={styles.infoRow}>
                  <Icon name="school" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.infoText}>
                    {item.grade || item.className || '—'}
                  </Text>
                </View>
                {item.email && (
                  <View style={styles.infoRow}>
                    <Icon name="email" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
                  </View>
                )}
                {item.phone && (
                  <View style={styles.infoRow}>
                    <Icon name="phone" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>{item.phone}</Text>
                  </View>
                )}
                <View style={styles.joinedRow}>
                  <Icon name="event" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.joinedText}>
                    Joined {item.joinedAt?.toDate
                      ? new Date(item.joinedAt.toDate()).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})
                      : '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Remove button */}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item.docId, item.studentName)}>
              <Icon name="person-remove" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      />
        </>
      )}
    </SafeAreaView>
  );
};

const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#0891B2', '#9333EA', '#16A34A',
];

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12},
  errorText: {fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8},
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    elevation: 2,
  },
  backBtn: {padding: 4},
  topBarInfo: {flex: 1},
  pageTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  batchLabel: {fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '500', marginTop: 1},
  statsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 20,
  },
  statItem: {alignItems: 'center'},
  statNum: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white},
  statLbl: {fontSize: SIZES.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  statDivider: {width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)'},
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, marginBottom: 8,
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: {flex: 1, fontSize: SIZES.md, color: COLORS.text, padding: 0},
  list: {paddingHorizontal: 16, paddingBottom: 24},
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40,
  },
  emptyIconBg: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 8},
  emptyDesc: {
    fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 30,
  },
  studentCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start',
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  studentLeft: {flexDirection: 'row', flex: 1, gap: 12},
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: {color: COLORS.white, fontSize: 18, fontWeight: '700'},
  studentInfo: {flex: 1},
  studentName: {fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: 5},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3},
  infoText: {fontSize: SIZES.xs, color: COLORS.textSecondary, flex: 1},
  joinedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: COLORS.background, borderRadius: 6, paddingHorizontal: 6,
    paddingVertical: 3, alignSelf: 'flex-start',
  },
  joinedText: {fontSize: 10, color: COLORS.textSecondary},
  removeBtn: {
    padding: 8, backgroundColor: '#FEE2E2', borderRadius: 10,
    marginLeft: 8,
  },
});

export default ManageStudentsScreen;
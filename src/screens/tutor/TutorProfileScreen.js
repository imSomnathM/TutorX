// src/screens/tutor/TutorProfileScreen.js
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import {useAuth} from '../../context/AuthContext';
import {COLORS, SIZES, FONTS} from '../../theme/colors';

// ---------------------------------------------------------------------------
// TutorProfileScreen (tutor side)
//
// This is the tutor's own "public profile preview" — it shows the tutor
// exactly what students see on the student-side TutorProfileScreen (rating,
// fees, location, batches, etc.), but:
//   - there is no "Join Batch" action (a tutor can't join their own batch)
//   - batches only expand to "View Details", nothing more
//   - the visual language matches the rest of the tutor dashboard
//     (shared COLORS/SIZES theme, stat cards, left-accent list rows)
//     rather than mirroring the student-side card style 1:1.
//
// Usable in two ways:
//   navigation.navigate('TutorProfile')              -> shows the logged-in
//                                                        tutor's own profile
//   navigation.navigate('TutorProfile', { tutorId })  -> shows any tutor's
//                                                        profile by id
// ---------------------------------------------------------------------------

const TutorProfileScreen = ({route, navigation}) => {
  const {user} = useAuth();
  const tutorId = route?.params?.tutorId || user?.uid;

  const [tutor, setTutor] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatchId, setExpandedBatchId] = useState(null);

  useEffect(() => {
    if (!tutorId) return;
    // Tutor-specific fields (qualification, subjects, bio, address,
    // experience, rating, reviewCount) live in `tutors/{uid}`, NOT
    // `users/{uid}` — `users` only has name/photoURL/email/role. Both are
    // needed to show a complete profile.
    const unsubUser = firestore()
      .collection('users')
      .doc(tutorId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            const {name, photoURL, email} = doc.data();
            setTutor(prev => ({...prev, id: tutorId, name, photoURL, email}));
          }
        },
        err => console.warn('Tutor user-doc fetch error:', err),
      );

    const unsubTutor = firestore()
      .collection('tutors')
      .doc(tutorId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            setTutor(prev => ({...prev, id: tutorId, ...doc.data()}));
          }
        },
        err => console.warn('Tutor info fetch error:', err),
      );

    return () => {
      unsubUser();
      unsubTutor();
    };
  }, [tutorId]);

  useEffect(() => {
    if (!tutorId) return;
    const unsubscribe = firestore()
      .collection('batches')
      .where('tutorId', '==', tutorId)
      .onSnapshot(
        snapshot => {
          setBatches(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
          setLoading(false);
        },
        err => {
          console.warn('Batches fetch error:', err);
          setLoading(false);
        },
      );
    return unsubscribe;
  }, [tutorId]);

  const toggleBatchExpand = batchId => {
    setExpandedBatchId(prev => (prev === batchId ? null : batchId));
  };

  const formatSchedule = batch => {
    const days = Array.isArray(batch.days) ? batch.days.join(', ') : '';
    return [days, batch.startTime].filter(Boolean).join(' \u2022 ') || 'To be announced';
  };

  const totalStudents = batches.reduce((acc, b) => acc + (b.studentCount || 0), 0);

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
        <Text style={styles.previewNote}>
          This is exactly how students see your public profile.
        </Text>

        {/* ---------------- Profile header card ---------------- */}
        {tutor && (
          <View style={styles.headerCard}>
            <View style={styles.avatarWrapper}>
              {tutor.photoURL ? (
                <Image source={{uri: tutor.photoURL}} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {(tutor.name || 'T')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              )}
            </View>

            <Text style={styles.tutorName}>{tutor.name}</Text>
            {!!tutor.qualification && (
              <Text style={styles.tutorQualification}>{tutor.qualification}</Text>
            )}

            <View style={styles.badge}>
              <Icon name="verified" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>Teacher</Text>
            </View>

            {!!tutor.bio && <Text style={styles.tutorBio}>{tutor.bio}</Text>}

            {!!tutor.address && (
              <View style={styles.locationRow}>
                <Icon name="place" size={16} color={COLORS.textSecondary} />
                <Text style={styles.locationText}>{tutor.address}</Text>
              </View>
            )}
          </View>
        )}

        {/* ---------------- Stat cards ---------------- */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, {borderLeftColor: COLORS.warning}]}>
            <Icon name="star" size={18} color={COLORS.warning} />
            <Text style={styles.statValue}>{tutor?.rating ? tutor.rating.toFixed(1) : 'New'}</Text>
            <Text style={styles.statLabel}>{tutor?.reviewCount ?? 0} reviews</Text>
          </View>
          <View style={[styles.statCard, {borderLeftColor: COLORS.primary}]}>
            <Icon name="menu-book" size={18} color={COLORS.primary} />
            <Text style={styles.statValue}>{batches.length}</Text>
            <Text style={styles.statLabel}>Batches</Text>
          </View>
          <View style={[styles.statCard, {borderLeftColor: COLORS.success}]}>
            <Icon name="people" size={18} color={COLORS.success} />
            <Text style={styles.statValue}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        {!!tutor?.experience && (
          <View style={styles.infoRow}>
            <Icon name="history" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{tutor.experience} experience</Text>
          </View>
        )}

        {!!tutor?.subjects && (
          <View style={styles.chipsWrap}>
            {tutor.subjects
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .map(s => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
          </View>
        )}

        {/* ---------------- Batches ---------------- */}
        <Text style={styles.sectionTitle}>My Batches</Text>

        {batches.map(batch => {
          const maxStudents = batch.maxStudents || 30;
          const studentCount = batch.studentCount || 0;
          const seatsLeft = Math.max(0, maxStudents - studentCount);
          const isExpanded = expandedBatchId === batch.id;

          return (
            <TouchableOpacity
              key={batch.id}
              activeOpacity={0.85}
              onPress={() => toggleBatchExpand(batch.id)}
              style={styles.batchCard}>
              <View style={styles.batchAccent} />

              <View style={styles.batchBody}>
                <View style={styles.batchTitleRow}>
                  <Text style={styles.batchTitle}>{batch.batchName || 'Batch'}</Text>
                  <Icon
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.metaRow}>
                  {!!batch.forClass && (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{batch.forClass}</Text>
                    </View>
                  )}
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>
                      {'\u20B9'}{batch.price ? `${batch.price}/mo` : 'Contact'}
                    </Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>
                      {studentCount}/{maxStudents} enrolled
                    </Text>
                  </View>
                </View>

                <View style={styles.detailLine}>
                  <Icon name="event" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>{formatSchedule(batch)}</Text>
                </View>

                {isExpanded && (
                  <>
                    {!!batch.medium && (
                      <View style={styles.detailLine}>
                        <Icon name="translate" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>Medium: {batch.medium}</Text>
                      </View>
                    )}
                    {!!batch.subjects && (
                      <View style={styles.detailLine}>
                        <Icon name="menu-book" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>Subjects: {batch.subjects}</Text>
                      </View>
                    )}
                    {!!batch.address && (
                      <View style={styles.detailLine}>
                        <Icon name="place" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{batch.address}</Text>
                      </View>
                    )}
                    <Text style={styles.seatsNote}>
                      {seatsLeft > 0 ? `${seatsLeft} seats remaining` : 'Batch full'}
                    </Text>
                  </>
                )}

                <Text style={styles.viewDetailsText}>
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {batches.length === 0 && (
          <Text style={styles.emptyText}>You haven't created any batches yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {color: COLORS.white, fontSize: SIZES.lg, ...FONTS.bold},
  scrollContent: {padding: 20, paddingBottom: 40},
  previewNote: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  avatarWrapper: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: {width: 78, height: 78},
  avatarInitials: {fontSize: SIZES.xl, color: COLORS.primary, ...FONTS.bold},
  tutorName: {fontSize: SIZES.xl, color: COLORS.text, ...FONTS.extraBold, textAlign: 'center'},
  tutorQualification: {fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center'},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeText: {color: COLORS.primary, fontSize: SIZES.xs, ...FONTS.semiBold},
  tutorBio: {fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 20},
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12},
  locationText: {fontSize: SIZES.sm, color: COLORS.textSecondary},
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    elevation: 1,
  },
  statValue: {fontSize: SIZES.lg, color: COLORS.text, ...FONTS.bold, marginTop: 4},
  statLabel: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 4},
  infoText: {fontSize: SIZES.sm, color: COLORS.textSecondary},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, paddingHorizontal: 4},
  chip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {color: COLORS.primaryDark, fontSize: SIZES.xs, ...FONTS.semiBold},
  sectionTitle: {fontSize: SIZES.lg, color: COLORS.text, ...FONTS.bold, marginBottom: 12},
  batchCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  batchAccent: {width: 5, backgroundColor: COLORS.primary},
  batchBody: {flex: 1, padding: 14},
  batchTitleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  batchTitle: {fontSize: SIZES.base, color: COLORS.text, ...FONTS.bold},
  metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8},
  metaPill: {backgroundColor: COLORS.background, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border},
  metaPillText: {fontSize: SIZES.xs, color: COLORS.text, ...FONTS.medium},
  detailLine: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8},
  detailText: {fontSize: SIZES.sm, color: COLORS.textSecondary},
  seatsNote: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 8, ...FONTS.medium},
  viewDetailsText: {fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.semiBold, marginTop: 10},
  emptyText: {textAlign: 'center', color: COLORS.textSecondary, marginTop: 30},
});

export default TutorProfileScreen;
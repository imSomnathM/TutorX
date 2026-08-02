// src/screens/student/TutorProfileScreen.js
import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {COLORS, SIZES} from '../../theme/colors';

// ---------------------------------------------------------------------------
// TutorProfileScreen (student side)
//
// Expects to be navigated to with: navigation.navigate('TutorProfile', { tutorId })
//
// Firestore structure:
// users/{uid}       -> { name, email, photoURL, role }
// tutors/{uid}       -> { qualification, subjects (comma string), experience,
//                          address, bio, location }
// batches/{batchId} -> { tutorId, batchName, forClass, subjects (comma string),
//                         medium, address, maxStudents, startDate, startTime,
//                         days: [], price, studentCount, tutorName }
// batchStudents/{id} -> { batchId, tutorId, studentId, studentName,
//                          email, phone, className, joinedAt }
// ---------------------------------------------------------------------------

const InfoPill = ({icon, label}) =>
  label ? (
    <View style={styles.infoPill}>
      <Icon name={icon} size={13} color={COLORS.white} />
      <Text style={styles.infoPillText} numberOfLines={1}>{label}</Text>
    </View>
  ) : null;

const BatchMetaRow = ({icon, label}) =>
  label ? (
    <View style={styles.batchMetaRow}>
      <Icon name={icon} size={16} color={COLORS.textSecondary} />
      <Text style={styles.batchMetaText}>{label}</Text>
    </View>
  ) : null;

export default function TutorProfileScreen({route, navigation}) {
  const {tutorId} = route.params || {};

  const [tutor, setTutor] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [expandedBatchId, setExpandedBatchId] = useState(null);

  const toggleBatchExpand = batchId => {
    setExpandedBatchId(prev => (prev === batchId ? null : batchId));
  };

  // ---- Fetch tutor profile: merge "users" (name/photo) + "tutors" (qualification/subjects/bio/address) ----
  useEffect(() => {
    if (!tutorId) return;
    const unsubUser = firestore()
      .collection('users')
      .doc(tutorId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            setTutor(prev => ({...(prev || {}), id: tutorId, ...doc.data()}));
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
            setTutor(prev => ({...(prev || {}), id: tutorId, ...doc.data()}));
          }
        },
        err => console.warn('Tutor profile-doc fetch error:', err),
      );

    return () => {
      unsubUser();
      unsubTutor();
    };
  }, [tutorId]);

  // ---- Fetch batches for this tutor (realtime, so seats refresh automatically) ----
  useEffect(() => {
    if (!tutorId) return;
    const unsubscribe = firestore()
      .collection('batches')
      .where('tutorId', '==', tutorId)
      .onSnapshot(
        snapshot => {
          const list = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
          setBatches(list);
          setLoading(false);
        },
        err => {
          console.warn('Batches fetch error:', err);
          setLoading(false);
        },
      );
    return () => unsubscribe();
  }, [tutorId]);

  // ---- Confirm + join a batch ----
  const handleJoinPress = useCallback(batch => {
    const maxStudents = batch.maxStudents || 30;
    const seatsAvailable = maxStudents - (batch.studentCount || 0);
    if (seatsAvailable <= 0) return;

    Alert.alert(
      'Join Batch',
      'Do you want to join this batch?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Join', onPress: () => joinBatch(batch)},
      ],
      {cancelable: true},
    );
  }, []);

  const joinBatch = useCallback(async batch => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to join a batch.');
      return;
    }

    setJoiningId(batch.id);
    try {
      // Prevent a student from joining the same batch twice
      const existing = await firestore()
        .collection('batchStudents')
        .where('batchId', '==', batch.id)
        .where('studentId', '==', currentUser.uid)
        .get();

      if (!existing.empty) {
        Alert.alert('Already Joined', 'You have already joined this batch.');
        setJoiningId(null);
        return;
      }

      // Pull a couple of profile details so the tutor's "Manage Students"
      // screen has something meaningful to show (class, phone, etc).
      let studentProfile = {};
      try {
        const profileSnap = await firestore().collection('students').doc(currentUser.uid).get();
        if (profileSnap.exists) studentProfile = profileSnap.data();
      } catch (_) {}

      await firestore().runTransaction(async transaction => {
        const batchRef = firestore().collection('batches').doc(batch.id);
        const batchSnap = await transaction.get(batchRef);

        if (!batchSnap.exists) {
          throw new Error('This batch no longer exists.');
        }

        const data = batchSnap.data();
        const maxStudents = data.maxStudents || 30;
        if ((data.studentCount || 0) >= maxStudents) {
          throw new Error('This batch is already full.');
        }

        // Create enrollment document in "batchStudents" — the SAME
        // collection ManageStudentsScreen, getStudentBatches, and
        // StudentProfileScreen all read from.
        const enrollmentRef = firestore().collection('batchStudents').doc();
        transaction.set(enrollmentRef, {
          batchId: batch.id,
          tutorId: data.tutorId,
          studentId: currentUser.uid,
          studentName: currentUser.displayName || 'Student',
          email: currentUser.email || '',
          phone: studentProfile.phone || '',
          className: studentProfile.className || '',
          joinedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Increase studentCount
        transaction.update(batchRef, {
          studentCount: firestore.FieldValue.increment(1),
        });
      });

      // onSnapshot listener above will refresh the UI automatically
      Alert.alert('Success', 'You have successfully joined this batch!');
    } catch (error) {
      Alert.alert('Could not join batch', error.message || 'Something went wrong.');
    } finally {
      setJoiningId(null);
    }
  }, []);

  const formatSchedule = batch => {
    const days = Array.isArray(batch.days) ? batch.days.join(', ') : '';
    const time = batch.startTime || '';
    return [days, time].filter(Boolean).join(' • ') || 'To be announced';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const initials = (tutor?.name || 'T')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const subjectList = tutor?.subjects
    ? tutor.subjects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>

        {/* ---------------- Header ---------------- */}
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            {tutor?.photoURL ? (
              <Image source={{uri: tutor.photoURL}} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={styles.tutorName}>{tutor?.name || 'Tutor'}</Text>
          {!!tutor?.qualification && (
            <Text style={styles.tutorQualification}>{tutor.qualification}</Text>
          )}

          <View style={styles.badgeRow}>
            <View style={styles.rolePill}>
              <Icon name="verified" size={13} color={COLORS.white} />
              <Text style={styles.rolePillText}>Certified Tutor</Text>
            </View>
            {tutor?.rating != null && (
              <View style={styles.rolePill}>
                <Icon name="star" size={13} color={COLORS.white} />
                <Text style={styles.rolePillText}>
                  {tutor.rating} ({tutor.reviewCount || 0})
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoPillRow}>
            <InfoPill icon="place" label={tutor?.address} />
            <InfoPill icon="work" label={tutor?.experience ? `${tutor.experience} Experience` : null} />
          </View>
        </View>

        {/* ---------------- About ---------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.bodyText}>
            {tutor?.bio || 'This tutor has not added a bio yet.'}
          </Text>
        </View>

        {/* ---------------- Subjects ---------------- */}
        {subjectList.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subjects</Text>
            <View style={styles.chips}>
              {subjectList.map(s => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ---------------- Available Batches ---------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Batches</Text>

          {batches.length === 0 && (
            <Text style={styles.emptyText}>No batches available right now.</Text>
          )}

          {batches.map((batch, index) => {
            const maxStudents = batch.maxStudents || 30;
            const studentCount = batch.studentCount || 0;
            const seatsAvailable = Math.max(0, maxStudents - studentCount);
            const isFull = seatsAvailable <= 0;
            const isJoining = joiningId === batch.id;
            const isExpanded = expandedBatchId === batch.id;

            return (
              <View key={batch.id}>
                {index > 0 && <View style={styles.batchDivider} />}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleBatchExpand(batch.id)}
                  style={styles.batchRow}
                >
                  <View style={styles.batchTitleRow}>
                    <Text style={styles.batchTitle} numberOfLines={1}>
                      {batch.batchName || 'Batch'}
                    </Text>
                    <Icon
                      name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={22}
                      color={COLORS.textSecondary}
                    />
                  </View>

                  <BatchMetaRow icon="school" label={batch.forClass} />
                  <BatchMetaRow icon="schedule" label={formatSchedule(batch)} />
                  <BatchMetaRow
                    icon="currency-rupee"
                    label={batch.price ? `₹${batch.price} / month` : 'Contact tutor for fee'}
                  />

                  {isExpanded && (
                    <>
                      <BatchMetaRow icon="language" label={batch.medium} />
                      <BatchMetaRow icon="menu-book" label={batch.subjects} />
                      <BatchMetaRow icon="place" label={batch.address} />
                    </>
                  )}

                  <View style={styles.seatRow}>
                    <View style={[styles.seatDot, {backgroundColor: isFull ? COLORS.error : COLORS.success}]} />
                    <Text style={[styles.seatText, {color: isFull ? COLORS.error : COLORS.success}]}>
                      {isFull ? 'Fully Booked' : `${seatsAvailable} Seats Left`}
                    </Text>
                  </View>

                  {isExpanded && (
                    <TouchableOpacity
                      disabled={isFull || isJoining}
                      onPress={() => handleJoinPress(batch)}
                      style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
                    >
                      {isJoining ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.joinButtonText}>
                          {isFull ? 'Batch Full' : 'Join Batch'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background},

  headerCard: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 26,
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {position: 'absolute', top: 14, left: 16, padding: 8, zIndex: 1},

  avatarWrap: {marginBottom: 12},
  avatar: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  avatarImage: {width: 92, height: 92, borderRadius: 46, elevation: 4},
  avatarText: {fontSize: 36, fontWeight: '800', color: COLORS.primary},

  tutorName: {fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white, textAlign: 'center'},
  tutorQualification: {
    fontSize: SIZES.md, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center',
  },

  badgeRow: {flexDirection: 'row', gap: 8, marginTop: 12},
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  rolePillText: {color: COLORS.white, fontWeight: '600', fontSize: SIZES.sm},

  infoPillRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12},
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    maxWidth: 220,
  },
  infoPillText: {color: COLORS.white, fontSize: SIZES.xs, fontWeight: '500'},

  card: {
    margin: 16, marginBottom: 0, backgroundColor: COLORS.surface,
    borderRadius: 18, padding: 18, elevation: 2,
  },
  cardTitle: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 12},
  bodyText: {fontSize: SIZES.md, color: COLORS.textSecondary, lineHeight: 21},

  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6},
  chipText: {color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm},

  emptyText: {fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 12},

  batchDivider: {height: 1, backgroundColor: COLORS.border, marginVertical: 16},
  batchRow: {},
  batchTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  batchTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8},

  batchMetaRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  batchMetaText: {fontSize: SIZES.sm, color: COLORS.textSecondary, flex: 1},

  seatRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 4},
  seatDot: {width: 8, height: 8, borderRadius: 4},
  seatText: {fontSize: SIZES.sm, fontWeight: '700'},

  joinButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginTop: 12,
  },
  joinButtonDisabled: {backgroundColor: COLORS.textSecondary},
  joinButtonText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.md},
});
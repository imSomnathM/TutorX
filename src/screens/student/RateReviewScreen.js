// src/screens/student/RateReviewScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES, FONTS} from '../../theme/colors';
import {useAuth} from '../../context/AuthContext';
import {submitRating} from '../../firebase/firestore';

// ---------------------------------------------------------------------------
// RateReviewScreen
//
// navigation.navigate('RateReview', {
//   tutorId, tutorName, batchId, batchName, existingRating? (number)
// })
//
// A student can rate/review a tutor once per batch they've joined. The
// average is recalculated on the tutor's `tutors/{tutorId}` doc as soon as
// this is submitted (see firestore.js -> submitRating).
// ---------------------------------------------------------------------------

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const RateReviewScreen = ({route, navigation}) => {
  const {tutorId, tutorName, batchId, batchName, existingRating} = route.params || {};
  const {user} = useAuth();

  const [rating, setRating] = useState(existingRating || 0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Select a rating', 'Please tap a star to rate this tutor before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await submitRating({
        tutorId,
        studentId: user.uid,
        batchId,
        batchName,
        rating,
        review: review.trim(),
      });
      Alert.alert('Thank you!', 'Your rating has been submitted.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      Alert.alert('Something went wrong', e.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Rate & Review</Text>
        <View style={{width: 34}} />
      </View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.tutorCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(tutorName || 'T')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.tutorName}>{tutorName || 'Tutor'}</Text>
              <Text style={styles.batchName}>{batchName}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>How was your experience?</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                <Icon
                  name={i <= rating ? 'star' : 'star-outline'}
                  size={42}
                  color={COLORS.warning}
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>}

          <Text style={styles.sectionLabel}>Write a review (optional)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share details about the teaching quality, punctuality, and how the batch was conducted..."
            placeholderTextColor={COLORS.textSecondary}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {existingRating ? 'Update Rating' : 'Submit Rating'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
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
  content: {flex: 1, padding: 20},
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 28,
    elevation: 2,
    gap: 14,
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {color: COLORS.primary, fontSize: SIZES.lg, ...FONTS.bold},
  tutorName: {fontSize: SIZES.base, color: COLORS.text, ...FONTS.bold},
  batchName: {fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2},
  sectionLabel: {fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.semiBold, marginBottom: 12},
  starsRow: {flexDirection: 'row', justifyContent: 'center', marginBottom: 8},
  star: {marginHorizontal: 4},
  ratingLabel: {
    textAlign: 'center', color: COLORS.warning, ...FONTS.bold,
    fontSize: SIZES.base, marginBottom: 28,
  },
  reviewInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: SIZES.md,
    color: COLORS.text,
    minHeight: 120,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
  },
  submitBtnDisabled: {backgroundColor: COLORS.textSecondary},
  submitBtnText: {color: COLORS.white, fontSize: SIZES.base, ...FONTS.bold},
});

export default RateReviewScreen;
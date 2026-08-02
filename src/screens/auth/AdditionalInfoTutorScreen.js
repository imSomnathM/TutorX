// src/screens/auth/AdditionalInfoTutorScreen.js
import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, 
  Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import {saveTutorInfo} from '../../firebase/firestore';
import {useAuth} from '../../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import LocationService from '../../services/LocationService';
import auth from '@react-native-firebase/auth';

const SUBJECT_OPTIONS = ['Math','Physics','Chemistry','Biology','History','Geography','English','Bengali','Hindi','Computer Science'];

const AdditionalInfoTutorScreen = ({route}) => {
  // const {uid} = route.params;
  // const {setRole} = useAuth();

  const {refreshUserData, user} = useAuth();
  // `user` comes from AuthContext's onAuthStateChanged listener — the same
  // event that caused this screen to be rendered in the first place, so
  // it's guaranteed to be set by the time we get here. Calling
  // auth().currentUser directly here instead can momentarily return null
  // right after sign-in (the native module hasn't caught up yet), which
  // was crashing this screen with "Cannot read property 'uid' of null".
  const uid = user?.uid ?? auth().currentUser?.uid;

  const [qualification, setQualification] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const toggleSubject = subj => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj],
    );
  };

  // Extra safety net: on the off chance uid still isn't ready on the very
  // first render, don't crash — just render nothing for a beat. This
  // should resolve itself within a frame since `user` is already set by
  // the time RootNavigator routes here.
  if (!uid) {
    return null;
  }

  const handleFinish = async () => {
    if (!qualification.trim()) return Alert.alert('Error', 'Qualification is required');
    if (selectedSubjects.length === 0) return Alert.alert('Error', 'Select at least one subject');
    if (!phone.trim()) return Alert.alert('Error', 'Phone number is required');
    if (!/^\d{10}$/.test(phone.trim())) return Alert.alert('Error', 'Enter a valid 10-digit phone number');
    if (!address.trim()) return Alert.alert('Error', 'Tuition address is required');
    if (!location) return Alert.alert('Error', 'Please capture your teaching location');

    setLoading(true);
    try {
      await saveTutorInfo(uid, {
        qualification: qualification.trim(),
        subjects: selectedSubjects.join(', '),
        experience: experience.trim(),
        address: address.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          source: location.source,
        },
        updatedAt: new Date().toISOString(),
      });
    //   await firestore().collection("users").doc(uid).update({
    //     profileCompleted: true,
    // });
    //   await firestore().collection('users').doc(uid).update({role: 'tutor'});
      // setRole('tutor');
      await firestore().collection('users').doc(uid).update({role:'teacher',profileCompleted:true,});
      await refreshUserData();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleGetLocation = async () => {
  try {
    setLocationLoading(true);

    const result = await LocationService.getCurrentLocation();

    setLocation(result);

    Alert.alert(
      'Location Added',
      result.source === 'gps'
        ? 'GPS location captured successfully.'
        : 'Approximate location captured using IP.',
    );
  } catch (error) {
    Alert.alert('Error', 'Unable to get location.');
  } finally {
    setLocationLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBg}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>TX</Text>
            </View>
            <Text style={styles.title}>Setup Your Profile</Text>
            <Text style={styles.subtitle}>Help students discover you</Text>
            <View style={styles.badge}>
              <Icon name="person" size={14} color={COLORS.white} />
              <Text style={styles.badgeText}>Teacher</Text>
            </View>
          </View>

          <View style={styles.card}>
            <CustomInput
              label="Qualification *"
              placeholder="e.g. M.Sc in Mathematics"
              value={qualification}
              onChangeText={setQualification}
              iconName="school"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Subjects You Can Teach *</Text>
            <View style={styles.chipsWrap}>
              {SUBJECT_OPTIONS.map(s => (
                <Text
                  key={s}
                  onPress={() => toggleSubject(s)}
                  style={[styles.chip, selectedSubjects.includes(s) && styles.chipActive]}>
                  {s}
                </Text>
              ))}
            </View>

            <CustomInput
              label="Teaching Experience"
              placeholder="e.g. 5 years"
              value={experience}
              onChangeText={setExperience}
              iconName="history"
              style={{marginTop: 14}}
            />

            <CustomInput
              label="Phone Number *"
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))}
              iconName="phone"
              keyboardType="phone-pad"
              maxLength={10}
              style={{marginTop: 14}}
            />

            <CustomInput
              label="Tuition Address *"
              placeholder="e.g. 12/A, Puabagan, Bankura"
              value={address}
              onChangeText={setAddress}
              iconName="place"
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>Teaching Location *</Text>

            <CustomButton
              title={
                locationLoading
                  ? 'Getting Location...'
                  : location
                  ? 'Location Captured'
                  : 'Use Current Location'
              }
              iconName="my-location"
              onPress={handleGetLocation}
              loading={locationLoading}
            />

            {location && (
              <View style={{marginTop: 10}}>
                <Text style={{color: 'green', fontWeight: '600'}}>
                  ✓ {location.source === 'gps'
                      ? 'GPS Location Captured'
                      : 'Approximate Location Captured'}
                </Text>
              </View>
            )}

            <CustomInput
              label="Bio (optional)"
              placeholder="Write a short description about yourself..."
              value={bio}
              onChangeText={setBio}
              iconName="edit"
              multiline
            />

            <CustomButton
              title="Complete Setup"
              onPress={handleFinish}
              loading={loading}
              iconName="check-circle"
              iconRight
              style={{marginTop: 8}}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  container: {flexGrow: 1},
  topBg: {backgroundColor: COLORS.primary, paddingTop: 40, paddingBottom: 50, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40},
  logoCircle: {width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 4},
  logoText: {color: COLORS.primary, fontWeight: '800', fontSize: 24},
  title: {fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white, marginBottom: 6},
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.85)', marginBottom: 10},
  badge: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20},
  badgeText: {color: COLORS.white, fontWeight: '600', fontSize: SIZES.sm},
  card: {backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 24, padding: 22, marginTop: -20, elevation: 8, marginBottom: 30},
  fieldLabel: {fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background, fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text, overflow: 'hidden'},
  chipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary, color: COLORS.white},
});

export default AdditionalInfoTutorScreen;
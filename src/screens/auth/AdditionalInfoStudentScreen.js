// src/screens/auth/AdditionalInfoStudentScreen.js
import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, StatusBar, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import {saveStudentInfo} from '../../firebase/firestore';
import {useAuth} from '../../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CLASS_OPTIONS = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const MEDIUM_OPTIONS = ['Bengali','English','Hindi'];
const SUBJECT_OPTIONS = ['Math','Physics','Chemistry','Biology','History','Geography','English','Bengali','Hindi','Computer Science'];

const AdditionalInfoStudentScreen = ({route, navigation}) => {
  // const {uid} = route.params;
  // const {setRole} = useAuth();/

  const {refreshUserData, user, userData} = useAuth();
  // `user` comes from AuthContext's onAuthStateChanged listener — the same
  // event that caused this screen to be rendered in the first place, so
  // it's guaranteed to be set by the time we get here. Calling
  // auth().currentUser directly here instead can momentarily return null
  // right after sign-in (the native module hasn't caught up yet), which
  // was crashing this screen with "Cannot read property 'uid' of null".
  const uid = user?.uid ?? auth().currentUser?.uid;

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [address, setAddress] = useState('');
  // If the student signed up manually, their phone was already collected
  // and saved to users/{uid}.phone on the sign-up page — no need to ask
  // again here, just reuse it (read-only). Google sign-in never collects
  // a phone number, so users/{uid}.phone is blank in that case and this
  // field stays editable/required.
  const [phone, setPhone] = useState(userData?.phone || '');
  const phoneLocked = !!userData?.phone;
  const [selectedMedium, setSelectedMedium] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const toggleSubject = subj => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj],
    );
  };

  useEffect(() => {
    if (userData?.phone && !phone) setPhone(userData.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Extra safety net: on the off chance uid still isn't ready on the very
  // first render, don't crash — just render nothing for a beat. This
  // should resolve itself within a frame since `user` is already set by
  // the time RootNavigator routes here.
  if (!uid) {
    return null;
  }

  const handleFinish = async () => {
    if (!selectedClass) return Alert.alert('Error', 'Please select your class');
    if (selectedSubjects.length === 0) return Alert.alert('Error', 'Select at least one subject');
    if (!phone.trim()) return Alert.alert('Error', 'Phone number is required');
    if (!phoneLocked && !/^\d{10}$/.test(phone.trim())) {
      return Alert.alert('Error', 'Enter a valid 10-digit phone number');
    }
    if (!address.trim()) return Alert.alert('Error', 'Address is required');
    if (!selectedMedium) return Alert.alert('Error', 'Please select a medium');

    setLoading(true);
    try {
      await saveStudentInfo(uid, {
        className: selectedClass,
        subjects: selectedSubjects.join(', '),
        phone: phone.trim(),
        address: address.trim(),
        medium: selectedMedium,
        updatedAt: new Date().toISOString(),
      });
      // await firestore().collection('users').doc(uid).update({role: 'student'});
      // setRole('student');
    //   await firestore().collection("users").doc(uid).update({
    //     profileCompleted: true,
    // });
    await firestore().collection('users').doc(uid).update({role:'student',profileCompleted:true,});
    await refreshUserData();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBg}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>TX</Text>
            </View>
            <Text style={styles.title}>Almost There!</Text>
            <Text style={styles.subtitle}>Tell us a bit more about yourself</Text>
            <View style={styles.badge}>
              <Icon name="school" size={14} color={COLORS.white} />
              <Text style={styles.badgeText}>Student</Text>
            </View>
          </View>

          <View style={styles.card}>
            {/* Class Selector */}
            <Text style={styles.fieldLabel}>Your Class *</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowClassPicker(!showClassPicker)}>
              <Icon name="format-list-numbered" size={20} color={COLORS.textSecondary} style={{marginRight: 10}} />
              <Text style={[styles.selectText, !selectedClass && {color: COLORS.textSecondary}]}>
                {selectedClass || 'Select your class'}
              </Text>
              <Icon name={showClassPicker ? 'expand-less' : 'expand-more'} size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {showClassPicker && (
              <View style={styles.pickerDropdown}>
                <ScrollView style={{maxHeight: 180}} nestedScrollEnabled>
                  {CLASS_OPTIONS.map(cls => (
                    <TouchableOpacity
                      key={cls}
                      style={[styles.pickerItem, selectedClass === cls && styles.pickerItemActive]}
                      onPress={() => {setSelectedClass(cls); setShowClassPicker(false);}}>
                      <Text style={[styles.pickerItemText, selectedClass === cls && {color: COLORS.primary, fontWeight: '700'}]}>
                        {cls}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Subjects */}
            <Text style={[styles.fieldLabel, {marginTop: 14}]}>Subjects You Study *</Text>
            <View style={styles.chipsWrap}>
              {SUBJECT_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, selectedSubjects.includes(s) && styles.chipActive]}
                  onPress={() => toggleSubject(s)}>
                  <Text style={[styles.chipText, selectedSubjects.includes(s) && {color: COLORS.white}]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Phone */}
            <CustomInput
              label={phoneLocked ? 'Phone Number' : 'Phone Number *'}
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))}
              iconName={phoneLocked ? 'lock' : 'phone'}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!phoneLocked}
              style={{marginTop: 14}}
            />
            {phoneLocked && (
              <Text style={styles.helperText}>
                This is the number you used to sign up.
              </Text>
            )}

            {/* Address */}
            <CustomInput
              label="Your Address *"
              placeholder="e.g. 12/A, Puabagan, Bankura"
              value={address}
              onChangeText={setAddress}
              iconName="place"
              autoCapitalize="words"
              style={{marginTop: 14}}
            />

            {/* Medium */}
            <Text style={styles.fieldLabel}>Medium of Instruction *</Text>
            <View style={styles.mediumRow}>
              {MEDIUM_OPTIONS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.mediumBtn, selectedMedium === m && styles.mediumBtnActive]}
                  onPress={() => setSelectedMedium(m)}>
                  <View style={[styles.radio, selectedMedium === m && styles.radioActive]} />
                  <Text style={[styles.mediumText, selectedMedium === m && {color: COLORS.primary}]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomButton title="Complete Setup" onPress={handleFinish} loading={loading} style={{marginTop: 20}} iconName="check-circle" iconRight />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  container: {flexGrow: 1},
  topBg: {
    backgroundColor: COLORS.secondary,
    paddingTop: 40,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoCircle: {width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 4},
  logoText: {color: COLORS.secondary, fontWeight: '800', fontSize: 24},
  title: {fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white, marginBottom: 6},
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.85)', marginBottom: 10},
  badge: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20},
  badgeText: {color: COLORS.white, fontWeight: '600', fontSize: SIZES.sm},
  card: {backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 24, padding: 22, marginTop: -20, elevation: 8, marginBottom: 30},
  fieldLabel: {fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8},
  selectBtn: {flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 4},
  selectText: {flex: 1, fontSize: SIZES.md, color: COLORS.text},
  pickerDropdown: {backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, overflow: 'hidden', elevation: 4},
  pickerItem: {paddingHorizontal: 16, paddingVertical: 12},
  pickerItemActive: {backgroundColor: COLORS.primaryLight},
  pickerItemText: {fontSize: SIZES.md, color: COLORS.text},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background},
  chipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  chipText: {fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text},
  mediumRow: {flexDirection: 'row', gap: 10, marginBottom: 4},
  mediumBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 10, backgroundColor: COLORS.background},
  mediumBtnActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  radio: {width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border},
  radioActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primary},
  mediumText: {fontSize: SIZES.sm, fontWeight: '500', color: COLORS.textSecondary},
  helperText: {fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: -10, marginBottom: 12, marginLeft: 4},
});

export default AdditionalInfoStudentScreen;
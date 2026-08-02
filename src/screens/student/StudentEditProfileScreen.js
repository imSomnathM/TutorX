// src/screens/student/StudentEditProfileScreen.js
import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
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
import {getStudentProfile, updateStudentProfile} from '../../firebase/firestore';
import {useAuth} from '../../context/AuthContext';

const CLASS_OPTIONS = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const MEDIUM_OPTIONS = ['Bengali', 'English', 'Hindi'];
const SUBJECT_OPTIONS = ['Math','Physics','Chemistry','Biology','History','Geography','English','Bengali','Hindi','Computer Science'];

const StudentEditProfileScreen = ({navigation}) => {
  const {user} = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const loadProfile = () => {
    setPageLoading(true);
    setLoadError(false);

    if (!user) {
      setPageLoading(false);
      return;
    }

    setName(user.displayName || '');

    // A plain Firestore .get() has no built-in timeout — on a slow/offline
    // connection it can hang indefinitely, leaving the spinner stuck forever.
    // Race it against a 15s timer so the user always gets feedback.
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 15000),
    );

    Promise.race([getStudentProfile(user.uid), timeout])
      .then(snap => {
        if (snap.exists) {
          const d = snap.data();
          setPhone(d.phone || '');
          setAddress(d.address || '');
          setSelectedClass(d.className || '');
          setSelectedMedium(d.medium || '');
          setSelectedSubjects(d.subjects ? d.subjects.split(',').map(s => s.trim()) : []);
        }
      })
      .catch(e => {
        console.warn('Failed to load student profile:', e);
        setLoadError(true);
      })
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleSubject = s => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    setLoading(true);
    try {
      await user.updateProfile({displayName: name.trim()});
      await updateStudentProfile(user.uid, {
        phone: phone.trim(),
        address: address.trim(),
        className: selectedClass,
        medium: selectedMedium,
        subjects: selectedSubjects.join(', '),
        updatedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  if (pageLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Icon name="refresh" size={30} color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
          <Icon name="wifi-off" size={40} color={COLORS.textSecondary} />
          <Text style={{marginTop: 12, marginBottom: 20, textAlign: 'center', color: COLORS.textSecondary}}>
            Couldn't load your profile. Please check your connection and try again.
          </Text>
          <CustomButton title="Retry" onPress={loadProfile} iconName="refresh" />
          <CustomButton title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={styles.avatarArea}>
            <View style={[styles.avatar, {backgroundColor: COLORS.secondary}]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.photoBtn}>
              <Icon name="photo-camera" size={16} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <CustomInput label="Full Name" placeholder="Your full name" value={name} onChangeText={setName} iconName="person" autoCapitalize="words" />
            <CustomInput label="Email" placeholder="Email" value={user?.email || ''} editable={false} iconName="email" />
            <CustomInput label="Phone Number" placeholder="Your phone number" value={phone} onChangeText={setPhone} iconName="phone" keyboardType="phone-pad" maxLength={10} />
            <CustomInput label="Address" placeholder="Your home address" value={address} onChangeText={setAddress} iconName="place" autoCapitalize="words" />
          </View>

          {/* Academic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Information</Text>

            <Text style={styles.fieldLabel}>Class</Text>
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
              <View style={styles.dropdown}>
                <ScrollView style={{maxHeight: 180}} nestedScrollEnabled>
                  {CLASS_OPTIONS.map(cls => (
                    <TouchableOpacity
                      key={cls}
                      style={[styles.dropdownItem, selectedClass === cls && styles.dropdownItemActive]}
                      onPress={() => {setSelectedClass(cls); setShowClassPicker(false);}}>
                      <Text style={[styles.dropdownText, selectedClass === cls && {color: COLORS.primary, fontWeight: '700'}]}>
                        {cls}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.fieldLabel, {marginTop: 14}]}>Medium</Text>
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

            <Text style={[styles.fieldLabel, {marginTop: 14}]}>Subjects</Text>
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
          </View>

          <View style={styles.section}>
            <CustomButton title="Save Changes" onPress={handleSave} loading={loading} iconName="save" iconRight />
            <CustomButton title="Cancel" onPress={() => navigation.goBack()} variant="outline" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface, elevation: 2,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {padding: 4},
  pageTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  saveBtn: {backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10},
  saveBtnText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.sm},
  container: {paddingBottom: 40},
  avatarArea: {
    alignItems: 'center', paddingVertical: 24,
    backgroundColor: COLORS.surface, marginBottom: 16,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, elevation: 4,
  },
  avatarText: {fontSize: 38, fontWeight: '800', color: COLORS.white},
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  photoBtnText: {color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm},
  section: {
    backgroundColor: COLORS.surface, marginHorizontal: 16,
    marginBottom: 14, borderRadius: 18, padding: 18, elevation: 1,
  },
  sectionTitle: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 16},
  fieldLabel: {fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8},
  selectBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 4,
  },
  selectText: {flex: 1, fontSize: SIZES.md, color: COLORS.text},
  dropdown: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 8, overflow: 'hidden', elevation: 4,
  },
  dropdownItem: {paddingHorizontal: 16, paddingVertical: 12},
  dropdownItemActive: {backgroundColor: COLORS.primaryLight},
  dropdownText: {fontSize: SIZES.md, color: COLORS.text},
  mediumRow: {flexDirection: 'row', gap: 10},
  mediumBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    padding: 10, backgroundColor: COLORS.background,
  },
  mediumBtnActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  radio: {width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border},
  radioActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primary},
  mediumText: {fontSize: SIZES.sm, fontWeight: '500', color: COLORS.textSecondary},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  chipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  chipText: {fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text},
});

export default StudentEditProfileScreen;

// src/screens/tutor/TutorEditProfileScreen.js
import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
   Alert, StatusBar, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {COLORS, SIZES} from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import {getTutorProfile, updateTutorProfile, updateUserData} from '../../firebase/firestore';
import {uploadProfilePhoto} from '../../firebase/storage';
import {useAuth} from '../../context/AuthContext';

const SUBJECT_OPTIONS = ['Math','Physics','Chemistry','Biology','History','Geography','English','Bengali','Hindi','Computer Science'];

const TutorEditProfileScreen = ({navigation}) => {
  const {user, userData, refreshUserData} = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

    Promise.race([getTutorProfile(user.uid), timeout])
      .then(snap => {
        if (snap.exists) {
          const d = snap.data();
          setPhone(d.phone || '');
          setBio(d.bio || '');
          setSelectedSubjects(d.subjects ? d.subjects.split(',').map(s => s.trim()) : []);
          setQualification(d.qualification || '');
          setExperience(d.experience || '');
          setAddress(d.address || '');
        }
      })
      .catch(e => {
        console.warn('Failed to load tutor profile:', e);
        setLoadError(true);
      })
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (userData?.photoURL) setPhotoURL(userData.photoURL);
  }, [userData]);

  const toggleSubject = subj => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj],
    );
  };

  const handleChangePhoto = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      {text: 'Take Photo', onPress: () => pickImage('camera')},
      {text: 'Choose from Gallery', onPress: () => pickImage('gallery')},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const pickImage = async source => {
    const options = {mediaType: 'photo', quality: 0.7, maxWidth: 800, maxHeight: 800};
    const result =
      source === 'camera' ? await launchCamera(options) : await launchImageLibrary(options);

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Could not access camera/gallery.');
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setUploadingPhoto(true);
    try {
      const url = await uploadProfilePhoto(asset.uri);
      // photoURL lives on the `users/{uid}` doc (shared by every screen that
      // shows this person's avatar), not on `tutors/{uid}`, so update it there.
      await updateUserData(user.uid, {photoURL: url});
      setPhotoURL(url);
      await refreshUserData();
    } catch (e) {
      Alert.alert('Upload failed', e.message || 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    setLoading(true);
    try {
      await user.updateProfile({displayName: name.trim()});
      await updateTutorProfile(user.uid, {
        phone: phone.trim(),
        bio: bio.trim(),
        subjects: selectedSubjects.join(', '),
        qualification: qualification.trim(),
        experience: experience.trim(),
        address: address.trim(),
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
    return <SafeAreaView style={styles.safe}><View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Icon name="refresh" size={30} color={COLORS.primary} /></View></SafeAreaView>;
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

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarArea}>
            <View style={styles.avatar}>
              {photoURL ? (
                <Image source={{uri: photoURL}} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              {uploadingPhoto && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.photoBtn} onPress={handleChangePhoto} disabled={uploadingPhoto}>
              <Icon name="photo-camera" size={16} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>{photoURL ? 'Change Photo' : 'Add Photo'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <CustomInput label="Full Name" placeholder="Your full name" value={name} onChangeText={setName} iconName="person" autoCapitalize="words" />
            <CustomInput label="Email" placeholder="Email" value={user?.email || ''} editable={false} iconName="email" />
            <CustomInput label="Phone Number" placeholder="Your phone number" value={phone} onChangeText={setPhone} iconName="phone" keyboardType="phone-pad" maxLength={10} />
            <CustomInput label="Bio" placeholder="Write something about yourself..." value={bio} onChangeText={setBio} iconName="edit" multiline />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Information</Text>
            <CustomInput label="Qualification" placeholder="e.g. M.Sc in Mathematics" value={qualification} onChangeText={setQualification} iconName="school" />
            <CustomInput label="Experience" placeholder="e.g. 5 years" value={experience} onChangeText={setExperience} iconName="history" />
            <CustomInput label="Tuition Address" placeholder="Your tuition center address" value={address} onChangeText={setAddress} iconName="place" autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Subjects You Teach</Text>
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
  topBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.surface, elevation: 2, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  backBtn: {padding: 4},
  pageTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  saveBtn: {backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10},
  saveBtnText: {color: COLORS.white, fontWeight: '700', fontSize: SIZES.sm},
  container: {paddingBottom: 40},
  avatarArea: {alignItems: 'center', paddingVertical: 24, backgroundColor: COLORS.surface, marginBottom: 16},
  avatar: {width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 4, overflow: 'hidden'},
  avatarImage: {width: 96, height: 96},
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {fontSize: 38, fontWeight: '800', color: COLORS.white},
  photoBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10},
  photoBtnText: {color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm},
  section: {backgroundColor: COLORS.surface, marginHorizontal: 16, marginBottom: 14, borderRadius: 18, padding: 18, elevation: 1},
  sectionTitle: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 16},
  fieldLabel: {fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 10},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background},
  chipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  chipText: {fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text},
});

export default TutorEditProfileScreen;
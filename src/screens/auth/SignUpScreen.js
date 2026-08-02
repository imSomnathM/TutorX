// src/screens/auth/SignUpScreen.js
import React, {useState} from 'react';
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
import {signUpWithEmail, signInWithGoogle, signOut} from '../../firebase/auth';
import {saveUserBase, getUserData} from '../../firebase/firestore';
import {useAuth} from '../../context/AuthContext';

const SignUpScreen = ({navigation}) => {
  const {refreshUserData} = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!phone.trim()) e.phone = 'Phone is required';
    else if (phone.trim().length < 10) e.phone = 'Enter a valid phone number';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await signUpWithEmail(name.trim(), email.trim(), password);
      await saveUserBase(user.uid, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        profileCompleted: false,
        createdAt: new Date().toISOString(),
      });

      // AuthContext's onAuthStateChanged listener fires as soon as the
      // account is created (before this Firestore write above finishes),
      // so it can end up reading the user doc too early and seeing
      // role = null (defaulting the profile-setup screen to Student).
      // Force a re-read now that the doc is guaranteed to have the
      // correct role saved.
      await refreshUserData();
    } catch (e) {
      Alert.alert('Sign Up Failed', e.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithGoogle();

      // Google always signs in to the SAME Firebase account for a given
      // email, so if a user doc already exists for this uid, this person
      // already signed up before (via Google or email/password). Don't let
      // them "sign up" again from this screen — that would silently wipe
      // out their existing role/profileCompleted data.
      const existingSnap = await getUserData(cred.user.uid);

      if (existingSnap.exists) {
        await signOut();
        Alert.alert(
          'Account Already Exists',
          'An account with this Google email already exists. Please use "Sign in with Google" on the Login screen instead.',
        );
        return;
      }

      await saveUserBase(cred.user.uid, {
        name: cred.user.displayName || '',
        email: cred.user.email || '',
        phone: '',
        role,
        profileCompleted: false,
        createdAt: new Date().toISOString(),
      });

      // Same race as the email sign-up flow above: force a re-read so the
      // role picked here ('teacher'/'student') is reflected immediately
      // instead of whatever AuthContext saw before this write finished.
      await refreshUserData();
    } catch (e) {
      if (e.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign Up Failed', e.message);
      }
    }
    setGoogleLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topBg}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>TX</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join TutorX as a Student or Teacher</Text>
          </View>

          <View style={styles.card}>
            {/* Role selector */}
            <Text style={styles.roleLabel}>I am a</Text>
            <View style={styles.roleRow}>
              {['student', 'teacher'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, role === r && styles.roleActive]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}>
                  <Icon
                    name={r === 'student' ? 'school' : 'person'}
                    size={22}
                    color={role === r ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={t => {setName(t); setErrors(p => ({...p, name: ''}));}}
              iconName="person"
              autoCapitalize="words"
              error={errors.name}
            />
            <CustomInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={t => {setEmail(t); setErrors(p => ({...p, email: ''}));}}
              iconName="email"
              keyboardType="email-address"
              error={errors.email}
            />
            <CustomInput
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={t => {setPhone(t); setErrors(p => ({...p, phone: ''}));}}
              iconName="phone"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />
            <CustomInput
              label="Password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChangeText={t => {setPassword(t); setErrors(p => ({...p, password: ''}));}}
              iconName="lock"
              secureTextEntry
              error={errors.password}
            />

            <CustomButton
              title="Sign Up"
              onPress={handleSignUp}
              loading={loading}
              iconName="person-add"
              iconRight
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <CustomButton
              title="Sign Up with Google"
              onPress={handleGoogleSignUp}
              loading={googleLoading}
              variant="outline"
              iconName="language"
            />

            <TouchableOpacity
              style={styles.loginRow}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
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
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: {position: 'absolute', top: 14, left: 16, padding: 6},
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    marginBottom: 12,
  },
  logoText: {color: COLORS.primary, fontWeight: '800', fontSize: 26},
  title: {fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white, marginBottom: 6},
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 20},
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 22,
    marginTop: -20,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    marginBottom: 30,
  },
  roleLabel: {fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 10},
  roleRow: {flexDirection: 'row', gap: 12, marginBottom: 18},
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  roleActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  roleText: {color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.md},
  roleTextActive: {color: COLORS.white},
  divider: {flexDirection: 'row', alignItems: 'center', marginVertical: 14},
  line: {flex: 1, height: 1, backgroundColor: COLORS.border},
  orText: {marginHorizontal: 12, color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.sm},
  loginRow: {flexDirection: 'row', justifyContent: 'center', marginTop: 6},
  loginText: {color: COLORS.textSecondary, fontSize: SIZES.sm},
  loginLink: {color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm},
});

export default SignUpScreen;
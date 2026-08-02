// src/screens/auth/LoginScreen.js
import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
   Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {COLORS, SIZES} from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import {signInWithEmail, signInWithGoogle, signOut} from '../../firebase/auth';
import {getUserData} from '../../firebase/firestore';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await signInWithEmail(email.trim(), password);

      
    } catch (e) {
      Alert.alert(
        'Login Failed',
        e.message.replace('Firebase: ', ''),
      );
    }

  setLoading(false);
};

  const handleGoogle = async () => {
    setGoogleLoading(true);

    try {
      // Actually perform the Google sign-in first — this was missing before,
      // which is why 'cred' didn't exist and threw the crash.
      const cred = await signInWithGoogle();

      const snap = await getUserData(cred.user.uid);

      if (!snap.exists) {
        // This Google account has never signed up with TutorX before.
        // Sign them back out immediately and send them to Sign Up instead.
        await signOut();

        Alert.alert(
          'Account Not Found',
          'No account is registered with this Google account. Please sign up first.',
        );

        return;
      }

      // Existing users: AuthContext's onAuthStateChanged listener will
      // automatically detect the signed-in user and route them in.
    } catch (e) {
      if (e.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign In Failed', e.message);
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
          {/* Curved top background */}
          <View style={styles.topBg}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>TX</Text>
            </View>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome back! Please sign in to continue</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <CustomInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={t => {setEmail(t); setErrors(p => ({...p, email: ''}));}}
              iconName="email"
              keyboardType="email-address"
              error={errors.email}
              autoCapitalize="none"
            />
            <CustomInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={t => {setPassword(t); setErrors(p => ({...p, password: ''}));}}
              iconName="lock"
              secureTextEntry
              error={errors.password}
            />

            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setRemember(!remember)}
                style={styles.checkRow}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <View style={[styles.checkbox, remember && styles.checked]}>
                  {remember && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              iconName="login"
              iconRight
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <CustomButton
              title="Sign in with Google"
              onPress={handleGoogle}
              loading={googleLoading}
              variant="outline"
              iconName="language"
            />

            <TouchableOpacity
              style={styles.signupRow}
              onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupText}>New Here? </Text>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  logoText: {color: COLORS.primary, fontWeight: '800', fontSize: 26},
  title: {fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.white, marginBottom: 6},
  subtitle: {fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center'},
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
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18},
  checkRow: {flexDirection: 'row', alignItems: 'center'},
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  checkMark: {color: COLORS.white, fontSize: 11, fontWeight: '700'},
  rememberText: {color: COLORS.textSecondary, fontSize: SIZES.sm},
  forgot: {color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm},
  divider: {flexDirection: 'row', alignItems: 'center', marginVertical: 14},
  line: {flex: 1, height: 1, backgroundColor: COLORS.border},
  orText: {marginHorizontal: 12, color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.sm},
  signupRow: {flexDirection: 'row', justifyContent: 'center', marginTop: 6},
  signupText: {color: COLORS.textSecondary, fontSize: SIZES.sm},
  signupLink: {color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm},
});

export default LoginScreen;
